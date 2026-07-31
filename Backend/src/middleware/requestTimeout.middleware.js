/**
 * requestTimeout(ms)
 *
 * Enforces a hard time limit on a request. If the request is still running
 * when the timer fires, every cleanup function registered via
 * `req.registerCleanup(fn)` is executed (in parallel) and the client gets a
 * 408 instead of the request hanging indefinitely.
 *
 * Usage in a router:
 *   router.post(
 *     '/menu/add-item',
 *     requestTimeout(30000),          // <-- put this before the uploader
 *     uploader().array('images', 4),
 *     bodyValidator(schema),
 *     controller.createBakeryItem
 *   );
 *
 * Usage inside a controller/service, right after something is created:
 *   const upload = await cloudinarySvc.fileUpload(file.path, 'bakery/');
 *   req.registerCleanup(() => cloudinarySvc.deleteFile(upload.public_id));
 *
 *   const saved = await itemObj.save();
 *   req.registerCleanup(() => Bakery.findByIdAndDelete(saved._id));
 *
 * If the request finishes normally, nothing is ever run — the cleanup list
 * is just discarded. It only fires when the timeout wins the race.
 */
export const requestTimeout = (ms = 30000) => {
    return (req, res, next) => {
        const cleanupFns = [];
        let timedOut = false;

        req.registerCleanup = (fn) => cleanupFns.push(fn);
        req.hasTimedOut = () => timedOut;

        const timer = setTimeout(async () => {
            timedOut = true;

            console.log(
                `[Timeout] ${req.method} ${req.originalUrl} exceeded ${ms}ms — running ${cleanupFns.length} cleanup task(s)`
            );

            const results = await Promise.allSettled(cleanupFns.map((fn) => fn()));
            results.forEach((result, i) => {
                if (result.status === "rejected") {
                    console.log(`[Timeout] cleanup task #${i} failed:`, result.reason);
                }
            });

            if (!res.headersSent) {
                res.status(408).json({
                    data: null,
                    message: "The request took too long to process and was cancelled. Any files that were already uploaded have been removed.",
                    status: "REQUEST_TIMEOUT",
                    option: null
                });
            }
        }, ms);

        // If the response completes normally first, cancel the timer so
        // cleanup never runs.
        res.on("finish", () => clearTimeout(timer));
        res.on("close", () => clearTimeout(timer));

        next();
    };
};
