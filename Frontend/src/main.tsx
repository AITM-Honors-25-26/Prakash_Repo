import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom"; // 1. Add these imports
import HomePage from "./pages/home/home.page";
import LoginPage from "./pages/Login/login.page"; // 2. Import your Login page

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter> {/* 3. Wrap everything in a Router */}
      <Routes>
        {/* Define which path shows which component */}
        <Route path="/" element={<HomePage />} />
        <Route path="/LoginPage" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);