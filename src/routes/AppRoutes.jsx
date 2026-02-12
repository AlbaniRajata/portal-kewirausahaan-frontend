import { Routes, Route } from "react-router-dom";

import LandingPage from "../pages/public/LandingPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterMahasiswaPage from "../pages/auth/RegisterMahasiswaPage";
import RegisterDosenPage from "../pages/auth/RegisterDosenPage";

import VerifikasiPage from "../pages/admin/VerifikasiPage";
import ProgramPage from "../pages/admin/ProgramPage";
import ProposalListPage from "../pages/admin/ProposalListPage";
import ProposalDetailPage from "../pages/admin/ProposalDetailPage";
import DistribusiPenilaiPage from "../pages/admin/DistribusiPenilaiPage";
import DistribusiDetailPage from "../pages/admin/DistribusiDetailPage";

import BiodataMahasiswaPage from "../pages/mahasiswa/BiodataMahasiswaPage";
import AnggotaTimPage from "../pages/mahasiswa/AnggotaTimPage";
import DaftarProposalPage from "../pages/mahasiswa/DaftarProposalPage";
import FormProposalPage from "../pages/mahasiswa/FormProposalPage";

import PenugasanPage from "../pages/reviewer/PenugasanPage";
import DetailPenugasanPage from "../pages/reviewer/DetailPenugasanPage";

import JuriPenugasanPage from "../pages/juri/PenugasanPage";
import JuriDetailPenugasanPage from "../pages/juri/DetailPenugasanPage";

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
      <Route path="/admin" element={<PrivateRoute />}>
        <Route path="verifikasi" element={<VerifikasiPage />} />
        <Route path="program" element={<ProgramPage />} />
        <Route path="proposal" element={<ProposalListPage />} />
        <Route path="proposal/:id_proposal" element={<ProposalDetailPage />} />
        <Route path="distribusi-penilai" element={<DistribusiPenilaiPage />} />
        <Route path="program/:id_program/distribusi/reviewer/tahap/:tahap/:id_distribusi" element={<DistribusiDetailPage />} />
      </Route>

      {/* MAHASISWA*/}
      <Route path="/mahasiswa" element={<PrivateRoute />}>
        <Route path="biodata" element={<BiodataMahasiswaPage />} />
        <Route path="anggota-tim" element={<AnggotaTimPage />} />
        <Route path="proposal" element={<DaftarProposalPage />} />
        <Route path="proposal/form" element={<FormProposalPage />} />
      </Route>

      {/* REVIEWER*/}
      <Route path="/reviewer" element={<PrivateRoute />}>
        <Route path="penugasan" element={<PenugasanPage />} />
        <Route path="penugasan/:id_distribusi" element={<DetailPenugasanPage />} />
      </Route>

      {/* JURI*/}
      <Route path="/juri" element={<PrivateRoute />}>
        <Route path="penugasan" element={<JuriPenugasanPage />} />
        <Route path="penugasan/:id_distribusi" element={<JuriDetailPenugasanPage />} />
      </Route>

      {/* ERROR */}
      <Route path="/500" element={<ServerErrorPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
