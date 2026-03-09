import { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import axios from "axios";
import AppRoutes from "./routes/AppRoutes";
import { useAuthStore } from "./store/authStore";
import { setAccessToken } from "./api/axios";

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
  }, []);

  if (restoring) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return <AppRoutes />;
}

export default App;