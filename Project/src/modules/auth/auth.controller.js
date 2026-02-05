class AuthController {
    registerUser = (req, res, next)=>{
        let data = req.body;
        res.json({
            data:data,
            message:"Sucess call",
            status:"SUCESS",
            option:null
        })
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