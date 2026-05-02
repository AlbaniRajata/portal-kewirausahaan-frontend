import { useState, useEffect, useCallback, Fragment } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, Button, Chip, CircularProgress, Pagination, TextField, MenuItem,
  Collapse, Paper,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowRight } from "@mui/icons-material";
import Swal from "sweetalert2";
import { getListProposalRekapTahap1, finalisasiDeskBatch, getRekapDesk } from "../../api/admin";
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
  success:      "#059669",
  successLight: "#ECFDF5",
  warning:      "#D97706",
  warningLight: "#FFFBEB",
  error:        "#DC2626",
  errorLight:   "#ff7070",
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

const ROWS_PER_PAGE = 10;

const getStatusInfo = (status, totalReviewer, totalSubmit) => {
  if (status === 3) return { text: "Tidak Lolos Desk",     color: "error"   };
  if (status === 4) return { text: "Lolos Desk",           color: "success" };
  if (status === 2) return totalSubmit === totalReviewer && totalReviewer > 0
    ? { text: "Menunggu Finalisasi", color: "warning" }
    : { text: "Sedang Dinilai",      color: "info"    };
  return { text: "Unknown", color: "default" };
};

const formatDate = (d) => (!d ? "-" : new Date(d).toLocaleDateString("id-ID", {
  day: "2-digit", month: "short", year: "numeric",
}));

const getKey = (id) => `1-${id}`;

function ReviewerCard({ data }) {
  return (
    <Paper elevation={0} sx={{
      p: 2.5, mb: 2, borderRadius: "12px",
      border: `1.5px solid ${COLORS.slateLight}`,
      backgroundColor: "#FAFBFF",
    }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#1E293B" }}>
          {data.reviewer?.nama || data.user?.nama || "Reviewer"}
        </Typography>
        <Typography sx={{ fontSize: 12, color: COLORS.slate }}>
          Submit: {formatDate(data.submitted_at)}
        </Typography>
      </Box>
      <TableContainer sx={{ borderRadius: "10px", border: `1.5px solid ${COLORS.slateLight}` }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={tableHeadCell}>Kriteria</TableCell>
              <TableCell sx={{ ...tableHeadCell, textAlign: "center", width: 80 }}>Bobot</TableCell>
              <TableCell sx={{ ...tableHeadCell, textAlign: "center", width: 80 }}>Skor</TableCell>
              <TableCell sx={{ ...tableHeadCell, textAlign: "right", width: 120 }}>Nilai</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data.detail || []).map((d) => (
              <TableRow key={d.id_kriteria} sx={tableBodyRow} hover>
                <TableCell>
                  <Typography sx={{ fontSize: 13, color: "#1E293B" }}>{d.nama_kriteria}</Typography>
                  {d.catatan && (
                    <Typography sx={{ fontSize: 11, color: COLORS.slate, fontStyle: "italic", mt: 0.25 }}>
                      Catatan: {d.catatan}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ textAlign: "center" }}><Typography sx={{ fontSize: 13 }}>{d.bobot}</Typography></TableCell>
                <TableCell sx={{ textAlign: "center" }}><Typography sx={{ fontSize: 13 }}>{d.skor}</Typography></TableCell>
                <TableCell sx={{ textAlign: "right" }}><Typography sx={{ fontSize: 13, fontWeight: 700 }}>{d.nilai}</Typography></TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ backgroundColor: COLORS.primaryLight }}>
              <TableCell colSpan={3} sx={{ fontWeight: 700, textAlign: "right", fontSize: 13, color: COLORS.primaryDark }}>TOTAL</TableCell>
              <TableCell sx={{ fontWeight: 800, textAlign: "right", color: COLORS.primary, fontSize: 15 }}>{data.total_nilai}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function EmptyInfo({ text }) {
  return (
    <Box sx={{
      px: 2.5, py: 2, mb: 2, minHeight: 56,
      display: "flex", alignItems: "center",
      backgroundColor: COLORS.primaryLight,
      borderRadius: "12px",
      border: `1.5px solid ${COLORS.primaryMuted}`,
    }}>
      <Typography sx={{ fontSize: 13, color: COLORS.primaryDark, fontWeight: 600, lineHeight: 1.5 }}>
        {text}
      </Typography>
    </Box>
  );
}

export default function RekapTahap1Tab({ id_program }) {
  const [loading, setLoading]           = useState(true);
  const [proposalList, setProposalList] = useState([]);
  const [selected, setSelected]         = useState([]);
  const [submitting, setSubmitting]     = useState(false);
  const [page, setPage]                 = useState(1);
  const [kategoriFilter, setKategoriFilter] = useState("");
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [detailMap, setDetailMap]       = useState({});
  const [loadingKeys, setLoadingKeys]   = useState([]);

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getListProposalRekapTahap1(id_program);
      setProposalList(res.data || []);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat data proposal", confirmButtonColor: COLORS.primary });
    } finally {
      setLoading(false);
    }
  }, [id_program]);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  const kategoriOptions = Array.from(new Set(proposalList.map((p) => p.nama_kategori || "").filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const filteredList    = kategoriFilter === "" ? proposalList : proposalList.filter((p) => (p.nama_kategori || "") === kategoriFilter);
  const finalisableProposals = filteredList.filter((p) => p.status === 2 && p.total_submit === p.total_reviewer && p.total_reviewer > 0);
  const isAllSelected   = finalisableProposals.length > 0 && finalisableProposals.every((p) => selected.includes(p.id_proposal));
  const isIndeterminate = selected.length > 0 && !isAllSelected;
  const totalPages      = Math.ceil(filteredList.length / ROWS_PER_PAGE);
  const paginated       = filteredList.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  useEffect(() => { setPage(1); setSelected([]); }, [kategoriFilter]);

  const handleSelectAll = (e) => setSelected(e.target.checked ? finalisableProposals.map((p) => p.id_proposal) : []);
  const handleSelectOne = (id) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleFinalisasi = async (isLolos) => {
    if (selected.length === 0) return;
    const label = isLolos ? "Lolos Desk" : "Tidak Lolos Desk";
    const result = await Swal.fire({
      title: "Konfirmasi Finalisasi",
      html: `<b>${selected.length} proposal</b> akan difinalisasi sebagai <b>${label}</b>.<br/><br/>Tindakan ini tidak dapat dibatalkan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: isLolos ? COLORS.primary : COLORS.error,
      cancelButtonColor: COLORS.slate,
      confirmButtonText: "Ya, Finalisasi",
      cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    try {
      setSubmitting(true);
      await finalisasiDeskBatch(id_program, isLolos ? { lolos: selected, tidak_lolos: [] } : { lolos: [], tidak_lolos: selected });
      await Swal.fire({ icon: "success", title: "Berhasil", text: "Finalisasi berhasil", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      setSelected([]);
      fetchProposals();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal melakukan finalisasi", confirmButtonColor: COLORS.primary });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpand = async (proposal) => {
    const key = getKey(proposal.id_proposal);
    setExpandedKeys((prev) => prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]);
    if (detailMap[key]) return;
    try {
      setLoadingKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
      const res = await getRekapDesk(id_program, proposal.id_proposal);
      setDetailMap((prev) => ({ ...prev, [key]: res.data || null }));
    } catch {
      setDetailMap((prev) => ({ ...prev, [key]: null }));
    } finally {
      setLoadingKeys((prev) => prev.filter((x) => x !== key));
    }
  };

  const renderExpanded = (proposal) => {
    const key    = getKey(proposal.id_proposal);
    const detail = detailMap[key];
    if (loadingKeys.includes(key)) return (
      <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={24} sx={{ color: COLORS.primary }} />
      </Box>
    );
    if (!detail) return <EmptyInfo text="Belum ada detail rekap untuk proposal ini" />;
    return (
      <Box sx={{ mt: 2 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2, color: "#1E293B" }}>Penilaian Reviewer</Typography>
        {detail.reviewer?.length > 0
          ? detail.reviewer.map((r) => <ReviewerCard key={r.reviewer?.id_user || r.user?.id_user} data={r} />)
          : <EmptyInfo text="Belum ada penilaian reviewer yang disubmit" />
        }
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "stretch", sm: "center" },
        mb: 3, gap: 2, flexWrap: "wrap",
      }}>
        <TextField
          select size="small"
          value={kategoriFilter}
          onChange={(e) => setKategoriFilter(e.target.value)}
          SelectProps={{
            displayEmpty: true,
            renderValue: (v) => (
              <span style={{ fontSize: 14, color: !v ? "#9CA3AF" : "inherit" }}>
                {!v ? "Semua Kategori" : v}
              </span>
            ),
          }}
          sx={{ ...roundedField, width: { xs: "100%", sm: "auto" }, minWidth: { sm: 220 } }}
        >
          <MenuItem value="" sx={{ fontSize: 13 }}>Semua Kategori</MenuItem>
          {kategoriOptions.map((k) => <MenuItem key={k} value={k} sx={{ fontSize: 13 }}>{k}</MenuItem>)}
        </TextField>

        <Typography sx={{ fontSize: 14, color: COLORS.slate, fontWeight: 500, textAlign: { xs: "left", sm: "center" } }}>
          {selected.length > 0 ? <b>{selected.length} proposal terpilih</b> : `Total ${filteredList.length} proposal`}
        </Typography>

        <Box sx={{
          display: "flex", gap: 1.5,
          width: { xs: "100%", sm: "auto" },
          flexDirection: { xs: "column", sm: "row" },
        }}>
          <Button
            variant="contained"
            onClick={() => handleFinalisasi(false)}
            disabled={selected.length === 0 || submitting}
            sx={{
              textTransform: "none", borderRadius: "12px", px: 3, fontWeight: 700,
              backgroundColor: COLORS.error,
              boxShadow: "0 4px 12px rgba(220,38,38,0.2)",
              width: { xs: "100%", sm: "auto" },
              "&:hover": { backgroundColor: "#B91C1C", boxShadow: "0 6px 16px rgba(220,38,38,0.3)" },
            }}
          >
            Finalisasi Tidak Lolos
          </Button>
          <Button
            variant="contained"
            onClick={() => handleFinalisasi(true)}
            disabled={selected.length === 0 || submitting}
            sx={{
              textTransform: "none", borderRadius: "12px", px: 3, fontWeight: 700,
              backgroundColor: COLORS.primary,
              boxShadow: "0 4px 12px rgba(13,89,242,0.2)",
              width: { xs: "100%", sm: "auto" },
              "&:hover": { backgroundColor: COLORS.primaryDark, boxShadow: "0 6px 16px rgba(13,89,242,0.3)" },
            }}
          >
            Finalisasi Lolos
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ position: "relative", minHeight: 320 }}>
          <LoadingScreen message="Memuat rekap tahap 1..." overlay minHeight="320px" />
        </Box>
      ) : filteredList.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10 }}>
          <Typography sx={{ fontSize: 15, color: COLORS.slate, fontWeight: 500 }}>
            Belum ada proposal untuk tahap desk evaluasi
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{
            borderRadius: "16px",
            border: `1.5px solid ${COLORS.slateLight}`,
            overflowX: "auto",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
          }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={tableHeadCell}>
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isIndeterminate}
                      onChange={handleSelectAll}
                      sx={{ color: COLORS.primaryMuted, "&.Mui-checked": { color: COLORS.primary } }}
                    />
                  </TableCell>
                  {["Judul Proposal", "Tim", "Kategori", "Penilaian Submit", "Status", ""].map((h, i) => (
                    <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 5 && { textAlign: "right", width: 110 }) }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((p) => {
                  const statusInfo    = getStatusInfo(p.status, p.total_reviewer, p.total_submit);
                  const isFinalisable = p.status === 2 && p.total_submit === p.total_reviewer && p.total_reviewer > 0;
                  const isSelected    = selected.includes(p.id_proposal);
                  const key           = getKey(p.id_proposal);
                  const isExpanded    = expandedKeys.includes(key);
                  return (
                    <Fragment key={key}>
                      <TableRow
                        sx={{ ...tableBodyRow, cursor: "pointer" }}
                        hover
                        selected={isSelected}
                        onClick={() => toggleExpand(p)}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isSelected}
                            disabled={!isFinalisable}
                            onChange={(e) => { e.stopPropagation(); handleSelectOne(p.id_proposal); }}
                            sx={{ color: COLORS.primaryMuted, "&.Mui-checked": { color: COLORS.primary } }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, fontSize: 13, color: "#1E293B", maxWidth: 280, wordBreak: "break-word", whiteSpace: "normal" }}>
                            {p.judul}
                          </Typography>
                        </TableCell>
                        <TableCell><Typography sx={{ fontSize: 13, color: "#475569" }}>{p.nama_tim}</Typography></TableCell>
                        <TableCell><Typography sx={{ fontSize: 13, color: "#475569" }}>{p.nama_kategori || "-"}</Typography></TableCell>
                        <TableCell>
                          <Chip
                            label={`${p.total_submit} / ${p.total_reviewer}`}
                            size="small"
                            color={p.total_submit === p.total_reviewer ? "success" : "default"}
                            sx={{ borderRadius: "8px", fontWeight: 700, px: 1 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusInfo.text}
                            color={statusInfo.color}
                            size="small"
                            sx={{ borderRadius: "8px", fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: "right" }}>
                          <Button
                            size="small"
                            variant="text"
                            endIcon={isExpanded ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
                            onClick={(e) => { e.stopPropagation(); toggleExpand(p); }}
                            sx={{ textTransform: "none", fontWeight: 700, color: COLORS.primary, fontSize: 12 }}
                          >
                            Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell
                          sx={{ py: 0, borderBottom: isExpanded ? `1px solid ${COLORS.slateLight}` : 0 }}
                          colSpan={7}
                        >
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ px: { xs: 1.5, sm: 3 }, pt: 2, pb: 2 }}>
                              {renderExpanded(p)}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </Fragment>
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
            mt: 3, gap: 2,
          }}>
            <Typography sx={{ fontSize: 14, color: COLORS.slate, fontWeight: 500 }}>
              Menampilkan{" "}
              <b>{Math.min((page - 1) * ROWS_PER_PAGE + 1, filteredList.length)}–{Math.min(page * ROWS_PER_PAGE, filteredList.length)}</b>
              {" "}dari <b>{filteredList.length}</b> data
            </Typography>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
              sx={{
                "& .MuiPaginationItem-root": {
                  fontWeight: 600, borderRadius: "8px",
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
    </Box>
  );
}