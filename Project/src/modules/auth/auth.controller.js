import autSvc from "./auth.service.js";
import cloudianarySvc from "../../services/cloudinary.service.js";
import { AppConfig, SMTPConfig} from "../../config/constants.js";
import emailSvc from "../../services/email.service.js";

class AuthController {
    registerUser =async (req, res, next)=>{
        try{
            let userData = await autSvc.userRegisterDataTrans(req)
            const userObj = await autSvc.userStore(userData)
            await autSvc.notifyActivationEmail({
                name:userObj.name,
                email:userObj.email,
                activationToken:userObj.activationToken
            })         
            res.json({
                data:{
                    user:autSvc.publicUserProfile(userObj),
                    msg:msg},
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
    activateUser =async (req, res, next)=>{
        try{
            let token = req.params.token || null;
            if(!token){
                throw{
                    code:422,
                    messaagge:"Activation token is expected",
                    status:"ACTIVATION_TOKEN_MISSING"
                }
            }
            const associatedUser = await autSvc.getSingleUserByFilter({
                activationToken:token
            })
            if(!associatedUser){
                throw{
                    code:422,
                    message:"Token already used or does not exists",
                    status:"ACTIVATION_TOKEN_NOTT_FOUND"
                }
            }
            let userData = {
                status:true,
                activationToken:null
            }
            await autSvc.updateSingleUserByFilter({_id:associatedUser._id}, userData)
            res.json({
                data:null,
                messaagge:'Thank you rehestering with us, Your account has been sucessfully activated',
                status:"ACTIVIATION_SUCESS",
                option:null
            })

        }catch(exception){
            next(exception)
        }
    }
    loginUser = ()=>(req, res, next)=>{}
    getMyProfile = (req, res, next)=>{}
    forgotPassword= (rea, res, next)=>{}
    resetPassword=(res, req, next)=>{}
}
const authCtr = new AuthController()
export default authCtr