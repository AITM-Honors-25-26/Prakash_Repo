import autSvc from "./auth.service.js";
import cloudianarySvc from "../../services/cloudinary.service.js";
import { AppConfig, SMTPConfig} from "../../config/constants.js";
import emailSvc from "../../services/email.service.js";

class AuthController {
    registerUser =async (req, res, next)=>{
        try{
            let userData = await autSvc.userRegisterDataTrans(req)
            const userObj = await autSvc.userStore(userData)
            console.log(userObj.activationToken)

            // let msg = `<strong>Dear ${userObj.fullName}</strong><br/>
            // <p>Thank you for registering with us.</p>
            // <p>Your username will be: <em>${userObj.email}</em>.</p>
            // <p>To activate your account, click the link below:</p>
            // <a href="${AppConfig.frontend_Url}/auth/activater/${userObj.activationToken}"style="color:rgb(4,70,4); text-decoration:underline;">
            // Activate Your Account</a><br/><br/>
            // <p>If the button does not work, copy and paste this URL:</p>
            // <p>${AppConfig.frontend_Url}/auth/activater/${userObj.activationToken}</p>
            // <br/>
            // <p><strong>Regards,</strong></p>
            // <p><strong>${SMTPConfig.fromAddress}</strong></p>
            // <p><em><b>Note:</b> Please do not reply to this email directly.</em></p>`

            let activationUrl = `${AppConfig.frontend_Url}/auth/activater/${userObj.activationToken}`;

let msg = `
<div style="background-color: #f4f4f4; padding: 20px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid #e0e0e0;">
        
        <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 24px;">Welcome to Our Platform</h2>
        </div>

        <div style="padding: 30px; color: #333333; line-height: 1.6;">
            <p style="font-size: 18px; margin-top: 0;">Hi <strong>${userObj.fullName}</strong>,</p>
            <p>Thank you for registering! Your account has been created successfully with the username: <br/>
               <span style="color: #2c3e50; font-weight: bold;">${userObj.email}</span>
            </p>
            
            <p style="margin-top: 25px;">Please click the button below to activate your account and get started:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${activationUrl}" 
                   style="background-color: #27ae60; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                   Activate My Account
                </a>
            </div>

            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
            
            <p style="font-size: 12px; color: #7f8c8d;">
                If the button above doesn't work, copy and paste this link into your browser: <br/>
                <a href="${activationUrl}" style="color: #3498db;">${activationUrl}</a>
            </p>
        </div>

        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 13px; color: #95a5a6; border-top: 1px solid #eeeeee;">
            <p style="margin: 0;">Regards, <br/> <strong>Team Support</strong></p>
            <p style="margin-top: 10px; font-style: italic;">Note: This is an automated email. Please do not reply.</p>
        </div>
    </div>
</div>`;






            await emailSvc.sendEmail({
                to:userObj.email,
                sub:"Activate your account!1!!",
                message:msg
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