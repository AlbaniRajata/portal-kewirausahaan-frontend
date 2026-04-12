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
} from "@mui/material";
import LoadingScreen from "../common/LoadingScreen";
import Swal from "sweetalert2";
import {
  getProposalPembimbing,
  getDosenPembimbing,
  getDosenBebanPembimbing,
  updatePembimbing,
} from "../../api/admin";

const tableHeadCell = {
  fontWeight: 700,
  fontSize: 13,
  color: "#000",
  backgroundColor: "#fafafa",
  borderBottom: "2px solid #f0f0f0",
  py: 2,
};

const tableBodyRow = { "& td": { borderBottom: "1px solid #f5f5f5", py: 2 } };
const roundedField = { "& .MuiOutlinedInput-root": { borderRadius: "15px" } };

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
      <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#fafafa" }}>
              <TableCell sx={tableHeadCell}>Judul Proposal</TableCell>
              <TableCell sx={tableHeadCell}>Nama Tim</TableCell>
              <TableCell sx={tableHeadCell}>Kategori</TableCell>
              <TableCell sx={tableHeadCell}>Dosen Pembimbing</TableCell>
              <TableCell sx={{ ...tableHeadCell, textAlign: "center", width: "90px" }}>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {proposals.length === 0 ? (
              <TableRow sx={tableBodyRow}>
                <TableCell colSpan={5} sx={{ textAlign: "center", py: 4, color: "#999" }}>
                  Tidak ada proposal
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
                        borderRadius: "50px",
                        fontSize: 12,
                        fontWeight: 600,
                        px: 2,
                        borderColor: "#0D59F2",
                        color: "#0D59F2",
                        "&:hover": { backgroundColor: "#f0f4ff" },
                      }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f0f0f0", gap: 2, flexWrap: "wrap" }}>
        <Typography sx={{ fontSize: 13, color: "#777" }}>
          Menampilkan {startDisplay}–{endDisplay} dari {proposals.length} proposal
        </Typography>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, v) => setPage(v)}
          color="primary"
          shape="rounded"
          showFirstButton
          showLastButton
        />
      </Box>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16, pb: 1 }}>Edit Dosen Pembimbing</DialogTitle>
        <DialogContent
          sx={{
            pt: 2,
            maxHeight: "70vh",
            overflowY: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            "&::-webkit-scrollbar": { width: 0, height: 0 },
          }}
        >
          {selectedProposal && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: "12px", backgroundColor: "#fafafa", border: "1px solid #e0e0e0" }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#666", mb: 1.5, textTransform: "uppercase" }}>
                  Detail Proposal
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#999", mb: 0.3 }}>Judul</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{selectedProposal.judul}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#999", mb: 0.3 }}>Tim</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{selectedProposal.nama_tim}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 11, color: "#999", mb: 0.3 }}>Kategori</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{selectedProposal.nama_kategori}</Typography>
                  </Box>
                </Box>
              </Paper>

              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a", mb: 1 }}>Pilih Dosen Pembimbing</Typography>
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
                <Paper variant="outlined" sx={{ p: 2, borderRadius: "12px", backgroundColor: "#e3f2fd", border: "1px solid #2196f3" }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#1976d2", mb: 1.5, textTransform: "uppercase" }}>
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
        <DialogActions sx={{ p: 2, borderTop: "1px solid #f0f0f0" }}>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600, color: "#666", border: "1.5px solid #e0e0e0", "&:hover": { backgroundColor: "#f5f5f5" } }}
          >
            Batal
          </Button>
          <Button
            onClick={handleSaveChanges}
            variant="contained"
            disabled={submitting}
            sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600, backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" }, "&:disabled": { backgroundColor: "#ccc" } }}
          >
            {submitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
