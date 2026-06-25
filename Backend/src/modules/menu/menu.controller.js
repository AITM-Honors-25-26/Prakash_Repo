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
            const list = await menuSvc.getAllItems({});
            res.json({
                result: list,
                message: "Menu fetched successfully",
                meta: null
            });
        } catch (exception) {
            next(exception);
        }
    }
    deleteMenuItem = async (req, res, next) => {
        try {
            const id = req.params.id;
            const deletedResponse = await menuSvc.deleteItemById(id);
            
            res.json({
                result: deletedResponse,
                message: "Bakery item and associated images deleted successfully.",
                meta: null
            });
        } catch (exception) {
            next(exception);
        }
    }
}

const menuCtrl = new MenuController();
export default menuCtrl;