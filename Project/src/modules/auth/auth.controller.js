import autSvc from "./auth.service.js";
import cloudianarySvc from "../../services/cloudinary.service.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import { AppConfig } from "../../config/constants.js";

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
                messaagge:'Thank you rehestering with us, Your account has been sucessfully activated',
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
                        refreshToken: refreshToken
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
    forgotPassword=async (req, res, next)=>{
        try{
            const{email}= req.body
            const user = await autSvc.getSingleUserByFilter({
                email: email
            });
            if(!user){
                return next({
                    code:400,
                    detail:{
                        email:"User email has not beed registered yet"
                    },
                    message:"User not found",
                    status:"USER_NOT_FOUND"
                })
            }

        }catch(exception){
            next (exception)
        }
    }
    resetPassword=async(res, req, next)=>{}
}
const authCtr = new AuthController()
export default authCtr