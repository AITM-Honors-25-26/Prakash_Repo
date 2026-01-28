import express from "express";
import router from "./router.config.js";

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

export default app;
