import { Routes, Route } from "react-router-dom";

import LandingPage from "../pages/public/LandingPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterMahasiswaPage from "../pages/auth/RegisterMahasiswaPage";
import RegisterDosenPage from "../pages/auth/RegisterDosenPage";

import VerifikasiPage from "../pages/admin/VerifikasiPage";
import ProgramPage from "../pages/admin/ProgramPage";

import BiodataMahasiswaPage from "../pages/mahasiswa/BiodataMahasiswaPage";
import AnggotaTimPage from "../pages/mahasiswa/AnggotaTimPage";
import DaftarProposalPage from "../pages/mahasiswa/DaftarProposalPage";
import FormProposalPage from "../pages/mahasiswa/FormProposalPage";

import PrivateRoute from "../components/PrivateRoute";

import NotFoundPage from "../pages/errors/NotFoundPage";
import ServerErrorPage from "../pages/errors/ServerErrorPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/daftar/mahasiswa" element={<RegisterMahasiswaPage />} />
      <Route path="/daftar/dosen" element={<RegisterDosenPage />} />

      {/* ADMIN*/}
      <Route
        path="/admin"
        element={<PrivateRoute />}
      >
        <Route path="verifikasi" element={<VerifikasiPage />} />
        <Route path="program" element={<ProgramPage />} />
      </Route>

      {/* MAHASISWA*/}
      <Route
        path="/mahasiswa"
        element={<PrivateRoute />}
      >
        <Route path="biodata" element={<BiodataMahasiswaPage />} />
        <Route path="anggota-tim" element={<AnggotaTimPage />} />
        <Route path="proposal" element={<DaftarProposalPage />} />
        <Route path="proposal/form" element={<FormProposalPage />} />
      </Route>

      {/* ERROR */}
      <Route path="/500" element={<ServerErrorPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
