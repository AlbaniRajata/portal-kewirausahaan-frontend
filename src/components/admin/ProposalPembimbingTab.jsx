import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Typography,
  Paper,
  Pagination,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import LoadingScreen from "../common/LoadingScreen";
import Swal from "sweetalert2";
import {
  getProposalPembimbing,
  getDosenPembimbing,
  getDosenBebanPembimbing,
  updatePembimbing,
} from "../../api/admin";

const COLORS = {
  primary: "#0D59F2",
  primaryLight: "#E0F2FE",
  primaryDark: "#0369A1",
  primaryMuted: "#93C5FD",
  secondary: "#2563EB",
  accent: "#3B82F6",
  slate: "#64748B",
  slateLight: "#F1F5F9",
  success: "#059669",
  successLight: "#ECFDF5",
  warning: "#D97706",
  error: "#DC2626",
  warningLight: "#ff7070",
};

const tableHeadCell = {
  fontWeight: 800,
  fontSize: 12,
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  backgroundColor: "#F8FAFC",
  borderBottom: `2px solid ${COLORS.primaryMuted}`,
  py: 2.5,
};

const tableBodyRow = {
  "&:hover": { backgroundColor: "#F1F5F9/50" },
  "& td": { borderBottom: "1.5px solid #E2E8F0", py: 2 },
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

const statCard = {
  p: 2,
  borderRadius: "16px",
  border: "1px solid #e5e7eb",
  background: "#fff",
  boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
};

export default function ProposalPembimbingTab({ id_program }) {
  const [proposals, setProposals] = useState([]);
  const [dosenList, setDosenList] = useState([]);
  const [dosenBeban, setDosenBeban] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [selectedDosen, setSelectedDosen] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [proposalRes, dosenRes, dosenBebanRes] = await Promise.all([
        getProposalPembimbing(id_program),
        getDosenPembimbing(),
        getDosenBebanPembimbing(id_program),
      ]);

      setProposals(proposalRes?.data || []);
      setDosenList(dosenRes?.data || []);
      setDosenBeban(dosenBebanRes?.data || []);
    } catch {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Gagal memuat data",
        confirmButtonColor: "#0D59F2",
      });
    } finally {
      setLoading(false);
    }
  }, [id_program]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [proposals.length]);

  const handleEditClick = (proposal) => {
    setSelectedProposal(proposal);
    setSelectedDosen(proposal.pembimbing?.id_dosen || dosenList[0]?.id_dosen || "");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProposal(null);
    setSelectedDosen("");
  };

  const getDosenBebanInfo = (id_dosen) => {
    const beban = dosenBeban.find((d) => d.id_dosen === parseInt(id_dosen, 10));
    return beban?.jumlah_bimbingan || 0;
  };

  const getDosenInfo = (id_dosen) => {
    return dosenList.find((d) => d.id_dosen === parseInt(id_dosen, 10));
  };

  const handleSaveChanges = async () => {
    if (!selectedDosen || !selectedProposal?.id_tim) {
      Swal.fire({
        icon: "warning",
        title: "Peringatan",
        text: "Silakan pilih dosen pembimbing",
        confirmButtonColor: "#0D59F2",
      });
      return;
    }

    try {
      setSubmitting(true);
      await updatePembimbing(selectedProposal.id_tim, selectedDosen);

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Dosen pembimbing berhasil diperbarui",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      handleCloseDialog();
      fetchData();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: error.response?.data?.message || "Gagal memperbarui dosen pembimbing",
        confirmButtonColor: "#0D59F2",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ position: "relative", minHeight: 320 }}>
        <LoadingScreen message="Memuat data proposal..." overlay minHeight="320px" />
      </Box>
    );
  }

  const currentDosenInfo = getDosenInfo(selectedDosen);
  const currentBeban = getDosenBebanInfo(selectedDosen);

  const totalPages = Math.max(1, Math.ceil(proposals.length / itemsPerPage));
  const startIdx = (page - 1) * itemsPerPage;
  const paginatedProposals = proposals.slice(startIdx, startIdx + itemsPerPage);
  const startDisplay = proposals.length === 0 ? 0 : startIdx + 1;
  const endDisplay = Math.min(page * itemsPerPage, proposals.length);

  return (
    <Box>
      <Box sx={{ mb: 2.5, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 1.5 }}>
        <Box sx={{ ...statCard, borderColor: "#d7e9d8", backgroundColor: "#f2faf3" }}>
          <Typography sx={{ fontSize: 12, color: "#5f7160" }}>Belum Ditentukan</Typography>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: COLORS.success }}>{proposals.filter((p) => !p.pembimbing?.id_dosen).length}</Typography>
        </Box>
        <Box sx={{ ...statCard, borderColor: "#d7e5fb", backgroundColor: "#f3f7ff" }}>
          <Typography sx={{ fontSize: 12, color: "#566b93" }}>Sudah Ditentukan</Typography>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: COLORS.primary }}>{proposals.filter((p) => p.pembimbing?.id_dosen).length}</Typography>
        </Box>
        <Box sx={{ ...statCard, borderColor: "#fde3c7", backgroundColor: "#fff7ee" }}>
          <Typography sx={{ fontSize: 12, color: "#91653b" }}>Total Proposal</Typography>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: COLORS.warning }}>{proposals.length}</Typography>
        </Box>
      </Box>

      <TableContainer sx={{ borderRadius: "16px", border: "1.5px solid #E2E8F0", overflow: "auto", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
        <Table sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#fafafa" }}>
              <TableCell sx={tableHeadCell}>JUDUL PROPOSAL</TableCell>
              <TableCell sx={tableHeadCell}>NAMA TIM</TableCell>
              <TableCell sx={tableHeadCell}>KATEGORI</TableCell>
              <TableCell sx={tableHeadCell}>DOSEN PEMBIMBING</TableCell>
              <TableCell sx={{ ...tableHeadCell, textAlign: "center" }}>AKSI</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {proposals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: "center", py: 6 }}>
                  <Typography sx={{ fontSize: { xs: 16, sm: 18 }, fontWeight: 800, color: "#1E293B", mb: 0.5 }}>
                    Belum ada proposal
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: COLORS.slate, fontWeight: 500 }}>
                    Belum ada data proposal yang tersedia
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedProposals.map((proposal) => (
                <TableRow key={proposal.id_tim} sx={tableBodyRow}>
                  <TableCell sx={{ fontSize: 13, maxWidth: 260 }}>
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {proposal.judul || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{proposal.nama_tim || "-"}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{proposal.nama_kategori || "-"}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>
                    {proposal.pembimbing?.nama_dosen ? (
                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{proposal.pembimbing.nama_dosen}</Typography>
                        <Typography sx={{ fontSize: 12, color: "#666" }}>NIP: {proposal.pembimbing.nip}</Typography>
                      </Box>
                    ) : (
                      <Typography sx={{ fontSize: 13, color: "#999", fontStyle: "italic" }}>Belum ditentukan</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    <Button
                      size="small"
                      onClick={() => handleEditClick(proposal)}
                      variant="outlined"
                      sx={{
                        textTransform: "none",
                        color: COLORS.primary,
                        borderColor: COLORS.primaryMuted,
                        borderRadius: "10px",
                        fontWeight: 700,
                        fontSize: { xs: 11, sm: 12 },
                        px: { xs: 1, sm: 2 },
                        "&:hover": { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
                      }}
                    >
                      Detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexDirection: { xs: "column", sm: "row" }, px: 1 }}>
        <Typography sx={{ fontSize: 14, color: COLORS.slate, fontWeight: 600 }}>
          Menampilkan <span style={{ color: "#1E293B" }}>{startDisplay}–{endDisplay}</span> dari <span style={{ color: "#1E293B" }}>{proposals.length}</span> proposal
        </Typography>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, v) => setPage(v)}
          color="primary"
          shape="rounded"
          size="small"
          sx={{
            "& .MuiPaginationItem-root": {
              fontWeight: 700,
              borderRadius: "10px",
              "&.Mui-selected": {
                backgroundColor: COLORS.primary,
                color: "#fff",
                "&:hover": { backgroundColor: COLORS.primaryDark },
              },
            },
          }}
        />
      </Box>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: { xs: "16px", sm: "24px" }, overflow: "hidden" } }}
      >
        <Box sx={{ p: { xs: 1.5, sm: 2 }, display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, color: "#fff" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: 16, sm: 18 } }}>
              Edit Dosen Pembimbing
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDialog} sx={{ color: "#fff", "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" } }}>
            <Close />
          </IconButton>
        </Box>
        <DialogContent
          sx={{
            px: { xs: 2.5, sm: 4 },
            py: { xs: 3, sm: 4 },
            maxHeight: "70vh",
            overflowY: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            "&::-webkit-scrollbar": { width: 0, height: 0 },
          }}
        >
          {selectedProposal && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: "14px", backgroundColor: "#fafafa", border: `1px solid ${COLORS.slateLight}` }}>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: COLORS.slate, mb: 1.5, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Detail Proposal
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#94a3b8", mb: 0.3 }}>Judul</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{selectedProposal.judul}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#94a3b8", mb: 0.3 }}>Tim</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{selectedProposal.nama_tim}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#94a3b8", mb: 0.3 }}>Kategori</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{selectedProposal.nama_kategori}</Typography>
                  </Box>
                </Box>
              </Paper>

              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#1a1a1a", mb: 1 }}>Pilih Dosen Pembimbing</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={selectedDosen}
                  onChange={(e) => setSelectedDosen(e.target.value)}
                  sx={roundedField}
                >
                  {dosenList.map((dosen) => (
                    <MenuItem key={dosen.id_dosen} value={dosen.id_dosen}>
                      {dosen.nama_lengkap} ({dosen.nip})
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {currentDosenInfo && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: "14px", backgroundColor: "#e3f2fd", border: "1px solid #2196f3" }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#1976d2", mb: 1.5, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    Informasi Dosen
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Box>
                      <Typography sx={{ fontSize: 11, color: "#666", mb: 0.3 }}>Nama Lengkap</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#0D59F2" }}>{currentDosenInfo.nama_lengkap}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 11, color: "#666", mb: 0.3 }}>NIP</Typography>
                      <Typography sx={{ fontSize: 13 }}>{currentDosenInfo.nip}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 11, color: "#666", mb: 0.3 }}>Bidang Keahlian</Typography>
                      <Typography sx={{ fontSize: 13 }}>{currentDosenInfo.bidang_keahlian || "-"}</Typography>
                    </Box>
                    <Box sx={{ pt: 1, borderTop: "1px solid #90caf9" }}>
                      <Typography sx={{ fontSize: 11, color: "#666", mb: 0.3 }}>Total Tim Dibimbing</Typography>
                      <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1976d2" }}>{currentBeban} tim</Typography>
                    </Box>
                  </Box>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 2, sm: 3 }, backgroundColor: "#F8FAFC", borderTop: "1.5px solid #E2E8F0", gap: 1.5, flexDirection: { xs: "column", sm: "row" }, "& > button": { width: { xs: "100%", sm: "auto" } } }}>
          <Button
            onClick={handleCloseDialog}
            variant="contained"
            disabled={submitting}
            sx={{
              textTransform: "none", borderRadius: "12px", px: 3, fontWeight: 700,
              backgroundColor: COLORS.error,
              boxShadow: "0 4px 12px rgba(220,38,38,0.2)",
              "&:hover": {
                backgroundColor: "#B91C1C",
                boxShadow: "0 6px 16px rgba(220,38,38,0.3)",
              },
            }}
          >
            Batal
          </Button>
          <Button
            onClick={handleSaveChanges}
            variant="contained"
            disabled={submitting}
            sx={{
              textTransform: "none", borderRadius: "12px", px: 4, fontWeight: 700,
              backgroundColor: COLORS.primary,
              boxShadow: "0 4px 12px rgba(13, 89, 242, 0.2)",
              "&:hover": {
                backgroundColor: COLORS.primaryDark,
                boxShadow: "0 6px 16px rgba(13, 89, 242, 0.3)",
              },
            }}
          >
            {submitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
