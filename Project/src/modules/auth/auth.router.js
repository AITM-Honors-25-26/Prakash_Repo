import getMenuData from "../../middleware/textmiddleware.js";
import { Router } from "express";
const authRouter = Router();

const myMiddelware = (req , res, next)=>{
    console.log("i am here")
    req.user= "my name is prakash"
    // res.json({
    //     data:"null",
    //     message:"message from midddelware"
    // })
    next({
        code:401,
        error: null,
        message:"Unauthorized",
        status:"Authorization_error",
        option:null
        
    });
}

const registerUser = (req, res, next)=>{
    res.json({
        data:req.user,
        message:"sucess", 
        status:"ok",
        Option:null
    })
}


authRouter.post('/auth/register',myMiddelware, registerUser)

// authRouter.get('/auth/activater/:token',getMenuData,(req,res, next)=>{});

authRouter.get('/auth/activater/:token', getMenuData, (req, res) => {
    res.status(200).json({
        message: "Middleware executed and route reached!",
        tokenReceived: req.params.token
    });
});
authRouter.post('/auth/login',(req,res, next)=>{});
authRouter.get('/auth/me',(req,res, next)=>{});
authRouter.post('/auth/forgot_password',(req,res, next)=>{});
authRouter.patch('/auth/reset-password/:token',(req,res, next)=>{});

export default authRouter;