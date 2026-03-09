import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { getAccessToken } from "../api/axios";

export default function PrivateRoute({ allowedRoles }) {
  const { user } = useAuthStore();
  const accessToken = getAccessToken();

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}