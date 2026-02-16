import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Chip,
  CircularProgress, Alert, TextField, InputAdornment,
} from "@mui/material";
import { Search, Inbox } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import BodyLayout from "../../components/layouts/BodyLayout";
import DosenSidebar from "../../components/layouts/DosenSidebar";
import { getPengajuanMasuk } from "../../api/dosen";

const STATUS_PENGAJUAN = {
  0: { text: "Menunggu Respon", color: "warning" },
  1: { text: "Disetujui", color: "success" },
  2: { text: "Ditolak", color: "error" },
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
      if (res.success) {
        setPengajuanList(res.data || []);
      }
    } catch (err) {
      console.error("Error fetching pengajuan:", err);
      setAlertMsg("Gagal memuat daftar pengajuan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPengajuan();
  }, [fetchPengajuan]);

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
            <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
              Pengajuan Pembimbing
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#777" }}>
              Kelola pengajuan dosen pembimbing dari mahasiswa
            </Typography>
          </Box>

          {pending > 0 && (
            <Chip
              label={`${pending} menunggu respon`}
              color="warning"
              sx={{ fontWeight: 600, fontSize: 13 }}
            />
          )}
        </Box>

        {alertMsg && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setAlertMsg("")}>
            {alertMsg}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
              Daftar Pengajuan
            </Typography>
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
              sx={{ minWidth: 300 }}
            />
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Inbox sx={{ fontSize: 64, color: "#ddd", mb: 2 }} />
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#666", mb: 0.5 }}>
                {search ? "Pengajuan tidak ditemukan" : "Belum ada pengajuan masuk"}
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#999" }}>
                {search ? "Coba kata kunci lain" : "Pengajuan dari mahasiswa akan muncul di sini"}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Tim</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Program</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Diajukan Oleh</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tanggal Pengajuan</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id_pengajuan} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                          {p.nama_tim}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 14 }}>
                          {p.nama_program}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 14 }}>
                          {p.mahasiswa_pengaju}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 14 }}>
                          {formatDate(p.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={STATUS_PENGAJUAN[p.status]?.text || "-"}
                          color={STATUS_PENGAJUAN[p.status]?.color || "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => navigate(`/dosen/pembimbing/pengajuan/${p.id_pengajuan}`)}
                          sx={{ textTransform: "none" }}
                        >
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>
    </BodyLayout>
  );
}