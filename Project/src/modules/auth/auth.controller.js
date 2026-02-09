import { constants } from "node:buffer";
import cloudianarySvc from "./../../services/cloudinary.service.js"
import bcrypt from "bcryptjs"
import { UserStatus } from "../../config/constants.js";
import { randomStringGenerator } from "../../utils/helpers.js";

class AuthController {
    registerUser =async (req, res, next)=>{
        try{
            let data = req.body;
            if(req.file){
                //uploading to cloudinary
                data.image= await cloudianarySvc.fileUpload(req.file.path, 'user/')
            }
            // }else{throw { status: 400, message: "Profile image is required!" };
            // }
                data.password = bcrypt.hashSync(data.password, 12);
                data.status=UserStatus.INACTIVE
                data.activationToken = randomStringGenerator(100,'special'),
                    res.json({
                        data:data,
                        message:"Sucess call",
                        status:"SUCESS",
                        option:null
                    })
            }catch(exception){
                next(exception)
            }
        }
    activateUser = (req, res, next)=>{
    }
    loginUser = ()=>(req, res, next)=>{}
    getMyProfile = (req, res, next)=>{}
    forgotPassword= (rea, res, next)=>{}
    resetPassword=(res, req, next)=>{}
}
const authCtr = new AuthController()
export default authCtr