import bcrypt from "bcryptjs";
import cloudianarySvc from "../../services/cloudinary.service.js";
import { UserStatus } from "../../config/constants.js";
import { randomStringGenerator } from "../../utils/helpers.js";
import UserModel from "../User/user.model.js";
class AuthService{
    userRegisterDataTrans= async (req, res) => {
        try{
            let data = req.body;
                data.image= await cloudianarySvc.fileUpload(req.file.path, 'user/')
                data.password = bcrypt.hashSync(data.password, 12);
                data.status=UserStatus.INACTIVE
                data.activationToken = randomStringGenerator(100,'special')
                console.log("in usererehistertras")
                return data;
            }catch(exception){
                throw(exception);
        }
    }
    userStore = async()=>{
        try{
            const userObj = new UserModel()
        }catch(exception){
            throw(exception)
        }
    }  

}
const autSvc = new AuthService
export default autSvc