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
import RekapPenilaianPage from "../pages/admin/RekapPenilaianPage";
import BimbinganPage from "../pages/admin/BimbinganPage";
import KampusPage from "../pages/admin/KampusPage";
import JurusanPage from "../pages/admin/JurusanPage";
import ProdiPage from "../pages/admin/ProdiPage";
import KelolaPenggunaPage from "../pages/admin/KelolaPenggunaPage";
import TimPesertaPage from "../pages/admin/TimPesertaPage";

import BiodataMahasiswaPage from "../pages/mahasiswa/BiodataMahasiswaPage";
import AnggotaTimPage from "../pages/mahasiswa/AnggotaTimPage";
import DaftarProposalPage from "../pages/mahasiswa/DaftarProposalPage";
import FormProposalPage from "../pages/mahasiswa/FormProposalPage";
import PengajuanPembimbingPage from "../pages/mahasiswa/PengajuanPembimbingPage";
import LogBimbinganPage from "../pages/mahasiswa/LogBimbinganPage";
import DetailLogBimbinganPage from "../pages/mahasiswa/DetailLogBimbinganPage";

import PenugasanPage from "../pages/reviewer/PenugasanPage";
import PenugasanDetailPage from "../pages/reviewer/PenugasanDetailPage";

import JuriPenugasanPage from "../pages/juri/PenugasanPage";
import JuriDetailPenugasanPage from "../pages/juri/PenugasanDetailPage";

import BiodataDosenPage from "../pages/dosen/BiodataDosenPage";
import DaftarPengajuanPembimbingPage from "../pages/dosen/DaftarPengajuanPembimbingPage";
import DetailPengajuanPembimbingPage from "../pages/dosen/DetailPengajuanPembimbingPage";
import DaftarBimbinganPage from "../pages/dosen/DaftarBimbinganPage"; 
import DetailBimbinganPage from "../pages/dosen/DetailBimbinganPage";

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
        <Route path="rekap-penilaian" element={<RekapPenilaianPage />} />
        <Route path= "bimbingan" element={<BimbinganPage />} />
        <Route path="kampus" element={<KampusPage />} />
        <Route path="jurusan" element={<JurusanPage />} />
        <Route path="prodi" element={<ProdiPage />} />
        <Route path="pengguna" element={<KelolaPenggunaPage />} />
        <Route path="tim-peserta" element={<TimPesertaPage />} />
      </Route>

      {/* MAHASISWA*/}
      <Route path="/mahasiswa" element={<PrivateRoute />}>
        <Route path="biodata" element={<BiodataMahasiswaPage />} />
        <Route path="anggota-tim" element={<AnggotaTimPage />} />
        <Route path="proposal" element={<DaftarProposalPage />} />
        <Route path="proposal/form" element={<FormProposalPage />} />
        <Route path="pembimbing/dosen" element={<PengajuanPembimbingPage />} />
        <Route path="bimbingan" element={<LogBimbinganPage />} />
        <Route path="bimbingan/:id_bimbingan" element={<DetailLogBimbinganPage />} />
      </Route>

      {/* REVIEWER*/}
      <Route path="/reviewer" element={<PrivateRoute />}>
        <Route path="penugasan" element={<PenugasanPage />} />
        <Route path="penugasan/:id_distribusi" element={<PenugasanDetailPage />} />
      </Route>

      {/* JURI*/}
      <Route path="/juri" element={<PrivateRoute />}>
        <Route path="penugasan" element={<JuriPenugasanPage />} />
        <Route path="penugasan/:id_distribusi" element={<JuriDetailPenugasanPage />} />
      </Route>

      {/* DOSEN*/}
      <Route path="/dosen" element={<PrivateRoute />}>
        <Route path="biodata" element={<BiodataDosenPage />} />
        <Route path="pembimbing/pengajuan" element={<DaftarPengajuanPembimbingPage />} />
        <Route path="pembimbing/pengajuan/:id_pengajuan" element={<DetailPengajuanPembimbingPage />} />
        <Route path="bimbingan" element={<DaftarBimbinganPage />} />
        <Route path="bimbingan/pengajuan/:id_bimbingan" element={<DetailBimbinganPage />} />
      </Route>

      {/* ERROR */}
      <Route path="/500" element={<ServerErrorPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
