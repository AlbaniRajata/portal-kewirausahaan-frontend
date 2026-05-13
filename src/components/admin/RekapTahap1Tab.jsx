import { useState, useEffect, useCallback, Fragment } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, Button, Chip, CircularProgress, Pagination, TextField, MenuItem,
  Collapse, Paper,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowRight } from "@mui/icons-material";
import Swal from "sweetalert2";
import { getListProposalRekapTahap1, finalisasiDeskBatch, getRekapDesk, getMyProgram } from "../../api/admin";
import LoadingScreen from "../common/LoadingScreen";
import { getXLSX } from "../../utils/xlsxLazy";

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
  fontWeight: 800,
  fontSize: 11,
  color: "#475569",
  backgroundColor: "#F8FAFC",
  py: 2,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderBottom: `2px solid ${COLORS.primaryMuted}`,
};

const tableBodyRow = {
  "& td": { borderBottom: `1px solid ${COLORS.slateLight}`, py: 2 },
  "&:hover": { backgroundColor: "#F8FAFC" },
};

const ROWS_PER_PAGE = 10;
const MIN_SUBMIT_TAHAP1 = 2;

const STATUS_MAP = {
  2: { label: "Sedang Dinilai",      colorType: "info"    },
  3: { label: "Tidak Lolos Desk",      colorType: "error"   },
  4: { label: "Lolos Desk",            colorType: "success" },
};

const COLOR_TYPE_MAP = {
  warning: { bg: COLORS.warningLight,  text: COLORS.warning  },
  success: { bg: COLORS.successLight,  text: COLORS.success  },
  error:   { bg: COLORS.errorLight,    text: COLORS.error    },
  primary: { bg: COLORS.primaryLight,  text: COLORS.primary  },
  info:    { bg: "#E0F2FE",            text: "#0284C7"       },
  slate:   { bg: COLORS.slateLight,    text: COLORS.slate    },
};

const StatusPill = ({ status, totalReviewer, totalSubmit }) => {
  let label = STATUS_MAP[status]?.label || "Unknown";
  let colorType = STATUS_MAP[status]?.colorType || "slate";

  if (status === 2 && totalSubmit >= MIN_SUBMIT_TAHAP1) {
    label = "Menunggu Finalisasi";
    colorType = "warning";
  }

  const colors = COLOR_TYPE_MAP[colorType] || COLOR_TYPE_MAP.slate;
  return (
    <Box sx={{
      display: "inline-flex", alignItems: "center",
      px: 1.2, py: 0.4, borderRadius: "6px",
      backgroundColor: colors.bg, color: colors.text,
      fontSize: 10, fontWeight: 800,
      whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.02em",
    }}>
      {label}
    </Box>
  );
};

const formatDate = (d) => (!d ? "-" : new Date(d).toLocaleDateString("id-ID", {
  day: "2-digit", month: "short", year: "numeric",
}));

const getKey = (id) => `1-${id}`;

function AssessmentDetailTable({ title, evaluators }) {
  if (!evaluators || evaluators.length === 0) return <EmptyInfo text={`Belum ada penilaian ${title.toLowerCase()} yang disubmit`} />;

  return (
    <Box sx={{ mb: 4 }}>
      <Typography sx={{ fontSize: 14, fontWeight: 800, mb: 2, color: COLORS.primaryDark, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{ width: 4, height: 18, backgroundColor: COLORS.primary, borderRadius: 1 }} />
        {title.toUpperCase()}
      </Typography>
      
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {evaluators.map((e) => (
          <Box key={e.reviewer?.id_user || e.user?.id_user}>
            <Box sx={{ 
              display: "flex", justifyContent: "space-between", alignItems: "flex-end", 
              mb: 1.5, px: 1, borderLeft: `3px solid ${COLORS.slateLight}` 
            }}>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>
                  {e.reviewer?.nama || e.user?.nama || "Evaluator"}
                </Typography>
                <Typography sx={{ fontSize: 11, color: COLORS.slate }}>
                  Diserahkan pada {formatDate(e.submitted_at)}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography sx={{ fontSize: 10, color: COLORS.slate, fontWeight: 700, textTransform: "uppercase" }}>Total Nilai</Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 900, color: COLORS.primary, lineHeight: 1 }}>{e.total_nilai}</Typography>
              </Box>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#F8FAFC" }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: 11, color: COLORS.slate, py: 1.5 }}>KRITERIA PENILAIAN</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11, color: COLORS.slate, width: 80 }}>BOBOT</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontSize: 11, color: COLORS.slate, width: 80 }}>SKOR</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: 11, color: COLORS.slate, width: 100 }}>NILAI</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(e.detail || []).map((d) => (
                    <TableRow key={d.id_kriteria} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#334155", lineHeight: 1.4 }}>
                          {d.nama_kriteria}
                        </Typography>
                        {d.catatan && (
                          <Typography sx={{ fontSize: 11, color: COLORS.slate, fontStyle: "italic", mt: 0.5, backgroundColor: "#F1F5F9", p: 1, borderRadius: "6px" }}>
                            " {d.catatan} "
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Typography sx={{ fontSize: 12, color: "#64748B" }}>{d.bobot}%</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: "inline-flex", px: 1, py: 0.25, borderRadius: "4px", backgroundColor: "#F1F5F9", fontSize: 12, fontWeight: 700, color: "#475569" }}>
                          {d.skor}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#1E293B" }}>{d.nilai}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function EmptyInfo({ text }) {
  return (
    <Box sx={{ px: 2, py: 1.5, mb: 2, display: "flex", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
      <Typography sx={{ fontSize: 12, color: COLORS.slate, fontWeight: 500 }}>{text}</Typography>
    </Box>
  );
}

export default function RekapTahap1Tab({ id_program }) {
  const [loading, setLoading]           = useState(true);
  const [programInfo, setProgramInfo]     = useState(null);
  const [proposalList, setProposalList] = useState([]);
  const [selected, setSelected]         = useState([]);
  const [submitting, setSubmitting]     = useState(false);
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

  useEffect(() => { 
    fetchProposals(); 
    getMyProgram().then(res => setProgramInfo(res.data));
  }, [fetchProposals]);

  const handleExportAllExcel = async () => {
    try {
      Swal.fire({
        title: "Menyiapkan Data",
        text: "Sedang mengumpulkan semua hasil penilaian...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      // 1. Get all details for all proposals
      const allResults = await Promise.allSettled(
        proposalList.map(p => getRekapDesk(id_program, p.id_proposal))
      );

      // 2. Group by Reviewer
      const reviewerMap = {};
      allResults.forEach((res) => {
        if (res.status !== "fulfilled" || !res.value?.success || !res.value?.data) return;
        const d = res.value.data;
        d.reviewer.forEach(evalData => {
          const rId = evalData.reviewer?.id_user || evalData.user?.id_user;
          const rName = evalData.reviewer?.nama || evalData.user?.nama;
          if (!reviewerMap[rId]) {
            reviewerMap[rId] = { name: rName, evaluations: [] };
          }
          reviewerMap[rId].evaluations.push({
            judul: d.proposal.judul,
            details: evalData.detail,
            total: evalData.total_nilai,
            catatan: evalData.catatan || "",
          });
        });
      });

      const reviewerIds = Object.keys(reviewerMap);
      if (reviewerIds.length === 0) {
        Swal.fire({ icon: "info", title: "Info", text: "Belum ada data penilaian yang bisa diekspor. Pastikan minimal 2 reviewer sudah submit." });
        return;
      }

      const XLSX = await getXLSX();
      const wb = XLSX.utils.book_new();

      reviewerIds.forEach(rId => {
        const reviewer = reviewerMap[rId];
        const rows = [];
        const criteria = reviewer.evaluations[0].details;

        // Title & Reviewer Name
        rows.push(["NILAI EVALUASI"]);
        rows.push(["PRESENTASI PROPOSAL USAHA MAHASISWA"]);
        rows.push([]);
        rows.push([reviewer.name]);

        // Headers
        const headers = ["NO", "JUDUL"];
        criteria.forEach(c => headers.push(`${c.nama_kriteria} (${c.bobot}%)`));
        headers.push("NILAI (BOBOT X SKOR)");
        rows.push(headers);

        // Data Rows
        reviewer.evaluations.forEach((ev, idx) => {
          const row = [idx + 1, ev.judul];
          criteria.forEach(c => {
            const score = ev.details.find(d => d.id_kriteria === c.id_kriteria)?.skor || 0;
            row.push(score);
          });
          row.push(ev.total);
          rows.push(row);
        });

        rows.push([]);
        rows.push(["Catatan Reviewer:"]);
        const catatans = reviewer.evaluations.filter(e => e.catatan).map(e => `[${e.judul}]\n${e.catatan}`).join("\n\n");
        rows.push([catatans]);

        const ws = XLSX.utils.aoa_to_sheet(rows);

        // Styling
        const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: "F1F5F9" } }, border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };
        const cellStyle = { border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };

        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = 4; R <= range.e.r; ++R) {
          for (let C = 0; C <= range.e.c; ++C) {
            const cell_ref = XLSX.utils.encode_cell({ c: C, r: R });
            if (!ws[cell_ref]) continue;
            if (R === 4) ws[cell_ref].s = headerStyle;
            else if (R <= 4 + reviewer.evaluations.length) ws[cell_ref].s = cellStyle;
          }
        }

        ws['!cols'] = [{ wch: 5 }, { wch: 60 }];
        criteria.forEach(() => ws['!cols'].push({ wch: 15 }));
        ws['!cols'].push({ wch: 20 });

        // Sheet name max 31 chars
        const sheetName = reviewer.name.substring(0, 31).replace(/[\\/*?[\]]/g, "_");
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      XLSX.writeFile(wb, `Rekap_Nilai_Desk_Evaluasi.xlsx`);
      Swal.close();
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Gagal", text: err?.message || "Gagal mengekspor excel" });
    }
  };

  const handleExportReviewerExcel = (reviewerData) => {
    // Legacy support for detail table call if needed, but we use handleExportAllExcel now
  };

  const uniqueKategori = Array.from(new Set(proposalList.map((p) => p.nama_kategori).filter(Boolean))).sort();
  const filteredList = proposalList.filter((p) => {
    if (p.status !== 2) return false;
    if (kategoriFilter && p.nama_kategori !== kategoriFilter) return false;
    return true;
  });

  const proposalsByCategory = filteredList.reduce((acc, p) => {
    const cat = p.nama_kategori || "Tanpa Kategori";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  Object.keys(proposalsByCategory).forEach(cat => {
    proposalsByCategory[cat].sort((a, b) => (b.nilai_rata_rata || 0) - (a.nilai_rata_rata || 0));
  });

  useEffect(() => { setSelected([]); }, [kategoriFilter]);

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
      setLoadingKeys((prev) => [...prev, key]);
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
      <Box sx={{ mt: 1, p: 2, border: "1px solid #E2E8F0", borderRadius: "16px", backgroundColor: "#fff" }}>
        <AssessmentDetailTable 
          title="Penilaian Reviewer" 
          evaluators={detail.reviewer} 
        />
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{
        display: "flex", flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" },
        mb: 4, gap: 2, flexWrap: "wrap",
      }}>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            select size="small"
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value)}
            SelectProps={{
              displayEmpty: true,
              renderValue: (v) => <span style={{ fontSize: 14, color: !v ? "#9CA3AF" : "inherit" }}>{!v ? "Semua Kategori" : v}</span>,
            }}
            sx={{ ...roundedField, minWidth: 200 }}
          >
            <MenuItem value=""><em>Semua Kategori</em></MenuItem>
            {uniqueKategori.map((k) => <MenuItem key={k} value={k}>{k}</MenuItem>)}
          </TextField>
          <Button
            variant="contained"
            color="success"
            onClick={handleExportAllExcel}
            sx={{
              textTransform: "none", borderRadius: "10px", fontWeight: 700,
              px: 3, boxShadow: "0 2px 8px rgba(5,150,105,0.2)"
            }}
          >
            Ekspor Excel
          </Button>
          <Button
            variant="contained"
            disabled={selected.length === 0 || submitting}
            onClick={() => handleFinalisasi(true)}
            sx={{
              textTransform: "none", borderRadius: "10px", fontWeight: 700,
              backgroundColor: COLORS.primary, px: 3,
              "&:hover": { backgroundColor: COLORS.primaryDark }
            }}
          >
            Loloskan ({selected.length})
          </Button>
          <Button
            variant="contained"
            disabled={selected.length === 0 || submitting}
            onClick={() => handleFinalisasi(false)}
            sx={{
              textTransform: "none", borderRadius: "10px", fontWeight: 700,
              backgroundColor: COLORS.error, px: 3,
              "&:hover": { backgroundColor: "#B91C1C" }
            }}
          >
            Tidak Lolos ({selected.length})
          </Button>
        </Box>
        <Typography sx={{ fontSize: 13, color: COLORS.slate, fontWeight: 600 }}>
          Total: {filteredList.length} proposal
        </Typography>
      </Box>

      {loading ? (
        <LoadingScreen message="Memuat rekap penilaian..." overlay minHeight="320px" />
      ) : filteredList.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10, backgroundColor: "#F8FAFC", borderRadius: "20px", border: "1px dashed #E2E8F0" }}>
          <Typography sx={{ fontSize: 15, color: COLORS.slate, fontWeight: 500 }}>
            Belum ada proposal untuk tahap desk evaluasi
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {Object.entries(proposalsByCategory).map(([category, items]) => (
            <Box key={category}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, px: 1 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#1E293B", letterSpacing: "-0.01em" }}>
                  {category}
                </Typography>
                <Chip 
                  label={`${items.length} Proposal`} 
                  size="small" 
                  sx={{ fontWeight: 700, fontSize: 11, backgroundColor: "#E2E8F0", color: "#475569", borderRadius: "6px" }} 
                />
              </Box>

              <TableContainer sx={{
                borderRadius: "16px", border: `1px solid #E2E8F0`,
                overflowX: "auto", backgroundColor: "#fff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
              }}>
                <Table sx={{ minWidth: 1000 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" sx={{ ...tableHeadCell, pl: 2 }}>
                        <Checkbox
                          size="small"
                          checked={items.length > 0 && items.filter(p => {
                            const totalSub = p.total_submit || 0;
                            return p.status === 2 && totalSub >= MIN_SUBMIT_TAHAP1;
                          }).every(p => selected.includes(p.id_proposal))}
                          indeterminate={items.some(p => selected.includes(p.id_proposal)) && !items.every(p => selected.includes(p.id_proposal))}
                          onChange={(e) => {
                            const ids = items.filter(p => {
                              const totalSub = p.total_submit || 0;
                              return p.status === 2 && totalSub >= MIN_SUBMIT_TAHAP1;
                            }).map(p => p.id_proposal);
                            if (e.target.checked) {
                              setSelected(prev => Array.from(new Set([...prev, ...ids])));
                            } else {
                              setSelected(prev => prev.filter(id => !ids.includes(id)));
                            }
                          }}
                          sx={{ color: COLORS.primaryMuted, "&.Mui-checked": { color: COLORS.primary } }}
                        />
                      </TableCell>
                      {["Rank", "Judul Proposal", "Tim", "Reviewer", "Rata-rata", "Status", ""].map((h, i) => (
                        <TableCell 
                          key={i} 
                          sx={{ 
                            ...tableHeadCell, 
                            ...(i === 0 ? { textAlign: "center", width: 60 } : {}),
                            ...(i >= 3 && i <= 5 ? { textAlign: "center" } : {}),
                            ...(i === 6 && { textAlign: "right", width: 100 }) 
                          }}
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((p, idx) => {
                      const isFinalisable = p.status === 2 && (p.total_submit || 0) >= MIN_SUBMIT_TAHAP1;
                      const isSelected    = selected.includes(p.id_proposal);
                      const key           = getKey(p.id_proposal);
                      const isExpanded    = expandedKeys.includes(key);
                      const submittedCount = Math.min(p.total_submit || 0, MIN_SUBMIT_TAHAP1);

                      return (
                        <Fragment key={key}>
                          <TableRow
                            sx={{ 
                              ...tableBodyRow, 
                              cursor: "pointer", 
                              backgroundColor: isSelected ? "#F0F7FF" : (idx % 2 === 1 ? "#FAFCFF" : "inherit"),
                              transition: "background-color 0.2s"
                            }}
                            hover
                            onClick={() => toggleExpand(p)}
                          >
                            <TableCell padding="checkbox" sx={{ pl: 2 }}>
                              <Checkbox
                                size="small"
                                checked={isSelected}
                                disabled={!isFinalisable}
                                onChange={(e) => { e.stopPropagation(); handleSelectOne(p.id_proposal); }}
                                sx={{ color: COLORS.primaryMuted, "&.Mui-checked": { color: COLORS.primary } }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ 
                                width: 24, height: 24, borderRadius: "50%", 
                                backgroundColor: idx < 3 ? COLORS.primaryLight : "#F1F5F9",
                                color: idx < 3 ? COLORS.primary : COLORS.slate,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontWeight: 800, fontSize: 10, mx: "auto"
                              }}>
                                {idx + 1}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontWeight: 700, fontSize: 13, color: "#1E293B", maxWidth: 350, lineHeight: 1.4 }}>
                                {p.judul}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 12, color: COLORS.slate }}>{p.nama_tim}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={`${submittedCount} / ${MIN_SUBMIT_TAHAP1}`}
                                size="small"
                                color={(p.total_submit || 0) >= MIN_SUBMIT_TAHAP1 ? "success" : "default"}
                                sx={{ borderRadius: "6px", fontWeight: 800, fontSize: 11 }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ 
                                display: "inline-flex", px: 1.5, py: 0.5, borderRadius: "8px", 
                                backgroundColor: COLORS.primaryLight, fontWeight: 800, fontSize: 14, color: COLORS.primaryDark
                              }}>
                                {p.nilai_rata_rata ? p.nilai_rata_rata.toFixed(1) : "-"}
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <StatusPill status={p.status} totalReviewer={p.total_reviewer} totalSubmit={p.total_submit} />
                            </TableCell>
                            <TableCell sx={{ textAlign: "right", pr: 2 }}>
                              <Button
                                size="small" variant="text"
                                endIcon={isExpanded ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
                                onClick={(e) => { e.stopPropagation(); toggleExpand(p); }}
                                sx={{ textTransform: "none", fontWeight: 700, color: COLORS.primary, fontSize: 12 }}
                              >
                                Detail
                              </Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ p: 0, borderBottom: isExpanded ? `1px solid #E2E8F0` : 0 }} colSpan={8}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box sx={{ px: 3, py: 2, backgroundColor: "#F8FAFC" }}>
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
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}