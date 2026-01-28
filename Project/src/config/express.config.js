import express from "express";
import { title } from "process";

const app = express();


app.use("/health", (req, res) => {
  res.json({
    data: "health",
    message: "success",
    status: "ok",
    option: null
  });
});

app.use("/healthA", (req, res) => {
  res.status(400).json({
    error: {
        title:"title is required"
    },
    message: "valaditation failed",
    status: "BAD_REQUEST",
    option: null
  });
});


app.get("/contact-us", (req, res) => {
  res.json({
    data: "contact-us",
    message: "success",
    status: "ok",
    option: null
  });
});


app.get("/product/:id", (req, res) => {
  const params = req.params;
  console.log(params)
  res.json({
    data:params
    
  })
});

export default app;
