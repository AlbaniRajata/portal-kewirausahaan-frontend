import { useState, useEffect } from "react";
import { Box, Typography, CircularProgress, Avatar } from "@mui/material";
import {
  SchoolOutlined, MenuBookOutlined, CheckCircleOutlined,
  CancelOutlined, ArrowForward, PersonOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import BodyLayout from "../../components/layouts/BodyLayout";
import DosenSidebar from "../../components/layouts/DosenSidebar";
import PageTransition from "../../components/PageTransition";
import { getProfile, getPengajuanMasuk, getBimbinganMasuk } from "../../api/dosen";
import { useAuthStore } from "../../store/authStore";

const API_URL = import.meta.env.VITE_API_URL?.replace("/api", "");

const greet = () => {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
};

const formatTime = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
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

const AktivitasItem = ({ item, onClick }) => {
  const isPembimbing = item._type === "pembimbing";
  const accent = isPembimbing ? "#0D59F2" : "#059669";
  const typeLabel = isPembimbing ? "Pengajuan Pembimbing" : "Pengajuan Bimbingan";

  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex", alignItems: "center", gap: 2,
        p: 2, borderRadius: "12px",
        border: "1px solid #f5f5f5", backgroundColor: "#fafafa",
        cursor: "pointer", transition: "background 0.15s",
        "&:hover": { backgroundColor: "#f0f4ff" },
      }}
    >
      <Box sx={{
        width: 36, height: 36, borderRadius: "10px", flexShrink: 0,
        backgroundColor: `${accent}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {isPembimbing
          ? <SchoolOutlined sx={{ fontSize: 18, color: accent }} />
          : <MenuBookOutlined sx={{ fontSize: 18, color: accent }} />
        }
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.nama_tim}
        </Typography>
        <Typography sx={{ fontSize: 12, color: "#aaa" }}>
          {typeLabel} · {formatTime(item.created_at)}
        </Typography>
      </Box>
      <Box sx={{ px: 1.5, py: 0.3, borderRadius: "50px", backgroundColor: "#f57f17", flexShrink: 0 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>Menunggu</Typography>
      </Box>
      <ArrowForward sx={{ fontSize: 16, color: "#ccc", flexShrink: 0 }} />
    </Box>
  );
};

export default function DashboardDosenPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    profile: null,
    pengajuan: [],
    bimbingan: [],
  });

  useEffect(() => {
    const fetchAll = async () => {
      const [profileRes, pengajuanRes, bimbinganRes] = await Promise.allSettled([
        getProfile(),
        getPengajuanMasuk(),
        getBimbinganMasuk(),
      ]);

      setData({
        profile:   profileRes.status   === "fulfilled" ? profileRes.value.data       : null,
        pengajuan: pengajuanRes.status === "fulfilled" ? (pengajuanRes.value.data || []) : [],
        bimbingan: bimbinganRes.status === "fulfilled" ? (bimbinganRes.value.data || []) : [],
      });
      setLoading(false);
    };
    fetchAll();
  }, []);

  const { profile, pengajuan, bimbingan } = data;

  const pengajuanMenunggu  = pengajuan.filter((p) => p.status === 0).length;
  const pengajuanDisetujui = pengajuan.filter((p) => p.status === 1).length;
  const pengajuanDitolak   = pengajuan.filter((p) => p.status === 2).length;

  const bimbinganMenunggu  = bimbingan.filter((b) => b.status === 0).length;
  const bimbinganDisetujui = bimbingan.filter((b) => b.status === 1).length;
  const bimbinganDitolak   = bimbingan.filter((b) => b.status === 2).length;

  const totalMenunggu  = pengajuanMenunggu + bimbinganMenunggu;
  const totalDisetujui = pengajuanDisetujui + bimbinganDisetujui;
  const totalDitolak   = pengajuanDitolak + bimbinganDitolak;

  const aktivitasBelumDirespon = [
    ...pengajuan.filter((p) => p.status === 0).map((p) => ({ ...p, _type: "pembimbing" })),
    ...bimbingan.filter((b) => b.status === 0).map((b) => ({ ...b, _type: "bimbingan" })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  const statCards = [
    {
      icon: <SchoolOutlined sx={{ fontSize: 20, color: "#0D59F2" }} />,
      label: "Pengajuan Pembimbing",
      value: pengajuan.length,
      sub: pengajuanMenunggu > 0 ? `${pengajuanMenunggu} menunggu respon` : "Semua sudah direspon",
      accent: "#0D59F2",
      path: "/dosen/pembimbing/pengajuan",
    },
    {
      icon: <MenuBookOutlined sx={{ fontSize: 20, color: "#059669" }} />,
      label: "Log Bimbingan",
      value: bimbingan.length,
      sub: bimbinganMenunggu > 0 ? `${bimbinganMenunggu} menunggu konfirmasi` : "Semua sudah direspon",
      accent: "#059669",
      path: "/dosen/bimbingan",
    },
    {
      icon: <CheckCircleOutlined sx={{ fontSize: 20, color: "#2e7d32" }} />,
      label: "Total Disetujui",
      value: totalDisetujui,
      sub: `${pengajuanDisetujui} pembimbing · ${bimbinganDisetujui} bimbingan`,
      accent: "#2e7d32",
      path: null,
    },
    {
      icon: <CancelOutlined sx={{ fontSize: 20, color: "#c62828" }} />,
      label: "Total Ditolak",
      value: totalDitolak,
      sub: `${pengajuanDitolak} pembimbing · ${bimbinganDitolak} bimbingan`,
      accent: "#c62828",
      path: null,
    },
  ];

  if (loading) {
    return (
      <BodyLayout Sidebar={DosenSidebar}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress />
        </Box>
      </BodyLayout>
    );
  }

  return (
    <BodyLayout Sidebar={DosenSidebar}>
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
                {user?.nama_lengkap?.[0] || "D"}
              </Avatar>
              <Box>
                <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                  {greet()},
                </Typography>
                <Typography sx={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2 }}>
                  {profile?.nama_lengkap || user?.nama_lengkap || "Dosen"}
                </Typography>
                <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.7)", mt: 0.5 }}>
                  {profile?.nip || "-"} · {profile?.nama_jurusan || "-"}
                </Typography>
              </Box>

              {totalMenunggu > 0 && (
                <Box sx={{
                  ml: "auto", px: 2.5, py: 1.2, borderRadius: "50px",
                  backgroundColor: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  backdropFilter: "blur(4px)",
                }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                    {totalMenunggu} perlu direspon
                  </Typography>
                </Box>
              )}
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
                onClick={card.path ? () => navigate(card.path) : undefined}
              />
            ))}
          </Box>

          <Box sx={{
            p: 4, borderRadius: "20px",
            background: "#fff",
            border: "1px solid #f0f0f0",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Box>
                <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#1a1a1a" }}>
                  Perlu Direspon
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#aaa" }}>
                  Pengajuan pembimbing & bimbingan yang belum direspon
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Box
                  onClick={() => navigate("/dosen/pembimbing/pengajuan")}
                  sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", color: "#0D59F2", "&:hover": { opacity: 0.7 } }}
                >
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Pembimbing</Typography>
                  <ArrowForward sx={{ fontSize: 16 }} />
                </Box>
                <Box
                  onClick={() => navigate("/dosen/bimbingan")}
                  sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", color: "#059669", "&:hover": { opacity: 0.7 } }}
                >
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Bimbingan</Typography>
                  <ArrowForward sx={{ fontSize: 16 }} />
                </Box>
              </Box>
            </Box>

            {aktivitasBelumDirespon.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 5 }}>
                <CheckCircleOutlined sx={{ fontSize: 40, color: "#e0e0e0", mb: 1.5 }} />
                <Typography sx={{ fontSize: 14, color: "#bbb" }}>Semua pengajuan sudah direspon</Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {aktivitasBelumDirespon.map((item) => (
                  <AktivitasItem
                    key={`${item._type}-${item._type === "pembimbing" ? item.id_pengajuan : item.id_bimbingan}`}
                    item={item}
                    onClick={() =>
                      navigate(
                        item._type === "pembimbing"
                          ? `/dosen/pembimbing/pengajuan/${item.id_pengajuan}`
                          : `/dosen/bimbingan/pengajuan/${item.id_bimbingan}`
                      )
                    }
                  />
                ))}
              </Box>
            )}
          </Box>

        </Box>
      </PageTransition>
    </BodyLayout>
  );
}