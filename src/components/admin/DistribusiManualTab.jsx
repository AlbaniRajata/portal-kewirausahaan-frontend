import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
  Radio,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  getReviewerList,
  getProposalList,
  executeBulkDistribusi,
  getJuriList,
  executeManualDistribusiTahap2,
  getPanelTahap2History,
} from "../../api/admin";
import LoadingScreen from "../common/LoadingScreen";

const COLORS = {
  primary: "#0D59F2",
  primaryLight: "#E0F2FE",
  primaryMuted: "#93C5FD",
  slate: "#64748B",
  slateLight: "#F1F5F9",
  success: "#059669",
  successLight: "#ECFDF5",
  warning: "#D97706",
  warningLight: "#FFFBEB",
  error: "#DC2626",
  errorLight: "#ff7070",
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
  fontSize: 13,
  color: "#374151",
  backgroundColor: "#F8FAFC",
  borderBottom: `2px solid ${COLORS.primaryMuted}`,
  py: 2,
};

const tableBodyRow = {
  "& td": { borderBottom: `1px solid ${COLORS.slateLight}`, py: 2 },
  "&:hover": { backgroundColor: "#F8FAFC" },
};

const formatRupiah = (value) => {
  if (!value) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const getDosenPembimbingName = (item) =>
  item?.nama_dosen ||
  item?.nama_pembimbing ||
  item?.dosen_pembimbing ||
  item?.pembimbing?.nama_dosen ||
  item?.pembimbing?.nama_lengkap ||
  item?.pengajuan_pembimbing?.nama_dosen ||
  "-";

const normalizeId = (value) => {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
};

const extractReviewerId = (historyItem) =>
  normalizeId(
    historyItem?.id_reviewer ??
      historyItem?.id_user_reviewer ??
      historyItem?.reviewer_id ??
      historyItem?.id_user
  );

const extractJuriId = (historyItem) =>
  normalizeId(
    historyItem?.id_juri ??
      historyItem?.id_user_juri ??
      historyItem?.juri_id ??
      historyItem?.id_user
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
      {institusi || "-"}
      {keahlian ? ` • ${keahlian}` : ""}
    </Typography>
  </Box>
);

const SectionLabel = ({ children }) => (
  <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>{children}</Typography>
);

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
        <Typography sx={{ fontSize: 14, color: COLORS.slate }}>
          Tidak ada proposal siap distribusi
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer
      sx={{
        borderRadius: "16px",
        border: `1.5px solid ${COLORS.slateLight}`,
        overflow: "auto",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox" sx={{ ...tableHeadCell, width: 48 }} />
            <TableCell sx={tableHeadCell}>JUDUL PROPOSAL</TableCell>
            <TableCell sx={tableHeadCell}>KATEGORI</TableCell>
            <TableCell sx={tableHeadCell}>TIM</TableCell>
            <TableCell sx={tableHeadCell}>DOSEN PEMBIMBING</TableCell>
            <TableCell sx={tableHeadCell}>MODAL</TableCell>
            <TableCell sx={{ ...tableHeadCell, width: 90, textAlign: "center" }}>AKSI</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {proposals.map((p) => (
            <TableRow key={p.id_proposal} sx={tableBodyRow}>
              <TableCell padding="checkbox">{renderSelector(p)}</TableCell>
                <TableCell>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 500,
                      maxWidth: 300,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {p.judul}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: 13 }}>{p.nama_kategori || p.kategori || "-"}</Typography>
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
              <TableCell sx={{ textAlign: "center" }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate(`/admin/proposal/${p.id_proposal}`)}
                  sx={{
                    textTransform: "none",
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: "50px",
                    px: 2,
                    borderColor: COLORS.primary,
                    color: COLORS.primary,
                    "&:hover": { backgroundColor: "#f0f4ff" },
                  }}
                >
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

export default function DistribusiManualTab({ id_program, tahap, onSuccess, onError }) {
  const navigate = useNavigate();
  const [reviewers, setReviewers] = useState([]);
  const [juries, setJuries] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [panelHistory, setPanelHistory] = useState([]);

  const [selectedReviewer1, setSelectedReviewer1] = useState(null);
  const [selectedReviewer2, setSelectedReviewer2] = useState(null);
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
          (item, index, arr) =>
            arr.findIndex((x) => x.id_proposal === item.id_proposal) === index
        );

        setProposals(unique.filter((p) => !idSudahLengkap.has(p.id_proposal)));
      }
    } catch {
      onError("Gagal memuat daftar proposal");
    } finally {
      setLoadingProposals(false);
    }
  }, [id_program, tahap, onError]);

  useEffect(() => {
    fetchReviewers();
  }, [fetchReviewers]);

  useEffect(() => {
    if (tahap === 2) fetchJuries();
  }, [tahap, fetchJuries]);

  useEffect(() => {
    if (id_program) {
      fetchProposals();
      setSelectedProposals([]);
      setSelectedReviewer1(null);
      setSelectedReviewer2(null);
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

  const reviewerTersedia = reviewers.filter(
    (r) => !reviewerSudahAktif.has(normalizeId(r.id_user))
  );
  const juriTersedia = juries.filter(
    (j) => !juriSudahAktif.has(normalizeId(j.id_user))
  );

  const slotKosong = proposals.length;
  const reviewerOptions =
    reviewerTersedia.length > 0 || slotKosong === 0 ? reviewerTersedia : reviewers;
  const juriOptions =
    juriTersedia.length > 0 || slotKosong === 0 ? juriTersedia : juries;

  const handleAssignTahap1 = async () => {
    if (!selectedReviewer1 || !selectedReviewer2) {
      Swal.fire({
        icon: "warning",
        title: "Perhatian",
        text: "Silahkan pilih 2 reviewer terlebih dahulu",
        confirmButtonColor: COLORS.primary,
      });
      return;
    }
    if (selectedProposals.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Perhatian",
        text: "Silahkan pilih minimal 1 proposal",
        confirmButtonColor: COLORS.primary,
      });
      return;
    }

    const result = await Swal.fire({
      title: "Konfirmasi Distribusi",
      html: `Assign <b>${selectedProposals.length}</b> proposal ke:<br/><br/>
             Reviewer 1: <b>${selectedReviewer1.nama_lengkap}</b><br/>
             Reviewer 2: <b>${selectedReviewer2.nama_lengkap}</b><br/><br/>Lanjutkan?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: COLORS.primary,
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Assign",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      setAssigning(true);

      let totalAssigned = 0;
      let totalFailed = 0;

      // Distribute selected proposals to both reviewers
      for (const reviewerId of [selectedReviewer1.id_user, selectedReviewer2.id_user]) {
        const res = await executeBulkDistribusi(id_program, tahap, {
          id_reviewer: reviewerId,
          id_proposal_list: selectedProposals,
        });
        const body = res.data || res;
        const ta = body?.total_assigned ?? 0;
        const tf = body?.total_failed ?? 0;
        totalAssigned += ta;
        totalFailed += tf;
      }

      await Swal.fire({
        icon: totalFailed > 0 ? "warning" : "success",
        title: "Distribusi Selesai",
        html: `<b>Berhasil:</b> ${totalAssigned} distribusi${
          totalFailed > 0 ? `<br/><b>Gagal:</b> ${totalFailed} distribusi` : ""
        }`,
        confirmButtonColor: COLORS.primary,
      });
      onSuccess("Distribusi selesai");
      setSelectedProposals([]);
      setSelectedReviewer1(null);
      setSelectedReviewer2(null);
      fetchProposals();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.response?.data?.message || "Terjadi kesalahan saat assign proposal",
        confirmButtonColor: COLORS.primary,
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleAssignTahap2 = async () => {
    if (!selectedReviewerTahap2) {
      Swal.fire({
        icon: "warning",
        title: "Perhatian",
        text: "Silahkan pilih reviewer terlebih dahulu",
        confirmButtonColor: COLORS.primary,
      });
      return;
    }
    if (!selectedJuri) {
      Swal.fire({
        icon: "warning",
        title: "Perhatian",
        text: "Silahkan pilih juri terlebih dahulu",
        confirmButtonColor: COLORS.primary,
      });
      return;
    }
    if (!selectedProposal) {
      Swal.fire({
        icon: "warning",
        title: "Perhatian",
        text: "Silahkan pilih 1 proposal",
        confirmButtonColor: COLORS.primary,
      });
      return;
    }

    const proposal = proposals.find((p) => p.id_proposal === selectedProposal);
    const result = await Swal.fire({
      title: "Konfirmasi Distribusi Wawancara",
      html: `Assign wawancara ke:<br/><br/>
             <b>${proposal?.judul}</b><br/><br/>
             Reviewer: <b>${selectedReviewerTahap2.nama_lengkap}</b><br/>
             Juri: <b>${selectedJuri.nama_lengkap}</b><br/><br/>Lanjutkan?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: COLORS.primary,
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Assign",
      cancelButtonText: "Batal",
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
        icon: "success",
        title: "Distribusi Selesai",
        text: res.message,
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      onSuccess(res.message);
      setSelectedReviewerTahap2(null);
      setSelectedJuri(null);
      setSelectedProposal(null);
      fetchProposals();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.response?.data?.message || "Terjadi kesalahan saat assign wawancara",
        confirmButtonColor: COLORS.primary,
      });
    } finally {
      setAssigning(false);
    }
  };

  if (tahap === 1) {
    return (
      <DistribusiManualTahap1
        reviewers={reviewers}
        proposals={proposals}
        selectedReviewer1={selectedReviewer1}
        setSelectedReviewer1={setSelectedReviewer1}
        selectedReviewer2={selectedReviewer2}
        setSelectedReviewer2={setSelectedReviewer2}
        selectedProposals={selectedProposals}
        setSelectedProposals={setSelectedProposals}
        handleAssign={handleAssignTahap1}
        loadingReviewers={loadingReviewers}
        loadingProposals={loadingProposals}
        assigning={assigning}
        navigate={navigate}
      />
    );
  }

  return (
    <DistribusiManualTahap2
      reviewerOptions={reviewerOptions}
      juriOptions={juriOptions}
      proposals={proposals}
      selectedReviewer={selectedReviewerTahap2}
      setSelectedReviewer={setSelectedReviewerTahap2}
      selectedJuri={selectedJuri}
      setSelectedJuri={setSelectedJuri}
      selectedProposal={selectedProposal}
      setSelectedProposal={setSelectedProposal}
      handleAssign={handleAssignTahap2}
      loadingReviewers={loadingReviewers}
      loadingJuries={loadingJuries}
      loadingProposals={loadingProposals}
      assigning={assigning}
      navigate={navigate}
    />
  );
}

function DistribusiManualTahap1({
  reviewers,
  proposals,
  selectedReviewer1,
  setSelectedReviewer1,
  selectedReviewer2,
  setSelectedReviewer2,
  selectedProposals,
  setSelectedProposals,
  handleAssign,
  loadingReviewers,
  loadingProposals,
  assigning,
  navigate,
}) {
  const handleSelectAll = (e) => {
    setSelectedProposals(e.target.checked ? proposals.map((p) => p.id_proposal) : []);
  };

  const handleToggle = (id) => {
    setSelectedProposals((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <SectionLabel>1. Pilih Reviewer (Pasangan)</SectionLabel>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1, color: "#374151" }}>Reviewer 1</Typography>
          <Autocomplete
            options={reviewers.filter((r) => !selectedReviewer2 || selectedReviewer2.id_user !== r.id_user)}
            value={selectedReviewer1}
            onChange={(_, v) => setSelectedReviewer1(v)}
            getOptionLabel={(o) => o.nama_lengkap || ""}
            isOptionEqualToValue={(o, v) => o.id_user === v.id_user}
            disabled={loadingReviewers}
            loading={loadingReviewers}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.id_user}>
                <PersonOption
                  nama={option.nama_lengkap}
                  institusi={option.institusi}
                  keahlian={option.bidang_keahlian}
                />
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Cari atau pilih reviewer"
                sx={roundedField}
              />
            )}
          />
        </Box>

        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1, color: "#374151" }}>Reviewer 2</Typography>
          <Autocomplete
            options={reviewers.filter((r) => !selectedReviewer1 || selectedReviewer1.id_user !== r.id_user)}
            value={selectedReviewer2}
            onChange={(_, v) => setSelectedReviewer2(v)}
            getOptionLabel={(o) => o.nama_lengkap || ""}
            isOptionEqualToValue={(o, v) => o.id_user === v.id_user}
            disabled={loadingReviewers}
            loading={loadingReviewers}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.id_user}>
                <PersonOption
                  nama={option.nama_lengkap}
                  institusi={option.institusi}
                  keahlian={option.bidang_keahlian}
                />
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Cari atau pilih reviewer"
                sx={roundedField}
              />
            )}
          />
        </Box>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <SectionLabel>2. Pilih Proposal ({selectedProposals.length} terpilih)</SectionLabel>
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
                sx={{
                  color: COLORS.primary,
                  "&.Mui-checked": { color: COLORS.primary },
                  "&.MuiCheckbox-indeterminate": { color: COLORS.primary },
                }}
              />
            }
            label={<Typography sx={{ fontSize: 13, color: COLORS.slate }}>Pilih Semua</Typography>}
          />
        )}
      </Box>

      <ProposalTable
        proposals={proposals}
        loading={loadingProposals}
        navigate={navigate}
        renderSelector={(p) => (
          <Checkbox
            checked={selectedProposals.includes(p.id_proposal)}
            onChange={() => handleToggle(p.id_proposal)}
            sx={{
              color: COLORS.primary,
              "&.Mui-checked": { color: COLORS.primary },
            }}
          />
        )}
      />

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          onClick={handleAssign}
          disabled={assigning || selectedProposals.length === 0 || !selectedReviewer1 || !selectedReviewer2}
          sx={{
            textTransform: "none",
            borderRadius: "50px",
            fontWeight: 700,
            px: 3,
            backgroundColor: COLORS.primary,
            "&:hover": { backgroundColor: "#0a47c4" },
            "&:disabled": { backgroundColor: "#ccc" },
          }}
        >
          {assigning ? "Memproses..." : `Assign ${selectedProposals.length} Proposal`}
        </Button>
      </Box>
    </Box>
  );
}

function DistribusiManualTahap2({
  reviewerOptions,
  juriOptions,
  proposals,
  selectedReviewer,
  setSelectedReviewer,
  selectedJuri,
  setSelectedJuri,
  selectedProposal,
  setSelectedProposal,
  handleAssign,
  loadingReviewers,
  loadingJuries,
  loadingProposals,
  assigning,
  navigate,
}) {
  const canAssign = selectedReviewer && selectedJuri && selectedProposal;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <SectionLabel>1. Pilih Reviewer</SectionLabel>

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
            <PersonOption
              nama={option.nama_lengkap}
              institusi={option.institusi}
              keahlian={option.bidang_keahlian}
            />
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Reviewer"
            placeholder="Cari atau pilih reviewer"
            sx={roundedField}
          />
        )}
      />

      <SectionLabel>2. Pilih Juri</SectionLabel>

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
              <Typography sx={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>
                {option.nama_lengkap}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#888" }}>{option.email || "-"}</Typography>
            </Box>
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Juri"
            placeholder="Cari atau pilih juri"
            sx={roundedField}
          />
        )}
      />

      <SectionLabel>3. Pilih Proposal (1 proposal)</SectionLabel>

      <ProposalTable
        proposals={proposals}
        loading={loadingProposals}
        navigate={navigate}
        renderSelector={(p) => (
          <Radio
            checked={selectedProposal === p.id_proposal}
            onChange={() => setSelectedProposal(p.id_proposal)}
            sx={{
              color: COLORS.primary,
              "&.Mui-checked": { color: COLORS.primary },
            }}
          />
        )}
      />

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          onClick={handleAssign}
          disabled={assigning || !canAssign}
          sx={{
            textTransform: "none",
            borderRadius: "50px",
            fontWeight: 700,
            px: 3,
            backgroundColor: COLORS.primary,
            "&:hover": { backgroundColor: "#0a47c4" },
            "&:disabled": { backgroundColor: "#ccc" },
          }}
        >
          {assigning ? "Memproses..." : "Assign Wawancara ke Proposal"}
        </Button>
      </Box>
    </Box>
  );
}