import menuSvc from "./menu.service.js";
class MenuController {
    createBakeryItem = async (req, res, next) => {
        try {
            const data = await menuSvc.transformMenuData(req);
            const savedItem = await menuSvc.storeMenuItem(data);
            res.status(201).json({
                result: savedItem,
                message: "Bakery item added successfully!",
                meta: null
            });
        } catch (exception) {
            next(exception); 
        }
    }
    getAllMenuItems = async (req, res, next) => {
        try {
            const list = await menuSvc.getMenuItemByFilter({}); 
            res.json({
                result: list,
                message: "Menu fetched successfully",
                meta: null
            });
        } catch (exception) {
            next(exception);
        }
    }
}

const menuCtrl = new MenuController();
export default menuCtrl;