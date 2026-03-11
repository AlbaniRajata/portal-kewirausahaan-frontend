import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, TextField, MenuItem, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, IconButton, Divider,
} from "@mui/material";
import { Close, Visibility } from "@mui/icons-material";
import Swal from "sweetalert2";
import { getDashboardPengajuanPembimbing } from "../../api/admin";

const STATUS_PILL = {
  0: { label: "Menunggu Respon", backgroundColor: "#f57f17" },
  1: { label: "Disetujui",       backgroundColor: "#2e7d32" },
  2: { label: "Ditolak",         backgroundColor: "#c62828" },
};

const METODE_CONFIG = {
  1: "Offline",
  2: "Online",
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const tableHeadCell = {
  fontWeight: 700, fontSize: 13, color: "#000",
  backgroundColor: "#fafafa", borderBottom: "2px solid #f0f0f0", py: 2,
};

const tableBodyRow = { "& td": { borderBottom: "1px solid #f5f5f5", py: 2 } };

const roundedField = { "& .MuiOutlinedInput-root": { borderRadius: "15px" } };

const StatusPill = ({ label, backgroundColor }) => (
  <Box sx={{ display: "inline-flex", alignItems: "center", px: 1.5, py: 0.4, borderRadius: "50px", backgroundColor, color: "#fff", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
    {label}
  </Box>
);

const DetailRow = ({ label, value }) => (
  <Box sx={{ mb: 2 }}>
    <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>{label}</Typography>
    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{value || "-"}</Typography>
  </Box>
);

export default function PengajuanPembimbingTab() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDashboardPengajuanPembimbing(statusFilter);
      setList(res.data?.list || []);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat data pengajuan pembimbing", confirmButtonColor: "#0D59F2" });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Daftar Pengajuan Pembimbing</Typography>
        <TextField
          select size="small" label="Filter Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ ...roundedField, minWidth: 200 }}
        >
          <MenuItem value="">Semua Status</MenuItem>
          <MenuItem value="0">Menunggu Respon</MenuItem>
          <MenuItem value="1">Disetujui</MenuItem>
          <MenuItem value="2">Ditolak</MenuItem>
        </TextField>
      </Box>

      {list.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography sx={{ color: "#666" }}>Belum ada pengajuan pembimbing</Typography>
        </Box>
      ) : (
        <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0" }}>
          <Table>
            <TableHead>
              <TableRow>
                {["Tim", "Mahasiswa Pengaju", "Dosen Pembimbing", "Tanggal Diajukan", "Status", "Aksi"].map((h, i) => (
                  <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 5 && { textAlign: "center" }) }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((item) => {
                const sp = STATUS_PILL[item.status] || { label: "Unknown", backgroundColor: "#757575" };
                return (
                  <TableRow key={item.id_pengajuan} sx={tableBodyRow}>
                    <TableCell><Typography sx={{ fontWeight: 500, fontSize: 14 }}>{item.nama_tim}</Typography></TableCell>
                    <TableCell><Typography sx={{ fontSize: 14 }}>{item.nama_pengaju}</Typography></TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{item.nama_dosen}</Typography>
                      <Typography sx={{ fontSize: 12, color: "#666" }}>{item.nip_dosen}</Typography>
                    </TableCell>
                    <TableCell><Typography sx={{ fontSize: 13 }}>{formatDate(item.created_at)}</Typography></TableCell>
                    <TableCell><StatusPill label={sp.label} backgroundColor={sp.backgroundColor} /></TableCell>
                    <TableCell align="center">
                      <Button size="small" variant="outlined" startIcon={<Visibility sx={{ fontSize: 14 }} />}
                        onClick={() => { setSelectedItem(item); setDialogOpen(true); }}
                        sx={{ textTransform: "none", borderRadius: "50px", fontSize: 12, fontWeight: 600, px: 2, borderColor: "#0D59F2", color: "#0D59F2", "&:hover": { backgroundColor: "#f0f4ff" } }}
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Detail Pengajuan Pembimbing</Typography>
          <IconButton onClick={() => setDialogOpen(false)} sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ px: 3, py: 3 }}>
          {selectedItem && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Status</Typography>
                <StatusPill label={STATUS_PILL[selectedItem.status]?.label || "-"} backgroundColor={STATUS_PILL[selectedItem.status]?.backgroundColor || "#757575"} />
              </Box>
              <Divider sx={{ my: 2 }} />
              <DetailRow label="Tim" value={selectedItem.nama_tim} />
              <DetailRow label="Mahasiswa Pengaju" value={selectedItem.nama_pengaju} />
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Dosen Pembimbing</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{selectedItem.nama_dosen}</Typography>
                <Typography sx={{ fontSize: 12, color: "#666" }}>NIP: {selectedItem.nip_dosen}</Typography>
                <Typography sx={{ fontSize: 12, color: "#666" }}>Bidang: {selectedItem.bidang_keahlian || "-"}</Typography>
              </Box>
              {selectedItem.judul_proposal && (
                <DetailRow label="Judul Proposal" value={selectedItem.judul_proposal} />
              )}
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
                <Box sx={{ p: 2, backgroundColor: "#fff3e0", borderRadius: "12px", border: "1px solid #ffcc80" }}>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Catatan Dosen</Typography>
                  <Typography sx={{ fontSize: 14 }}>{selectedItem.catatan_dosen}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)}
            sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600, color: "#666", border: "1.5px solid #e0e0e0", "&:hover": { backgroundColor: "#f5f5f5" } }}>
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}