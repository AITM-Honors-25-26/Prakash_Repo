import express from "express";
import router from "./router.config.js";
import { error } from "console";

const app = express();

app.use("/health", (req, res) => {
  res.json({
    data: "health",
    message: "success",
    status: "ok",
    option: null
  });
});

app.use("/api", router);

app.use((req, res, next)=>{
  next({
    code:404,
    message:"page not found",
    status:"PAGE_NOT_FOUND"
  })
})

//error handeling middelware
app.use((error, req, res, next)=>{
  let statusCode = error.code || 500;
  let msg = error.message || "Internal server errpr....";
  let status = error.status || "SERVER_ERROR";
  let errorDetail = error.detail || null;

  res.status(statusCode).json({
    error:errorDetail,
    message:msg,
    status:status,
    option:null

  })
  console.log(error)
})

export default app;