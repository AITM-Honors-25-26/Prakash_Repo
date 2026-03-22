import { AppConfig, UserRole } from "../config/constants.js";
import jwt from "jsonwebtoken"
import autSvc from "../modules/auth/auth.service.js";

const allowUser = (roles = null) => {
    return async(req, res, next)=>{
        try{
            let token = req.headers['authorization'] || null;
        if(!token){
            next({
                code:401,
                message:"Unauthenticated",
                staues:"UNAUTHENTICATED"
            })
        }else{
            token = token.split(" ").pop();

            let payload = jwt.verify(token, AppConfig.jwtSecret)
            if(payload.type === "access"){
                const user = await autSvc.getSingleUserByFilter({
                _id:payload.sub
            })
            if(!user){
                next ({
                code:401,
                message:"User not found",
                status:"UNAUTHENTICATED"
            });
            } else {
                req.authUser = autSvc.publicUserProfile(user);
                if(!roles || user.role === UserRole.ADMIN){
                    next()
                } else{
                    if(roles.includes(user.role)){
                        next()
                    } else{
                        next({
                            code: 403,
                            message:"You dont have access to these resource",
                            status:"UNAUTHORIZES"
                        })
                    }
                }
            }
            }else{
                next({
                    code:401,
                    message:"Invaalid Token type",
                    status:"UNAUTHENTACATED"
                })
            }
            
        }
        } catch(exception){
            next ({
                code:401,
                message:exception.message,
                status:"UNAUTHENTICATED"
            });
        }
    }
}

export default allowUser