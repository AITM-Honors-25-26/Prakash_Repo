import autSvc from "./auth.service.js";

class AuthController {
    registerUser =async (req, res, next)=>{
        try{
            const userData = await autSvc.userRegisterDataTrans(req)
            res.json({
                data:data,
                message:"Sucess Call",
                status:"ok",
                option:null
            
        });
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