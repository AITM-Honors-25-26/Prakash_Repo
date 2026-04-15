import bcrypt from "bcryptjs";
import cloudianarySvc from "../../services/cloudinary.service.js";
import { randomStringGenerator } from "../../utils/helpers.js";
import {AppConfig, SMTPConfig} from "../../config/constants.js"
import UserModel from "../User/user.model.js";
import emailSvc from "../../services/email.service.js";
class AuthService{
    userRegisterDataTrans= async (req, res) => {
        try{
            let data = {...req.body};
            if (req.file) {
                const upload = await cloudianarySvc.fileUpload(req.file.path, 'user/');
                data.image = {
                    url: upload.url,
                    optmizedUrl: upload.secure_url || upload.url
                };
                data.image_id = upload.public_id;
            }
            data.password = bcrypt.hashSync(data.password, 12);
            data.status= false
            data.activationToken = randomStringGenerator(100,'string')
            return data;
            }catch(exception){
                throw(exception);
        }
    }
    userStore = async(data)=>{
        try{
            const userObj = new UserModel(data)
            return await userObj.save()
        }catch(exception){
            throw(exception)
        }
    }  
    publicUserProfile = (userObj)=>{
        return{
            name:userObj.fullName,
            email:userObj.email,
            role:userObj.role,
            address:userObj.address,
            phone:userObj.phone,
            status:userObj.status,
            image:userObj.image,
            _id:userObj._id,
            createdAt:userObj.createdAt,
            dob:userObj.dob,
        };
    }
    getSingleUserByFilter= async (filter, selectFields)=>{
        try{
            const user = await UserModel.findOne(filter).select(selectFields);
            return user
        }catch(exception){
            throw exception
        }
    }
    updateSingleUserByFilter=async (filter, updateData) =>{
        try{
             let update = await UserModel.findOneAndUpdate(filter, {$set: updateData}, {new:true})
             return update
        }catch (exception){
            throw exception
        }
    }

    notifyActivationEmail = async ({name, email, activationToken})=>{
        try{
             let activationUrl = `${AppConfig.backend_Url}/auth/activater/${activationToken}`;
            let msg = `
            <div style="background-color: #f4f4f4; padding: 20px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid #e0e0e0;">
                    <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
                        <h2 style="color: #ffffff; margin: 0; font-size: 24px;">Resturent Management System</h2>
                    </div>
                    <div style="padding: 30px; color: #333333; line-height: 1.6;">
                        <p style="font-size: 18px; margin-top: 0;">Hi <strong>${name}</strong>,</p>
                        <p>Thank you for registering! Your account has been created successfully with the username: <br/>
                           <span style="color: #2c3e50; font-weight: bold;">${email}</span>
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
             return await emailSvc.sendEmail({
                to:email,
                sub:"Activate your account!1!!",
                message:msg
            })
        }catch(exception){
            throw exception
        }
    }

    notifyForgotPassword = async ({name, email, resetToken}) => {
    try {

        let resetUrl = `${AppConfig.backend_Url}/auth/verify-token/${resetToken}`;
        
        let msg = `
        <div style="background-color: #f4f4f4; padding: 20px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 1px solid #e0e0e0;">
                <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
                    <h2 style="color: #ffffff; margin: 0; font-size: 24px;">Restaurant Management System</h2>
                </div>
                <div style="padding: 30px; color: #333333; line-height: 1.6;">
                    <p style="font-size: 18px; margin-top: 0;">Hi <strong>${name}</strong>,</p>
                    <p>We received a request to reset the password for your account associated with: <br/>
                       <span style="color: #2c3e50; font-weight: bold;">${email}</span>
                    </p>
                    <p style="margin-top: 25px;">Please click the button below to securely reset your password. This link will expire soon.</p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background-color: #e74c3c; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                           Reset Password
                        </a>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #7f8c8d;">
                        If the button above doesn't work, copy and paste this link into your browser: <br/>
                        <a href="${resetUrl}" style="color: #3498db; word-break: break-all;">${resetUrl}</a>
                    </p>
                    <p style="font-size: 12px; color: #7f8c8d; margin-top: 15px;">
                        If you did not request a password reset, no further action is required and your password remains secure.
                    </p>
                </div>
                <div style="background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 13px; color: #95a5a6; border-top: 1px solid #eeeeee;">
                    <p style="margin: 0;">Regards, <br/> <strong>Team Support</strong></p>
                    <p style="margin-top: 10px; font-style: italic;">Note: This is an automated email. Please do not reply.</p>
                </div>
            </div>
        </div>`;
        
        return await emailSvc.sendEmail({
            to: email,
            sub: "Reset Your Password - Restaurant Management System",
            message: msg
        });
    } catch (exception) {
        throw exception;
    }
}
    

}
const autSvc = new AuthService
export default autSvc