import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";
import PrivateRoute from "../components/PrivateRoute";

const LandingPage = lazy(() => import("../pages/public/LandingPage"));
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterMahasiswaPage = lazy(() => import("../pages/auth/RegisterMahasiswaPage"));
const RegisterDosenPage = lazy(() => import("../pages/auth/RegisterDosenPage"));

const VerifikasiPage = lazy(() => import("../pages/admin/VerifikasiPage"));
const ProgramPage = lazy(() => import("../pages/admin/ProgramPage"));
const ProposalListPage = lazy(() => import("../pages/admin/ProposalListPage"));
const ProposalDetailPage = lazy(() => import("../pages/admin/ProposalDetailPage"));
const DistribusiPenilaiPage = lazy(() => import("../pages/admin/DistribusiPenilaiPage"));
const DistribusiDetailPage = lazy(() => import("../pages/admin/DistribusiDetailPage"));
const RekapPenilaianPage = lazy(() => import("../pages/admin/RekapPenilaianPage"));
const BimbinganPage = lazy(() => import("../pages/admin/BimbinganPage"));
const KampusPage = lazy(() => import("../pages/admin/KampusPage"));
const JurusanPage = lazy(() => import("../pages/admin/JurusanPage"));
const ProdiPage = lazy(() => import("../pages/admin/ProdiPage"));
const KelolaPenggunaPage = lazy(() => import("../pages/admin/KelolaPenggunaPage"));
const TimPesertaPage = lazy(() => import("../pages/admin/TimPesertaPage"));

const DashboardMahasiswaPage = lazy(() => import("../pages/mahasiswa/DashboardMahasiswaPage"));
const BiodataMahasiswaPage = lazy(() => import("../pages/mahasiswa/BiodataMahasiswaPage"));
const AnggotaTimPage = lazy(() => import("../pages/mahasiswa/AnggotaTimPage"));
const UndanganAnggotaPage = lazy(() => import("../pages/mahasiswa/UndanganAnggotaPage"));
const DaftarProposalPage = lazy(() => import("../pages/mahasiswa/DaftarProposalPage"));
const FormProposalPage = lazy(() => import("../pages/mahasiswa/FormProposalPage"));
const PengajuanPembimbingPage = lazy(() => import("../pages/mahasiswa/PengajuanPembimbingPage"));
const LogBimbinganPage = lazy(() => import("../pages/mahasiswa/LogBimbinganPage"));
const DetailLogBimbinganPage = lazy(() => import("../pages/mahasiswa/DetailLogBimbinganPage"));

const PenugasanPage = lazy(() => import("../pages/reviewer/PenugasanPage"));
const PenugasanDetailPage = lazy(() => import("../pages/reviewer/PenugasanDetailPage"));

const JuriPenugasanPage = lazy(() => import("../pages/juri/PenugasanPage"));
const JuriDetailPenugasanPage = lazy(() => import("../pages/juri/PenugasanDetailPage"));

const BiodataDosenPage = lazy(() => import("../pages/dosen/BiodataDosenPage"));
const DaftarPengajuanPembimbingPage = lazy(() => import("../pages/dosen/DaftarPengajuanPembimbingPage"));
const DetailPengajuanPembimbingPage = lazy(() => import("../pages/dosen/DetailPengajuanPembimbingPage"));
const DaftarBimbinganPage = lazy(() => import("../pages/dosen/DaftarBimbinganPage"));
const DetailBimbinganPage = lazy(() => import("../pages/dosen/DetailBimbinganPage"));

const NotFoundPage = lazy(() => import("../pages/errors/UnauthorizedPage"));
const ServerErrorPage = lazy(() => import("../components/ErrorBoundary"));
const UnauthorizedPage = lazy(() => import("../pages/errors/UnauthorizedPage"));

const PageLoader = () => (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
    <CircularProgress />
  </Box>
);

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/daftar/mahasiswa" element={<RegisterMahasiswaPage />} />
        <Route path="/daftar/dosen" element={<RegisterDosenPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route path="/admin" element={<PrivateRoute allowedRoles={["admin", "super admin"]} />}>
          <Route path="verifikasi" element={<VerifikasiPage />} />
          <Route path="program" element={<ProgramPage />} />
          <Route path="proposal" element={<ProposalListPage />} />
          <Route path="proposal/:id_proposal" element={<ProposalDetailPage />} />
          <Route path="distribusi-penilai" element={<DistribusiPenilaiPage />} />
          <Route path="program/:id_program/distribusi/reviewer/tahap/:tahap/:id_distribusi" element={<DistribusiDetailPage />} />
          <Route path="rekap-penilaian" element={<RekapPenilaianPage />} />
          <Route path="bimbingan" element={<BimbinganPage />} />
          <Route path="kampus" element={<KampusPage />} />
          <Route path="jurusan" element={<JurusanPage />} />
          <Route path="prodi" element={<ProdiPage />} />
          <Route path="pengguna" element={<KelolaPenggunaPage />} />
          <Route path="tim-peserta" element={<TimPesertaPage />} />
        </Route>

        <Route path="/mahasiswa" element={<PrivateRoute allowedRoles={["mahasiswa"]} />}>
          <Route path="dashboard" element={<DashboardMahasiswaPage />} />
          <Route path="biodata" element={<BiodataMahasiswaPage />} />
          <Route path="anggota-tim" element={<AnggotaTimPage />} />
          <Route path="undangan-anggota" element={<UndanganAnggotaPage />} />
          <Route path="proposal" element={<DaftarProposalPage />} />
          <Route path="proposal/form" element={<FormProposalPage />} />
          <Route path="pembimbing/dosen" element={<PengajuanPembimbingPage />} />
          <Route path="bimbingan" element={<LogBimbinganPage />} />
          <Route path="bimbingan/:id_bimbingan" element={<DetailLogBimbinganPage />} />
        </Route>

        <Route path="/reviewer" element={<PrivateRoute allowedRoles={["reviewer"]} />}>
          <Route path="penugasan" element={<PenugasanPage />} />
          <Route path="penugasan/:id_distribusi" element={<PenugasanDetailPage />} />
        </Route>

        <Route path="/juri" element={<PrivateRoute allowedRoles={["juri"]} />}>
          <Route path="penugasan" element={<JuriPenugasanPage />} />
          <Route path="penugasan/:id_distribusi" element={<JuriDetailPenugasanPage />} />
        </Route>

        <Route path="/dosen" element={<PrivateRoute allowedRoles={["dosen"]} />}>
          <Route path="biodata" element={<BiodataDosenPage />} />
          <Route path="pembimbing/pengajuan" element={<DaftarPengajuanPembimbingPage />} />
          <Route path="pembimbing/pengajuan/:id_pengajuan" element={<DetailPengajuanPembimbingPage />} />
          <Route path="bimbingan" element={<DaftarBimbinganPage />} />
          <Route path="bimbingan/pengajuan/:id_bimbingan" element={<DetailBimbinganPage />} />
        </Route>

        <Route path="/500" element={<ServerErrorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}