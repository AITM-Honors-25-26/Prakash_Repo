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

app.use((error, req, res, next) => {
  console.log(error)

  let statusCode = 500;
  let message = error.message || "Internal Server Error";
  let status = error.status || "SERVER_ERROR";
  let errorDetail = error.error || null;

  if (error.name === "MongoServerError") {
  statusCode = 422; 
  status = "DATABASE_ERROR";

  if (error.code === 11000) {
    // Correctly extract the field name that is duplicated
    const key = Object.keys(error.keyPattern)[0]; 
    
    statusCode = 422; 
    errorDetail = {
      [key]: `${key} has already been used`
    };
    message = "Validation failed"; // Set the message for the user
    status = "VALIDATION_ERROR";
  }
}

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

  // // Custom numeric status
  if (typeof error.code === "number" && error.code >= 100 && error.code < 600) {
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