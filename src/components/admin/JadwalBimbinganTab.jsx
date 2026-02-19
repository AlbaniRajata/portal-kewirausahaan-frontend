import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, TextField, MenuItem, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip,
  CircularProgress, Alert, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, IconButton, Divider,
} from "@mui/material";
import { Close, Visibility } from "@mui/icons-material";
import { getDashboardBimbingan } from "../../api/admin";

const STATUS_CONFIG = {
  0: { text: "Menunggu Respon", color: "warning" },
  1: { text: "Disetujui", color: "success" },
  2: { text: "Ditolak", color: "error" },
};

const METODE_CONFIG = {
  1: "Offline",
  2: "Online",
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export default function JadwalBimbinganTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [alert, setAlert] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDashboardBimbingan(statusFilter);
      if (res.success) {
        setData(res.data);
      } else {
        setAlert(res.message);
      }
    } catch (err) {
        console.error("Error fetching jadwal bimbingan:", err);
      setAlert("Gagal memuat data jadwal bimbingan");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDetail = (item) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (alert) {
    return <Alert severity="error">{alert}</Alert>;
  }

  const { list } = data;

  return (
    <Box>
      {/* Filter */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 600 }}>
          Daftar Jadwal Bimbingan
        </Typography>
        <TextField
          select
          size="small"
          label="Filter Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Semua Status</MenuItem>
          <MenuItem value="0">Menunggu Respon</MenuItem>
          <MenuItem value="1">Disetujui</MenuItem>
          <MenuItem value="2">Ditolak</MenuItem>
        </TextField>
      </Box>

      {/* Tabel */}
      {list.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography sx={{ color: "#666" }}>Belum ada jadwal bimbingan</Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 700 }}>Tim</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Topik</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Dosen</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tanggal Bimbingan</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Metode</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((item) => {
                const statusInfo = STATUS_CONFIG[item.status] || { text: "Unknown", color: "default" };
                return (
                  <TableRow key={item.id_bimbingan} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500, fontSize: 14 }}>{item.nama_tim}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14 }}>{item.topik}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{item.nama_dosen}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13 }}>{formatDate(item.tanggal_bimbingan)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={METODE_CONFIG[item.metode] || "-"} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={statusInfo.text} color={statusInfo.color} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => handleOpenDetail(item)}
                        sx={{ textTransform: "none" }}
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

      {/* Dialog Detail */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography sx={{ fontWeight: 700, fontSize: 16, pr: 4 }}>
            Detail Jadwal Bimbingan
          </Typography>
          <IconButton
            onClick={() => setDialogOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {selectedItem && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Status</Typography>
                <Chip
                  label={STATUS_CONFIG[selectedItem.status]?.text || "-"}
                  color={STATUS_CONFIG[selectedItem.status]?.color || "default"}
                  size="small"
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Tim</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{selectedItem.nama_tim}</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Diajukan Oleh</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{selectedItem.nama_pengaju}</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Dosen Pembimbing</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{selectedItem.nama_dosen}</Typography>
                <Typography sx={{ fontSize: 12, color: "#666" }}>NIP: {selectedItem.nip_dosen}</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Judul Proposal</Typography>
                <Typography sx={{ fontSize: 14 }}>{selectedItem.judul_proposal}</Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Topik Bimbingan</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{selectedItem.topik}</Typography>
              </Box>

              {selectedItem.deskripsi && (
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Deskripsi</Typography>
                  <Typography sx={{ fontSize: 14 }}>{selectedItem.deskripsi}</Typography>
                </Box>
              )}

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Tanggal Bimbingan</Typography>
                  <Typography sx={{ fontSize: 14 }}>{formatDate(selectedItem.tanggal_bimbingan)}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Metode</Typography>
                  <Chip label={METODE_CONFIG[selectedItem.metode] || "-"} size="small" variant="outlined" />
                </Box>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Tanggal Diajukan</Typography>
                  <Typography sx={{ fontSize: 14 }}>{formatDate(selectedItem.created_at)}</Typography>
                </Box>
                {selectedItem.responded_at && (
                  <Box>
                    <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Tanggal Respon</Typography>
                    <Typography sx={{ fontSize: 14 }}>{formatDate(selectedItem.responded_at)}</Typography>
                  </Box>
                )}
              </Box>

              {selectedItem.catatan_dosen && (
                <Box sx={{ p: 2, backgroundColor: "#fff3e0", borderRadius: 1 }}>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Catatan Dosen</Typography>
                  <Typography sx={{ fontSize: 14 }}>{selectedItem.catatan_dosen}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setDialogOpen(false)}
            variant="contained"
            sx={{
              backgroundColor: "#FDB022",
              "&:hover": { backgroundColor: "#E09A1A" },
              textTransform: "none",
            }}
          >
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}