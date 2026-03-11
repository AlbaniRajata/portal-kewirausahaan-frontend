import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, CircularProgress, Avatar,
  Paper, Divider,
} from "@mui/material";
import {
  DescriptionOutlined, CheckCircleOutlined, CancelOutlined,
  HourglassEmptyOutlined, WarningAmberOutlined, VerifiedUserOutlined,
  SchoolOutlined, ArrowForward, PeopleOutlined, NewspaperOutlined,
  AssignmentTurnedInOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer,
} from "recharts";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import { getMyProgram, getDashboardAdmin } from "../../api/admin";
import { useAuthStore } from "../../store/authStore";
import Swal from "sweetalert2";

const greet = () => {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
};

const formatDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const STATUS_MAP = {
  1: { label: "Diajukan",              backgroundColor: "#1565c0" },
  2: { label: "Review Tahap 1",        backgroundColor: "#3949ab" },
  3: { label: "Tidak Lolos Desk",      backgroundColor: "#c62828" },
  4: { label: "Lolos Desk",            backgroundColor: "#2e7d32" },
  5: { label: "Panel Wawancara",       backgroundColor: "#f57f17" },
  6: { label: "Tidak Lolos Wawancara", backgroundColor: "#c62828" },
  7: { label: "Lolos Wawancara",       backgroundColor: "#2e7d32" },
  8: { label: "Pembimbing Diajukan",   backgroundColor: "#1565c0" },
  9: { label: "Pembimbing Disetujui",  backgroundColor: "#2e7d32" },
};

const StatusPill = ({ status }) => {
  const cfg = STATUS_MAP[status] || { label: `Status ${status}`, backgroundColor: "#666" };
  return (
    <Box sx={{
      display: "inline-flex", px: 1.5, py: 0.35, borderRadius: "50px",
      backgroundColor: cfg.backgroundColor,
      color: "#fff", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
    }}>
      {cfg.label}
    </Box>
  );
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
    <Typography sx={{ fontSize: 28, fontWeight: 800, color: "#1a1a1a", lineHeight: 1 }}>{value}</Typography>
    {sub && <Typography sx={{ fontSize: 12, color: "#aaa", mt: 0.75 }}>{sub}</Typography>}
  </Box>
);

const ActionCard = ({ icon, label, value, color, onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      display: "flex", alignItems: "center", gap: 2,
      p: 2, borderRadius: "14px",
      border: `1.5px solid ${value > 0 ? color + "40" : "#f0f0f0"}`,
      backgroundColor: value > 0 ? `${color}08` : "#fafafa",
      cursor: "pointer",
      transition: "transform 0.15s, box-shadow 0.15s",
      "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 16px rgba(0,0,0,0.07)" },
    }}
  >
    <Box sx={{
      width: 42, height: 42, borderRadius: "12px", flexShrink: 0,
      backgroundColor: `${color}18`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {icon}
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#444", lineHeight: 1.3 }}>{label}</Typography>
    </Box>
    <Box sx={{
      minWidth: 36, height: 28, px: 1.5, borderRadius: "50px",
      backgroundColor: value > 0 ? color : "#e0e0e0",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{value}</Typography>
    </Box>
  </Box>
);

const PIE_COLORS = ["#0D59F2", "#7c3aed", "#059669", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];

const BAR_STATUS_LABELS = {
  1: "Diajukan", 2: "Review T1", 3: "Tdk Lolos Desk",
  4: "Lolos Desk", 5: "Wawancara", 6: "Tdk Lolos W",
  7: "Lolos W", 8: "Bimbingan",
};

const BAR_COLORS = {
  1: "#1565c0", 2: "#3949ab", 3: "#c62828", 4: "#2e7d32",
  5: "#f57f17", 6: "#b71c1c", 7: "#1b5e20", 8: "#0891b2",
};

export default function DashboardAdminPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [dashboard, setDashboard] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const programRes = await getMyProgram();
      const prog = programRes.data;
      setProgram(prog);
      if (prog?.id_program) {
        const dashRes = await getDashboardAdmin(prog.id_program);
        setDashboard(dashRes.data);
      }
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat data dashboard", confirmButtonColor: "#0D59F2" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <BodyLayout Sidebar={AdminSidebar}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress />
        </Box>
      </BodyLayout>
    );
  }

  const stats = dashboard?.stats || {};
  const perluTindakan = dashboard?.perlu_tindakan || {};
  const chart = dashboard?.chart || {};
  const recentProposal = dashboard?.recent_proposal || [];

  const barData = (chart.per_status || []).map((item) => ({
    name: BAR_STATUS_LABELS[item.status] || `Status ${item.status}`,
    total: item.total,
    fill: BAR_COLORS[item.status] || "#888",
  }));

  const pieData = (chart.per_kategori || []).map((item) => ({
    name: item.nama_kategori,
    value: item.total,
  }));

  const statCards = [
    {
      icon: <DescriptionOutlined sx={{ fontSize: 20, color: "#0D59F2" }} />,
      label: "Total Proposal",
      value: stats.total_proposal ?? 0,
      sub: "Proposal masuk program ini",
      accent: "#0D59F2",
      onClick: () => navigate("/admin/proposal"),
    },
    {
      icon: <CheckCircleOutlined sx={{ fontSize: 20, color: "#2e7d32" }} />,
      label: "Lolos Desk",
      value: stats.lolos_desk ?? 0,
      sub: `${stats.tidak_lolos_desk ?? 0} tidak lolos desk`,
      accent: "#2e7d32",
      onClick: () => navigate("/admin/rekap-penilaian"),
    },
    {
      icon: <AssignmentTurnedInOutlined sx={{ fontSize: 20, color: "#7c3aed" }} />,
      label: "Lolos Wawancara",
      value: stats.lolos_wawancara ?? 0,
      sub: `${stats.tidak_lolos_wawancara ?? 0} tidak lolos wawancara`,
      accent: "#7c3aed",
      onClick: () => navigate("/admin/rekap-penilaian"),
    },
    {
      icon: <SchoolOutlined sx={{ fontSize: 20, color: "#059669" }} />,
      label: "Tahap Bimbingan",
      value: stats.total_bimbingan ?? 0,
      sub: "Proposal aktif bimbingan",
      accent: "#059669",
      onClick: () => navigate("/admin/bimbingan"),
    },
  ];

  const actionCards = [
    {
      icon: <DescriptionOutlined sx={{ fontSize: 20, color: "#0D59F2" }} />,
      label: "Proposal belum didistribusikan",
      value: perluTindakan.menunggu_distribusi ?? 0,
      color: "#0D59F2",
      onClick: () => navigate("/admin/distribusi-penilai"),
    },
    {
      icon: <WarningAmberOutlined sx={{ fontSize: 20, color: "#f59e0b" }} />,
      label: "Distribusi ditolak reviewer",
      value: perluTindakan.distribusi_ditolak ?? 0,
      color: "#f59e0b",
      onClick: () => navigate("/admin/distribusi-penilai"),
    },
    {
      icon: <HourglassEmptyOutlined sx={{ fontSize: 20, color: "#7c3aed" }} />,
      label: "Menunggu finalisasi penilaian",
      value: perluTindakan.menunggu_finalisasi ?? 0,
      color: "#7c3aed",
      onClick: () => navigate("/admin/rekap-penilaian"),
    },
    {
      icon: <VerifiedUserOutlined sx={{ fontSize: 20, color: "#ef4444" }} />,
      label: "Menunggu verifikasi akun",
      value: perluTindakan.pending_verifikasi ?? 0,
      color: "#ef4444",
      onClick: () => navigate("/admin/verifikasi"),
    },
    {
      icon: <SchoolOutlined sx={{ fontSize: 20, color: "#059669" }} />,
      label: "Pengajuan pembimbing pending",
      value: perluTindakan.pending_pembimbing ?? 0,
      color: "#059669",
      onClick: () => navigate("/admin/bimbingan"),
    },
  ];

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box>

          <Box sx={{
            p: 4, mb: 4, borderRadius: "24px",
            background: "linear-gradient(135deg, #0D59F2 0%, #1e40af 100%)",
            color: "#fff", position: "relative", overflow: "hidden",
          }}>
            <Box sx={{ position: "absolute", top: -40, right: -40, width: 220, height: 220, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.06)" }} />
            <Box sx={{ position: "absolute", bottom: -60, right: 100, width: 160, height: 160, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.04)" }} />
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Avatar sx={{ width: 64, height: 64, border: "3px solid rgba(255,255,255,0.3)", fontSize: 24, backgroundColor: "rgba(255,255,255,0.2)", fontWeight: 700 }}>
                  {user?.nama_lengkap?.[0] || "A"}
                </Avatar>
                <Box>
                  <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                    {greet()},
                  </Typography>
                  <Typography sx={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2 }}>
                    {user?.nama_lengkap || "Admin"}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.7)", mt: 0.5 }}>
                    {program?.keterangan || "Portal Kewirausahaan"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2.5, mb: 4 }}>
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 3, mb: 3 }}>

            <Paper sx={{ p: 3, borderRadius: "20px", border: "1px solid #f0f0f0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#1a1a1a", mb: 0.5 }}>
                Distribusi Status Proposal
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#aaa", mb: 3 }}>
                Jumlah proposal per status saat ini
              </Typography>
              {barData.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 6 }}>
                  <Typography sx={{ fontSize: 13, color: "#bbb" }}>Belum ada data proposal</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={barData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#888" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#888" }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "1px solid #f0f0f0", fontSize: 13 }}
                      formatter={(v) => [v, "Proposal"]}
                    />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                      {barData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Paper>

            <Paper sx={{ p: 3, borderRadius: "20px", border: "1px solid #f0f0f0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#1a1a1a", mb: 0.5 }}>
                Sebaran Kategori Usaha
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#aaa", mb: 2 }}>
                Distribusi proposal per kategori
              </Typography>
              {pieData.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 6 }}>
                  <Typography sx={{ fontSize: 13, color: "#bbb" }}>Belum ada data kategori</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="45%" outerRadius={80} dataKey="value" paddingAngle={3}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "1px solid #f0f0f0", fontSize: 13 }}
                      formatter={(v, n) => [v, n]}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Paper>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 3 }}>

            <Paper sx={{ p: 3, borderRadius: "20px", border: "1px solid #f0f0f0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Box>
                  <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#1a1a1a" }}>Proposal Terbaru</Typography>
                  <Typography sx={{ fontSize: 13, color: "#aaa" }}>5 proposal terakhir masuk</Typography>
                </Box>
                <Box onClick={() => navigate("/admin/proposal")}
                  sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", color: "#0D59F2", "&:hover": { opacity: 0.7 } }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Lihat semua</Typography>
                  <ArrowForward sx={{ fontSize: 16 }} />
                </Box>
              </Box>

              {recentProposal.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 5 }}>
                  <DescriptionOutlined sx={{ fontSize: 40, color: "#e0e0e0", mb: 1.5 }} />
                  <Typography sx={{ fontSize: 13, color: "#bbb" }}>Belum ada proposal masuk</Typography>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  {recentProposal.map((p, i) => (
                    <Box key={p.id_proposal}>
                      <Box
                        onClick={() => navigate(`/admin/proposal/${p.id_proposal}`)}
                        sx={{
                          display: "flex", alignItems: "center", gap: 2, py: 2,
                          cursor: "pointer", borderRadius: "12px", px: 1.5,
                          transition: "background 0.15s",
                          "&:hover": { backgroundColor: "#f8f9ff" },
                        }}
                      >
                        <Box sx={{
                          width: 40, height: 40, borderRadius: "10px", flexShrink: 0,
                          backgroundColor: "#e3f2fd",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <DescriptionOutlined sx={{ fontSize: 18, color: "#0D59F2" }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.judul}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: "#aaa" }}>
                            {p.nama_tim} · {formatDate(p.tanggal_submit)}
                          </Typography>
                        </Box>
                        <StatusPill status={p.status} />
                      </Box>
                      {i < recentProposal.length - 1 && <Divider sx={{ mx: 1.5 }} />}
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>

            <Paper sx={{ p: 3, borderRadius: "20px", border: "1px solid #f0f0f0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#1a1a1a", mb: 0.5 }}>Perlu Tindakan</Typography>
              <Typography sx={{ fontSize: 13, color: "#aaa", mb: 3 }}>Item yang memerlukan perhatian</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {actionCards.map((card) => (
                  <ActionCard key={card.label} {...card} />
                ))}
              </Box>

              <Divider sx={{ my: 2.5 }} />

              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#888", mb: 1.5 }}>Akses Cepat</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                {[
                  { label: "Kelola Berita", icon: <NewspaperOutlined sx={{ fontSize: 18, color: "#0D59F2" }} />, path: "/admin/berita", color: "#0D59F2" },
                  { label: "Kelola Pengguna", icon: <PeopleOutlined sx={{ fontSize: 18, color: "#7c3aed" }} />, path: "/admin/kelola-pengguna", color: "#7c3aed" },
                  { label: "Data Proposal", icon: <DescriptionOutlined sx={{ fontSize: 18, color: "#059669" }} />, path: "/admin/proposal", color: "#059669" },
                  { label: "Rekap Penilaian", icon: <AssignmentTurnedInOutlined sx={{ fontSize: 18, color: "#f59e0b" }} />, path: "/admin/rekap-penilaian", color: "#f59e0b" },
                ].map((item) => (
                  <Box
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    sx={{
                      display: "flex", alignItems: "center", gap: 1.5,
                      p: 1.5, borderRadius: "12px",
                      border: "1.5px solid #f0f0f0",
                      cursor: "pointer",
                      transition: "transform 0.15s, border-color 0.15s",
                      "&:hover": { transform: "translateY(-2px)", borderColor: item.color },
                    }}
                  >
                    <Box sx={{ width: 34, height: 34, borderRadius: "10px", backgroundColor: `${item.color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {item.icon}
                    </Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#444", lineHeight: 1.3 }}>{item.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>

          </Box>
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}