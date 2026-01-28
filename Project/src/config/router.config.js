import { Router } from "express";

const router = Router();

router.post("/about-us", (req, res) => {
  res.status(400).json({
    error: {
      title: "Title is required"
    },
    message: "Validation Failed",
    status: "BAD_REQUEST",
    option: null
  });
});

router.get("/contact-us", (req, res) => {
  res.json({
    data: "contact-us",
    message: "Success",
    status: "OK",
    option: null
  });
});

router.get("/product/:id", (req, res) => {
    const params = req.params;
    const query = req.query;
  res.json({
    data:params,
    query:query
  });
});

export default router;
