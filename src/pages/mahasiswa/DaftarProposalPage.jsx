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
  CheckCircle,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import BodyLayout from "../../components/layouts/BodyLayout";
import SidebarMahasiswa from "../../components/layouts/MahasiswaSidebar";
import { getProposalStatus } from "../../api/mahasiswa";

export default function DaftarProposalPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [alert, setAlert] = useState("");

  useEffect(() => {
    fetchStatus();
  }, []);

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
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusInfo = (statusCode) => {
    switch (statusCode) {
      case 0:
        return { label: "Draft", color: "default" };
      case 1:
        return { label: "Diajukan", color: "info" };
      case 2:
        return { label: "Review Tahap 1", color: "primary" };
      case 3:
        return { label: "Tidak Lolos Desk", color: "error" };
      case 4:
        return { label: "Lolos Desk", color: "success" };
      case 5:
        return { label: "Panel Wawancara", color: "warning" };
      case 6:
        return { label: "Tidak Lolos Wawancara", color: "error" };
      case 7:
        return { label: "Lolos Wawancara", color: "success" };
      case 8:
        return { label: "Pembimbing Diajukan", color: "info" };
      case 9:
        return { label: "Pembimbing Disetujui", color: "success" };
      default:
        return { label: "Unknown", color: "default" };
    }
  };

  const handleCreateProposal = () => {
    navigate("/mahasiswa/proposal/form");
  };

  const handleViewProposal = () => {
    navigate("/mahasiswa/proposal/form");
  };

  if (loading) {
    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
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
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
              Daftar Proposal
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#777" }}>
              Kelola proposal kewirausahaan Anda
            </Typography>
          </Box>

          {status?.isKetua &&
            status?.data?.anggota?.all_accepted &&
            !status?.data?.proposal && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateProposal}
                sx={{
                  textTransform: "none",
                  backgroundColor: "#0D59F2",
                  "&:hover": { backgroundColor: "#0846c7" },
                  px: 3,
                  py: 1.2,
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                Buat Proposal
              </Button>
            )}
        </Box>

        {alert && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setAlert("")}>
            {alert}
          </Alert>
        )}

        {!status?.hasTim && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Anda belum terdaftar dalam tim. Silakan ajukan anggota tim terlebih
            dahulu.
          </Alert>
        )}

        {status?.hasTim && !status?.isKetua && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Hanya ketua tim yang dapat mengajukan proposal.
          </Alert>
        )}

        {status?.hasTim &&
          status?.isKetua &&
          !status?.data?.anggota?.all_accepted && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Belum semua anggota menyetujui undangan. Pengajuan proposal hanya
              bisa dilakukan setelah semua anggota menyetujui undangan.
            </Alert>
          )}

        <Paper sx={{ overflow: "hidden", mb: 3 }}>
          {proposal ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#0D59F2" }}>
                    <TableCell
                      sx={{ fontWeight: 700, color: "#fff", fontSize: 14 }}
                    >
                      Judul Proposal
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, color: "#fff", fontSize: 14 }}
                    >
                      Program
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, color: "#fff", fontSize: 14 }}
                    >
                      Kategori
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, color: "#fff", fontSize: 14 }}
                    >
                      Modal Diajukan
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, color: "#fff", fontSize: 14 }}
                    >
                      Tanggal Submit
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, color: "#fff", fontSize: 14 }}
                    >
                      Status
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        color: "#fff",
                        fontSize: 14,
                        textAlign: "center",
                      }}
                    >
                      Aksi
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow
                    hover
                    sx={{
                      "&:hover": {
                        backgroundColor: "#f8f9ff",
                      },
                    }}
                  >
                    <TableCell>
                      <Typography
                        sx={{ fontWeight: 600, maxWidth: 350, fontSize: 14 }}
                      >
                        {proposal.judul}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14 }}>
                        {status.data.tim.keterangan}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14 }}>
                        {proposal.nama_kategori || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{ fontSize: 14, fontWeight: 600, color: "#0D59F2" }}
                      >
                        {formatRupiah(proposal.modal_diajukan)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14 }}>
                        {formatDate(proposal.tanggal_submit)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusInfo.label}
                        color={statusInfo.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          justifyContent: "center",
                        }}
                      >
                        <Button
                          size="small"
                          variant={
                            proposal.status === 0 ? "contained" : "outlined"
                          }
                          startIcon={
                            proposal.status === 0 ? <Edit /> : <Visibility />
                          }
                          onClick={handleViewProposal}
                          sx={{
                            textTransform: "none",
                            ...(proposal.status === 0 && {
                              backgroundColor: "#FDB022",
                              "&:hover": { backgroundColor: "#e09a1a" },
                            }),
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
            <Box sx={{ p: 10, textAlign: "center" }}>
              <Description sx={{ fontSize: 100, color: "#e0e0e0", mb: 3 }} />
              <Typography
                sx={{ fontSize: 20, fontWeight: 600, color: "#666", mb: 1 }}
              >
                Belum Ada Proposal
              </Typography>
              <Typography
                sx={{
                  fontSize: 14,
                  color: "#999",
                  mb: 4,
                  maxWidth: 500,
                  mx: "auto",
                }}
              >
                {status?.isKetua && status?.data?.anggota?.all_accepted
                  ? "Mulai buat proposal kewirausahaan Anda dengan klik tombol di bawah"
                  : "Proposal akan muncul di sini setelah dibuat oleh ketua tim"}
              </Typography>
              {status?.isKetua && status?.data?.anggota?.all_accepted && (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Add />}
                  onClick={handleCreateProposal}
                  sx={{
                    textTransform: "none",
                    backgroundColor: "#0D59F2",
                    "&:hover": { backgroundColor: "#0846c7" },
                    px: 4,
                    py: 1.5,
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  Buat Proposal Sekarang
                </Button>
              )}
            </Box>
          )}
        </Paper>

        {status?.data?.tim && (
          <Paper sx={{ p: 4 }}>
            <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>
              Informasi Tim
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}
            >
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                  Nama Tim
                </Typography>
                <TextField
                  fullWidth
                  value={status.data.tim.nama_tim}
                  disabled
                  InputProps={{
                    sx: { fontWeight: 500 },
                  }}
                />
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                  Program
                </Typography>
                <TextField
                  fullWidth
                  value={status.data.tim.keterangan}
                  disabled
                  InputProps={{
                    sx: { fontWeight: 500 },
                  }}
                />
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                  Jumlah Anggota
                </Typography>
                <TextField
                  fullWidth
                  value={`${status.data.anggota?.total || 0} orang`}
                  disabled
                  InputProps={{
                    sx: { fontWeight: 500 },
                  }}
                />
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                  Status Tim
                </Typography>
                <Box sx={{ pt: 1 }}>
                  <Chip
                    label={
                      status.data.anggota?.all_accepted
                        ? "Lengkap"
                        : "Menunggu Persetujuan"
                    }
                    color={
                      status.data.anggota?.all_accepted ? "success" : "warning"
                    }
                    size="small"
                  />
                </Box>
              </Box>
            </Box>
          </Paper>
        )}
      </Box>
    </BodyLayout>
  );
}
