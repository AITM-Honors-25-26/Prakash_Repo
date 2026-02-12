import autSvc from "./auth.service.js";

class AuthController {
    registerUser =async (req, res, next)=>{
        try{
            const data = await autSvc.userRegisterDataTrans(req)
            const userObj = await autSvc.userStore(data)
            res.json({
                data:userObj,
                message:"User register sucessifully",
                status:"Register_Sucess",
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