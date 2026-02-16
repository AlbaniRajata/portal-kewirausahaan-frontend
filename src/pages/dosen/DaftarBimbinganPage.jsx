import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Chip,
  CircularProgress, Alert, TextField, InputAdornment, Tabs, Tab,
} from "@mui/material";
import { Search, BookOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import BodyLayout from "../../components/layouts/BodyLayout";
import DosenSidebar from "../../components/layouts/DosenSidebar";
import { getBimbinganMasuk } from "../../api/dosen";

const STATUS_BIMBINGAN = {
  0: { text: "Menunggu Konfirmasi", color: "warning" },
  1: { text: "Disetujui", color: "success" },
  2: { text: "Ditolak", color: "error" },
};

const METODE_LABEL = {
  1: { text: "Online", color: "info" },
  2: { text: "Offline", color: "default" },
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export default function DaftarBimbinganPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bimbinganList, setBimbinganList] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [alertMsg, setAlertMsg] = useState("");

  const fetchBimbingan = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getBimbinganMasuk();
      if (res.success) {
        setBimbinganList(res.data || []);
      }
    } catch (err) {
      console.error("Error fetching bimbingan:", err);
      setAlertMsg("Gagal memuat daftar bimbingan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBimbingan();
  }, [fetchBimbingan]);

  const pending = bimbinganList.filter((b) => b.status === 0);
  const selesai = bimbinganList.filter((b) => b.status !== 0);

  const activeList = activeTab === 0 ? pending : selesai;

  const filtered = activeList.filter((b) =>
    (b.nama_tim || "").toLowerCase().includes(search.toLowerCase()) ||
    (b.topik || "").toLowerCase().includes(search.toLowerCase()) ||
    (b.mahasiswa_pengaju || "").toLowerCase().includes(search.toLowerCase()) ||
    (b.judul_proposal || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <BodyLayout Sidebar={DosenSidebar}>
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
          <Box>
            <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
              Log Bimbingan
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#777" }}>
              Kelola jadwal bimbingan dari mahasiswa bimbingan Anda
            </Typography>
          </Box>

          {pending.length > 0 && (
            <Chip
              label={`${pending.length} menunggu konfirmasi`}
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

        <Paper sx={{ overflow: "hidden" }}>
          <Box sx={{ px: 3, pt: 2, borderBottom: "1px solid #eee" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Tabs
                value={activeTab}
                onChange={(_, v) => { setActiveTab(v); setSearch(""); }}
                sx={{ "& .MuiTab-root": { textTransform: "none", fontWeight: 600 } }}
              >
                <Tab
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      Menunggu Konfirmasi
                      {pending.length > 0 && (
                        <Chip label={pending.length} size="small" color="warning" sx={{ height: 20, fontSize: 11 }} />
                      )}
                    </Box>
                  }
                />
                <Tab
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      Riwayat
                      {selesai.length > 0 && (
                        <Chip label={selesai.length} size="small" color="default" sx={{ height: 20, fontSize: 11 }} />
                      )}
                    </Box>
                  }
                />
              </Tabs>

              <TextField
                size="small"
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
                sx={{ minWidth: 280 }}
              />
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <BookOutlined sx={{ fontSize: 64, color: "#ddd", mb: 2 }} />
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#666", mb: 0.5 }}>
                {search
                  ? "Bimbingan tidak ditemukan"
                  : activeTab === 0
                  ? "Tidak ada pengajuan yang menunggu konfirmasi"
                  : "Belum ada riwayat bimbingan"}
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#999" }}>
                {search ? "Coba kata kunci lain" : "Pengajuan bimbingan dari mahasiswa akan muncul di sini"}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Topik</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tim</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Diajukan Oleh</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tanggal Bimbingan</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Metode</TableCell>
                    {activeTab === 1 && (
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    )}
                    <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((b) => (
                    <TableRow key={b.id_bimbingan} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 500, fontSize: 14, maxWidth: 220 }}>
                          {b.topik}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: "#888", mt: 0.25 }}>
                          {b.judul_proposal}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                          {b.nama_tim}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 14 }}>
                          {b.mahasiswa_pengaju}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 14 }}>
                          {formatDate(b.tanggal_bimbingan)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={METODE_LABEL[b.metode]?.text || b.metode}
                          size="small"
                          variant="outlined"
                          color={METODE_LABEL[b.metode]?.color || "default"}
                        />
                      </TableCell>
                      {activeTab === 1 && (
                        <TableCell>
                          <Chip
                            label={STATUS_BIMBINGAN[b.status]?.text || "-"}
                            color={STATUS_BIMBINGAN[b.status]?.color || "default"}
                            size="small"
                          />
                        </TableCell>
                      )}
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => navigate(`/dosen/bimbingan/pengajuan/${b.id_bimbingan}`)}
                          sx={{ textTransform: "none" }}
                        >
                          {activeTab === 0 ? "Konfirmasi" : "Detail"}
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