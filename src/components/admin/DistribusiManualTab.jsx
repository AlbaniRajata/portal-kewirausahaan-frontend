import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, CircularProgress, TextField, MenuItem,
  Checkbox, FormControlLabel, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Autocomplete, Radio,
} from "@mui/material";
import { Assignment, Visibility } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  getReviewerList, getProposalList, executeBulkDistribusi,
  getJuriList, executeManualDistribusiTahap2,
} from "../../api/admin";

const formatRupiah = (value) => {
  if (!value) return "Rp 0";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
};

export default function DistribusiManualTab({ id_program, tahap, onSuccess, onError }) {
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
      const res = await getReviewerList();
      setReviewers(res.data || []);
    } catch {
      onError("Gagal memuat daftar reviewer");
    } finally {
      setLoadingReviewers(false);
    }
  }, [onError]);

  const fetchJuries = useCallback(async () => {
    if (tahap !== 2) return;
    try {
      setLoadingJuries(true);
      const res = await getJuriList();
      setJuries(res.data || []);
    } catch {
      onError("Gagal memuat daftar juri");
    } finally {
      setLoadingJuries(false);
    }
  }, [tahap, onError]);

  const fetchProposals = useCallback(async () => {
    if (!id_program) return;
    try {
      setLoadingProposals(true);
      const res = await getProposalList({ id_program, status: tahap === 1 ? 1 : 4 });
      setProposals(res.data || []);
    } catch {
      onError("Gagal memuat daftar proposal");
    } finally {
      setLoadingProposals(false);
    }
  }, [id_program, tahap, onError]);

  useEffect(() => { fetchReviewers(); }, [fetchReviewers]);
  useEffect(() => { if (tahap === 2) fetchJuries(); }, [tahap, fetchJuries]);
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

  const handleAssignTahap1 = async () => {
    if (!selectedReviewer) {
      Swal.fire({ icon: "warning", title: "Perhatian", text: "Silakan pilih reviewer terlebih dahulu", confirmButtonColor: "#0D59F2" });
      return;
    }
    if (selectedProposals.length === 0) {
      Swal.fire({ icon: "warning", title: "Perhatian", text: "Silakan pilih minimal 1 proposal", confirmButtonColor: "#0D59F2" });
      return;
    }

    const reviewer = reviewers.find((r) => r.id_user === selectedReviewer);
    const result = await Swal.fire({
      title: "Konfirmasi Distribusi",
      html: `Assign <b>${selectedProposals.length}</b> proposal ke:<br/><br/><b>${reviewer?.nama_lengkap}</b><br/>${reviewer?.institusi || ""}<br/><br/>Lanjutkan?`,
      icon: "question", showCancelButton: true,
      confirmButtonColor: "#0D59F2", cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Assign", cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      setAssigning(true);
      const res = await executeBulkDistribusi(id_program, tahap, {
        id_reviewer: selectedReviewer,
        id_proposal_list: selectedProposals,
      });
      const { total_assigned, total_failed } = res.data;
      await Swal.fire({
        icon: total_failed > 0 ? "warning" : "success",
        title: "Distribusi Selesai",
        html: `<b>Berhasil:</b> ${total_assigned} proposal${total_failed > 0 ? `<br/><b>Gagal:</b> ${total_failed} proposal` : ""}`,
        confirmButtonColor: "#0D59F2",
      });
      onSuccess(res.message);
      setSelectedProposals([]);
      fetchProposals();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Terjadi kesalahan saat assign proposal", confirmButtonColor: "#0D59F2" });
      onError(err.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setAssigning(false);
    }
  };

  const handleAssignTahap2 = async () => {
    if (selectedReviewers.length === 0) {
      Swal.fire({ icon: "warning", title: "Perhatian", text: "Silakan pilih minimal 1 reviewer", confirmButtonColor: "#0D59F2" });
      return;
    }
    if (selectedJuries.length === 0) {
      Swal.fire({ icon: "warning", title: "Perhatian", text: "Silakan pilih minimal 1 juri", confirmButtonColor: "#0D59F2" });
      return;
    }
    if (!selectedProposal) {
      Swal.fire({ icon: "warning", title: "Perhatian", text: "Silakan pilih 1 proposal", confirmButtonColor: "#0D59F2" });
      return;
    }

    const proposal = proposals.find((p) => p.id_proposal === selectedProposal);
    const result = await Swal.fire({
      title: "Konfirmasi Distribusi Panel",
      html: `Assign panel ke:<br/><br/><b>${proposal?.judul}</b><br/><br/>Reviewer: <b>${selectedReviewers.length}</b> orang<br/>Juri: <b>${selectedJuries.length}</b> orang<br/><br/>Lanjutkan?`,
      icon: "question", showCancelButton: true,
      confirmButtonColor: "#0D59F2", cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Assign", cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      setAssigning(true);
      const res = await executeManualDistribusiTahap2(id_program, {
        id_proposal: selectedProposal,
        reviewers: selectedReviewers,
        juries: selectedJuries,
      });
      await Swal.fire({ icon: "success", title: "Distribusi Selesai", text: res.message, timer: 2000, timerProgressBar: true, showConfirmButton: false });
      onSuccess(res.message);
      setSelectedReviewers([]);
      setSelectedJuries([]);
      setSelectedProposal(null);
      fetchProposals();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Terjadi kesalahan saat assign panel", confirmButtonColor: "#0D59F2" });
      onError(err.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setAssigning(false);
    }
  };

  if (tahap === 1) {
    return (
      <DistribusiManualTahap1
        reviewers={reviewers} proposals={proposals}
        selectedReviewer={selectedReviewer} setSelectedReviewer={setSelectedReviewer}
        selectedProposals={selectedProposals} setSelectedProposals={setSelectedProposals}
        handleAssign={handleAssignTahap1}
        loadingReviewers={loadingReviewers} loadingProposals={loadingProposals}
        assigning={assigning} navigate={navigate}
      />
    );
  }

  return (
    <DistribusiManualTahap2
      reviewers={reviewers} juries={juries} proposals={proposals}
      selectedReviewers={selectedReviewers} setSelectedReviewers={setSelectedReviewers}
      selectedJuries={selectedJuries} setSelectedJuries={setSelectedJuries}
      selectedProposal={selectedProposal} setSelectedProposal={setSelectedProposal}
      handleAssign={handleAssignTahap2}
      loadingReviewers={loadingReviewers} loadingJuries={loadingJuries} loadingProposals={loadingProposals}
      assigning={assigning} navigate={navigate}
    />
  );
}

function ProposalTable({ proposals, loading, renderSelector, navigate }) {
  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress /></Box>;
  if (proposals.length === 0) return (
    <Box sx={{ textAlign: "center", py: 5 }}>
      <Typography sx={{ fontSize: 14, color: "#999" }}>Tidak ada proposal siap distribusi</Typography>
    </Box>
  );
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
            <TableCell padding="checkbox" />
            <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Judul Proposal</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Tim</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Modal</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Aksi</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {proposals.map((p) => (
            <TableRow key={p.id_proposal} hover>
              <TableCell padding="checkbox">{renderSelector(p)}</TableCell>
              <TableCell><Chip label={`#${p.id_proposal}`} size="small" color="primary" variant="outlined" /></TableCell>
              <TableCell><Typography sx={{ fontSize: 13, maxWidth: 300 }}>{p.judul}</Typography></TableCell>
              <TableCell><Typography sx={{ fontSize: 13 }}>{p.nama_tim}</Typography></TableCell>
              <TableCell><Typography sx={{ fontSize: 13 }}>{formatRupiah(p.modal_diajukan)}</Typography></TableCell>
              <TableCell>
                <Button size="small" variant="outlined" startIcon={<Visibility />}
                  onClick={() => navigate(`/admin/proposal/${p.id_proposal}`)}
                  sx={{ textTransform: "none" }}>Detail</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function DistribusiManualTahap1({
  reviewers, proposals, selectedReviewer, setSelectedReviewer,
  selectedProposals, setSelectedProposals, handleAssign,
  loadingReviewers, loadingProposals, assigning, navigate,
}) {
  const handleSelectAll = (e) => {
    setSelectedProposals(e.target.checked ? proposals.map((p) => p.id_proposal) : []);
  };
  const handleToggle = (id) => {
    setSelectedProposals((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography sx={{ fontSize: 15, fontWeight: 600 }}>1. Pilih Reviewer</Typography>

      <TextField select fullWidth label="Reviewer" value={selectedReviewer}
        onChange={(e) => setSelectedReviewer(e.target.value)} disabled={loadingReviewers}>
        <MenuItem value="">Pilih Reviewer</MenuItem>
        {reviewers.map((r) => (
          <MenuItem key={r.id_user} value={r.id_user}>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{r.nama_lengkap}</Typography>
              <Typography sx={{ fontSize: 12, color: "#888" }}>{r.institusi || "-"}{r.bidang_keahlian ? ` • ${r.bidang_keahlian}` : ""}</Typography>
            </Box>
          </MenuItem>
        ))}
      </TextField>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography sx={{ fontSize: 15, fontWeight: 600 }}>2. Pilih Proposal ({selectedProposals.length} terpilih)</Typography>
        {proposals.length > 0 && (
          <FormControlLabel
            control={<Checkbox checked={proposals.length > 0 && selectedProposals.length === proposals.length} indeterminate={selectedProposals.length > 0 && selectedProposals.length < proposals.length} onChange={handleSelectAll} />}
            label="Pilih Semua"
          />
        )}
      </Box>

      <ProposalTable
        proposals={proposals} loading={loadingProposals} navigate={navigate}
        renderSelector={(p) => (
          <Checkbox checked={selectedProposals.includes(p.id_proposal)} onChange={() => handleToggle(p.id_proposal)} />
        )}
      />

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" startIcon={assigning ? <CircularProgress size={18} color="inherit" /> : <Assignment />}
          onClick={handleAssign} disabled={assigning || selectedProposals.length === 0}
          sx={{ textTransform: "none", backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" } }}>
          {assigning ? "Memproses..." : `Assign ${selectedProposals.length} Proposal`}
        </Button>
      </Box>
    </Box>
  );
}

function DistribusiManualTahap2({
  reviewers, juries, proposals,
  selectedReviewers, setSelectedReviewers,
  selectedJuries, setSelectedJuries,
  selectedProposal, setSelectedProposal,
  handleAssign, loadingReviewers, loadingJuries, loadingProposals,
  assigning, navigate,
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography sx={{ fontSize: 15, fontWeight: 600 }}>1. Pilih Reviewer ({selectedReviewers.length} terpilih)</Typography>

      <Autocomplete multiple options={reviewers}
        value={reviewers.filter((r) => selectedReviewers.includes(r.id_user))}
        onChange={(_, v) => setSelectedReviewers(v.map((x) => x.id_user))}
        getOptionLabel={(o) => o.nama_lengkap}
        isOptionEqualToValue={(o, v) => o.id_user === v.id_user}
        disabled={loadingReviewers}
        renderInput={(params) => <TextField {...params} label="Reviewer" placeholder="Pilih reviewer" />}
        renderTags={(value, getTagProps) => value.map((o, i) => <Chip key={i} label={o.nama_lengkap} {...getTagProps({ index: i })} size="small" />)}
      />

      <Typography sx={{ fontSize: 15, fontWeight: 600 }}>2. Pilih Juri ({selectedJuries.length} terpilih)</Typography>

      <Autocomplete multiple options={juries}
        value={juries.filter((j) => selectedJuries.includes(j.id_user))}
        onChange={(_, v) => setSelectedJuries(v.map((x) => x.id_user))}
        getOptionLabel={(o) => o.nama_lengkap}
        isOptionEqualToValue={(o, v) => o.id_user === v.id_user}
        disabled={loadingJuries}
        renderInput={(params) => <TextField {...params} label="Juri" placeholder="Pilih juri" />}
        renderTags={(value, getTagProps) => value.map((o, i) => <Chip key={i} label={o.nama_lengkap} {...getTagProps({ index: i })} size="small" />)}
      />

      <Typography sx={{ fontSize: 15, fontWeight: 600 }}>3. Pilih Proposal (1 proposal)</Typography>

      <ProposalTable
        proposals={proposals} loading={loadingProposals} navigate={navigate}
        renderSelector={(p) => (
          <Radio checked={selectedProposal === p.id_proposal} onChange={() => setSelectedProposal(p.id_proposal)} />
        )}
      />

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" startIcon={assigning ? <CircularProgress size={18} color="inherit" /> : <Assignment />}
          onClick={handleAssign}
          disabled={assigning || selectedReviewers.length === 0 || selectedJuries.length === 0 || !selectedProposal}
          sx={{ textTransform: "none", backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" } }}>
          {assigning ? "Memproses..." : "Assign Panel ke Proposal"}
        </Button>
      </Box>
    </Box>
  );
}