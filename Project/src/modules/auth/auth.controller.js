import autSvc from "./auth.service.js";
import cloudianarySvc from "../../services/cloudinary.service.js";

class AuthController {
    registerUser =async (req, res, next)=>{
        let data;
        try{
            data = await autSvc.userRegisterDataTrans(req)
            const userObj = await autSvc.userStore(data)
            res.json({
                data:autSvc.publicUserProfile(userObj),
                message:"User register sucessifully",
                status:"Register_Sucess",
                option:null
        });

        }catch(exception){
            if (data && data.image_id) {
                await cloudianarySvc.deleteFile(data.image_id);
            } 
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