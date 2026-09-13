import React from "react";
import ErrorPage from "../pages/ErrorPage/ErrorPage";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const getStoredUser = () => {
  const storedUser = localStorage.getItem("qr_user");
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as { role?: string };
  } catch {
    return null;
  }
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const user = getStoredUser();
  const token = localStorage.getItem("qr_accessToken");
  const normalizedRole = user?.role?.trim().toLowerCase();
  const hasRequiredRole =
    !roles ||
    Boolean(
      normalizedRole &&
        roles.some((role) => role.toLowerCase() === normalizedRole)
    );

  if (!token || !user || !hasRequiredRole) {
    return <ErrorPage />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
