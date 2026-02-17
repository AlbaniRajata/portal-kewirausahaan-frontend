import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  TextField,
  Divider,
} from "@mui/material";
import {
  Add,
  Visibility,
  Edit,
  Description,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import BodyLayout from "../../components/layouts/BodyLayout";
import SidebarMahasiswa from "../../components/layouts/MahasiswaSidebar";
import { getProposalStatus } from "../../api/mahasiswa";

const roundedField = {
  "& .MuiOutlinedInput-root": { borderRadius: "15px" },
};

export default function DaftarProposalPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [alert, setAlert] = useState("");

  useEffect(() => { fetchStatus(); }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await getProposalStatus();
      setStatus(response.data);
    } catch (err) {
      console.error("Error fetching status:", err);
      setAlert("Gagal memuat data proposal");
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (value) => {
    if (!value) return "Rp 0";
    return "Rp " + new Intl.NumberFormat("id-ID").format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  };

  const getStatusInfo = (statusCode) => {
    switch (statusCode) {
      case 0: return { label: "Draft", color: "default", text: "#f5f5f5", bg: "#666" };
      case 1: return { label: "Diajukan", color: "info", text: "#e3f2fd", bg: "#1565c0" };
      case 2: return { label: "Review Tahap 1", color: "primary", text: "#e8eaf6", bg: "#3949ab" };
      case 3: return { label: "Tidak Lolos Desk", color: "error", text: "#fce4ec", bg: "#c62828" };
      case 4: return { label: "Lolos Desk", color: "success", text: "#e8f5e9", bg: "#2e7d32" };
      case 5: return { label: "Panel Wawancara", color: "warning", text: "#fff8e1", bg: "#f57f17" };
      case 6: return { label: "Tidak Lolos Wawancara", color: "error", text: "#fce4ec", bg: "#c62828" };
      case 7: return { label: "Lolos Wawancara", color: "success", text: "#e8f5e9", bg: "#2e7d32" };
      case 8: return { label: "Pembimbing Diajukan", color: "info", text: "#e3f2fd", bg: "#1565c0" };
      case 9: return { label: "Pembimbing Disetujui", color: "success", text: "#e8f5e9", bg: "#2e7d32" };
      default: return { label: "Unknown", color: "default", text: "#f5f5f5", bg: "#666" };
    }
  };

  if (loading) {
    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress />
        </Box>
      </BodyLayout>
    );
  }

  const proposal = status?.data?.proposal;
  const statusInfo = proposal ? getStatusInfo(proposal.status) : null;

  return (
    <BodyLayout Sidebar={SidebarMahasiswa}>
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Box>
            <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Daftar Proposal</Typography>
            <Typography sx={{ fontSize: 14, color: "#777" }}>Kelola proposal kewirausahaan Anda</Typography>
          </Box>
          {status?.isKetua && status?.data?.anggota?.all_accepted && !status?.data?.proposal && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate("/mahasiswa/proposal/form")}
              sx={{
                textTransform: "none",
                borderRadius: "50px",
                backgroundColor: "#0D59F2",
                "&:hover": { backgroundColor: "#0846c7" },
                px: 3, py: 1.2, fontSize: 15, fontWeight: 600,
              }}
            >
              Buat Proposal
            </Button>
          )}
        </Box>

        {alert && <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setAlert("")}>{alert}</Alert>}
        {!status?.hasTim && <Alert severity="warning" sx={{ mb: 3, borderRadius: "12px" }}>Anda belum terdaftar dalam tim. Silakan ajukan anggota tim terlebih dahulu.</Alert>}
        {status?.hasTim && !status?.isKetua && <Alert severity="info" sx={{ mb: 3, borderRadius: "12px" }}>Hanya ketua tim yang dapat mengajukan proposal.</Alert>}
        {status?.hasTim && status?.isKetua && !status?.data?.anggota?.all_accepted && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: "12px" }}>Belum semua anggota menyetujui undangan. Pengajuan proposal hanya bisa dilakukan setelah semua anggota menyetujui undangan.</Alert>
        )}

        <Paper sx={{ overflow: "hidden", mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
          {proposal ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {["Judul Proposal", "Program", "Kategori", "Modal Diajukan", "Tanggal Submit", "Status", "Aksi"].map((head, i) => (
                      <TableCell
                        key={i}
                        sx={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: "#000",
                          backgroundColor: "#fafafa",
                          borderBottom: "2px solid #f0f0f0",
                          py: 2,
                          ...(i === 6 && { textAlign: "center" }),
                        }}
                      >
                        {head}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow
                    sx={{
                      "& td": { borderBottom: "1px solid #f5f5f5", py: 2.5 },
                    }}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, maxWidth: 280, fontSize: 14, lineHeight: 1.4 }}>
                        {proposal.judul}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, color: "#555" }}>{status.data.tim.keterangan}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, color: "#555" }}>{proposal.nama_kategori || "-"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#0D59F2" }}>
                        {formatRupiah(proposal.modal_diajukan)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, color: "#555" }}>{formatDate(proposal.tanggal_submit)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          px: 1.5,
                          py: 0.4,
                          borderRadius: "50px",
                          backgroundColor: statusInfo.bg,
                          color: statusInfo.text,
                          fontSize: 12,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {statusInfo.label}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <Button
                          size="small"
                          variant={proposal.status === 0 ? "contained" : "outlined"}
                          startIcon={proposal.status === 0 ? <Edit sx={{ fontSize: 15 }} /> : <Visibility sx={{ fontSize: 15 }} />}
                          onClick={() => navigate("/mahasiswa/proposal/form")}
                          sx={{
                            textTransform: "none",
                            borderRadius: "50px",
                            fontSize: 13,
                            fontWeight: 600,
                            px: 2,
                            ...(proposal.status === 0
                              ? { backgroundColor: "#FDB022", "&:hover": { backgroundColor: "#e09a1a" }, border: "none", color: "#fff" }
                              : { borderColor: "#0D59F2", color: "#0D59F2", "&:hover": { backgroundColor: "#f0f4ff", borderColor: "#0D59F2" } }),
                          }}
                        >
                          {proposal.status === 0 ? "Edit" : "Lihat"}
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ py: 10, textAlign: "center" }}>
              <Box
                sx={{
                  width: 100, height: 100, borderRadius: "50%",
                  backgroundColor: "#f5f5f5",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  mx: "auto", mb: 3,
                }}
              >
                <Description sx={{ fontSize: 48, color: "#ccc" }} />
              </Box>
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#444", mb: 1 }}>
                Belum Ada Proposal
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#999", mb: 4, maxWidth: 400, mx: "auto", lineHeight: 1.7 }}>
                {status?.isKetua && status?.data?.anggota?.all_accepted
                  ? "Mulai buat proposal kewirausahaan Anda dengan klik tombol di bawah"
                  : "Proposal akan muncul di sini setelah dibuat oleh ketua tim"}
              </Typography>
              {status?.isKetua && status?.data?.anggota?.all_accepted && (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Add />}
                  onClick={() => navigate("/mahasiswa/proposal/form")}
                  sx={{
                    textTransform: "none",
                    borderRadius: "50px",
                    backgroundColor: "#0D59F2",
                    "&:hover": { backgroundColor: "#0846c7" },
                    px: 4, py: 1.5, fontSize: 15, fontWeight: 600,
                  }}
                >
                  Buat Proposal Sekarang
                </Button>
              )}
            </Box>
          )}
        </Paper>

        {status?.data?.tim && (
          <Paper sx={{ p: 4, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
            <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>Informasi Tim</Typography>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Nama Tim</Typography>
                <TextField fullWidth value={status.data.tim.nama_tim} disabled sx={roundedField} InputProps={{ sx: { fontWeight: 500 } }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Program</Typography>
                <TextField fullWidth value={status.data.tim.keterangan} disabled sx={roundedField} InputProps={{ sx: { fontWeight: 500 } }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Jumlah Anggota</Typography>
                <TextField fullWidth value={`${status.data.anggota?.total || 0} orang`} disabled sx={roundedField} InputProps={{ sx: { fontWeight: 500 } }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Status Tim</Typography>
                <Box sx={{ pt: 1.5 }}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      px: 2,
                      py: 0.6,
                      borderRadius: "50px",
                      color: status.data.anggota?.all_accepted ? "#e8f5e9" : "#fff8e1",
                      backgroundColor: status.data.anggota?.all_accepted ? "#2e7d32" : "#f57f17",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {status.data.anggota?.all_accepted ? "Lengkap" : "Menunggu Persetujuan"}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>
        )}
      </Box>
    </BodyLayout>
  );
}