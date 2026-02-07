import { Routes, Route } from "react-router-dom";

import LandingPage from "../pages/public/LandingPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterMahasiswaPage from "../pages/auth/RegisterMahasiswaPage";
import RegisterDosenPage from "../pages/auth/RegisterDosenPage";
import VerifikasiPage from "../pages/admin/VerifikasiPage";

import BiodataMahasiswaPage from "../pages/mahasiswa/BiodataMahasiswaPage";
import AnggotaTimPage from "../pages/mahasiswa/AnggotaTimPage";
import PrivateRoute from "../components/PrivateRoute";

import NotFoundPage from "../pages/errors/NotFoundPage";
import ServerErrorPage from "../pages/errors/ServerErrorPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/daftar/mahasiswa" element={<RegisterMahasiswaPage />} />
      <Route path="/daftar/dosen" element={<RegisterDosenPage />} />
      <Route
        path="/admin/verifikasi"
        element={
          <PrivateRoute requiredRole={2}>
            <VerifikasiPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/mahasiswa/biodata"
        element={
          <PrivateRoute requiredRole={1}>
            <BiodataMahasiswaPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/mahasiswa/anggota-tim"
        element={
          <PrivateRoute>
            <AnggotaTimPage />
          </PrivateRoute>
        }
      />
      <Route path="/500" element={<ServerErrorPage />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
