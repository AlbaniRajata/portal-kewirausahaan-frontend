import { Routes, Route } from "react-router-dom";

import LandingPage from "../pages/public/LandingPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterMahasiswaPage from "../pages/auth/RegisterMahasiswaPage";
import RegisterDosenPage from "../pages/auth/RegisterDosenPage";

import NotFoundPage from "../pages/errors/NotFoundPage";
import ServerErrorPage from "../pages/errors/ServerErrorPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/daftar/mahasiswa" element={<RegisterMahasiswaPage />} />
      <Route path="/daftar/dosen" element={<RegisterDosenPage />} />

      <Route path="/500" element={<ServerErrorPage />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
