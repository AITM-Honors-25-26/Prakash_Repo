import React from "react";
import "sweetalert2/dist/sweetalert2.min.css";
import "./pages/main.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/home/home.page";
import LoginPage from "./pages/Auth/Login/login.page";
import RegisterPage from "./pages/Auth/Register/register.page";
import ForgetPassPage from "./pages/Auth/forgotPassword/forgotPassword.page";
import ContactUs from "./pages/ContactUS/ContactUs.Page";
import AboutUsPage from "./pages/AboutUs/aboutUs.page";
import MenuPage from "./pages/Menu/Menu.page";
import ResetPasswordPage from "./pages/Auth/ResetPassword/resetPassword.page";
import Profile from "./pages/Profile/profile.page";
import Settings from "./pages/Settings/setting.page";
import TableManagement from "./pages/TableManagement/TableManagement.page";
import CheckoutPage from "./pages/Checkout/CheckOut.page";
import ErrorPage from "./pages/ErrorPage/ErrorPage";
import Dashboard from "./pages/DashboardPage/Dashboard.Page";
import CreateMenuItemPage from "./pages/Menu/menupage/menu.page.add";
import StaffManagement from "./pages/StaffManagement/StaffManagement.page";
import Analytics from "./pages/Analytics/Analytics.page";
import BillingSettings from "./pages/BillingSettings/BillingSettings.page";
import OrderTrackingPage from "./pages/OrderTracking/OrderTracking.page";
import MembershipPage from "./pages/Membership/Membership.page";
import ReceptionBillingPage from "./pages/ReceptionBilling/ReceptionBilling.page";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/LoginPage" element={<LoginPage />} />
        <Route path="/RegisterPage" element={<RegisterPage />} />
        <Route path="/ForgetPassPage" element={<ForgetPassPage />} />
        <Route path="/ContactUsPage" element={<ContactUs />} />
        <Route path="/AboutUsPage" element={<AboutUsPage />} />
        <Route path="/MenuPage" element={<MenuPage />} />
        <Route path="/Menu/Add" element={<CreateMenuItemPage />}></Route>
        <Route path="/MenuPage/:id" element={<MenuPage />} />
        <Route path="/Reset-password" element={<ResetPasswordPage /> }/>
        <Route path="/ProfilePage" element={<Profile />} />
        <Route path="/SettingsPage" element={<Settings />} />
        <Route path="/TableManagement" element={<TableManagement />} />
        <Route path="/CheckoutPage" element={<CheckoutPage />}  />
        <Route path="/ErrorPage" element={<ErrorPage />} />
        <Route  path="/DashboardPage" element={<Dashboard />}/>
        <Route path="/StaffManagement" element={<StaffManagement />} />
        <Route path="/Analytics" element={<Analytics />} />
        <Route path="/BillingSettings" element={<BillingSettings />} />
        <Route path="/OrderTracking/:orderId" element={<OrderTrackingPage />} />
        <Route path="/MembershipPage" element={<MembershipPage />} />
        <Route path="/ReceptionBilling" element={<ReceptionBillingPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);