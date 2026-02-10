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
  Autocomplete,
  Radio,
} from "@mui/material";
import { Assignment, Visibility } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  getReviewerList,
  getProposalList,
  executeBulkDistribusi,
  getJuriList,
  executeManualDistribusiTahap2,
} from "../../api/admin";

export default function DistribusiManualTab({
  id_program,
  tahap,
  onSuccess,
  onError,
}) {
  const navigate = useNavigate();
  const [reviewers, setReviewers] = useState([]);
  const [juries, setJuries] = useState([]);
  const [proposals, setProposals] = useState([]);
  
  const [selectedReviewer, setSelectedReviewer] = useState("");
  const [selectedProposals, setSelectedProposals] = useState([]);
  
  const [selectedReviewers, setSelectedReviewers] = useState([]);
  const [selectedJuries, setSelectedJuries] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  
  const [loadingReviewers, setLoadingReviewers] = useState(false);
  const [loadingJuries, setLoadingJuries] = useState(false);
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

  const fetchJuries = useCallback(async () => {
    if (tahap !== 2) return;
    
    try {
      setLoadingJuries(true);
      const response = await getJuriList();

      if (response.success) {
        setJuries(response.data || []);
      }
    } catch (err) {
      console.error("Error fetching juries:", err);
      onError("Gagal memuat daftar juri");
    } finally {
      setLoadingJuries(false);
    }
  }, [tahap, onError]);

  const fetchProposals = useCallback(async () => {
    if (!id_program) return;

    try {
      setLoadingProposals(true);
      const statusFilter = tahap === 1 ? 1 : 5;
      const response = await getProposalList({
        id_program: id_program,
        status: statusFilter,
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
  }, [id_program, tahap, onError]);

  useEffect(() => {
    fetchReviewers();
  }, [fetchReviewers]);

  useEffect(() => {
    if (tahap === 2) {
      fetchJuries();
    }
  }, [tahap, fetchJuries]);

  useEffect(() => {
    if (id_program) {
      fetchProposals();
      setSelectedProposals([]);
      setSelectedReviewer("");
      setSelectedReviewers([]);
      setSelectedJuries([]);
      setSelectedProposal(null);
    }
  }, [id_program, tahap, fetchProposals]);

  const formatRupiah = (value) => {
    if (!value) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleAssignTahap1 = async () => {
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

  const handleAssignTahap2 = async () => {
    if (selectedReviewers.length === 0) {
      Swal.fire({
        title: "Perhatian!",
        text: "Silakan pilih minimal 1 reviewer",
        icon: "warning",
        confirmButtonColor: "#0D59F2",
      });
      return;
    }

    if (selectedJuries.length === 0) {
      Swal.fire({
        title: "Perhatian!",
        text: "Silakan pilih minimal 1 juri",
        icon: "warning",
        confirmButtonColor: "#0D59F2",
      });
      return;
    }

    if (!selectedProposal) {
      Swal.fire({
        title: "Perhatian!",
        text: "Silakan pilih 1 proposal",
        icon: "warning",
        confirmButtonColor: "#0D59F2",
      });
      return;
    }

    const proposal = proposals.find((p) => p.id_proposal === selectedProposal);
    const result = await Swal.fire({
      title: "Konfirmasi Distribusi Panel",
      html: `
        Assign panel ke proposal:<br/><br/>
        <b>${proposal?.judul}</b><br/><br/>
        Reviewer: <b>${selectedReviewers.length}</b> orang<br/>
        Juri: <b>${selectedJuries.length}</b> orang<br/><br/>
        Lanjutkan?
      `,
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
        const response = await executeManualDistribusiTahap2(id_program, {
          id_proposal: selectedProposal,
          reviewers: selectedReviewers,
          juries: selectedJuries,
        });

        if (response.success) {
          Swal.fire({
            title: "Distribusi Selesai!",
            text: response.message,
            icon: "success",
            confirmButtonColor: "#0D59F2",
          });

          onSuccess(response.message);
          setSelectedReviewers([]);
          setSelectedJuries([]);
          setSelectedProposal(null);
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
        console.error("Error assigning panel:", err);
        Swal.fire({
          title: "Error!",
          text: "Terjadi kesalahan saat assign panel",
          icon: "error",
          confirmButtonColor: "#d33",
        });
        onError("Terjadi kesalahan saat assign panel");
      } finally {
        setAssigning(false);
      }
    }
  };

  if (tahap === 1) {
    return <DistribusiManualTahap1
      reviewers={reviewers}
      proposals={proposals}
      selectedReviewer={selectedReviewer}
      setSelectedReviewer={setSelectedReviewer}
      selectedProposals={selectedProposals}
      setSelectedProposals={setSelectedProposals}
      handleAssign={handleAssignTahap1}
      loadingReviewers={loadingReviewers}
      loadingProposals={loadingProposals}
      assigning={assigning}
      formatRupiah={formatRupiah}
      navigate={navigate}
    />;
  }

  return <DistribusiManualTahap2
    reviewers={reviewers}
    juries={juries}
    proposals={proposals}
    selectedReviewers={selectedReviewers}
    setSelectedReviewers={setSelectedReviewers}
    selectedJuries={selectedJuries}
    setSelectedJuries={setSelectedJuries}
    selectedProposal={selectedProposal}
    setSelectedProposal={setSelectedProposal}
    handleAssign={handleAssignTahap2}
    loadingReviewers={loadingReviewers}
    loadingJuries={loadingJuries}
    loadingProposals={loadingProposals}
    assigning={assigning}
    formatRupiah={formatRupiah}
    navigate={navigate}
  />;
}

function DistribusiManualTahap1({
  reviewers,
  proposals,
  selectedReviewer,
  setSelectedReviewer,
  selectedProposals,
  setSelectedProposals,
  handleAssign,
  loadingReviewers,
  loadingProposals,
  assigning,
  formatRupiah,
  navigate,
}) {
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

  return (
    <Box>
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

function DistribusiManualTahap2({
  reviewers,
  juries,
  proposals,
  selectedReviewers,
  setSelectedReviewers,
  selectedJuries,
  setSelectedJuries,
  selectedProposal,
  setSelectedProposal,
  handleAssign,
  loadingReviewers,
  loadingJuries,
  loadingProposals,
  assigning,
  formatRupiah,
  navigate,
}) {
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 2 }}>
          1. Pilih Reviewer ({selectedReviewers.length} terpilih)
        </Typography>

        <Autocomplete
          multiple
          options={reviewers}
          value={reviewers.filter((r) => selectedReviewers.includes(r.id_user))}
          onChange={(e, newValue) => {
            setSelectedReviewers(newValue.map((v) => v.id_user));
          }}
          getOptionLabel={(option) => option.nama_lengkap}
          isOptionEqualToValue={(option, value) => option.id_user === value.id_user}
          disabled={loadingReviewers}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Reviewer"
              placeholder="Pilih reviewer"
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                label={option.nama_lengkap}
                {...getTagProps({ index })}
                size="small"
              />
            ))
          }
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 2 }}>
          2. Pilih Juri ({selectedJuries.length} terpilih)
        </Typography>

        <Autocomplete
          multiple
          options={juries}
          value={juries.filter((j) => selectedJuries.includes(j.id_user))}
          onChange={(e, newValue) => {
            setSelectedJuries(newValue.map((v) => v.id_user));
          }}
          getOptionLabel={(option) => option.nama_lengkap}
          isOptionEqualToValue={(option, value) => option.id_user === value.id_user}
          disabled={loadingJuries}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Juri"
              placeholder="Pilih juri"
            />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                label={option.nama_lengkap}
                {...getTagProps({ index })}
                size="small"
              />
            ))
          }
        />
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 2 }}>
          3. Pilih Proposal (1 proposal)
        </Typography>

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
                      <Radio
                        checked={selectedProposal === proposal.id_proposal}
                        onChange={() => setSelectedProposal(proposal.id_proposal)}
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

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <Button
            variant="contained"
            startIcon={
              assigning ? <CircularProgress size={20} /> : <Assignment />
            }
            onClick={handleAssign}
            disabled={
              assigning ||
              selectedReviewers.length === 0 ||
              selectedJuries.length === 0 ||
              !selectedProposal
            }
            sx={{
              textTransform: "none",
              backgroundColor: "#0D59F2",
              "&:hover": { backgroundColor: "#0a47c4" },
            }}
          >
            {assigning
              ? "Memproses..."
              : `Assign Panel ke Proposal`}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}