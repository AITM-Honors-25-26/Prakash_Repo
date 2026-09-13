import React from "react";
import "sweetalert2/dist/sweetalert2.min.css";
import "./pages/main.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import PaymentPay from "./pages/Payment/Pay/PaymentPay.page";
import PaymentSuccess from "./pages/Payment/Success/PaymentSuccess.page";
import PaymentFailure from "./pages/Payment/Failure/PaymentFailure.page";
import ProtectedRoute from "./components/ProtectedRoute";

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
        <Route
          path="/Menu/Add"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <CreateMenuItemPage />
            </ProtectedRoute>
          }
        />
        <Route path="/MenuPage/:id" element={<MenuPage />} />
        <Route path="/Reset-password" element={<ResetPasswordPage /> }/>
        <Route
          path="/ProfilePage"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/SettingsPage"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/TableManagement"
          element={
            <ProtectedRoute roles={["Admin", "Waiter", "Reception"]}>
              <TableManagement />
            </ProtectedRoute>
          }
        />
        <Route path="/CheckoutPage" element={<CheckoutPage />}  />
        <Route path="/ErrorPage" element={<ErrorPage />} />
        <Route
          path="/DashboardPage"
          element={
            <ProtectedRoute roles={["Admin", "Chef", "Waiter", "Reception"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/StaffManagement"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <StaffManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Analytics"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/BillingSettings"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <BillingSettings />
            </ProtectedRoute>
          }
        />
        <Route path="/OrderTracking/:orderId" element={<OrderTrackingPage />} />
        <Route path="/MembershipPage" element={<MembershipPage />} />
        <Route
          path="/ReceptionBilling"
          element={
            <ProtectedRoute roles={["Admin", "Reception"]}>
              <ReceptionBillingPage />
            </ProtectedRoute>
          }
        />
        <Route path="/payment/pay/:orderId" element={<PaymentPay />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failure" element={<PaymentFailure />} />
        <Route path="/payment/sucess" element={<Navigate to="/payment/success" replace />} />
        <Route path="/payment/failed" element={<Navigate to="/payment/failure" replace />} />
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);