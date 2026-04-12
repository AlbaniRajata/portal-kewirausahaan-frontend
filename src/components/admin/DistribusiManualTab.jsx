import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, CircularProgress, TextField,
  Checkbox, FormControlLabel, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Autocomplete, Radio, Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  getReviewerList, getProposalList, executeBulkDistribusi,
  getJuriList, executeManualDistribusiTahap2, getPanelTahap2History,
} from "../../api/admin";
import LoadingScreen from "../common/LoadingScreen";

const roundedField = { "& .MuiOutlinedInput-root": { borderRadius: "15px" } };

const tableHeadCell = {
  fontWeight: 700, fontSize: 13, color: "#000",
  backgroundColor: "#fafafa", borderBottom: "2px solid #f0f0f0", py: 2,
};
const tableBodyRow = { "& td": { borderBottom: "1px solid #f5f5f5", py: 2 } };

const formatRupiah = (value) => {
  if (!value) return "Rp 0";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
};

const getDosenPembimbingName = (item) => {
  return (
    item?.nama_dosen ||
    item?.nama_pembimbing ||
    item?.dosen_pembimbing ||
    item?.pembimbing?.nama_dosen ||
    item?.pembimbing?.nama_lengkap ||
    item?.pengajuan_pembimbing?.nama_dosen ||
    "-"
  );
};

const normalizeId = (value) => {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
};

const extractReviewerId = (historyItem) => normalizeId(
  historyItem?.id_reviewer
  ?? historyItem?.id_user_reviewer
  ?? historyItem?.reviewer_id
  ?? historyItem?.id_user
);

const extractJuriId = (historyItem) => normalizeId(
  historyItem?.id_juri
  ?? historyItem?.id_user_juri
  ?? historyItem?.juri_id
  ?? historyItem?.id_user
);

const ACTIVE_ASSIGNMENT_STATUSES = new Set([0, 1, 3, 4]);

const toNumberOrNull = (value) => {
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const PersonOption = ({ nama, institusi, keahlian }) => (
  <Box>
    <Typography sx={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>{nama}</Typography>
    <Typography sx={{ fontSize: 12, color: "#888" }}>
      {institusi || "-"}{keahlian ? ` • ${keahlian}` : ""}
    </Typography>
  </Box>
);

export default function DistribusiManualTab({ id_program, tahap, onSuccess, onError }) {
  const navigate = useNavigate();
  const [reviewers, setReviewers] = useState([]);
  const [juries, setJuries] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [panelHistory, setPanelHistory] = useState([]);

  const [selectedReviewer, setSelectedReviewer] = useState(null);
  const [selectedProposals, setSelectedProposals] = useState([]);

  const [selectedReviewerTahap2, setSelectedReviewerTahap2] = useState(null);
  const [selectedJuri, setSelectedJuri] = useState(null);
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
    } catch { onError("Gagal memuat daftar reviewer"); }
    finally { setLoadingReviewers(false); }
  }, [onError]);

  const fetchJuries = useCallback(async () => {
    if (tahap !== 2) return;
    try {
      setLoadingJuries(true);
      const res = await getJuriList();
      setJuries(res.data || []);
    } catch { onError("Gagal memuat daftar juri"); }
    finally { setLoadingJuries(false); }
  }, [tahap, onError]);

  const fetchProposals = useCallback(async () => {
    if (!id_program) return;
    try {
      setLoadingProposals(true);
      if (tahap === 1) {
        const res = await getProposalList({ id_program, status: 1 });
        setProposals(res.data || []);
      } else {
        const [resStatus4, resStatus5, historyRes] = await Promise.all([
          getProposalList({ id_program, status: 4 }),
          getProposalList({ id_program, status: 5 }),
          getPanelTahap2History(id_program),
        ]);

        const history = historyRes.data || [];
        setPanelHistory(history);

        const idSudahLengkap = new Set(
          history
            .filter((h) => h.id_distribusi_reviewer && h.id_distribusi_juri)
            .map((h) => h.id_proposal)
        );

        const merged = [...(resStatus4.data || []), ...(resStatus5.data || [])];
        const unique = merged.filter(
          (item, index, arr) => arr.findIndex((x) => x.id_proposal === item.id_proposal) === index
        );

        setProposals(unique.filter((p) => !idSudahLengkap.has(p.id_proposal)));
      }
    } catch { onError("Gagal memuat daftar proposal"); }
    finally { setLoadingProposals(false); }
  }, [id_program, tahap, onError]);

  useEffect(() => { fetchReviewers(); }, [fetchReviewers]);
  useEffect(() => { if (tahap === 2) fetchJuries(); }, [tahap, fetchJuries]);
  useEffect(() => {
    if (id_program) {
      fetchProposals();
      setSelectedProposals([]);
      setSelectedReviewer(null);
      setSelectedReviewerTahap2(null);
      setSelectedJuri(null);
      setSelectedProposal(null);
    }
  }, [id_program, tahap, fetchProposals]);

  const reviewerSudahAktif = new Set(
    panelHistory
      .filter((h) => ACTIVE_ASSIGNMENT_STATUSES.has(toNumberOrNull(h.status_reviewer)))
      .map(extractReviewerId)
      .filter(Boolean)
  );

  const juriSudahAktif = new Set(
    panelHistory
      .filter((h) => ACTIVE_ASSIGNMENT_STATUSES.has(toNumberOrNull(h.status_juri)))
      .map(extractJuriId)
      .filter(Boolean)
  );

  const reviewerTersedia = reviewers.filter((r) => {
    return !reviewerSudahAktif.has(normalizeId(r.id_user));
  });

  const juriTersedia = juries.filter((j) => {
    return !juriSudahAktif.has(normalizeId(j.id_user));
  });

  const slotKosong = proposals.length;
  const reviewerOptions = reviewerTersedia.length > 0 || slotKosong === 0 ? reviewerTersedia : reviewers;
  const juriOptions = juriTersedia.length > 0 || slotKosong === 0 ? juriTersedia : juries;

  const handleAssignTahap1 = async () => {
    if (!selectedReviewer) {
      Swal.fire({ icon: "warning", title: "Perhatian", text: "Silahkan pilih reviewer terlebih dahulu", confirmButtonColor: "#0D59F2" });
      return;
    }
    if (selectedProposals.length === 0) {
      Swal.fire({ icon: "warning", title: "Perhatian", text: "Silahkan pilih minimal 1 proposal", confirmButtonColor: "#0D59F2" });
      return;
    }
    const result = await Swal.fire({
      title: "Konfirmasi Distribusi",
      html: `Assign <b>${selectedProposals.length}</b> proposal ke:<br/><br/><b>${selectedReviewer.nama_lengkap}</b><br/>${selectedReviewer.institusi || ""}<br/><br/>Lanjutkan?`,
      icon: "question", showCancelButton: true,
      confirmButtonColor: "#0D59F2", cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Assign", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    try {
      setAssigning(true);
      const res = await executeBulkDistribusi(id_program, tahap, {
        id_reviewer: selectedReviewer.id_user,
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
    } finally { setAssigning(false); }
  };

  const handleAssignTahap2 = async () => {
    if (!selectedReviewerTahap2) {
      Swal.fire({ icon: "warning", title: "Perhatian", text: "Silahkan pilih reviewer terlebih dahulu", confirmButtonColor: "#0D59F2" });
      return;
    }
    if (!selectedJuri) {
      Swal.fire({ icon: "warning", title: "Perhatian", text: "Silahkan pilih juri terlebih dahulu", confirmButtonColor: "#0D59F2" });
      return;
    }
    if (!selectedProposal) {
      Swal.fire({ icon: "warning", title: "Perhatian", text: "Silahkan pilih 1 proposal", confirmButtonColor: "#0D59F2" });
      return;
    }
    const proposal = proposals.find((p) => p.id_proposal === selectedProposal);
    const result = await Swal.fire({
      title: "Konfirmasi Distribusi Panel",
      html: `Assign panel wawancara ke:<br/><br/><b>${proposal?.judul}</b><br/><br/>Reviewer: <b>${selectedReviewerTahap2.nama_lengkap}</b><br/>Juri: <b>${selectedJuri.nama_lengkap}</b><br/><br/>Lanjutkan?`,
      icon: "question", showCancelButton: true,
      confirmButtonColor: "#0D59F2", cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Assign", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    try {
      setAssigning(true);
      const res = await executeManualDistribusiTahap2(id_program, {
        id_proposal: selectedProposal,
        id_reviewer: selectedReviewerTahap2.id_user,
        id_juri: selectedJuri.id_user,
      });
      await Swal.fire({
        icon: "success", title: "Distribusi Selesai", text: res.message,
        timer: 2000, timerProgressBar: true, showConfirmButton: false,
      });
      onSuccess(res.message);
      setSelectedReviewerTahap2(null);
      setSelectedJuri(null);
      setSelectedProposal(null);
      fetchProposals();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Terjadi kesalahan saat assign panel", confirmButtonColor: "#0D59F2" });
    } finally { setAssigning(false); }
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
      reviewerOptions={reviewerOptions}
      juriOptions={juriOptions}
      proposals={proposals}
      selectedReviewer={selectedReviewerTahap2} setSelectedReviewer={setSelectedReviewerTahap2}
      selectedJuri={selectedJuri} setSelectedJuri={setSelectedJuri}
      selectedProposal={selectedProposal} setSelectedProposal={setSelectedProposal}
      handleAssign={handleAssignTahap2}
      loadingReviewers={loadingReviewers} loadingJuries={loadingJuries} loadingProposals={loadingProposals}
      assigning={assigning} navigate={navigate}
    />
  );
}

function ProposalTable({ proposals, loading, renderSelector, navigate }) {
  if (loading) {
    return (
      <Box sx={{ position: "relative", minHeight: 260 }}>
        <LoadingScreen message="Memuat daftar proposal..." overlay minHeight="260px" />
      </Box>
    );
  }
  if (proposals.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 5 }}>
        <Typography sx={{ fontSize: 14, color: "#999" }}>Tidak ada proposal siap distribusi</Typography>
      </Box>
    );
  }
  return (
    <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "auto" }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" sx={{ ...tableHeadCell, width: 48 }} />
            <TableCell sx={tableHeadCell}>Judul Proposal</TableCell>
            <TableCell sx={tableHeadCell}>Tim</TableCell>
            <TableCell sx={tableHeadCell}>Dosen Pembimbing</TableCell>
            <TableCell sx={tableHeadCell}>Modal</TableCell>
            <TableCell sx={{ ...tableHeadCell, width: 90 }}>Aksi</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {proposals.map((p) => (
            <TableRow key={p.id_proposal} sx={tableBodyRow}>
              <TableCell padding="checkbox">{renderSelector(p)}</TableCell>
              <TableCell>
                <Typography sx={{ fontSize: 13, maxWidth: 300 }}>{p.judul}</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontSize: 13 }}>{p.nama_tim}</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontSize: 13 }}>{getDosenPembimbingName(p)}</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontSize: 13 }}>{formatRupiah(p.modal_diajukan)}</Typography>
              </TableCell>
              <TableCell>
                <Button size="small" variant="outlined"
                  onClick={() => navigate(`/admin/proposal/${p.id_proposal}`)}
                  sx={{ textTransform: "none", fontSize: 12, borderRadius: "50px" }}>
                  Detail
                </Button>
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
      <Typography sx={{ ...roundedField, fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>1. Pilih Reviewer</Typography>

      <Autocomplete
        options={reviewers}
        value={selectedReviewer}
        onChange={(_, v) => setSelectedReviewer(v)}
        getOptionLabel={(o) => o.nama_lengkap || ""}
        isOptionEqualToValue={(o, v) => o.id_user === v.id_user}
        disabled={loadingReviewers}
        loading={loadingReviewers}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.id_user}>
            <PersonOption nama={option.nama_lengkap} institusi={option.institusi} keahlian={option.bidang_keahlian} />
          </Box>
        )}
        renderInput={(params) => (
          <TextField {...params} label="Reviewer" placeholder="Cari atau pilih reviewer" sx={roundedField} />
        )}
      />

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>
          2. Pilih Proposal ({selectedProposals.length} terpilih)
        </Typography>
        {proposals.length > 0 && (
          <FormControlLabel
            control={
              <Checkbox
                checked={proposals.length > 0 && selectedProposals.length === proposals.length}
                indeterminate={selectedProposals.length > 0 && selectedProposals.length < proposals.length}
                onChange={handleSelectAll}
              />
            }
            label={<Typography sx={{ fontSize: 13 }}>Pilih Semua</Typography>}
          />
        )}
      </Box>

      <ProposalTable
        proposals={proposals} loading={loadingProposals} navigate={navigate}
        renderSelector={(p) => (
          <Checkbox
            checked={selectedProposals.includes(p.id_proposal)}
            onChange={() => handleToggle(p.id_proposal)}
          />
        )}
      />

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained" onClick={handleAssign}
          disabled={assigning || selectedProposals.length === 0 || !selectedReviewer}
          sx={{ textTransform: "none", borderRadius: "50px", px: 3, backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" } }}
        >
          {assigning ? "Memproses..." : `Assign ${selectedProposals.length} Proposal`}
        </Button>
      </Box>
    </Box>
  );
}

function DistribusiManualTahap2({
  reviewerOptions, juriOptions, proposals,
  selectedReviewer, setSelectedReviewer,
  selectedJuri, setSelectedJuri,
  selectedProposal, setSelectedProposal,
  handleAssign, loadingReviewers, loadingJuries, loadingProposals,
  assigning, navigate,
}) {
  const canAssign = selectedReviewer && selectedJuri && selectedProposal;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography sx={{ ...roundedField, fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>
        1. Pilih Reviewer
      </Typography>

      <Autocomplete
        options={reviewerOptions}
        value={selectedReviewer}
        onChange={(_, v) => setSelectedReviewer(v)}
        getOptionLabel={(o) => o.nama_lengkap || ""}
        isOptionEqualToValue={(o, v) => o.id_user === v.id_user}
        disabled={loadingReviewers}
        loading={loadingReviewers}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.id_user}>
            <PersonOption nama={option.nama_lengkap} institusi={option.institusi} keahlian={option.bidang_keahlian} />
          </Box>
        )}
        renderInput={(params) => (
          <TextField {...params} label="Reviewer" placeholder="Cari atau pilih reviewer" sx={roundedField} />
        )}
      />

      <Typography sx={{ ...roundedField, fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>
        2. Pilih Juri
      </Typography>

      <Autocomplete
        options={juriOptions}
        value={selectedJuri}
        onChange={(_, v) => setSelectedJuri(v)}
        getOptionLabel={(o) => o.nama_lengkap || ""}
        isOptionEqualToValue={(o, v) => o.id_user === v.id_user}
        disabled={loadingJuries}
        loading={loadingJuries}
        renderOption={(props, option) => (
          <Box component="li" {...props} key={option.id_user}>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>{option.nama_lengkap}</Typography>
              <Typography sx={{ fontSize: 12, color: "#888" }}>{option.email || "-"}</Typography>
            </Box>
          </Box>
        )}
        renderInput={(params) => (
          <TextField {...params} label="Juri" placeholder="Cari atau pilih juri" sx={roundedField} />
        )}
      />

      <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>
        3. Pilih Proposal (1 proposal)
      </Typography>

      <ProposalTable
        proposals={proposals} loading={loadingProposals} navigate={navigate}
        renderSelector={(p) => (
          <Radio
            checked={selectedProposal === p.id_proposal}
            onChange={() => setSelectedProposal(p.id_proposal)}
          />
        )}
      />

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained" onClick={handleAssign}
          disabled={assigning || !canAssign}
          sx={{ textTransform: "none", borderRadius: "50px", px: 3, backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" } }}
        >
          {assigning ? "Memproses..." : "Assign Panel ke Proposal"}
        </Button>
      </Box>
    </Box>
  );
}