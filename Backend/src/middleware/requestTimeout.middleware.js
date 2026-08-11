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

        res.on("finish", () => clearTimeout(timer));
        res.on("close", () => clearTimeout(timer));

        next();
    };
};
