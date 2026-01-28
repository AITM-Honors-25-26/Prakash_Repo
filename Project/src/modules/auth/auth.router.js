import { Router } from "express";
const authRouter = Router();

authRouter.post('/auth/register',(req,res)=>{
   res.status(400).json({
     error: { title: "Title is required" },
     message: "Validation Failed",
     status: "BAD_REQUEST",
     option: null
   });
});

authRouter.get('/auth/activater/:token',(req,res)=>{});
authRouter.post('/auth/login',(req,res)=>{});
authRouter.get('/auth/me',(req,res)=>{});
authRouter.post('/auth/forgot_password',(req,res)=>{});
authRouter.patch('/auth/re',(req,res)=>{});

export default authRouter;
