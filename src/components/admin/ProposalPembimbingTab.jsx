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
  warningLight: "#ffea95",
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

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
};

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};

export default function ProposalPembimbingTab({ id_program }) {
  const [proposals, setProposals] = useState([]);
  const [dosenList, setDosenList] = useState([]);
  const [dosenBeban, setDosenBeban] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [selectedDosen, setSelectedDosen] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");
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

  const handleDetailClick = (proposal) => {
    setSelectedProposal(proposal);
    setOpenDetailDialog(true);
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
    setSelectedProposal(null);
  };

  const handleEditClick = (proposal) => {
    setSelectedProposal(proposal);
    setSelectedDosen(proposal.pembimbing?.id_dosen || dosenList[0]?.id_dosen || "");
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
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

  const getFilteredProposals = () => {
    if (filterStatus === "belum") {
      return proposals.filter((p) => !p.pembimbing?.id_dosen);
    } else if (filterStatus === "sudah") {
      return proposals.filter((p) => p.pembimbing?.id_dosen);
    }
    return proposals;
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

      handleCloseEditDialog();
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

  const filteredProposals = getFilteredProposals();
  const totalPages = Math.max(1, Math.ceil(filteredProposals.length / itemsPerPage));
  const startIdx = (page - 1) * itemsPerPage;
  const paginatedProposals = filteredProposals.slice(startIdx, startIdx + itemsPerPage);
  const startDisplay = filteredProposals.length === 0 ? 0 : startIdx + 1;
  const endDisplay = Math.min(page * itemsPerPage, filteredProposals.length);

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

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          select
          size="small"
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          SelectProps={{
            displayEmpty: true,
            renderValue: (v) => (
              <span style={{ fontSize: 14, color: !v ? "#9CA3AF" : "inherit" }}>
                {!v || v === "all" ? "Semua Status" : (v === "belum" ? "Belum Ditentukan" : "Sudah Ditentukan")}
              </span>
            ),
          }}
          sx={{ ...roundedField, width: { xs: "100%", sm: "auto" }, minWidth: { xs: "100%", sm: 200 } }}
        >
          <MenuItem value="all" sx={{ fontSize: 13 }}>Semua Status</MenuItem>
          <MenuItem value="belum" sx={{ fontSize: 13 }}>Belum Ditentukan</MenuItem>
          <MenuItem value="sudah" sx={{ fontSize: 13 }}>Sudah Ditentukan</MenuItem>
        </TextField>
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
            {filteredProposals.length === 0 ? (
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
                    <Box sx={{ display: "flex", gap: { xs: 0.5, sm: 1.5 }, justifyContent: "center", flexWrap: "wrap" }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleDetailClick(proposal)}
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
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleEditClick(proposal)}
                        sx={{
                          textTransform: "none",
                          color: COLORS.warning,
                          borderColor: COLORS.warningLight,
                          borderRadius: "10px",
                          fontWeight: 700,
                          fontSize: { xs: 11, sm: 12 },
                          px: { xs: 1, sm: 2 },
                          "&:hover": { backgroundColor: COLORS.warningLight, borderColor: COLORS.warning },
                        }}
                      >
                        Edit
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexDirection: { xs: "column", sm: "row" }, px: 1 }}>
        <Typography sx={{ fontSize: 14, color: COLORS.slate, fontWeight: 600 }}>
          Menampilkan <span style={{ color: "#1E293B" }}>{startDisplay}–{endDisplay}</span> dari <span style={{ color: "#1E293B" }}>{filteredProposals.length}</span> proposal
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
        open={openDetailDialog}
        onClose={handleCloseDetailDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: { xs: "16px", sm: "24px" }, overflow: "hidden" } }}
      >
        <Box sx={{ p: { xs: 1.5, sm: 2 }, display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, color: "#fff" }}>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: 16, sm: 18 } }}>
            Detail Proposal
          </Typography>
          <IconButton onClick={handleCloseDetailDialog} sx={{ color: "#fff", "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" } }}>
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "14px", backgroundColor: "#fafafa", border: `1px solid ${COLORS.slateLight}` }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#94a3b8", mb: 0.5, fontWeight: 700, textTransform: "uppercase" }}>Judul Proposal</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{selectedProposal.judul}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#94a3b8", mb: 0.5, fontWeight: 700, textTransform: "uppercase" }}>Nama Tim</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{selectedProposal.nama_tim}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#94a3b8", mb: 0.5, fontWeight: 700, textTransform: "uppercase" }}>Kategori</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{selectedProposal.nama_kategori}</Typography>
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                    <Box>
                      <Typography sx={{ fontSize: 11, color: "#94a3b8", mb: 0.5, fontWeight: 700, textTransform: "uppercase" }}>Program</Typography>
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{selectedProposal.nama_program || "-"}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 11, color: "#94a3b8", mb: 0.5, fontWeight: 700, textTransform: "uppercase" }}>Modal Diajukan</Typography>
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{formatCurrency(selectedProposal.modal_diajukan)}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 11, color: "#94a3b8", mb: 0.5, fontWeight: 700, textTransform: "uppercase" }}>Tanggal Submit</Typography>
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{formatDate(selectedProposal.tanggal_submit)}</Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 11, color: "#94a3b8", mb: 0.5, fontWeight: 700, textTransform: "uppercase" }}>ID Tim</Typography>
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{selectedProposal.id_tim || "-"}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "14px", backgroundColor: "#f0f9ff", border: "1px solid #bfdbfe" }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#0369a1", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    Dosen Pembimbing Saat Ini
                  </Typography>
                  {selectedProposal.pembimbing?.id_dosen ? (
                    <>
                      <Box>
                        <Typography sx={{ fontSize: 11, color: "#666", mb: 0.5 }}>Nama Lengkap</Typography>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0D59F2" }}>{selectedProposal.pembimbing.nama_dosen}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 11, color: "#666", mb: 0.5 }}>NIP</Typography>
                        <Typography sx={{ fontSize: 14 }}>{selectedProposal.pembimbing.nip}</Typography>
                      </Box>
                    </>
                  ) : (
                    <Typography sx={{ fontSize: 14, color: "#999", fontStyle: "italic" }}>Belum ditentukan</Typography>
                  )}
                </Box>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 2, sm: 3 }, backgroundColor: "#F8FAFC", borderTop: "1.5px solid #E2E8F0", gap: 1.5, flexDirection: { xs: "column", sm: "row" }, "& > button": { width: { xs: "100%", sm: "auto" } } }}>
          <Button
            onClick={handleCloseDetailDialog}
            variant="outlined"
            sx={{
              textTransform: "none",
              borderRadius: "12px",
              px: 3,
              fontWeight: 700,
              color: COLORS.slate,
              borderColor: "#e2e8f0",
              backgroundColor: "#fff",
              "&:hover": {
                backgroundColor: "#f8fafc",
                borderColor: COLORS.slate,
              },
            }}
          >
            Tutup
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
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
          <IconButton onClick={handleCloseEditDialog} sx={{ color: "#fff", "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" } }}>
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
            onClick={handleCloseEditDialog}
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
