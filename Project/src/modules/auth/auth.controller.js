import autSvc from "./auth.service.js";
import cloudianarySvc from "../../services/cloudinary.service.js";
import { AppConfig, SMTPConfig} from "../../config/constants.js";

class AuthController {
    registerUser =async (req, res, next)=>{
        let data;
        try{
            data = await autSvc.userRegisterDataTrans(req)
            const userObj = await autSvc.userStore(data)
            let msg= `<strong>Dear ${userObj.fullName}</strong> <br/>
            <p>Thank you for registering with us.</p>
            <p>Your username will be : <em>${userObj.email}</em>. To activate your account, please click the link below or copy paist url in the browser.</p>
            <a href="${AppConfig.frontend_Url}/auth/activater/${userObj.activationToken}" style="color:rgb(4,70,4); text-decoration:underline;">
            </a>
            <br/>
            <p><strongt>Regards,</strongt></p>
            <p><strong>${SMTPConfig.fromAddress}</strong></p>
            <p>small<em>Note: Please do not reply to this email directly. Contact our administration for further assistance. </em></p>`
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