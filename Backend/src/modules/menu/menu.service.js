import { Bakery } from "../Items/items.model.js";
import cloudianarySvc from "../../services/cloudinary.service.js";

class MenuService {
    transformMenuData = async (req) => {
        try {
            let data = { ...req.body };
            data.images = [];

            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    // If a previous iteration already blew past the timeout,
                    // stop uploading further files instead of piling on more
                    // work that will just get deleted anyway.
                    if (req.hasTimedOut && req.hasTimedOut()) break;

                    const upload = await cloudianarySvc.fileUpload(file.path, 'bakery/');
                    data.images.push({
                        url: upload.secure_url || upload.url,
                        public_id: upload.public_id
                    });

                    if (req.registerCleanup) {
                        req.registerCleanup(() => cloudianarySvc.deleteFile(upload.public_id));
                    }
                }
            }

            if (data.price) data.price = Number(data.price);
            if (data.stock) data.stock = Number(data.stock);
            data.isAvailable = String(data.isAvailable) === 'true';

            // Order Customization: parse the admin-configured add-ons list
            // (arrives as a JSON string over multipart/form-data).
            if (typeof data.addOns === 'string') {
                try {
                    const parsed = JSON.parse(data.addOns);
                    data.addOns = Array.isArray(parsed)
                        ? parsed
                            .filter((addOn) => addOn && typeof addOn.name === 'string' && addOn.name.trim())
                            .map((addOn) => ({
                                name: addOn.name.trim(),
                                price: Math.max(Number(addOn.price) || 0, 0)
                            }))
                        : [];
                } catch {
                    data.addOns = [];
                }
            }

            return data;
        } catch (exception) {
            throw exception;
        }
    }
    storeMenuItem = async (data, req) => {
        try {
            if (req && req.hasTimedOut && req.hasTimedOut()) {
                // The request already timed out while uploads were running;
                // don't bother writing a DB row nobody will get a response for.
                return null;
            }

            const itemObj = new Bakery(data);
            const saved = await itemObj.save();

            if (req && req.registerCleanup) {
                req.registerCleanup(() => Bakery.findByIdAndDelete(saved._id));
            }

            return saved;
        } catch (exception) {
            throw exception;
        }
    }
    getAllItems = async (filter = {}) => {
        try {
            return await Bakery.find(filter);
        } catch (exception) {
            throw exception;
        }
    }
    deleteItemById = async (id) => {
    try {
        const item = await Bakery.findById(id);
        if (!item) {
            throw { status: 404, message: "Item not found." };
        }
        if (item.images && item.images.length > 0) {
            for (const img of item.images) {
                if (img.public_id) {
                    await cloudianarySvc.deleteFile(img.public_id);
                }
            }
        }
        return await Bakery.findByIdAndDelete(id);
    } catch (exception) {
        throw exception;
    }
}
}
const menuSvc = new MenuService();
export default menuSvc;