import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Assignment, Visibility } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  getReviewerList,
  getProposalList,
  executeBulkDistribusi,
} from "../../api/admin";

export default function DistribusiManualTab({
  id_program,
  tahap,
  onSuccess,
  onError,
}) {
  const navigate = useNavigate();
  const [reviewers, setReviewers] = useState([]);
  const [selectedReviewer, setSelectedReviewer] = useState("");
  const [proposals, setProposals] = useState([]);
  const [selectedProposals, setSelectedProposals] = useState([]);
  const [loadingReviewers, setLoadingReviewers] = useState(false);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const fetchReviewers = useCallback(async () => {
    try {
      setLoadingReviewers(true);
      const response = await getReviewerList();

      if (response.success) {
        setReviewers(response.data || []);
      }
    } catch (err) {
      console.error("Error fetching reviewers:", err);
      onError("Gagal memuat daftar reviewer");
    } finally {
      setLoadingReviewers(false);
    }
  }, [onError]);

  const fetchProposals = useCallback(async () => {
    if (!id_program) return;

    try {
      setLoadingProposals(true);
      const response = await getProposalList({
        id_program: id_program,
        status: 1,
      });

      if (response.success) {
        setProposals(response.data || []);
      }
    } catch (err) {
      console.error("Error fetching proposals:", err);
      onError("Gagal memuat daftar proposal");
    } finally {
      setLoadingProposals(false);
    }
  }, [id_program, onError]);

  useEffect(() => {
    fetchReviewers();
  }, [fetchReviewers]);

  useEffect(() => {
    if (id_program) {
      fetchProposals();
      setSelectedProposals([]);
    }
  }, [id_program, fetchProposals]);

  const handleSelectProposal = (id_proposal) => {
    setSelectedProposals((prev) => {
      if (prev.includes(id_proposal)) {
        return prev.filter((id) => id !== id_proposal);
      } else {
        return [...prev, id_proposal];
      }
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProposals(proposals.map((p) => p.id_proposal));
    } else {
      setSelectedProposals([]);
    }
  };

  const handleAssign = async () => {
    if (!selectedReviewer) {
      Swal.fire({
        title: "Perhatian!",
        text: "Silakan pilih reviewer terlebih dahulu",
        icon: "warning",
        confirmButtonColor: "#0D59F2",
      });
      return;
    }

    if (selectedProposals.length === 0) {
      Swal.fire({
        title: "Perhatian!",
        text: "Silakan pilih minimal 1 proposal",
        icon: "warning",
        confirmButtonColor: "#0D59F2",
      });
      return;
    }

    const reviewer = reviewers.find((r) => r.id_user === selectedReviewer);
    const result = await Swal.fire({
      title: "Konfirmasi Distribusi",
      html: `Assign <b>${selectedProposals.length}</b> proposal terpilih ke:<br/><br/><b>${reviewer?.nama_lengkap}</b><br/>${reviewer?.institusi || ""}<br/><br/>Lanjutkan?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0D59F2",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Assign",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        setAssigning(true);
        const response = await executeBulkDistribusi(id_program, tahap, {
          id_reviewer: selectedReviewer,
          id_proposal_list: selectedProposals,
        });

        if (response.success) {
          const { total_assigned, total_failed } = response.data;

          Swal.fire({
            title: "Distribusi Selesai!",
            html: `<b>Berhasil:</b> ${total_assigned} proposal<br/>${
              total_failed > 0 ? `<b>Gagal:</b> ${total_failed} proposal` : ""
            }`,
            icon: total_failed > 0 ? "warning" : "success",
            confirmButtonColor: "#0D59F2",
          });

          onSuccess(response.message);
          setSelectedProposals([]);
          fetchProposals();
        } else {
          Swal.fire({
            title: "Gagal!",
            text: response.message,
            icon: "error",
            confirmButtonColor: "#d33",
          });
          onError(response.message);
        }
      } catch (err) {
        console.error("Error assigning proposals:", err);
        Swal.fire({
          title: "Error!",
          text: "Terjadi kesalahan saat assign proposal",
          icon: "error",
          confirmButtonColor: "#d33",
        });
        onError("Terjadi kesalahan saat assign proposal");
      } finally {
        setAssigning(false);
      }
    }
  };

  const formatRupiah = (value) => {
    if (!value) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Box>
      {/* Step 1: Pilih Reviewer */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 2 }}>
          1. Pilih Reviewer
        </Typography>

        <TextField
          select
          fullWidth
          label="Reviewer"
          value={selectedReviewer}
          onChange={(e) => setSelectedReviewer(e.target.value)}
          disabled={loadingReviewers}
        >
          <MenuItem value="">Pilih Reviewer</MenuItem>
          {reviewers.map((reviewer) => (
            <MenuItem key={reviewer.id_user} value={reviewer.id_user}>
              <Box>
                <Typography sx={{ fontWeight: 500 }}>
                  {reviewer.nama_lengkap}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "#666" }}>
                  {reviewer.institusi || "-"}
                  {reviewer.bidang_keahlian
                    ? ` • ${reviewer.bidang_keahlian}`
                    : ""}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </TextField>
      </Paper>

      {/* Step 2: Pilih Proposal */}
      <Paper sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 600 }}>
            2. Pilih Proposal ({selectedProposals.length} terpilih)
          </Typography>

          {proposals.length > 0 && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={
                    proposals.length > 0 &&
                    selectedProposals.length === proposals.length
                  }
                  indeterminate={
                    selectedProposals.length > 0 &&
                    selectedProposals.length < proposals.length
                  }
                  onChange={handleSelectAll}
                />
              }
              label="Pilih Semua"
            />
          )}
        </Box>

        {loadingProposals ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress />
          </Box>
        ) : proposals.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 5 }}>
            <Typography sx={{ fontSize: 16, color: "#666" }}>
              Tidak ada proposal siap distribusi
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell padding="checkbox"></TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Judul Proposal</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tim</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Modal</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>
                    Aksi
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proposals.map((proposal) => (
                  <TableRow key={proposal.id_proposal} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedProposals.includes(proposal.id_proposal)}
                        onChange={() => handleSelectProposal(proposal.id_proposal)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`#${proposal.id_proposal}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14, maxWidth: 300 }}>
                        {proposal.judul}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14 }}>
                        {proposal.nama_tim}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14 }}>
                        {formatRupiah(proposal.modal_diajukan)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() =>
                          navigate(`/admin/proposal/${proposal.id_proposal}`)
                        }
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

        {/* Assign Button */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <Button
            variant="contained"
            startIcon={
              assigning ? <CircularProgress size={20} /> : <Assignment />
            }
            onClick={handleAssign}
            disabled={assigning || selectedProposals.length === 0}
            sx={{
              textTransform: "none",
              backgroundColor: "#0D59F2",
              "&:hover": { backgroundColor: "#0a47c4" },
            }}
          >
            {assigning
              ? "Memproses..."
              : `Assign ${selectedProposals.length} Proposal`}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}