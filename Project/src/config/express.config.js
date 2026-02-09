import express from "express";
import multer from "multer";
import router from "./router.config.js";
import cookieParser from "cookie-parser";
import "./db.config.js"
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
// app.use((error, req, res, next)=>{
//   let statusCode = error.code || 500;
//   let msg = error.message || "Internal server errpr....";
//   let status = error.status || "SERVER_ERROR";
//   let errorDetail = error.error || null;

//   res.status(statusCode).json({
//     error:errorDetail,
//     message:msg,
//     status:status,
//     option:null

//   })
//   console.log(error)
// })


app.use((error, req, res, next) => {

  let statusCode = 500;
  let message = error.message || "Internal Server Error";
  let status = error.status || "SERVER_ERROR";
  let errorDetail = error.error || null;

  // Multer errors
  if (error instanceof multer.MulterError) {
    statusCode = 400;

    if (error.code === "LIMIT_FILE_SIZE") {
      message = "File size is too large";
      status = "FILE_TOO_LARGE";
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Unexpected file field";
      status = "UNEXPECTED_FILE";
    }
  }

  // Custom numeric status
  if (typeof error.code === "number") {
    statusCode = error.code;
  }

  res.status(statusCode).json({
    error: errorDetail,
    message,
    status,
    option: null
  });
});


export default app;