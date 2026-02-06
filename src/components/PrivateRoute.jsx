import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function PrivateRoute({ children }) {
  const { token } = useAuthStore();

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
}