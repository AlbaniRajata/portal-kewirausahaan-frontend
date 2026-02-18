import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button,
  CircularProgress, Alert, TextField, InputAdornment,
} from "@mui/material";
import { Search, Inbox, Visibility } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import BodyLayout from "../../components/layouts/BodyLayout";
import DosenSidebar from "../../components/layouts/DosenSidebar";
import { getPengajuanMasuk } from "../../api/dosen";

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

const STATUS_PENGAJUAN = {
  0: { label: "Menunggu Respon", color: "#fff8e1", bg: "#f57f17" },
  1: { label: "Disetujui",        color: "#e8f5e9", bg: "#2e7d32" },
  2: { label: "Ditolak",          color: "#fce4ec", bg: "#c62828" },
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export default function DaftarPengajuanPembimbingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pengajuanList, setPengajuanList] = useState([]);
  const [search, setSearch] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  const fetchPengajuan = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPengajuanMasuk();
      if (res.success) setPengajuanList(res.data || []);
    } catch (err) {
      console.error("Error fetching pengajuan:", err);
      setAlertMsg("Gagal memuat daftar pengajuan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPengajuan(); }, [fetchPengajuan]);

  const filtered = pengajuanList.filter((p) =>
    (p.nama_tim || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.nama_program || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.mahasiswa_pengaju || "").toLowerCase().includes(search.toLowerCase())
  );

  const pending = pengajuanList.filter((p) => p.status === 0).length;

  return (
    <BodyLayout Sidebar={DosenSidebar}>
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
          <Box>
            <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Pengajuan Pembimbing</Typography>
            <Typography sx={{ fontSize: 14, color: "#777" }}>Kelola pengajuan dosen pembimbing dari mahasiswa</Typography>
          </Box>
          {pending > 0 && (
            <Box sx={{ px: 2, py: 0.8, borderRadius: "50px", backgroundColor: "#fff8e1", border: "1px solid #ffe082" }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#f57f17" }}>
                {pending} menunggu respon
              </Typography>
            </Box>
          )}
        </Box>

        {alertMsg && <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setAlertMsg("")}>{alertMsg}</Alert>}

        <Paper sx={{ p: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700 }}>Daftar Pengajuan</Typography>
            <TextField
              size="small"
              placeholder="Cari tim, program, mahasiswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18, color: "#999" }} />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300, ...roundedField }}
            />
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 10 }}>
              <Box sx={{ width: 100, height: 100, borderRadius: "50%", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
                <Inbox sx={{ fontSize: 48, color: "#ccc" }} />
              </Box>
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#444", mb: 1 }}>
                {search ? "Pengajuan tidak ditemukan" : "Belum ada pengajuan masuk"}
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#999" }}>
                {search ? "Coba kata kunci lain" : "Pengajuan dari mahasiswa akan muncul di sini"}
              </Typography>
            </Box>
          ) : (
            <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "hidden" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    {["Tim", "Program", "Diajukan Oleh", "Tanggal Pengajuan", "Status", "Aksi"].map((h, i) => (
                      <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 5 && { textAlign: "center" }) }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((p) => {
                    const si = STATUS_PENGAJUAN[p.status];
                    return (
                      <TableRow key={p.id_pengajuan} sx={tableBodyRow}>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{p.nama_tim}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, color: "#555" }}>{p.nama_program}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, color: "#555" }}>{p.mahasiswa_pengaju}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, color: "#555" }}>{formatDate(p.created_at)}</Typography>
                        </TableCell>
                        <TableCell>
                          <StatusPill label={si?.label || "-"} bg={si?.bg || "#f5f5f5"} color={si?.color || "#666"} />
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Visibility sx={{ fontSize: 14 }} />}
                            onClick={() => navigate(`/dosen/pembimbing/pengajuan/${p.id_pengajuan}`)}
                            sx={{
                              textTransform: "none", borderRadius: "50px",
                              fontSize: 12, fontWeight: 600, px: 2,
                              borderColor: "#0D59F2", color: "#0D59F2",
                              "&:hover": { backgroundColor: "#f0f4ff" },
                            }}
                          >
                            Detail
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
      </Box>
    </BodyLayout>
  );
}