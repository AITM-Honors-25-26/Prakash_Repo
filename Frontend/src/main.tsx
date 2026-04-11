import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/home/home.page";
import LoginPage from "./pages/Login/login.page";
import RegisterPage from "./pages/Register/register.page";
import ForgetPassPage from "./pages/forgotPassword/forgotPassword.page";
import ContactUs from "./pages/ContactUS/ContactUs.Page"
import AboutUsPage from "./pages/AboutUs/aboutUs.page";
import MenuPage from "./pages/Menu/Menu.page";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/LoginPage" element={<LoginPage />} />
        <Route path="/RegisterPage" element={<RegisterPage />} />
        <Route path="/ForgetPassPage" element={<ForgetPassPage />} />
        <Route path="/ContactUsPage" element={<ContactUs />} />
        <Route path="/AboutUsPage" element={<AboutUsPage />}/>
        <Route path="/MenuPage" element={<MenuPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);