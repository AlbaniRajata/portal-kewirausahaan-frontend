import { useState, useEffect } from "react";
import { Box, Typography, Avatar, LinearProgress, Chip, Paper } from "@mui/material";
import {
  PersonOutlined, GroupsOutlined, DescriptionOutlined,
  SchoolOutlined, MenuBookOutlined, ArrowForward,
  AssignmentTurnedInOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import BodyLayout from "../../components/layouts/BodyLayout";
import MahasiswaNavbar from "../../components/layouts/MahasiswaNavbar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import { getProfile } from "../../api/mahasiswa";
import { getTimStatus } from "../../api/mahasiswa";
import { getProposalStatus } from "../../api/mahasiswa";
import { getStatusPembimbing } from "../../api/mahasiswa";
import { getListBimbingan } from "../../api/mahasiswa";
import { getLuaranMahasiswa } from "../../api/mahasiswa";
import { useAuthStore } from "../../store/authStore";
import { getUploadUrl } from "../../utils/fileUrl";

const COLORS = {
  primary:      "#0D59F2",
  primaryLight: "#E0F2FE",
  primaryDark:  "#0369A1",
  primaryMuted: "#93C5FD",
  secondary:    "#2563EB",
  accent:       "#3B82F6",
  slate:        "#64748B",
  slateLight:   "#F1F5F9",
  success:      "#059669",
  successLight: "#ECFDF5",
  warning:      "#D97706",
  warningLight: "#FFFBEB",
  error:        "#DC2626",
  errorLight:   "#FEF2F2",
};

const getProposalStatusInfo = (status) => {
  const map = {
    0:  { label: "Draft",                  backgroundColor: "#757575" },
    1:  { label: "Diajukan",               backgroundColor: "#1565c0" },
    2:  { label: "Review Tahap 1",         backgroundColor: "#3949ab" },
    3:  { label: "Tidak Lolos Desk",       backgroundColor: "#c62828" },
    4:  { label: "Lolos Desk",             backgroundColor: "#2e7d32" },
    5:  { label: "Wawancara",        backgroundColor: "#f57f17" },
    6:  { label: "Tidak Lolos Wawancara",  backgroundColor: "#c62828" },
    7:  { label: "Lolos Wawancara",        backgroundColor: "#2e7d32" },
    8:  { label: "Pembimbing Diajukan",    backgroundColor: "#1565c0" },
    9:  { label: "Pembimbing Disetujui",   backgroundColor: "#2e7d32" },
    10: { label: "Nonaktif / Mengundurkan Diri", backgroundColor: "#c62828" },
  };
  return map[status] ?? { label: "Unknown", backgroundColor: "#757575" };
};

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
};

const greet = () => {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
};

const isBiodataLengkap = (profile) => !!(
  profile?.nama_lengkap &&
  profile?.nim &&
  profile?.no_hp &&
  profile?.nama_prodi &&
  // Accept either profile photo or KTM photo as completing biodata
  (profile?.foto || profile?.foto_ktm)
);

const SectionHeader = ({ icon: Icon, title, subtitle, gradient }) => (
  <Box sx={{
    display: "flex", alignItems: "center", gap: 2, mb: 3,
    p: 2.5, borderRadius: "14px", background: gradient,
  }}>
    <Box sx={{
      width: 44, height: 44, borderRadius: "12px",
      background: "rgba(255,255,255,0.25)",
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(4px)",
    }}>
      <Icon sx={{ color: "#fff", fontSize: 22 }} />
    </Box>
    <Box>
      <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{title}</Typography>
      {subtitle && <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.8)", mt: 0.3 }}>{subtitle}</Typography>}
    </Box>
  </Box>
);

const StatCard = ({ icon, label, value, sub, accent, onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      position: "relative", overflow: "hidden",
      borderRadius: "16px", p: 2.5,
      background: "#fff",
      border: "1.5px solid #E5E7EB",
      cursor: onClick ? "pointer" : "default",
      transition: "transform 0.2s, box-shadow 0.2s",
      "&:hover": onClick ? {
        transform: "translateY(-3px)",
        boxShadow: `0 8px 24px rgba(0,0,0,0.09)`,
        borderColor: accent,
      } : {},
      "&::before": {
        content: '""', position: "absolute",
        top: 0, left: 0, width: "4px", height: "100%",
        backgroundColor: accent, borderRadius: "16px 0 0 16px",
      },
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
      <Box sx={{
        width: 40, height: 40, borderRadius: "12px",
        backgroundColor: `${accent}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </Box>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: COLORS.slate }}>{label}</Typography>
    </Box>
    <Typography sx={{ fontSize: 20, fontWeight: 800, color: "#1F2937", lineHeight: 1 }}>{value}</Typography>
    {sub && <Typography sx={{ fontSize: 12, color: "#9CA3AF", mt: 0.75, lineHeight: 1.4 }}>{sub}</Typography>}
  </Box>
);

const TimelineStep = ({ icon, label, sublabel, status, isLast, onClick }) => {
  const colorMap = {
    done:    { bg: COLORS.success,  border: COLORS.success,  text: COLORS.success },
    active:  { bg: COLORS.primary,  border: COLORS.primary,  text: COLORS.primary },
    pending: { bg: "#fff",          border: "#E5E7EB",        text: "#9CA3AF" },
  };
  const c = colorMap[status];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: "120px" }}>
      <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
        <Box sx={{ flex: 1, height: 2, backgroundColor: status === "done" ? COLORS.success : "#E5E7EB" }} />
        <Box
          onClick={onClick}
          sx={{
            width: 44, height: 44, borderRadius: "50%",
            backgroundColor: status === "pending" ? "#fff" : c.bg,
            border: `2px solid ${c.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: onClick ? "pointer" : "default",
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": onClick ? { transform: "scale(1.1)", boxShadow: `0 0 0 6px ${c.bg}22` } : {},
            zIndex: 1, flexShrink: 0,
          }}
        >
          <Box sx={{ color: status === "pending" ? "#9CA3AF" : "#fff", display: "flex" }}>
            {icon}
          </Box>
        </Box>
        {!isLast
          ? <Box sx={{ flex: 1, height: 2, backgroundColor: status === "done" ? COLORS.success : "#E5E7EB" }} />
          : <Box sx={{ flex: 1 }} />
        }
      </Box>
      <Box sx={{ mt: 1.5, textAlign: "center", px: 0.5 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: c.text }}>{label}</Typography>
        {sublabel && (
          <Typography sx={{ fontSize: 10, color: "#9CA3AF", mt: 0.25, lineHeight: 1.3 }}>{sublabel}</Typography>
        )}
      </Box>
    </Box>
  );
};

const BimbinganItem = ({ item }) => {
  const statusColor = { 0: COLORS.warning, 1: COLORS.success, 2: COLORS.error };
  const statusLabel = { 0: "Menunggu", 1: "Disetujui", 2: "Ditolak" };
  return (
    <Box sx={{
      display: "flex", alignItems: "center", gap: 2,
      p: 2, borderRadius: "12px",
      border: "1.5px solid #F1F5F9",
      backgroundColor: "#fafafa",
      transition: "border-color 0.2s",
      "&:hover": { borderColor: COLORS.primaryMuted },
    }}>
      <Box sx={{
        width: 36, height: 36, borderRadius: "10px", flexShrink: 0,
        backgroundColor: `${statusColor[item.status]}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <MenuBookOutlined sx={{ fontSize: 18, color: statusColor[item.status] }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#1F2937", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.topik}
        </Typography>
        <Typography sx={{ fontSize: 12, color: COLORS.slate }}>{formatDate(item.tanggal_bimbingan)}</Typography>
      </Box>
      <Box sx={{ px: 1.5, py: 0.3, borderRadius: "50px", backgroundColor: statusColor[item.status], flexShrink: 0 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>
          {statusLabel[item.status]}
        </Typography>
      </Box>
    </Box>
  );
};

const SectionLinkHeader = ({ title, subtitle, to, navigate }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 1 }}>
    <Box>
      <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#1F2937" }}>{title}</Typography>
      {subtitle && <Typography sx={{ fontSize: 12, color: COLORS.slate, mt: 0.3 }}>{subtitle}</Typography>}
    </Box>
    <Box
      onClick={() => navigate(to)}
      sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", color: COLORS.primary, "&:hover": { opacity: 0.7 } }}
    >
      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Lihat semua</Typography>
      <ArrowForward sx={{ fontSize: 16 }} />
    </Box>
  </Box>
);

export default function DashboardMahasiswaPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    profile: null, tim: null, proposal: null,
    pembimbing: null, bimbingan: [],
    monev: null, monevMessage: null,
  });

  useEffect(() => {
    const fetchAll = async () => {
      const [profileRes, timRes, proposalRes, pembimbingRes, bimbinganRes, monevRes] =
        await Promise.allSettled([
          getProfile(), getTimStatus(), getProposalStatus(),
          getStatusPembimbing(), getListBimbingan(), getLuaranMahasiswa(),
        ]);

      const monevPayload = monevRes.status === "fulfilled" ? monevRes.value : null;
      const monevData    = monevPayload?.success ? monevPayload.data : null;
      const monevMessage = monevPayload && !monevPayload.success
        ? monevPayload.message || "Data monev belum tersedia"
        : null;

      setData({
        profile:    profileRes.status    === "fulfilled" ? profileRes.value.data    : null,
        tim:        timRes.status        === "fulfilled" ? timRes.value.data        : null,
        proposal:   proposalRes.status   === "fulfilled" ? proposalRes.value.data   : null,
        pembimbing: pembimbingRes.status === "fulfilled" ? pembimbingRes.value.data : null,
        bimbingan:  bimbinganRes.status  === "fulfilled" ? (bimbinganRes.value.data?.bimbingan || []) : [],
        monev: monevData,
        monevMessage,
      });
      setLoading(false);
    };
    fetchAll();
  }, []);

  const { profile, tim, proposal, pembimbing, bimbingan, monev, monevMessage } = data;

  const biodataLengkap     = isBiodataLengkap(profile);
  const hasTim             = tim?.hasTim === true;
  const timLengkap         = hasTim && (proposal?.data?.anggota?.all_accepted === true);
  const hasProposal        = !!proposal?.data?.proposal;
  const proposalObj        = proposal?.data?.proposal;
  const proposalLolos      = proposalObj?.status >= 7;
  const hasPembimbing      = pembimbing?.pengajuan?.status === 1;
  const proposalSiapDibuat = hasTim && proposal?.data?.anggota?.all_accepted && hasPembimbing;
  const totalBimbingan     = bimbingan.length;
  const recentBimbingan    = [...bimbingan]
    .sort((a, b) => new Date(b.tanggal_bimbingan) - new Date(a.tanggal_bimbingan))
    .slice(0, 3);
  const monevProgress  = monev?.progress || null;
  const monevTotal     = Number(monevProgress?.total     || 0);
  const monevDisetujui = Number(monevProgress?.disetujui || 0);
  const monevSubmitted = Number(monevProgress?.submitted || 0);
  const monevDitolak   = Number(monevProgress?.ditolak   || 0);
  const monevBelum     = Number(monevProgress?.belum     || 0);
  const monevPercent   = monevTotal > 0 ? Math.round((monevDisetujui / monevTotal) * 100) : 0;

  const steps = [
    {
      icon: <PersonOutlined sx={{ fontSize: 20 }} />,
      label: "Biodata",
      sublabel: biodataLengkap ? "Lengkap" : profile ? "Belum lengkap" : "Belum diisi",
      status: biodataLengkap ? "done" : profile ? "active" : "active",
      path: "/mahasiswa/biodata",
    },
    {
      icon: <GroupsOutlined sx={{ fontSize: 20 }} />,
      label: "Tim",
      sublabel: hasTim ? (timLengkap ? "Lengkap" : "Menunggu anggota") : "Belum dibuat",
      status: timLengkap ? "done" : hasTim ? "active" : "pending",
      path: "/mahasiswa/anggota-tim",
    },
    {
      icon: <SchoolOutlined sx={{ fontSize: 20 }} />,
      label: "Pembimbing",
      sublabel: hasPembimbing ? "Disetujui" : pembimbing?.pengajuan ? "Menunggu" : "Belum diajukan",
      status: hasPembimbing ? "done" : pembimbing?.pengajuan ? "active" : "pending",
      path: "/mahasiswa/pembimbing/dosen",
    },
    {
      icon: <MenuBookOutlined sx={{ fontSize: 20 }} />,
      label: "Bimbingan",
      sublabel: totalBimbingan > 0 ? `${totalBimbingan} sesi` : "Belum ada",
      status: totalBimbingan > 0 ? "active" : "pending",
      path: "/mahasiswa/bimbingan",
    },
    {
      icon: <DescriptionOutlined sx={{ fontSize: 20 }} />,
      label: "Proposal",
      sublabel: hasProposal
        ? getProposalStatusInfo(proposalObj.status).label
        : proposalSiapDibuat
          ? "Siap dibuat"
          : proposal?.data?.anggota?.all_accepted
            ? (pembimbing?.pengajuan ? "Menunggu pembimbing" : "Pembimbing belum diajukan")
            : "Belum diajukan",
      status: proposalLolos ? "done" : hasProposal ? "active" : "pending",
      path: "/mahasiswa/proposal",
    },
  ];

  const statCards = [
    {
      icon: <GroupsOutlined sx={{ fontSize: 20, color: COLORS.primary }} />,
      label: "Status Tim",
      value: !hasTim ? "Belum" : timLengkap ? "Lengkap" : "Proses",
      sub: hasTim ? tim?.data?.tim?.nama_tim : "Belum terdaftar dalam tim",
      accent: COLORS.primary,
      path: "/mahasiswa/anggota-tim",
    },
    {
      icon: <SchoolOutlined sx={{ fontSize: 20, color: "#0891b2" }} />,
      label: "Pembimbing",
      value: hasPembimbing ? "Disetujui" : pembimbing?.pengajuan ? "Menunggu" : "Belum",
      sub: hasPembimbing ? pembimbing.pengajuan.nama_dosen : "Belum ada dosen pembimbing",
      accent: "#0891b2",
      path: "/mahasiswa/pembimbing/dosen",
    },
    {
      icon: <MenuBookOutlined sx={{ fontSize: 20, color: COLORS.success }} />,
      label: "Bimbingan",
      value: `${totalBimbingan} Sesi`,
      sub: totalBimbingan > 0 ? `Terakhir: ${formatDate(recentBimbingan[0]?.tanggal_bimbingan)}` : "Belum ada sesi bimbingan",
      accent: COLORS.success,
      path: "/mahasiswa/bimbingan",
    },
    {
      icon: <DescriptionOutlined sx={{ fontSize: 20, color: "#7c3aed" }} />,
      label: "Status Proposal",
      value: hasProposal ? getProposalStatusInfo(proposalObj.status).label : "Belum Ada",
      sub: hasProposal
        ? proposalObj.judul?.slice(0, 40) + "…"
        : proposalSiapDibuat
          ? "Proposal sudah bisa dibuat"
          : proposal?.data?.anggota?.all_accepted
            ? "Menunggu persetujuan pembimbing"
            : "Belum membuat proposal",
      accent: "#7c3aed",
      path: "/mahasiswa/proposal",
    },
    {
      icon: <AssignmentTurnedInOutlined sx={{ fontSize: 20, color: "#ea580c" }} />,
      label: "Progress Monev",
      value: monevProgress ? `${monevPercent}%` : "Belum Ada",
      sub: monevProgress
        ? `${monevDisetujui}/${monevTotal} luaran disetujui`
        : (monevMessage || "Belum ada data monev"),
      accent: "#ea580c",
      path: "/mahasiswa/monev",
    },
  ];

  if (loading) return (
    <BodyLayout Sidebar={MahasiswaNavbar}>
      <Box sx={{ position: "relative", minHeight: "60vh" }}>
        <LoadingScreen message="Memuat dashboard mahasiswa..." overlay minHeight="60vh" />
      </Box>
    </BodyLayout>
  );

  return (
    <BodyLayout Sidebar={MahasiswaNavbar}>
      <PageTransition>
        <Box>

          <Box sx={{
            p: { xs: 3, sm: 4 }, mb: 4, borderRadius: "20px",
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
            color: "#fff", position: "relative", overflow: "hidden",
          }}>
            <Box sx={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.06)" }} />
            <Box sx={{ position: "absolute", bottom: -60, right: 80, width: 150, height: 150, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.04)" }} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 3, position: "relative", zIndex: 1, flexWrap: "wrap" }}>
              <Avatar
                src={profile?.foto ? getUploadUrl("profil", profile.foto) : undefined}
                sx={{
                  width: { xs: 52, sm: 64 }, height: { xs: 52, sm: 64 },
                  border: "3px solid rgba(255,255,255,0.3)",
                  fontSize: 24, backgroundColor: "rgba(255,255,255,0.2)",
                }}
              >
                {user?.nama_lengkap?.[0] || "M"}
              </Avatar>
              <Box>
                <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                  {greet()},
                </Typography>
                <Typography sx={{ fontSize: { xs: 20, sm: 24 }, fontWeight: 800, lineHeight: 1.2 }}>
                  {profile?.nama_lengkap || user?.nama_lengkap || "Mahasiswa"}
                </Typography>
                <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.7)", mt: 0.5 }}>
                  {profile?.nim || "—"} · {profile?.nama_prodi || "—"}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" },
            gap: 2, mb: 4,
          }}>
            {statCards.map((card) => (
              <StatCard
                key={card.label}
                icon={card.icon}
                label={card.label}
                value={card.value}
                sub={card.sub}
                accent={card.accent}
                onClick={() => navigate(card.path)}
              />
            ))}
          </Box>

          <Paper elevation={0} sx={{ mb: 3, borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <SectionHeader
                icon={PersonOutlined}
                title="Progress Pendaftaran"
                subtitle="Klik setiap tahap untuk navigasi ke halaman terkait"
                gradient={`linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`}
              />

              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
                {[
                  { color: COLORS.success, label: "Selesai" },
                  { color: COLORS.primary, label: "Berjalan" },
                  { color: "#E5E7EB",      label: "Belum" },
                ].map((s) => (
                  <Box key={s.label} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: s.color }} />
                    <Typography sx={{ fontSize: 12, color: COLORS.slate }}>{s.label}</Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{
                display: "flex",
                alignItems: "flex-start",
                overflowX: "auto",
                pb: 1,
                "&::-webkit-scrollbar": { display: "none" },
                msOverflowStyle: "none",
                scrollbarWidth: "none",
              }}>
                {steps.map((step, i) => (
                  <TimelineStep
                    key={step.label}
                    icon={step.icon}
                    label={step.label}
                    sublabel={step.sublabel}
                    status={step.status}
                    isLast={i === steps.length - 1}
                    onClick={() => navigate(step.path)}
                  />
                ))}
              </Box>
            </Box>
          </Paper>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, mb: 3 }}>

            <Paper elevation={0} sx={{ borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
              <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.secondary}, ${COLORS.accent})` }} />
              <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
                <SectionHeader
                  icon={AssignmentTurnedInOutlined}
                  title="Monitoring & Evaluasi"
                  subtitle="Ringkasan progres pengumpulan luaran"
                  gradient={`linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.accent} 100%)`}
                />

                <Box
                  onClick={() => navigate("/mahasiswa/monev")}
                  sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5, mb: 2.5, cursor: "pointer", color: COLORS.primary, "&:hover": { opacity: 0.7 } }}
                >
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Lihat detail</Typography>
                  <ArrowForward sx={{ fontSize: 16 }} />
                </Box>

                {!monevProgress ? (
                  <Box sx={{ textAlign: "center", py: 5 }}>
                    <AssignmentTurnedInOutlined sx={{ fontSize: 40, color: "#E5E7EB", mb: 1.5 }} />
                    <Typography sx={{ fontSize: 14, color: COLORS.slate }}>
                      {monevMessage || "Belum ada data monev"}
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                      <LinearProgress
                        variant="determinate"
                        value={monevPercent}
                        sx={{
                          flex: 1, height: 10, borderRadius: 99,
                          backgroundColor: COLORS.slateLight,
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: monevPercent === 100 && monevTotal > 0 ? COLORS.success : COLORS.primary,
                            borderRadius: 99,
                          },
                        }}
                      />
                      <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#374151", minWidth: 44 }}>
                        {monevPercent}%
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}>
                      {[
                        { label: "Total",     value: monevTotal,     bg: "#424242" },
                        { label: "Disetujui", value: monevDisetujui, bg: "#1b5e20" },
                        { label: "Submitted", value: monevSubmitted, bg: "#f57f17" },
                        { label: "Ditolak",   value: monevDitolak,   bg: "#c62828" },
                        { label: "Belum",     value: monevBelum,     bg: "#757575" },
                      ].map((item) => (
                        <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                          <Chip
                            label={item.value}
                            size="small"
                            sx={{ backgroundColor: item.bg, color: "#fff", fontWeight: 700 }}
                          />
                          <Typography sx={{ fontSize: 13, color: COLORS.slate }}>{item.label}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </>
                )}
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
              <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.success}, #34D399)` }} />
              <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
                <SectionHeader
                  icon={MenuBookOutlined}
                  title="Bimbingan Terbaru"
                  subtitle="Riwayat sesi bimbingan terakhir"
                  gradient={`linear-gradient(135deg, ${COLORS.success} 0%, #34D399 100%)`}
                />

                <Box
                  onClick={() => navigate("/mahasiswa/bimbingan")}
                  sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5, mb: 2.5, cursor: "pointer", color: COLORS.primary, "&:hover": { opacity: 0.7 } }}
                >
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Lihat semua</Typography>
                  <ArrowForward sx={{ fontSize: 16 }} />
                </Box>

                {recentBimbingan.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 5 }}>
                    <MenuBookOutlined sx={{ fontSize: 40, color: "#E5E7EB", mb: 1.5 }} />
                    <Typography sx={{ fontSize: 14, color: COLORS.slate }}>Belum ada riwayat bimbingan</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {recentBimbingan.map((b) => (
                      <BimbinganItem key={b.id_bimbingan} item={b} />
                    ))}
                  </Box>
                )}
              </Box>
            </Paper>

          </Box>

        </Box>
      </PageTransition>
    </BodyLayout>
  );
}