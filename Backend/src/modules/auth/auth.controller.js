import autSvc from "./auth.service.js";
import cloudianarySvc from "../../services/cloudinary.service.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import { AppConfig } from "../../config/constants.js";
import { randomStringGenerator } from "../../utils/helpers.js";

class AuthController {
    registerUser =async (req, res, next)=>{
        let userData;
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
                },
                message:"User register sucessifully",
                status:"Register_Sucess",
                option:null
        });
        }catch(exception){
            if (userData && userData.image_id) {
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
                messaagge:'Thank you registering with us, Your account has been sucessfully activated',
                status:"ACTIVIATION_SUCESS",
                option:null
            })

        }catch(exception){
            next(exception)
        }
    }
    loginUser =async(req, res, next)=>{
        try{
            const{email, password} = req.body;
            const user = await autSvc.getSingleUserByFilter({
                email:email
            },"+password")
            console.log("Database user:",user)
            if(!user){
                throw{
                    code:422,
                    message:"User Does not exist",
                    status:"User_Not_Found"
                }
                
            } else if(!bcrypt.compareSync(password, user.password)){
                throw{
                    code:403,
                    message:"Credential does not match",
                    staus:"CREDENTIAL_NOT_MATCHED"
                }
            } else if (user.status === false) { 
                throw {
                    code: 403,
                    message: "Your account is not activated. Please verify your email.",
                    status: "ACCOUNT_NOT_ACTIVATED"
                };
            } else{
                let  accessToken = jwt.sign({
                    sub: user._id,
                    type:"access"
                }, AppConfig.jwtSecret, {
                    expiresIn: '3 hour'
                })
                let refreshToken = jwt.sign({
                    sub:user._id,
                    type:"refresh"
                }, AppConfig.jwtSecret,{
                    expiresIn:"1 day"
                });
                res.json({
                    data:{
                        accessToken: accessToken,
                        refreshToken: refreshToken,
                        user: autSvc.publicUserProfile(user)
                    },
                    message:"Login Successfully",
                    status: "LOGIN_SUCCESS",
                    option:null
                })

            }
        } catch (exception){
            next(exception)
        }
    }
    getMyProfile = async(req, res, next)=>{
        res.json({
            data:req.authUser,
            status:"LOGGEDIN_USER",
            message:"Your Profile",
            option:null
        })
    }
    forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await autSvc.getSingleUserByFilter({
            email: email,
        });

        if (!user) {
            return next({
                code: 400,
                detail: {
                    email: "User email has not been registered yet"
                },
                message: "User not found",
                status: "USER_NOT_FOUND"
            });
        }

        let updateData = {
            forgotPasswordToken: randomStringGenerator(100),
            expireToken: new Date(Date.now() + 60 * 60 * 1000) 
        };

        await autSvc.updateSingleUserByFilter({
            email: email
        }, updateData);

        await autSvc.notifyForgotPassword({
            name: user.fullName || 'User', 
            email: user.email, 
            resetToken: updateData.forgotPasswordToken
        });

        res.json({
            data: null,
            message: 'A link has been sent to your registered email to reset your password',
            status: "FORGETPASSWORD_LINK_SEND",
            option: null
        });

    } catch (exception) {
        next(exception);
    }
}

verifyFogetPasswordToken = async (req, res, next) => {
    try {
        let token = req.params.token;
        let user = await autSvc.getSingleUserByFilter({
            forgotPasswordToken: token
        });

        if (!user) {
            return next({
                code: 422,
                message: "Token does not exist or is already used",
                status: "TOKEN_NOT_FOUND"
            });
        }
        if (!user.expireToken) {
            return next({
                code: 400,
                message: "Token expiry time is missing from the database.",
                status: "INVALID_TOKEN_DATA"
            });
        }

        const tokenExpiry = new Date(user.expireToken).getTime();
        const currentTime = Date.now();

        if (currentTime > tokenExpiry) {
            return next({
                code: 422,
                message: "Password reset token expired",
                status: "PASSWORD_RESET_TOKEN_EXPIRED"
            });
        }

        const verifyToken = randomStringGenerator(100);
        await autSvc.updateSingleUserByFilter({
            _id: user._id 
        }, {
            forgotPasswordToken: verifyToken,
            expireToken: new Date(Date.now() + 30 * 60 * 1000)
        });




        res.redirect(`${AppConfig.frontend_Url}/reset-password?token=${verifyToken}`);
        return res.redirect(redirectUrl);

        // res.json({
        //     data: {
        //         verifyToken: verifyToken
        //     },
        //     message: "Token Verified",
        //     status: "FORGET_PASSWORD_VERIFIED",
        //     option: null       
        // });
    } catch (exception) {
        next(exception);
    }
}
    resetPassword=async(req, res, next)=>{
        try{
            const{token, password} = req.body;
            const user = await autSvc.getSingleUserByFilter({
                forgotPasswordToken:token
            })
            if(!user){
                next({
                    code:402,
                    message:"Token does not exist or already used",
                    status:"TOKEN_NOT_FOUND"
                })
            }
            const data = {
                forgotPasswordToken:null,
                expireToken:null,
                password: bcrypt.hashSync(password, 12),
                status:true
            }
            await autSvc.updateSingleUserByFilter({
                _id:user._id
            },data)
            res.status(201).json({
                data:null,
                message:"Your password has been reset Sucessfullly. Please log in to continue",
                status:"PASSWORD_RESET_SUCCESSFUL",
                option:null
            })
        }catch(exception){
            next(exception)
        }
    }
}
const authCtr = new AuthController()
export default authCtr