import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, TextField, MenuItem, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, IconButton, Divider, Paper, Pagination,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import Swal from "sweetalert2";
import { getDashboardPengajuanPembimbing } from "../../api/admin";
import LoadingScreen from "../common/LoadingScreen";

const COLORS = {
  primary:      "#0D59F2",
  primaryLight: "#E0F2FE",
  primaryDark:  "#0369A1",
  primaryMuted: "#93C5FD",
  secondary:    "#2563EB",
  accent:       "#3B82F6",
  slate:        "#64748B",
  slateLight:   "#F1F5F9",
  warning:      "#D97706",
  warningLight: "#FFFBEB",
  error:        "#DC2626",
  success:      "#059669",
  successLight: "#ECFDF5",
};

const STATUS_PILL = {
  0: { label: "Menunggu Respon", backgroundColor: COLORS.warning },
  1: { label: "Disetujui",       backgroundColor: COLORS.success },
  2: { label: "Ditolak",         backgroundColor: COLORS.error },
};

const METODE_CONFIG = {
  1: "Offline",
  2: "Online",
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const roundedField = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "#fff",
    transition: "box-shadow 0.2s",
    "&:hover fieldset": { borderColor: COLORS.primary },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary },
    "&.Mui-focused": { boxShadow: `0 0 0 3px ${COLORS.primaryLight}` },
  },
};

const tableHeadCell = {
  fontWeight: 700,
  fontSize: { xs: 11, sm: 12 },
  color: "#374151",
  backgroundColor: "#F8FAFC",
  borderBottom: `2px solid ${COLORS.primaryMuted}`,
  py: 2,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const tableBodyRow = {
  "& td": { borderBottom: `1px solid ${COLORS.slateLight}`, py: 2 },
  "&:hover": { backgroundColor: "#F8FAFC" },
};

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
  const [tahunFilter, setTahunFilter] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDashboardPengajuanPembimbing(statusFilter);
      setList(res.data?.list || []);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat data pengajuan pembimbing", confirmButtonColor: COLORS.primary });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tahunOptions = Array.from(new Set(
    list
      .map((item) => {
        if (!item.created_at) return null;
        const year = new Date(item.created_at).getFullYear();
        return Number.isNaN(year) ? null : year;
      })
      .filter(Boolean)
  )).sort((a, b) => b - a);

  const filteredList = tahunFilter === ""
    ? list
    : list.filter((item) => item.created_at && new Date(item.created_at).getFullYear() === Number(tahunFilter));

  const totalPages = Math.max(1, Math.ceil(filteredList.length / rowsPerPage));
  const paginatedList = filteredList.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, tahunFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (loading) {
    return (
      <Box sx={{ position: "relative", minHeight: 260 }}>
        <LoadingScreen message="Memuat data pengajuan pembimbing..." overlay minHeight="260px" />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "stretch", sm: "center" },
        mb: 3, gap: 2, flexWrap: "wrap",
      }}>
        <Box sx={{
          display: "flex", gap: 2, flexWrap: "wrap",
          width: { xs: "100%", sm: "auto" },
          flexDirection: { xs: "column", sm: "row" },
        }}>
          <TextField
            select size="small"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (v) => (
                <span style={{ fontSize: 14, color: !v ? "#9CA3AF" : "inherit" }}>
                  {!v ? "Semua Status" : (["Menunggu Respon", "Disetujui", "Ditolak"][v] || "Semua Status")}
                </span>
              ),
            }}
            sx={{ ...roundedField, width: { xs: "100%", sm: "auto" }, minWidth: { sm: 200 } }}
          >
            <MenuItem value="" sx={{ fontSize: 13 }}>Semua Status</MenuItem>
            <MenuItem value="0" sx={{ fontSize: 13 }}>Menunggu Respon</MenuItem>
            <MenuItem value="1" sx={{ fontSize: 13 }}>Disetujui</MenuItem>
            <MenuItem value="2" sx={{ fontSize: 13 }}>Ditolak</MenuItem>
          </TextField>
          <TextField
            select size="small"
            value={tahunFilter}
            onChange={(e) => {
              setTahunFilter(e.target.value);
              setPage(1);
            }}
            SelectProps={{
              displayEmpty: true,
              renderValue: (v) => (
                <span style={{ fontSize: 14, color: !v ? "#9CA3AF" : "inherit" }}>
                  {!v ? "Semua Tahun" : v}
                </span>
              ),
            }}
            sx={{ ...roundedField, width: { xs: "100%", sm: "auto" }, minWidth: { sm: 160 } }}
          >
            <MenuItem value="" sx={{ fontSize: 13 }}>Semua Tahun</MenuItem>
            {tahunOptions.map((tahun) => (
              <MenuItem key={tahun} value={String(tahun)} sx={{ fontSize: 13 }}>{tahun}</MenuItem>
            ))}
          </TextField>
        </Box>

        <Typography sx={{ fontSize: 14, color: COLORS.slate, fontWeight: 500, textAlign: { xs: "left", sm: "right" } }}>
          Total <b>{filteredList.length} pengajuan</b>
        </Typography>
      </Box>

      {filteredList.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 12 }}>
          <Typography sx={{ color: COLORS.slate, fontSize: 16, fontWeight: 500 }}>Belum ada pengajuan pembimbing</Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{ borderRadius: "12px", border: `1.5px solid ${COLORS.slateLight}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <Table>
              <TableHead>
                <TableRow>
                  {["Judul Proposal", "Mahasiswa Pengaju", "Dosen Pembimbing", "Tanggal Diajukan", "Status", "Aksi"].map((h, i) => (
                    <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 5 && { textAlign: "center" }) }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedList.map((item) => {
                  const sp = STATUS_PILL[item.status] || { label: "Unknown", backgroundColor: "#757575" };
                  return (
                    <TableRow key={item.id_pengajuan} sx={tableBodyRow}>
                      <TableCell><Typography sx={{ fontWeight: 500, fontSize: 14, color: "#1E293B" }}>{item.judul_proposal || "-"}</Typography></TableCell>
                      <TableCell><Typography sx={{ fontSize: 14, color: "#374151" }}>{item.nama_pengaju}</Typography></TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#1E293B" }}>{item.nama_dosen}</Typography>
                        <Typography sx={{ fontSize: 12, color: "#6B7280" }}>{item.nip_dosen}</Typography>
                      </TableCell>
                      <TableCell><Typography sx={{ fontSize: 13, color: "#374151" }}>{formatDate(item.created_at)}</Typography></TableCell>
                      <TableCell><StatusPill label={sp.label} backgroundColor={sp.backgroundColor} /></TableCell>
                      <TableCell align="center">
                        <Button size="small" variant="outlined"
                          onClick={() => { setSelectedItem(item); setDialogOpen(true); }}
                          sx={{
                            textTransform: "none", borderRadius: "12px", fontSize: 12, fontWeight: 600, px: 2.5,
                            borderColor: COLORS.primary, color: COLORS.primary,
                            transition: "all 0.2s",
                            "&:hover": { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primaryDark }
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

          <Box sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            mt: 3,
          }}>
            <Typography sx={{ fontSize: 14, color: COLORS.slate, fontWeight: 500 }}>
              Menampilkan <b>{filteredList.length > 0 ? (page - 1) * rowsPerPage + 1 : 0}–{Math.min(page * rowsPerPage, filteredList.length)}</b> dari <b>{filteredList.length}</b> data
            </Typography>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, v) => setPage(v)}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
              sx={{
                "& .MuiPaginationItem-root": {
                  fontWeight: 600,
                  borderRadius: "8px",
                  "&.Mui-selected": {
                    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                    color: "#fff",
                    "&:hover": { background: `linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.secondary})` },
                  },
                },
              }}
            />
          </Box>
        </>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: { xs: "16px", sm: "24px" }, overflow: "hidden" } }}
      >
        <Box sx={{ p: { xs: 1.5, sm: 2 }, display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, color: "#fff" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Detail Pengajuan Pembimbing</Typography>
          </Box>
          <IconButton
            onClick={() => setDialogOpen(false)}
            sx={{ color: "#fff", "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" } }}
          >
            <Close />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 } }}>
          {selectedItem && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 12, color: "#6B7280", mb: 0.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Status</Typography>
                <StatusPill
                  label={STATUS_PILL[selectedItem.status]?.label || "-"}
                  backgroundColor={STATUS_PILL[selectedItem.status]?.backgroundColor || "#757575"}
                />
              </Box>
              <Divider sx={{ my: 2 }} />
              <DetailRow label="Tim" value={selectedItem.nama_tim} />
              <DetailRow label="Mahasiswa Pengaju" value={selectedItem.nama_pengaju} />
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: 12, color: "#6B7280", mb: 0.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Dosen Pembimbing</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1E293B" }}>{selectedItem.nama_dosen}</Typography>
                <Typography sx={{ fontSize: 12, color: "#6B7280", mt: 0.25 }}>NIP: {selectedItem.nip_dosen}</Typography>
                <Typography sx={{ fontSize: 12, color: "#6B7280", mt: 0.25 }}>Bidang: {selectedItem.bidang_keahlian || "-"}</Typography>
              </Box>
              {selectedItem.judul_proposal && (
                <DetailRow label="Judul Proposal" value={selectedItem.judul_proposal} />
              )}
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#6B7280", mb: 0.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Tanggal Diajukan</Typography>
                  <Typography sx={{ fontSize: 14, color: "#1E293B" }}>{formatDate(selectedItem.created_at)}</Typography>
                </Box>
                {selectedItem.responded_at && (
                  <Box>
                    <Typography sx={{ fontSize: 12, color: "#6B7280", mb: 0.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Tanggal Respon</Typography>
                    <Typography sx={{ fontSize: 14, color: "#1E293B" }}>{formatDate(selectedItem.responded_at)}</Typography>
                  </Box>
                )}
              </Box>
              {selectedItem.catatan_dosen && (
                <Box sx={{ p: 2, backgroundColor: COLORS.warningLight, borderRadius: "12px", border: `1.5px solid ${COLORS.warning}30` }}>
                  <Typography sx={{ fontSize: 12, color: "#6B7280", mb: 0.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Catatan Dosen</Typography>
                  <Typography sx={{ fontSize: 14, color: "#1E293B" }}>{selectedItem.catatan_dosen}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 2, sm: 3 }, backgroundColor: "#F8FAFC", borderTop: "1.5px solid #E2E8F0", gap: 1.5, flexDirection: { xs: "column", sm: "row" }, "& > button": { width: { xs: "100%", sm: "auto" } } }}>
          <Button
            onClick={() => setDialogOpen(false)}
            variant="contained"
            sx={{
              textTransform: "none", borderRadius: "12px", px: 4,
              fontWeight: 700, backgroundColor: COLORS.primary,
              boxShadow: "0 4px 12px rgba(13,89,242,0.2)",
              transition: "all 0.2s",
              "&:hover": { backgroundColor: COLORS.primaryDark, boxShadow: "0 6px 16px rgba(13,89,242,0.3)" },
            }}
          >
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}