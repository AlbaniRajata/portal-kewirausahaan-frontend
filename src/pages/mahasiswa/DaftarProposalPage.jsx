import { useState, useEffect } from "react";
import {
  Box, Paper, Typography, CircularProgress, Button,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Divider,
} from "@mui/material";
import { Add, Visibility, Edit, Description } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import SidebarMahasiswa from "../../components/layouts/MahasiswaSidebar";
import PageTransition from "../../components/PageTransition";
import { getProposalStatus } from "../../api/mahasiswa";

const roundedField = {
  "& .MuiOutlinedInput-root": { borderRadius: "15px" },
};

const tableHeadCell = {
  fontWeight: 700, fontSize: 13, color: "#000",
  backgroundColor: "#fafafa", borderBottom: "2px solid #f0f0f0", py: 2,
};

const StatusPill = ({ label, backgroundColor }) => (
  <Box sx={{
    display: "inline-flex", alignItems: "center",
    px: 1.5, py: 0.4, borderRadius: "50px",
    backgroundColor, color: "#fff",
    fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
  }}>
    {label}
  </Box>
);

const getStatusInfo = (statusCode) => {
  const map = {
    0: { label: "Draft",                  backgroundColor: "#666" },
    1: { label: "Diajukan",               backgroundColor: "#1565c0" },
    2: { label: "Review Tahap 1",         backgroundColor: "#3949ab" },
    3: { label: "Tidak Lolos Desk",       backgroundColor: "#c62828" },
    4: { label: "Lolos Desk",             backgroundColor: "#2e7d32" },
    5: { label: "Panel Wawancara",        backgroundColor: "#f57f17" },
    6: { label: "Tidak Lolos Wawancara",  backgroundColor: "#c62828" },
    7: { label: "Lolos Wawancara",        backgroundColor: "#2e7d32" },
    8: { label: "Pembimbing Diajukan",    backgroundColor: "#1565c0" },
    9: { label: "Pembimbing Disetujui",   backgroundColor: "#2e7d32" },
  };
  return map[statusCode] || { label: "Unknown", backgroundColor: "#666" };
};

export default function DaftarProposalPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  useEffect(() => { fetchStatus(); }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await getProposalStatus();
      setStatus(response.data);
    } catch {
      await Swal.fire({
        icon: "error", title: "Gagal Memuat",
        text: "Gagal memuat data proposal. Silakan refresh halaman.",
        confirmButtonText: "OK",
      });
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
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit", month: "long", year: "numeric",
    });
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
      <PageTransition>
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
            <Box>
              <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Daftar Proposal</Typography>
              <Typography sx={{ fontSize: 14, color: "#777" }}>Kelola proposal kewirausahaan Anda</Typography>
            </Box>
            {status?.isKetua && status?.data?.anggota?.all_accepted && !status?.data?.proposal && (
              <Button
                variant="contained" startIcon={<Add />}
                onClick={() => navigate("/mahasiswa/proposal/form")}
                sx={{
                  textTransform: "none", borderRadius: "50px",
                  backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0846c7" },
                  px: 3, py: 1.2, fontSize: 15, fontWeight: 600,
                }}
              >
                Tambah Proposal
              </Button>
            )}
          </Box>

          {!status?.hasTim && (
            <Box sx={{ mb: 3, p: 2, borderRadius: "12px", backgroundColor: "#fff8e1", border: "1px solid #ffe082" }}>
              <Typography sx={{ fontSize: 14, color: "#f57f17", fontWeight: 500 }}>
                Anda belum terdaftar dalam tim. Silakan ajukan anggota tim terlebih dahulu.
              </Typography>
            </Box>
          )}
          {status?.hasTim && !status?.isKetua && (
            <Box sx={{ mb: 3, p: 2, borderRadius: "12px", backgroundColor: "#e3f2fd", border: "1px solid #90caf9" }}>
              <Typography sx={{ fontSize: 14, color: "#1565c0", fontWeight: 500 }}>
                Hanya ketua tim yang dapat mengajukan proposal.
              </Typography>
            </Box>
          )}
          {status?.hasTim && status?.isKetua && !status?.data?.anggota?.all_accepted && (
            <Box sx={{ mb: 3, p: 2, borderRadius: "12px", backgroundColor: "#fff8e1", border: "1px solid #ffe082" }}>
              <Typography sx={{ fontSize: 14, color: "#f57f17", fontWeight: 500 }}>
                Belum semua anggota menyetujui undangan. Pengajuan proposal hanya bisa dilakukan setelah semua anggota menyetujui undangan.
              </Typography>
            </Box>
          )}

          <Paper sx={{ overflow: "hidden", mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
            {proposal ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {["Judul Proposal", "Program", "Kategori", "Modal Diajukan", "Tanggal Submit", "Status", "Aksi"].map((head, i) => (
                        <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 6 && { textAlign: "center" }) }}>
                          {head}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow sx={{ "& td": { borderBottom: "1px solid #f5f5f5", py: 2.5 } }}>
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
                        <StatusPill label={statusInfo.label} backgroundColor={statusInfo.backgroundColor} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                          <Button
                            size="small"
                            variant={proposal.status === 0 ? "contained" : "outlined"}
                            startIcon={proposal.status === 0 ? <Edit sx={{ fontSize: 15 }} /> : <Visibility sx={{ fontSize: 15 }} />}
                            onClick={() => navigate("/mahasiswa/proposal/form")}
                            sx={{
                              textTransform: "none", borderRadius: "50px",
                              fontSize: 13, fontWeight: 600, px: 2,
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
                <Box sx={{
                  width: 100, height: 100, borderRadius: "50%",
                  backgroundColor: "#f5f5f5",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  mx: "auto", mb: 3,
                }}>
                  <Description sx={{ fontSize: 48, color: "#ccc" }} />
                </Box>
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#444", mb: 1 }}>
                  Belum Ada Proposal
                </Typography>
                <Typography sx={{ fontSize: 14, color: "#999", mb: 4, maxWidth: 400, mx: "auto", lineHeight: 1.7 }}>
                  {status?.isKetua && status?.data?.anggota?.all_accepted
                    ? "Tambahkan proposal kewirausahaan Anda dengan klik tombol di kanan atas."
                    : "Proposal akan muncul di sini setelah dibuat oleh ketua tim"}
                </Typography>
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
                    <StatusPill
                      label={status.data.anggota?.all_accepted ? "Lengkap" : "Menunggu Persetujuan"}
                      backgroundColor={status.data.anggota?.all_accepted ? "#2e7d32" : "#f57f17"}
                    />
                  </Box>
                </Box>
              </Box>
            </Paper>
          )}
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}