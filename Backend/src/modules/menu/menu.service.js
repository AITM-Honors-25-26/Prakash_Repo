import { Bakery } from "../Items/items.model.js";
import cloudianarySvc from "../../services/cloudinary.service.js";

class MenuService {
    transformMenuData = async (req) => {
    try {
        let data = { ...req.body };
        data.images = []; 
        if (req.file) {
            const upload = await cloudianarySvc.fileUpload(req.file.path, 'bakery/');
            data.images.push({
                url: upload.secure_url || upload.url,
                public_id: upload.public_id
            });
        }
        if (data.price) data.price = Number(data.price);
        if (data.stock) data.stock = Number(data.stock);
        data.isAvailable = String(data.isAvailable) === 'true';
        return data;
        } catch (exception) {
        throw exception;
        }
    }
    storeMenuItem = async (data) => {
        try {
            const itemObj = new Bakery(data);
            return await itemObj.save();
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
}
const menuSvc = new MenuService();
export default menuSvc;