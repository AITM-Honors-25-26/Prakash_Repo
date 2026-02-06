import cloudianarySvc from "./../../services/cloudinary.service.js"

class AuthController {
    registerUser =async (req, res, next)=>{
        try{
            let data = req.body;
            data.image= await cloudianarySvc.fileUpload(req.file.path, 'user/')
                res.json({
                    data:data,
                    message:"Sucess call",
                    status:"SUCESS",
                    option:null
                })
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