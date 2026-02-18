import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, CircularProgress,
  Alert, TextField, MenuItem, InputAdornment,
} from "@mui/material";
import { Search, BookOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import BodyLayout from "../../components/layouts/BodyLayout";
import DosenSidebar from "../../components/layouts/DosenSidebar";
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

const StatusPill = ({ label, bg, color }) => (
  <Box sx={{
    display: "inline-flex", alignItems: "center",
    px: 1.5, py: 0.4, borderRadius: "50px",
    backgroundColor: bg, color, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
  }}>
    {label}
  </Box>
);

const STATUS_BIMBINGAN = {
  0: { label: "Menunggu Konfirmasi", bg: "#f57f17", color: "#fff8e1" },
  1: { label: "Disetujui",           bg: "#2e7d32", color: "#e8f5e9" },
  2: { label: "Ditolak",             bg: "#c62828", color: "#fce4ec" },
};

const METODE_LABEL = {
  1: { label: "Online",  bg: "#1565c0", color: "#e3f2fd" },
  2: { label: "Offline", bg: "#555",    color: "#f5f5f5" },
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
  const [alertMsg, setAlertMsg] = useState("");

  const fetchBimbingan = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getBimbinganMasuk();
      if (res.success) setBimbinganList(res.data || []);
    } catch (err) {
      console.error("Error fetching bimbingan:", err);
      setAlertMsg("Gagal memuat daftar bimbingan");
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
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Log Bimbingan</Typography>
          <Typography sx={{ fontSize: 14, color: "#777" }}>Kelola jadwal bimbingan dari mahasiswa bimbingan Anda</Typography>
        </Box>

        {alertMsg && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setAlertMsg("")}>
            {alertMsg}
          </Alert>
        )}

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
                          <StatusPill label={metode?.label || "-"} bg={metode?.bg || "#555"} color={metode?.color || "#f5f5f5"} />
                        </TableCell>
                        <TableCell>
                          <StatusPill label={si?.label || "-"} bg={si?.bg || "#f5f5f5"} color={si?.color || "#666"} />
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
    </BodyLayout>
  );
}