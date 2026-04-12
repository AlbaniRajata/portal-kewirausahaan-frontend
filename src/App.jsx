import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import axios from "axios";
import AppRoutes from "./routes/AppRoutes";
import { useAuthStore } from "./store/authStore";
import { setAccessToken } from "./api/axios";
import LoadingScreen from "./components/common/LoadingScreen";

function App() {
  const { refreshToken, logout } = useAuthStore();
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    const restoreToken = async () => {
      if (!refreshToken) {
        setRestoring(false);
        return;
      }
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );
        setAccessToken(res.data.data.token);
      } catch {
        logout();
        setAccessToken(null);
      } finally {
        setRestoring(false);
      }
    };
    restoreToken();
  }, [refreshToken, logout]);

  if (restoring) {
    return (
      <Box sx={{ position: "relative", minHeight: "100vh" }}>
        <LoadingScreen message="Menyiapkan aplikasi..." overlay minHeight="100vh" />
      </Box>
    );
  }

  return <AppRoutes />;
}

export default App;