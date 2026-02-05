import express from "express";
import router from "./router.config.js";
import cookieParser from "cookie-parser";
const app = express();

//parces 
//for json data
app.use(express.json())
//for X-www-form-urlencoded data
app.use(express.urlencoded({
  extended:false
}))
// for cookie data(npm install cookoe-parser)
app.use(cookieParser ())


//check health
app.use("/health", (req, res) => {
  res.json({
    data: "health",
    message: "success",
    status: "ok",
    option: null
  });
});

app.use("/api", router);

//routing error catching
app.use((req, res, next)=>{
  next({
    code:404,
    message:"Route not found",
    status:"Route_error"
  })
})

//error handeling middelware
app.use((error, req, res, next)=>{
  let statusCode = error.code || 500;
  let msg = error.message || "Internal server errpr....";
  let status = error.status || "SERVER_ERROR";
  let errorDetail = error.error || null;

  res.status(statusCode).json({
    error:errorDetail,
    message:msg,
    status:status,
    option:null

  })
  console.log(error)
})

export default app;