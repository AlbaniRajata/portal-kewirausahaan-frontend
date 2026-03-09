import { useState, useEffect } from "react";
import { Box, Typography, CircularProgress, Avatar } from "@mui/material";
import {
  PersonOutlined, GroupsOutlined, DescriptionOutlined,
  SchoolOutlined, MenuBookOutlined, CheckCircle,
  RadioButtonUnchecked, ArrowForward,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import BodyLayout from "../../components/layouts/BodyLayout";
import SidebarMahasiswa from "../../components/layouts/MahasiswaSidebar";
import PageTransition from "../../components/PageTransition";
import { getProfile } from "../../api/mahasiswa";
import { getTimStatus } from "../../api/mahasiswa";
import { getProposalStatus } from "../../api/mahasiswa";
import { getStatusPembimbing } from "../../api/mahasiswa";
import { getListBimbingan } from "../../api/mahasiswa";
import { useAuthStore } from "../../store/authStore";

const API_URL = import.meta.env.VITE_API_URL?.replace("/api", "");

const getProposalStatusInfo = (status) => {
  const map = {
    0:  { label: "Draft",                backgroundColor: "#757575" },
    1:  { label: "Diajukan",             backgroundColor: "#1565c0" },
    2:  { label: "Review Tahap 1",       backgroundColor: "#3949ab" },
    3:  { label: "Tidak Lolos Desk",     backgroundColor: "#c62828" },
    4:  { label: "Lolos Desk",           backgroundColor: "#2e7d32" },
    5:  { label: "Panel Wawancara",      backgroundColor: "#f57f17" },
    6:  { label: "Tidak Lolos Wawancara",backgroundColor: "#c62828" },
    7:  { label: "Lolos Wawancara",      backgroundColor: "#2e7d32" },
    8:  { label: "Pembimbing Diajukan",  backgroundColor: "#1565c0" },
    9:  { label: "Pembimbing Disetujui", backgroundColor: "#2e7d32" },
  };
  return map[status] ?? { label: "Unknown", backgroundColor: "#757575" };
};

const formatDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
};

const greet = () => {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
};

const StatCard = ({ icon, label, value, sub, accent, onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      position: "relative", overflow: "hidden",
      borderRadius: "20px", p: 3,
      background: "#fff",
      border: "1px solid #f0f0f0",
      boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      cursor: onClick ? "pointer" : "default",
      transition: "transform 0.2s, box-shadow 0.2s",
      "&:hover": onClick ? { transform: "translateY(-3px)", boxShadow: "0 8px 24px rgba(0,0,0,0.09)" } : {},
      "&::before": {
        content: '""', position: "absolute",
        top: 0, left: 0, width: "4px", height: "100%",
        backgroundColor: accent, borderRadius: "20px 0 0 20px",
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
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#888" }}>{label}</Typography>
    </Box>
    <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#1a1a1a", lineHeight: 1 }}>{value}</Typography>
    {sub && <Typography sx={{ fontSize: 12, color: "#aaa", mt: 0.75 }}>{sub}</Typography>}
  </Box>
);

const TimelineStep = ({ icon, label, sublabel, status, isLast, onClick }) => {
  const colors = {
    done:    { bg: "#2e7d32", border: "#2e7d32", text: "#2e7d32", line: "#2e7d32" },
    active:  { bg: "#0D59F2", border: "#0D59F2", text: "#0D59F2", line: "#e0e0e0" },
    pending: { bg: "#fff",    border: "#e0e0e0", text: "#bbb",    line: "#e0e0e0" },
  };
  const c = colors[status];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
        <Box sx={{ flex: 1, height: 2, backgroundColor: status === "done" ? "#2e7d32" : "#e0e0e0" }} />
        <Box
          onClick={onClick}
          sx={{
            width: 48, height: 48, borderRadius: "50%",
            backgroundColor: status === "pending" ? "#fff" : c.bg,
            border: `2px solid ${c.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: onClick ? "pointer" : "default",
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": onClick ? { transform: "scale(1.1)", boxShadow: `0 0 0 6px ${c.bg}22` } : {},
            zIndex: 1, flexShrink: 0,
          }}
        >
          <Box sx={{ color: status === "pending" ? "#bbb" : "#fff", display: "flex" }}>
            {icon}
          </Box>
        </Box>
        {!isLast && <Box sx={{ flex: 1, height: 2, backgroundColor: status === "done" ? "#2e7d32" : "#e0e0e0" }} />}
        {isLast && <Box sx={{ flex: 1 }} />}
      </Box>

      <Box sx={{ mt: 1.5, textAlign: "center", px: 1 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: c.text }}>{label}</Typography>
        {sublabel && (
          <Typography sx={{ fontSize: 11, color: "#aaa", mt: 0.25, lineHeight: 1.3 }}>{sublabel}</Typography>
        )}
      </Box>
    </Box>
  );
};

const BimbinganItem = ({ item }) => {
  const statusColor = { 0: "#f57f17", 1: "#2e7d32", 2: "#c62828" };
  const statusLabel = { 0: "Menunggu", 1: "Disetujui", 2: "Ditolak" };
  return (
    <Box sx={{
      display: "flex", alignItems: "center", gap: 2,
      p: 2, borderRadius: "12px",
      border: "1px solid #f5f5f5", backgroundColor: "#fafafa",
    }}>
      <Box sx={{
        width: 36, height: 36, borderRadius: "10px", flexShrink: 0,
        backgroundColor: `${statusColor[item.status]}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <MenuBookOutlined sx={{ fontSize: 18, color: statusColor[item.status] }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.topik}
        </Typography>
        <Typography sx={{ fontSize: 12, color: "#aaa" }}>{formatDate(item.tanggal_bimbingan)}</Typography>
      </Box>
      <Box sx={{
        px: 1.5, py: 0.3, borderRadius: "50px",
        backgroundColor: statusColor[item.status],
        flexShrink: 0,
      }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>
          {statusLabel[item.status]}
        </Typography>
      </Box>
    </Box>
  );
};

export default function DashboardMahasiswaPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    profile: null,
    tim: null,
    proposal: null,
    pembimbing: null,
    bimbingan: [],
  });

  useEffect(() => {
    const fetchAll = async () => {
      const [profileRes, timRes, proposalRes, pembimbingRes, bimbinganRes] =
        await Promise.allSettled([
          getProfile(),
          getTimStatus(),
          getProposalStatus(),
          getStatusPembimbing(),
          getListBimbingan(),
        ]);

      setData({
        profile:    profileRes.status    === "fulfilled" ? profileRes.value.data    : null,
        tim:        timRes.status        === "fulfilled" ? timRes.value.data        : null,
        proposal:   proposalRes.status   === "fulfilled" ? proposalRes.value.data   : null,
        pembimbing: pembimbingRes.status === "fulfilled" ? pembimbingRes.value.data : null,
        bimbingan:  bimbinganRes.status  === "fulfilled"
          ? (bimbinganRes.value.data?.bimbingan || [])
          : [],
      });
      setLoading(false);
    };
    fetchAll();
  }, []);

  const { profile, tim, proposal, pembimbing, bimbingan } = data;

  const hasTim       = tim?.hasTim === true;
  const timLengkap   = hasTim && (proposal?.data?.anggota?.all_accepted === true);
  const hasProposal  = !!proposal?.data?.proposal;
  const proposalObj  = proposal?.data?.proposal;
  const proposalLolos = proposalObj?.status >= 7;
  const hasPembimbing = pembimbing?.pengajuan?.status === 1;
  const totalBimbingan = bimbingan.length;
  const recentBimbingan = [...bimbingan].sort((a, b) =>
    new Date(b.tanggal_bimbingan) - new Date(a.tanggal_bimbingan)
  ).slice(0, 3);

  const steps = [
    {
      icon: <PersonOutlined sx={{ fontSize: 20 }} />,
      label: "Biodata",
      sublabel: profile ? "Lengkap" : "Belum diisi",
      status: profile ? "done" : "active",
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
      icon: <DescriptionOutlined sx={{ fontSize: 20 }} />,
      label: "Proposal",
      sublabel: hasProposal ? getProposalStatusInfo(proposalObj.status).label : "Belum diajukan",
      status: proposalLolos ? "done" : hasProposal ? "active" : "pending",
      path: "/mahasiswa/proposal",
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
  ];

  const statCards = [
    {
      icon: <GroupsOutlined sx={{ fontSize: 20, color: "#0D59F2" }} />,
      label: "Status Tim",
      value: !hasTim ? "Belum" : timLengkap ? "Lengkap" : "Proses",
      sub: hasTim ? tim?.data?.tim?.nama_tim : "Belum terdaftar dalam tim",
      accent: "#0D59F2",
      path: "/mahasiswa/anggota-tim",
    },
    {
      icon: <DescriptionOutlined sx={{ fontSize: 20, color: "#7c3aed" }} />,
      label: "Status Proposal",
      value: hasProposal ? getProposalStatusInfo(proposalObj.status).label : "Belum Ada",
      sub: hasProposal ? proposalObj.judul?.slice(0, 40) + "..." : "Belum membuat proposal",
      accent: "#7c3aed",
      path: "/mahasiswa/proposal",
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
      icon: <MenuBookOutlined sx={{ fontSize: 20, color: "#059669" }} />,
      label: "Total Bimbingan",
      value: `${totalBimbingan} Sesi`,
      sub: totalBimbingan > 0 ? `Terakhir: ${formatDate(recentBimbingan[0]?.tanggal_bimbingan)}` : "Belum ada sesi bimbingan",
      accent: "#059669",
      path: "/mahasiswa/bimbingan",
    },
  ];

  if (loading) {
    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress />
        </Box>
      </BodyLayout>
    );
  }

  return (
    <BodyLayout Sidebar={SidebarMahasiswa}>
      <PageTransition>
        <Box>

          <Box sx={{
            p: 4, mb: 4, borderRadius: "24px",
            background: "linear-gradient(135deg, #0D59F2 0%, #1e40af 100%)",
            color: "#fff", position: "relative", overflow: "hidden",
          }}>
            <Box sx={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.06)" }} />
            <Box sx={{ position: "absolute", bottom: -60, right: 80, width: 150, height: 150, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.04)" }} />

            <Box sx={{ display: "flex", alignItems: "center", gap: 3, position: "relative", zIndex: 1 }}>
              <Avatar
                src={profile?.foto ? `${API_URL}/uploads/profil/${profile.foto}` : undefined}
                sx={{ width: 64, height: 64, border: "3px solid rgba(255,255,255,0.3)", fontSize: 24, backgroundColor: "rgba(255,255,255,0.2)" }}
              >
                {user?.nama_lengkap?.[0] || "M"}
              </Avatar>
              <Box>
                <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                  {greet()},
                </Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2 }}>
                  {profile?.nama_lengkap || user?.nama_lengkap || "Mahasiswa"}
                </Typography>
                <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.7)", mt: 0.5 }}>
                  {profile?.nim || "-"} · {profile?.nama_prodi || "-"}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2.5, mb: 4 }}>
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

          <Box sx={{
            p: 4, mb: 4, borderRadius: "20px",
            background: "#fff",
            border: "1px solid #f0f0f0",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#1a1a1a" }}>
                  Progress Pendaftaran
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#aaa" }}>
                  Klik tahap untuk navigasi ke halaman terkait
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {[{ color: "#2e7d32", label: "Selesai" }, { color: "#0D59F2", label: "Berjalan" }, { color: "#e0e0e0", label: "Belum" }].map((s) => (
                  <Box key={s.label} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: s.color }} />
                    <Typography sx={{ fontSize: 12, color: "#888" }}>{s.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "flex-start", px: 2 }}>
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

          <Box sx={{
            p: 4, borderRadius: "20px",
            background: "#fff",
            border: "1px solid #f0f0f0",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#1a1a1a" }}>
                Bimbingan Terbaru
              </Typography>
              <Box
                onClick={() => navigate("/mahasiswa/bimbingan")}
                sx={{
                  display: "flex", alignItems: "center", gap: 0.5,
                  cursor: "pointer", color: "#0D59F2",
                  "&:hover": { opacity: 0.7 },
                }}
              >
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Lihat semua</Typography>
                <ArrowForward sx={{ fontSize: 16 }} />
              </Box>
            </Box>

            {recentBimbingan.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 5 }}>
                <MenuBookOutlined sx={{ fontSize: 40, color: "#e0e0e0", mb: 1.5 }} />
                <Typography sx={{ fontSize: 14, color: "#bbb" }}>Belum ada riwayat bimbingan</Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {recentBimbingan.map((b) => (
                  <BimbinganItem key={b.id_bimbingan} item={b} />
                ))}
              </Box>
            )}
          </Box>

        </Box>
      </PageTransition>
    </BodyLayout>
  );
}