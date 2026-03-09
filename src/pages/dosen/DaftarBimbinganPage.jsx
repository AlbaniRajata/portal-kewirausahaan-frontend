import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, CircularProgress,
  TextField, MenuItem, InputAdornment,
} from "@mui/material";
import { Search, BookOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import DosenSidebar from "../../components/layouts/DosenSidebar";
import PageTransition from "../../components/PageTransition";
import { getBimbinganMasuk } from "../../api/dosen";

const roundedField = {
  "& .MuiOutlinedInput-root": { borderRadius: "15px" },
};

const tableHeadCell = {
  fontWeight: 700,
  fontSize: 13,
  color: "#000",
  backgroundColor: "#fafafa",
  borderBottom: "2px solid #f0f0f0",
  py: 2,
};

const tableBodyRow = {
  "& td": { borderBottom: "1px solid #f5f5f5", py: 2 },
};

const StatusPill = ({ label, backgroundColor }) => (
  <Box sx={{
    display: "inline-flex", alignItems: "center",
    px: 1.5, py: 0.4, borderRadius: "50px",
    backgroundColor, color: "#fff", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
  }}>
    {label}
  </Box>
);

const STATUS_BIMBINGAN = {
  0: { label: "Menunggu Konfirmasi", backgroundColor: "#f57f17" },
  1: { label: "Disetujui",           backgroundColor: "#2e7d32" },
  2: { label: "Ditolak",             backgroundColor: "#c62828" },
};

const METODE_LABEL = {
  1: { label: "Online",  backgroundColor: "#1565c0" },
  2: { label: "Offline", backgroundColor: "#555" },
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export default function DaftarBimbinganPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bimbinganList, setBimbinganList] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchBimbingan = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getBimbinganMasuk();
      if (res.success) setBimbinganList(res.data || []);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat daftar bimbingan", confirmButtonText: "OK" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBimbingan(); }, [fetchBimbingan]);

  const filtered = bimbinganList.filter((b) => {
    const matchSearch =
      (b.nama_tim || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.topik || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.mahasiswa_pengaju || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.judul_proposal || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "" || String(b.status) === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <BodyLayout Sidebar={DosenSidebar}>
      <PageTransition>
        <Box>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Log Bimbingan</Typography>
            <Typography sx={{ fontSize: 14, color: "#777" }}>Kelola jadwal bimbingan dari mahasiswa bimbingan Anda</Typography>
          </Box>

          <Paper sx={{ p: 3, mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>Filter Bimbingan</Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Box sx={{ minWidth: 200, flex: "1 1 auto" }}>
                <TextField
                  select fullWidth label="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={roundedField}
                >
                  <MenuItem value="">Semua Status</MenuItem>
                  <MenuItem value="0">Menunggu Konfirmasi</MenuItem>
                  <MenuItem value="1">Disetujui</MenuItem>
                  <MenuItem value="2">Ditolak</MenuItem>
                </TextField>
              </Box>
              <Box sx={{ minWidth: 280, flex: "2 1 auto" }}>
                <TextField
                  fullWidth
                  label="Cari"
                  placeholder="Cari tim, topik, mahasiswa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ fontSize: 18, color: "#999" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={roundedField}
                />
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ overflow: "hidden", borderRadius: "16px", border: "1px solid #f0f0f0" }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress />
              </Box>
            ) : filtered.length === 0 ? (
              <Box sx={{ py: 10, textAlign: "center" }}>
                <Box sx={{ width: 100, height: 100, borderRadius: "50%", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
                  <BookOutlined sx={{ fontSize: 48, color: "#ccc" }} />
                </Box>
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#444", mb: 1 }}>Belum Ada Bimbingan</Typography>
                <Typography sx={{ fontSize: 14, color: "#999" }}>
                  {search || statusFilter ? "Tidak ada bimbingan yang sesuai filter" : "Pengajuan bimbingan dari mahasiswa akan muncul di sini"}
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {["Topik", "Tim", "Diajukan Oleh", "Tanggal Bimbingan", "Metode", "Status", "Aksi"].map((h, i) => (
                        <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 6 && { textAlign: "center" }) }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((b) => {
                      const si = STATUS_BIMBINGAN[b.status];
                      const metode = METODE_LABEL[b.metode];
                      return (
                        <TableRow key={b.id_bimbingan} sx={tableBodyRow}>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600, fontSize: 14, maxWidth: 220, lineHeight: 1.4 }}>{b.topik}</Typography>
                            {b.judul_proposal && (
                              <Typography sx={{ fontSize: 12, color: "#888", mt: 0.25 }}>{b.judul_proposal}</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13 }}>{b.nama_tim}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13 }}>{b.mahasiswa_pengaju}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13 }}>{formatDate(b.tanggal_bimbingan)}</Typography>
                          </TableCell>
                          <TableCell>
                            <StatusPill label={metode?.label || "-"} backgroundColor={metode?.backgroundColor || "#555"} />
                          </TableCell>
                          <TableCell>
                            <StatusPill label={si?.label || "-"} backgroundColor={si?.backgroundColor || "#9e9e9e"} />
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant={b.status === 0 ? "contained" : "outlined"}
                              onClick={() => navigate(`/dosen/bimbingan/pengajuan/${b.id_bimbingan}`)}
                              sx={{
                                textTransform: "none", borderRadius: "50px",
                                fontSize: 12, fontWeight: 600, px: 2,
                                ...(b.status === 0
                                  ? { backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0846c7" } }
                                  : { borderColor: "#0D59F2", color: "#0D59F2", "&:hover": { backgroundColor: "#f0f4ff" } }
                                ),
                              }}
                            >
                              {b.status === 0 ? "Konfirmasi" : "Detail"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontSize: 13, color: "#999" }}>Total: {filtered.length} bimbingan</Typography>
          </Box>
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}