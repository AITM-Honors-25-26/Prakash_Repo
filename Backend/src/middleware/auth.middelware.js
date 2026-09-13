import { AppConfig, UserRole } from "../config/constants.js";
import jwt from "jsonwebtoken"
import autSvc from "../modules/auth/auth.service.js";

const allowUser = (roles = null) => {
    return async(req, res, next)=>{
        try{
            const authorization = req.headers.authorization;
            if (!authorization || !authorization.startsWith("Bearer ")) {
                return next({
                    code: 401,
                    message: "Unauthenticated",
                    status: "UNAUTHENTICATED"
                });
            }

            const token = authorization.slice("Bearer ".length).trim();
            if (!token) {
                return next({
                    code: 401,
                    message: "Unauthenticated",
                    status: "UNAUTHENTICATED"
                });
            }

            const payload = jwt.verify(token, AppConfig.jwtSecret);
            if(payload.type === "access"){
                const user = await autSvc.getSingleUserByFilter({
                    _id: payload.sub
                });
            if(!user){
                return next({
                    code: 401,
                    message: "User not found",
                    status: "UNAUTHENTICATED"
                });
            } else {
                req.authUser = autSvc.publicUserProfile(user);
                if(!roles || user.role === UserRole.ADMIN){
                    return next();
                } else{
                    if(roles.includes(user.role)){
                        return next();
                    } else{
                        return next({
                            code: 403,
                            message: "You do not have access to this resource",
                            status: "UNAUTHORIZED"
                        });
                    }
                }
            }
            }else{
                return next({
                    code: 401,
                    message: "Invalid token type",
                    status: "UNAUTHENTICATED"
                });
            }
        } catch(exception){
            return next({
                code: 401,
                message: exception.message,
                status: "UNAUTHENTICATED"
            });
        }
    }
}

export default allowUser