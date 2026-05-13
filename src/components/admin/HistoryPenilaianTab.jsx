import { useState, useEffect, useCallback, Fragment } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Button, Collapse, Paper,
  Pagination, TextField, MenuItem, Chip,
} from "@mui/material";
import { KeyboardArrowRight, KeyboardArrowDown, Download } from "@mui/icons-material";
import Swal from "sweetalert2";
import { getXLSX } from "../../utils/xlsxLazy";
import LoadingScreen from "../common/LoadingScreen";
import {
  getMyProgram,
  getHistoryPenilaianTahap1,
  getHistoryPenilaianTahap2,
  getHistoryDetailTahap1,
  getHistoryDetailTahap2,
} from "../../api/admin";

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
  "& td": { borderBottom: `1px solid #F1F5F9`, py: 2 },
  "&:hover": { backgroundColor: "#F8FAFC" },
};

const STATUS_MAP = {
  2: { label: "Review Tahap 1",        colorType: "info"    },
  3: { label: "Tidak Lolos Desk",      colorType: "error"   },
  4: { label: "Lolos Desk",            colorType: "success" },
  5: { label: "Wawancara",       colorType: "warning" },
  6: { label: "Tidak Lolos Wawancara", colorType: "error"   },
  7: { label: "Lolos Wawancara",       colorType: "success" },
  8: { label: "Lolos (Selesai)",       colorType: "success" },
};

const COLOR_TYPE_MAP = {
  warning: { bg: COLORS.warningLight,  text: COLORS.warning  },
  success: { bg: COLORS.successLight,  text: COLORS.success  },
  error:   { bg: COLORS.errorLight,    text: COLORS.error    },
  primary: { bg: COLORS.primaryLight,  text: COLORS.primary  },
  info:    { bg: "#E0F2FE",            text: "#0284C7"       },
  slate:   { bg: COLORS.slateLight,    text: COLORS.slate    },
};

const StatusPill = ({ status }) => {
  const cfg    = STATUS_MAP[status] || { label: `Status ${status}`, colorType: "slate" };
  const colors = COLOR_TYPE_MAP[cfg.colorType] || COLOR_TYPE_MAP.slate;
  return (
    <Box sx={{
      display: "inline-flex", alignItems: "center",
      px: 1.2, py: 0.4, borderRadius: "6px",
      backgroundColor: colors.bg, color: colors.text,
      fontSize: 10, fontWeight: 800,
      whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.02em",
    }}>
      {cfg.label}
    </Box>
  );
};

const formatDate = (d) => (!d ? "-" : new Date(d).toLocaleDateString("id-ID", {
  day: "2-digit", month: "short", year: "numeric",
}));

const getFinalisasiDateValue = (item) =>
  item?.tanggal_finalisasi || item?.tanggal_finalisasi_tahap2 ||
  item?.tanggal_finalisasi_wawancara || item?.finalized_at ||
  item?.wawancara_finalized_at || item?.desk_finalized_at ||
  item?.updated_at || item?.created_at || null;

const getProgramTitleForExport = (program) => {
  const nama = program?.nama_program || "";
  const ket  = program?.keterangan || "";
  return `${nama} ${ket}`.toUpperCase() || "DAFTAR PROGRAM";
};

const getProgramNameForFilename = (program) => {
  const text = `${program?.nama_program || ""} ${program?.keterangan || ""}`.toLowerCase();
  if (text.includes("pmw")) return "PMW";
  if (text.includes("inbis")) return "INBIS";
  return "Program";
};

const getProposalKey = (tahap, proposalId) => `${tahap}-${proposalId}`;
const getTahap1Nilai = (item) => item.rata_rata_nilai ?? item.total_nilai ?? item.nilai ?? "-";
const getTahap2Nilai = (item) => item.nilai_rata_rata ?? item.total_nilai ?? "-";

const getPenilaiLabel = (tahap, historyDetail) => {
  if (!historyDetail) return "-";
  if (tahap === 1) {
    const names = [...new Set((historyDetail.reviewer || []).map((r) => r?.reviewer?.nama || r?.user?.nama || "").filter(Boolean))];
    return names.length > 0 ? names.join(", ") : "-";
  }
  const rNames = (historyDetail.reviewer_panel || []).map((r) => r?.user?.nama || "").filter(Boolean);
  const jNames = (historyDetail.juri_panel || []).map((j) => j?.user?.nama || "").filter(Boolean);
  const names  = [...new Set([...rNames, ...jNames])];
  return names.length > 0 ? names.join(", ") : "-";
};

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
          <Box key={e.reviewer?.id_user || e.user?.id_user || e.id_user}>
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

function StageSection({ 
  tahap, list, id_program, programInfo, onExport 
}) {
  const [kategoriFilter, setKategoriFilter] = useState("");
  const [tahunFilter, setTahunFilter]         = useState("");
  const [expandedKeys, setExpandedKeys]     = useState([]);
  const [detailMap, setDetailMap]           = useState({});
  const [loadingKeys, setLoadingKeys]       = useState([]);

  const isExpanded = (id) => expandedKeys.includes(getProposalKey(tahap, id));
  
  const uniqueKategori = Array.from(new Set(list.map((i) => i.nama_kategori).filter(Boolean))).sort();
  const uniqueTahun = Array.from(new Set(list.map((i) => getFinalisasiDateValue(i)).filter(Boolean).map((v) => String(new Date(v).getFullYear())))).sort((a, b) => b - a);

  const filtered = list.filter(i => {
    if (kategoriFilter && i.nama_kategori !== kategoriFilter) return false;
    if (tahunFilter && String(new Date(getFinalisasiDateValue(i)).getFullYear()) !== tahunFilter) return false;
    return true;
  });

  const proposalsByCategory = filtered.reduce((acc, p) => {
    const cat = p.nama_kategori || "Tanpa Kategori";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  Object.keys(proposalsByCategory).forEach(cat => {
    proposalsByCategory[cat].sort((a, b) => {
      const valA = tahap === 1 ? (a.rata_rata_nilai || 0) : (a.nilai_akhir || 0);
      const valB = tahap === 1 ? (b.rata_rata_nilai || 0) : (b.nilai_akhir || 0);
      return valB - valA;
    });
  });

  const toggleExpand = async (proposal) => {
    const key = getProposalKey(tahap, proposal.id_proposal);
    if (expandedKeys.includes(key)) {
      setExpandedKeys(prev => prev.filter(k => k !== key));
      return;
    }
    setExpandedKeys(prev => [...prev, key]);
    if (detailMap[key]) return;
    try {
      setLoadingKeys((prev) => [...prev, key]);
      const res = tahap === 1 ? await getHistoryDetailTahap1(id_program, proposal.id_proposal) : await getHistoryDetailTahap2(id_program, proposal.id_proposal);
      setDetailMap((prev) => ({ ...prev, [key]: res.data || null }));
    } catch {
      setDetailMap((prev) => ({ ...prev, [key]: null }));
    } finally {
      setLoadingKeys((prev) => prev.filter((x) => x !== key));
    }
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
          <TextField
            select size="small"
            value={tahunFilter}
            onChange={(e) => setTahunFilter(e.target.value)}
            SelectProps={{
              displayEmpty: true,
              renderValue: (v) => <span style={{ fontSize: 14, color: !v ? "#9CA3AF" : "inherit" }}>{!v ? "Semua Tahun" : v}</span>,
            }}
            sx={{ ...roundedField, minWidth: 150 }}
          >
            <MenuItem value=""><em>Semua Tahun</em></MenuItem>
            {uniqueTahun.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <Button
            variant="contained"
            onClick={() => onExport(tahap, filtered)}
            startIcon={<Download />}
            sx={{
              textTransform: "none", borderRadius: "10px", fontWeight: 700,
              backgroundColor: COLORS.success, px: 3,
              "&:hover": { backgroundColor: "#047857" }
            }}
          >
            Ekspor Excel
          </Button>
        </Box>
        <Typography sx={{ fontSize: 13, color: COLORS.slate, fontWeight: 600 }}>
          Total: {filtered.length} proposal
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {Object.entries(proposalsByCategory).map(([category, items]) => (
          <Box key={category}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, px: 1 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#1E293B", letterSpacing: "-0.01em" }}>{category}</Typography>
              <Chip 
                label={`${items.length} Proposal`} 
                size="small" 
                sx={{ fontWeight: 700, fontSize: 11, backgroundColor: "#E2E8F0", color: "#475569", borderRadius: "6px" }} 
              />
            </Box>

            <TableContainer sx={{ borderRadius: "16px", border: "1px solid #E2E8F0", overflowX: "auto", backgroundColor: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
              <Table sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    <TableCell align="center" sx={{ ...tableHeadCell, width: 60, pl: 2 }}>Rank</TableCell>
                    <TableCell sx={tableHeadCell}>Judul Proposal</TableCell>
                    <TableCell sx={tableHeadCell}>Tim</TableCell>
                    {tahap === 1 ? (
                      <TableCell align="center" sx={tableHeadCell}>Total Nilai</TableCell>
                    ) : (
                      <>
                        <TableCell align="center" sx={tableHeadCell}>Rev</TableCell>
                        <TableCell align="center" sx={tableHeadCell}>Juri</TableCell>
                        <TableCell align="center" sx={tableHeadCell}>Rata-rata</TableCell>
                      </>
                    )}
                    <TableCell align="center" sx={tableHeadCell}>Tgl Finalisasi</TableCell>
                    <TableCell align="center" sx={tableHeadCell}>Status</TableCell>
                    <TableCell sx={{ ...tableHeadCell, textAlign: "right", pr: 2 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((p, idx) => {
                    const key      = getProposalKey(tahap, p.id_proposal);
                    const expanded = isExpanded(p.id_proposal);
                    const loading  = loadingKeys.includes(key);
                    return (
                      <Fragment key={key}>
                        <TableRow sx={{ ...tableBodyRow, cursor: "pointer", backgroundColor: idx % 2 === 1 ? "#FAFCFF" : "inherit" }} hover onClick={() => toggleExpand(p)}>
                          <TableCell align="center" sx={{ pl: 2 }}>
                            <Box sx={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: idx < 3 ? COLORS.primaryLight : "#F1F5F9", color: idx < 3 ? COLORS.primary : COLORS.slate, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 10, mx: "auto" }}>
                              {idx + 1}
                            </Box>
                          </TableCell>
                          <TableCell><Typography sx={{ fontWeight: 700, fontSize: 13, color: "#1E293B", maxWidth: 300, lineHeight: 1.4 }}>{p.judul}</Typography></TableCell>
                          <TableCell><Typography sx={{ fontSize: 12, color: COLORS.slate }}>{p.nama_tim}</Typography></TableCell>
                          {tahap === 1 ? (
                            <TableCell align="center">
                              <Box sx={{ display: "inline-flex", px: 1.5, py: 0.5, borderRadius: "8px", backgroundColor: COLORS.primaryLight, fontWeight: 800, fontSize: 13, color: COLORS.primaryDark }}>{getTahap1Nilai(p)}</Box>
                            </TableCell>
                          ) : (
                            <>
                              <TableCell align="center"><Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORS.primaryDark }}>{p.rata_rata_reviewer ?? "-"}</Typography></TableCell>
                              <TableCell align="center"><Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORS.success }}>{p.rata_rata_juri ?? "-"}</Typography></TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: "inline-flex", px: 1.5, py: 0.5, borderRadius: "8px", backgroundColor: COLORS.primaryLight, fontWeight: 800, fontSize: 14, color: COLORS.primaryDark }}>
                                  {p.nilai_rata_rata ? p.nilai_rata_rata.toFixed(1) : "-"}
                                </Box>
                              </TableCell>
                            </>
                          )}
                          <TableCell align="center"><Typography sx={{ fontSize: 12, color: COLORS.slate }}>{formatDate(getFinalisasiDateValue(p))}</Typography></TableCell>
                          <TableCell align="center"><StatusPill status={p.status_proposal} /></TableCell>
                          <TableCell sx={{ textAlign: "right", pr: 2 }}>
                            <Button size="small" variant="text" endIcon={expanded ? <KeyboardArrowDown /> : <KeyboardArrowRight />} onClick={(e) => { e.stopPropagation(); toggleExpand(p); }} sx={{ textTransform: "none", fontWeight: 700, color: COLORS.primary, fontSize: 12 }}>Detail</Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell sx={{ p: 0, borderBottom: expanded ? "1px solid #E2E8F0" : 0 }} colSpan={tahap === 1 ? 7 : 9}>
                            <Collapse in={expanded} timeout="auto" unmountOnExit>
                              <Box sx={{ px: 3, py: 2, backgroundColor: "#F8FAFC" }}>
                                {loading ? (
                                  <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}><CircularProgress size={24} sx={{ color: COLORS.primary }} /></Box>
                                ) : detailMap[key] ? (
                                  <Box sx={{ mt: 1, p: 2, border: "1px solid #E2E8F0", borderRadius: "16px", backgroundColor: "#fff" }}>
                                    {tahap === 1 ? (
                                      <AssessmentDetailTable title="Penilaian Reviewer" evaluators={detailMap[key].reviewer} />
                                    ) : (
                                      <>
                                        <AssessmentDetailTable title="Panel Reviewer" evaluators={detailMap[key].reviewer_panel} />
                                        <AssessmentDetailTable title="Panel Juri" evaluators={detailMap[key].juri_panel} />
                                        <Box sx={{ mt: 2, p: 2, borderRadius: "12px", backgroundColor: "#F8FAFC", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 2, border: "1px solid #E2E8F0" }}>
                                          <Box><Typography sx={{ fontSize: 10, color: COLORS.slate, fontWeight: 700, textTransform: "uppercase", mb: 0.5 }}>Total Reviewer</Typography><Typography sx={{ fontSize: 20, fontWeight: 800, color: COLORS.primary }}>{detailMap[key].total_reviewer ?? 0}</Typography></Box>
                                          <Box><Typography sx={{ fontSize: 10, color: COLORS.slate, fontWeight: 700, textTransform: "uppercase", mb: 0.5 }}>Total Juri</Typography><Typography sx={{ fontSize: 20, fontWeight: 800, color: COLORS.success }}>{detailMap[key].total_juri ?? 0}</Typography></Box>
                                        </Box>
                                      </>
                                    )}
                                  </Box>
                                ) : <EmptyInfo text="Belum ada detail rekap untuk proposal ini" />}
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
    </Box>
  );
}

export default function HistoryPenilaianTab({ id_program }) {
  const [loading, setLoading]             = useState(true);
  const [programInfo, setProgramInfo]     = useState(null);
  const [listTahap1, setListTahap1]       = useState([]);
  const [listTahap2, setListTahap2]       = useState([]);
  const [exportingTahap, setExportingTahap] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [res1, res2] = await Promise.all([getHistoryPenilaianTahap1(id_program), getHistoryPenilaianTahap2(id_program)]);
      setListTahap1((res1.data || []).filter(p => p.status_proposal === 4));
      setListTahap2((res2.data || []).filter(p => p.status_proposal >= 7));
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat history penilaian", confirmButtonColor: COLORS.primary });
    } finally {
      setLoading(false);
    }
  }, [id_program]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { getMyProgram().then((res) => setProgramInfo(res?.data || null)); }, []);

  const handleExportXlsx = async (tahap, filtered) => {
    if (filtered.length === 0) return Swal.fire({ icon: "info", title: "Tidak ada data", text: "Tidak ada data untuk diekspor", confirmButtonColor: COLORS.primary });
    
    setExportingTahap(tahap);
    try {
      const XLSX = await getXLSX();
      const allProposals = filtered;
      const historyResults = await Promise.allSettled(allProposals.map(p => tahap === 1 ? getHistoryDetailTahap1(id_program, p.id_proposal) : getHistoryDetailTahap2(id_program, p.id_proposal)));
      
      const aoa = [[getProgramTitleForExport(programInfo)], [], ["NO", "JUDUL PROPOSAL", "TIM", "KATEGORI", "PENILAI", "NILAI", "TANGGAL FINALISASI", "STATUS"]];
      allProposals.forEach((p, idx) => {
        const hist = historyResults[idx].status === "fulfilled" ? historyResults[idx].value.data : null;
        aoa.push([idx + 1, p.judul, p.nama_tim, p.nama_kategori, getPenilaiLabel(tahap, hist), tahap === 1 ? getTahap1Nilai(p) : getTahap2Nilai(p), formatDate(getFinalisasiDateValue(p)), STATUS_MAP[p.status_proposal]?.label || "-"]);
      });

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "History Penilaian");
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `History_Penilaian_Tahap${tahap}_${getProgramNameForFilename(programInfo)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal mengekspor data", confirmButtonColor: COLORS.primary });
    } finally {
      setExportingTahap(null);
    }
  };

  if (loading) return <Box sx={{ position: "relative", minHeight: 400 }}><LoadingScreen message="Memuat history..." overlay /></Box>;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, pb: 2, borderBottom: `1.5px solid ${COLORS.slateLight}` }}>
          <Typography sx={{ fontSize: { xs: 16, sm: 18 }, fontWeight: 800, color: "#1E293B" }}>History Tahap 1 — Desk Evaluasi</Typography>
        </Box>
        <StageSection 
          tahap={1} 
          list={listTahap1} 
          id_program={id_program} 
          programInfo={programInfo}
          onExport={handleExportXlsx}
        />
      </Box>

      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, pb: 2, borderBottom: `1.5px solid ${COLORS.slateLight}` }}>
          <Typography sx={{ fontSize: { xs: 16, sm: 18 }, fontWeight: 800, color: "#1E293B" }}>History Tahap 2 — Wawancara</Typography>
        </Box>
        <StageSection 
          tahap={2} 
          list={listTahap2} 
          id_program={id_program} 
          programInfo={programInfo}
          onExport={handleExportXlsx}
        />
      </Box>
    </Box>
  );
}