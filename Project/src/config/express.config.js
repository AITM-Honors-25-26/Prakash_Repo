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

//error handeling middelware
app.use((error, req, res, next)=>{
  let statusCode = error.code || 500;
  let msg = error.message || "Internal server errpr....";
  let status = error.status || "SERVER_ERROR"

  res.status(statusCode).json({
    error:null,
    message:msg,
    status:status,
    option:null

  })
  console.log(Error)
})

export default app;
