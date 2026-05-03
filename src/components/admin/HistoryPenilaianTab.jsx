import { useState, useEffect, useCallback, Fragment } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Button, Collapse, Paper,
  Pagination, TextField, MenuItem,
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
  getProposalDetailAdmin,
  getPesertaDetail,
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

const STATUS_MAP = {
  2: { label: "Review Tahap 1",        colorType: "info"    },
  3: { label: "Tidak Lolos Desk",      colorType: "error"   },
  4: { label: "Lolos Desk",            colorType: "success" },
  5: { label: "Panel Wawancara",       colorType: "warning" },
  6: { label: "Tidak Lolos Wawancara", colorType: "error"   },
  7: { label: "Lolos Wawancara",       colorType: "success" },
  8: { label: "Pembimbing Diajukan",   colorType: "primary" },
  9: { label: "Pembimbing Disetujui",  colorType: "primary" },
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
      px: 1.5, py: 0.5, borderRadius: "8px",
      backgroundColor: colors.bg, color: colors.text,
      fontSize: 11, fontWeight: 800,
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
  item?.finalisasi?.tanggal_finalisasi || item?.finalisasi_tahap2?.tanggal_finalisasi ||
  item?.updated_at || item?.created_at || null;

const getProgramDisplayName = (program) => {
  const nama = program?.nama_program?.trim();
  const ket  = program?.keterangan?.trim();
  if (nama && ket && nama.toLowerCase() !== ket.toLowerCase()) return `${nama} - ${ket}`;
  return nama || ket || "PENDAFTAR PMW";
};

const getProgramTitleForExport = (program) => {
  const text = `${program?.nama_program || ""} ${program?.keterangan || ""}`.toLowerCase();
  if (text.includes("pmw") || text.includes("program mahasiswa wirausaha")) return "DAFTAR PROGRAM MAHASISWA WIRAUSAHA";
  if (text.includes("inbis") || text.includes("inkubator bisnis"))           return "DAFTAR INKUBATOR BISNIS";
  return getProgramDisplayName(program).toUpperCase();
};

const getProgramNameForFilename = (program) => {
  const text = `${program?.nama_program || ""} ${program?.keterangan || ""}`.toLowerCase();
  if (text.includes("pmw") || text.includes("program mahasiswa wirausaha")) return "PMW";
  if (text.includes("inbis") || text.includes("inkubator bisnis"))           return "INBIS";
  return program?.keterangan?.substring(0, 10).toUpperCase() || "Program";
};

const getProposalKey = (tahap, proposalId) => `${tahap}-${proposalId}`;

const getTahap1Nilai = (item) =>
  item.rata_rata_nilai ?? item.total_nilai ?? item.nilai ?? item.nilai_akhir ?? item.rata_rata_reviewer ?? "-";

const getTahap2Nilai = (item) =>
  item.nilai_akhir ?? item.total_nilai ?? item.rata_rata_nilai ?? item.rata_rata_juri ?? item.rata_rata_reviewer ?? "-";

const getPenilaiLabel = (tahap, historyDetail) => {
  if (!historyDetail) return "-";
  if (tahap === 1) {
    const names = [...new Set((historyDetail.reviewer || []).map((r) => r?.reviewer?.nama || r?.user?.nama_lengkap || r?.user?.nama || "").filter(Boolean))];
    return names.length > 0 ? names.join(" dan ") : "-";
  }
  const rNames = (historyDetail.reviewer_panel || []).map((r) => r?.reviewer?.nama || r?.user?.nama_lengkap || r?.user?.nama || "").filter(Boolean);
  const jNames = (historyDetail.juri_panel || []).map((j) => j?.juri?.nama || j?.user?.nama_lengkap || j?.user?.nama || "").filter(Boolean);
  const names  = [...new Set([...rNames, ...jNames])];
  return names.length > 0 ? names.join(" dan ") : "-";
};

const getDosenPembimbingName = (item) =>
  item?.nama_dosen || item?.nama_pembimbing || item?.dosen_pembimbing ||
  item?.pembimbing?.nama_dosen || item?.pembimbing?.nama_lengkap ||
  item?.pengajuan_pembimbing?.nama_dosen || "-";

const getAnggotaPeranLabel = (a) => (a?.peran === 1 || String(a?.peran).toLowerCase() === "ketua") ? "Ketua" : "Anggota";
const getAnggotaKey = (a) => String(a?.id_user || a?.id || a?.nim || a?.username || "");
const getAnggotaProdi = (a, p) => { const j = a?.jenjang ? `${a.jenjang} ` : ""; const jp = p?.jenjang ? `${p.jenjang} ` : ""; return a?.prodi || `${j}${a?.nama_prodi || ""}`.trim() || `${jp}${p?.nama_prodi || ""}`.trim() || "-"; };
const getAnggotaJurusan = (a, p) => a?.nama_jurusan || a?.jurusan || a?.mahasiswa?.nama_jurusan || p?.nama_jurusan || "-";
const getAnggotaNoHp = (a, p) => a?.no_hp || a?.nomor_hp || a?.hp || a?.mahasiswa?.no_hp || p?.no_hp || "-";

const getAnggotaRowsForExport = (proposal, detail, pesertaDetailMap = new Map()) => {
  const anggotaRaw = detail?.anggota_tim || detail?.anggota || proposal?.anggota_tim || [];
  if (Array.isArray(anggotaRaw) && anggotaRaw.length > 0) {
    return [...anggotaRaw]
      .sort((a, b) => {
        const pA = getAnggotaPeranLabel(a) === "Ketua" ? 0 : 1;
        const pB = getAnggotaPeranLabel(b) === "Ketua" ? 0 : 1;
        if (pA !== pB) return pA - pB;
        return (a?.nama_lengkap || "").localeCompare(b?.nama_lengkap || "", "id-ID");
      })
      .map((anggota) => {
        const key = getAnggotaKey(anggota);
        const pd  = key ? pesertaDetailMap.get(key) : null;
        return {
          keterangan: getAnggotaPeranLabel(anggota),
          nama:       anggota?.nama_lengkap || anggota?.nama || anggota?.username || "-",
          nim:        anggota?.nim          || "-",
          prodi:      getAnggotaProdi(anggota, pd),
          jurusan:    getAnggotaJurusan(anggota, pd),
          noHp:       getAnggotaNoHp(anggota, pd),
        };
      });
  }
  return [{
    keterangan: "Ketua",
    nama:    proposal?.ketua?.nama_lengkap  || proposal?.nama_ketua  || "-",
    nim:     proposal?.ketua?.nim           || proposal?.nim_ketua   || "-",
    prodi:   getAnggotaProdi(proposal?.ketua, null),
    jurusan: getAnggotaJurusan(proposal?.ketua, null),
    noHp:    getAnggotaNoHp(proposal?.ketua, null),
  }];
};

const centerWorksheetColumns = (XLSX, worksheet, columns = [], startRow = 0, endRow = 0) => {
  for (let row = startRow; row <= endRow; row += 1) {
    columns.forEach((col) => {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
      if (!cell) return;
      cell.s = { ...(cell.s || {}), alignment: { ...(cell.s?.alignment || {}), horizontal: "center", vertical: "center" } };
    });
  }
};

const wrapWorksheetColumns = (XLSX, worksheet, columns = [], startRow = 0, endRow = 0) => {
  for (let row = startRow; row <= endRow; row += 1) {
    columns.forEach((col) => {
      const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
      if (!cell) return;
      cell.s = { ...(cell.s || {}), alignment: { ...(cell.s?.alignment || {}), vertical: "center", wrapText: true } };
    });
  }
};

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

function StageSection({
  tahap, list, kategoriFilter, tahunFilter,
  expandedKeys, setExpandedKeys, detailMap, setDetailMap,
  loadingKeys, setLoadingKeys, page, setPage, id_program,
}) {
  const filteredByKategori = kategoriFilter === ""
    ? list
    : list.filter((item) => (item.nama_kategori || "") === kategoriFilter);

  const filteredList = tahunFilter === ""
    ? filteredByKategori
    : filteredByKategori.filter((item) => {
        const d = getFinalisasiDateValue(item);
        return d ? String(new Date(d).getFullYear()) === tahunFilter : false;
      });

  const totalPages = Math.ceil(filteredList.length / ROWS_PER_PAGE);
  const paginated  = filteredList.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const isExpanded = (id) => expandedKeys.includes(getProposalKey(tahap, id));

  const toggleExpand = async (proposal) => {
    const key = getProposalKey(tahap, proposal.id_proposal);
    setExpandedKeys((prev) => prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]);
    if (detailMap[key]) return;
    try {
      setLoadingKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
      const res = tahap === 1
        ? await getHistoryDetailTahap1(id_program, proposal.id_proposal)
        : await getHistoryDetailTahap2(id_program, proposal.id_proposal);
      setDetailMap((prev) => ({ ...prev, [key]: res.data || null }));
    } catch {
      setDetailMap((prev) => ({ ...prev, [key]: null }));
    } finally {
      setLoadingKeys((prev) => prev.filter((x) => x !== key));
    }
  };

  const renderExpandedContent = (proposal) => {
    const key    = getProposalKey(tahap, proposal.id_proposal);
    const detail = detailMap[key];
    if (loadingKeys.includes(key)) return (
      <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress size={24} sx={{ color: COLORS.primary }} />
      </Box>
    );
    if (!detail) return <EmptyInfo text="Belum ada detail rekap untuk proposal ini" />;
    if (tahap === 1) {
      return (
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2, color: "#1E293B" }}>Penilaian Reviewer</Typography>
          {detail.reviewer?.length > 0
            ? detail.reviewer.map((r) => <ReviewerCard key={r.reviewer?.id_user || r.user?.id_user} data={r} />)
            : <EmptyInfo text="Belum ada penilaian reviewer yang disubmit" />
          }
        </Box>
      );
    }
    return (
      <Box sx={{ mt: 2 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2, color: "#1E293B" }}>Panel Reviewer</Typography>
        {detail.reviewer_panel?.length > 0
          ? detail.reviewer_panel.map((r) => <ReviewerCard key={r.user?.id_user} data={r} />)
          : <EmptyInfo text="Belum ada penilaian reviewer yang disubmit" />
        }
        <Box sx={{ height: 16 }} />
        <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2, color: "#1E293B" }}>Panel Juri</Typography>
        {detail.juri_panel?.length > 0
          ? detail.juri_panel.map((j) => <ReviewerCard key={j.user?.id_user} data={j} />)
          : <EmptyInfo text="Belum ada penilaian juri yang disubmit" />
        }
        <Paper elevation={0} sx={{
          p: { xs: 2.5, sm: 3 }, mt: 2, borderRadius: "16px",
          border: `1.5px solid ${COLORS.slateLight}`, backgroundColor: "#FAFBFF",
        }}>
          <Typography sx={{ fontSize: 15, fontWeight: 800, mb: 2.5, color: "#1E293B" }}>Ringkasan Panel</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            {[
              { label: "Total Reviewer", value: detail.total_reviewer ?? 0, bg: COLORS.primaryLight,  color: COLORS.primary  },
              { label: "Total Juri",     value: detail.total_juri     ?? 0, bg: COLORS.successLight, color: COLORS.success },
            ].map((item) => (
              <Box key={item.label} sx={{ textAlign: "center", p: 2.5, backgroundColor: item.bg, borderRadius: "12px" }}>
                <Typography sx={{ fontSize: 12, color: COLORS.slate, fontWeight: 600, mb: 0.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {item.label}
                </Typography>
                <Typography sx={{ fontSize: 26, fontWeight: 800, color: item.color }}>{item.value}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    );
  };

  const colSpan = tahap === 1 ? 6 : 7;

  return (
    <Box>
      <TableContainer sx={{
        borderRadius: "16px",
        border: `1.5px solid ${COLORS.slateLight}`,
        overflowX: "auto",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
      }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={tableHeadCell}>Judul Proposal</TableCell>
              <TableCell sx={tableHeadCell}>Tim</TableCell>
              <TableCell sx={tableHeadCell}>Kategori</TableCell>
              {tahap === 1 ? (
                <TableCell sx={tableHeadCell}>Total Nilai</TableCell>
              ) : (
                <>
                  <TableCell sx={tableHeadCell}>Nilai Reviewer</TableCell>
                  <TableCell sx={tableHeadCell}>Nilai Juri</TableCell>
                </>
              )}
              <TableCell sx={tableHeadCell}>Tgl Finalisasi</TableCell>
              <TableCell sx={tableHeadCell}>Status</TableCell>
              <TableCell sx={{ ...tableHeadCell, textAlign: "right", width: 80 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan + 1} sx={{ textAlign: "center", py: 8 }}>
                  <Typography sx={{ fontSize: 14, color: COLORS.slate, fontWeight: 500 }}>
                    Belum ada data pada kategori ini
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((p) => {
                const key      = getProposalKey(tahap, p.id_proposal);
                const expanded = isExpanded(p.id_proposal);
                return (
                  <Fragment key={key}>
                    <TableRow sx={{ ...tableBodyRow, cursor: "pointer" }} hover onClick={() => toggleExpand(p)}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: 13, color: "#1E293B", maxWidth: 260, wordBreak: "break-word", whiteSpace: "normal" }}>
                          {p.judul}
                        </Typography>
                      </TableCell>
                      <TableCell><Typography sx={{ fontSize: 13, color: "#475569" }}>{p.nama_tim}</Typography></TableCell>
                      <TableCell><Typography sx={{ fontSize: 13, color: "#475569" }}>{p.nama_kategori || "-"}</Typography></TableCell>
                      {tahap === 1 ? (
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 800, color: COLORS.primary }}>
                            {getTahap1Nilai(p)}
                          </Typography>
                        </TableCell>
                      ) : (
                        <>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORS.primaryDark }}>
                              {p.rata_rata_reviewer ?? "-"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORS.success }}>
                              {p.rata_rata_juri ?? "-"}
                            </Typography>
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        <Typography sx={{ fontSize: 13, color: "#475569" }}>
                          {formatDate(getFinalisasiDateValue(p))}
                        </Typography>
                      </TableCell>
                      <TableCell><StatusPill status={p.status_proposal} /></TableCell>
                      <TableCell sx={{ textAlign: "right" }}>
                        <Button
                          size="small"
                          variant="text"
                          endIcon={expanded ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
                          onClick={(e) => { e.stopPropagation(); toggleExpand(p); }}
                          sx={{ textTransform: "none", fontWeight: 700, color: COLORS.primary, fontSize: 12 }}
                        >
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        sx={{ py: 0, borderBottom: expanded ? `1px solid ${COLORS.slateLight}` : 0 }}
                        colSpan={colSpan + 1}
                      >
                        <Collapse in={expanded} timeout="auto" unmountOnExit>
                          <Box sx={{ px: { xs: 1.5, sm: 3 }, pt: 2, pb: 2 }}>
                            {renderExpandedContent(p)}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{
        display: "flex", flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between", alignItems: "center",
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
    </Box>
  );
}

export default function HistoryPenilaianTab({ id_program }) {
  const [loading, setLoading]             = useState(true);
  const [programInfo, setProgramInfo]     = useState(null);
  const [listTahap1, setListTahap1]       = useState([]);
  const [listTahap2, setListTahap2]       = useState([]);
  const [exportingTahap, setExportingTahap] = useState(null);
  const [kategoriFilter, setKategoriFilter] = useState("");
  const [tahunFilter, setTahunFilter]     = useState("");
  const [pageMap, setPageMap]             = useState({ 1: 1, 2: 1 });
  const [expandedKeys, setExpandedKeys]   = useState([]);
  const [detailMap, setDetailMap]         = useState({});
  const [loadingKeys, setLoadingKeys]     = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [res1, res2] = await Promise.all([
        getHistoryPenilaianTahap1(id_program),
        getHistoryPenilaianTahap2(id_program),
      ]);
      setListTahap1(res1.data || []);
      setListTahap2(res2.data || []);
      setPageMap({ 1: 1, 2: 1 });
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat history penilaian", confirmButtonColor: COLORS.primary });
    } finally {
      setLoading(false);
    }
  }, [id_program]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { getMyProgram().then((res) => setProgramInfo(res?.data || null)).catch(() => setProgramInfo(null)); }, []);
  useEffect(() => { setPageMap({ 1: 1, 2: 1 }); }, [kategoriFilter, tahunFilter]);

  const kategoriOptions = Array.from(new Set(
    [...listTahap1, ...listTahap2].map((item) => item.nama_kategori || "").filter(Boolean)
  )).sort((a, b) => a.localeCompare(b));

  const tahunOptions = Array.from(new Set(
    [...listTahap1, ...listTahap2]
      .map((item) => getFinalisasiDateValue(item))
      .filter(Boolean)
      .map((v) => String(new Date(v).getFullYear()))
  )).sort((a, b) => Number(b) - Number(a));

  const filterHistoryList = useCallback((list) => {
    const byKategori = kategoriFilter === "" ? list : list.filter((item) => (item.nama_kategori || "") === kategoriFilter);
    return tahunFilter === "" ? byKategori : byKategori.filter((item) => {
      const d = getFinalisasiDateValue(item);
      return d ? String(new Date(d).getFullYear()) === tahunFilter : false;
    });
  }, [kategoriFilter, tahunFilter]);

  const buildExportGroups = useCallback((tahap) => {
    const source  = tahap === 1 ? listTahap1 : listTahap2;
    const grouped = new Map();
    [...filterHistoryList(source)]
      .sort((a, b) => {
        const kA = a?.nama_kategori || "Tanpa Kategori", kB = b?.nama_kategori || "Tanpa Kategori";
        if (kA !== kB) return kA.localeCompare(kB, "id-ID");
        return (a?.judul || "").localeCompare(b?.judul || "", "id-ID");
      })
      .forEach((item) => {
        const k = item?.nama_kategori || "Tanpa Kategori";
        if (!grouped.has(k)) grouped.set(k, []);
        grouped.get(k).push(item);
      });
    return Array.from(grouped.entries()).map(([kategori, items]) => ({ tahap, kategori, items }));
  }, [filterHistoryList, listTahap1, listTahap2]);

  const exportHeaders = ["NO", "NAMA USAHA", "NO", "KETERANGAN", "NAMA", "NIM", "PRODI", "JURUSAN", "NO HP", "DOSEN PEMBIMBING", "PENILAI", "NILAI"];

  const buildDetailedExportGroups = useCallback(async (tahap) => {
    const groupedData  = buildExportGroups(tahap);
    const allProposals = groupedData.flatMap((g) => g.items);
    const detailByProp  = new Map();
    const historyByProp = new Map();
    const pesertaDetailMap = new Map();

    if (allProposals.length > 0) {
      const [detailResults, historyResults] = await Promise.all([
        Promise.allSettled(allProposals.map((p) => getProposalDetailAdmin(p.id_proposal))),
        Promise.allSettled(allProposals.map((p) => tahap === 1
          ? getHistoryDetailTahap1(id_program, p.id_proposal)
          : getHistoryDetailTahap2(id_program, p.id_proposal)
        )),
      ]);
      detailResults.forEach((r, i) => {
        const id = allProposals[i]?.id_proposal;
        if (id && r.status === "fulfilled") detailByProp.set(id, r.value?.data || null);
      });
      historyResults.forEach((r, i) => {
        const id = allProposals[i]?.id_proposal;
        if (id && r.status === "fulfilled") historyByProp.set(id, r.value?.data || null);
      });
    }

    const pesertaQueue = new Map();
    allProposals.forEach((proposal) => {
      const detail = detailByProp.get(proposal.id_proposal);
      const anggotaRaw = detail?.anggota_tim || detail?.anggota || proposal?.anggota_tim || [];
      if (!Array.isArray(anggotaRaw)) return;
      anggotaRaw.forEach((anggota) => {
        const key    = getAnggotaKey(anggota);
        const idUser = anggota?.id_user || anggota?.id;
        if (!key || !idUser || !id_program) return;
        if (!pesertaQueue.has(key)) pesertaQueue.set(key, { idUser, idProgram: id_program });
      });
    });

    if (pesertaQueue.size > 0) {
      const targets = Array.from(pesertaQueue.entries());
      const results = await Promise.allSettled(targets.map(([, v]) => getPesertaDetail(v.idUser, v.idProgram)));
      results.forEach((r, i) => {
        if (r.status !== "fulfilled") return;
        const key = targets[i]?.[0];
        if (key) pesertaDetailMap.set(key, r.value?.data || null);
      });
    }

    return groupedData.map((group) => ({
      ...group,
      items: group.items.map((proposal) => ({
        ...proposal,
        detail:        detailByProp.get(proposal.id_proposal)   || null,
        historyDetail: historyByProp.get(proposal.id_proposal) || null,
      })),
      pesertaDetailMap,
    }));
  }, [buildExportGroups, id_program]);

  const getExportMeta = (tahap) => {
    const tahapTitle    = tahap === 1 ? "DESK EVALUASI" : "WAWANCARA";
    const tahapFileName = tahap === 1 ? "DeskEvaluasi"  : "Wawancara";
    const programTitle  = getProgramTitleForExport(programInfo);
    const programName   = getProgramNameForFilename(programInfo);
    const titleText     = tahunFilter
      ? `${programTitle} - LOLOS ${tahapTitle} ${tahunFilter}`
      : `${programTitle} - LOLOS ${tahapTitle}`;
    const exportFileBaseName = tahunFilter
      ? `Lolos_${tahapFileName}_${programName}_${tahunFilter}`
      : `Lolos_${tahapFileName}_${programName}`;
    return { titleText, exportFileBaseName };
  };

  const handleExportXlsx = async (tahap) => {
    if (buildExportGroups(tahap).length === 0) {
      Swal.fire({ icon: "info", title: "Tidak ada data", text: "Tidak ada history penilaian untuk diekspor", confirmButtonColor: COLORS.primary });
      return;
    }
    const { titleText, exportFileBaseName } = getExportMeta(tahap);
    setExportingTahap(tahap);
    try {
      const XLSX = await getXLSX();
      const groupedData = await buildDetailedExportGroups(tahap);
      const aoa     = [[titleText], []];
      const merges  = [{ s: { r: 0, c: 0 }, e: { r: 0, c: exportHeaders.length - 1 } }];
      const dataRowRanges = [];
      let rowIndex = 2;

      groupedData.forEach((group) => {
        aoa.push([String(group.kategori || "Tanpa Kategori").toUpperCase()]);
        merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: exportHeaders.length - 1 } });
        rowIndex += 1;
        aoa.push(exportHeaders);
        rowIndex += 1;

        let anggotaNomor = 1;
        group.items.forEach((proposal, proposalIndex) => {
          const anggotaRows = getAnggotaRowsForExport(proposal, proposal.detail, group.pesertaDetailMap);
          const startRow    = rowIndex;
          const nilai       = group.tahap === 1 ? getTahap1Nilai(proposal) : getTahap2Nilai(proposal);

          anggotaRows.forEach((anggota, anggotaIndex) => {
            aoa.push([
              anggotaIndex === 0 ? proposalIndex + 1 : "",
              anggotaIndex === 0 ? proposal?.judul || "-" : "",
              anggotaNomor,
              anggota?.keterangan || "-",
              anggota?.nama       || "-",
              anggota?.nim        || "-",
              anggota?.prodi      || "-",
              anggota?.jurusan    || "-",
              anggota?.noHp       || "-",
              anggotaIndex === 0 ? getDosenPembimbingName(proposal?.detail || proposal) : "",
              anggotaIndex === 0 ? getPenilaiLabel(group.tahap, proposal?.historyDetail) : "",
              anggotaIndex === 0 ? nilai : "",
            ]);
            anggotaNomor += 1;
            rowIndex += 1;
          });

          const endRow = rowIndex - 1;
          dataRowRanges.push({ startRow, endRow });
          if (anggotaRows.length > 1) {
            merges.push({ s: { r: startRow, c: 0  }, e: { r: endRow, c: 0  } });
            merges.push({ s: { r: startRow, c: 1  }, e: { r: endRow, c: 1  } });
            merges.push({ s: { r: startRow, c: 9  }, e: { r: endRow, c: 9  } });
            merges.push({ s: { r: startRow, c: 10 }, e: { r: endRow, c: 10 } });
            merges.push({ s: { r: startRow, c: 11 }, e: { r: endRow, c: 11 } });
          }
        });
        aoa.push([]);
        rowIndex += 1;
      });

      const worksheet = XLSX.utils.aoa_to_sheet(aoa);
      dataRowRanges.forEach(({ startRow, endRow }) => {
        centerWorksheetColumns(XLSX, worksheet, [0, 1, 9, 10, 11], startRow, endRow);
        wrapWorksheetColumns(XLSX, worksheet, [10], startRow, endRow);
      });
      worksheet["!merges"] = merges;
      worksheet["!cols"]   = [
        { wch: 6 }, { wch: 48 }, { wch: 6 }, { wch: 14 }, { wch: 28 },
        { wch: 16 }, { wch: 32 }, { wch: 20 }, { wch: 17 }, { wch: 30 },
        { wch: 38 }, { wch: 16 },
      ];
      const workbook  = XLSX.utils.book_new();
      const sheetName = tahap === 1 ? "Lolos Desk Evaluasi" : "Lolos Wawancara";
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      // Browser-compatible export (no cellStyles for browser compatibility)
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportFileBaseName}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal mengekspor file XLSX", confirmButtonColor: COLORS.primary });
    } finally {
      setExportingTahap(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ position: "relative", minHeight: 320 }}>
        <LoadingScreen message="Memuat history penilaian..." overlay minHeight="320px" />
      </Box>
    );
  }

  if (listTahap1.length === 0 && listTahap2.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 10 }}>
        <Typography sx={{ fontSize: 15, color: COLORS.slate, fontWeight: 500 }}>Belum ada history penilaian</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{
        display: "flex",
        gap: { xs: 1.25, sm: 2 },
        mb: 4,
        flexWrap: "wrap",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
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

        <TextField
          select size="small"
          value={tahunFilter}
          onChange={(e) => setTahunFilter(e.target.value)}
          SelectProps={{
            displayEmpty: true,
            renderValue: (v) => (
              <span style={{ fontSize: 14, color: !v ? "#9CA3AF" : "inherit" }}>
                {!v ? "Semua Tahun" : v}
              </span>
            ),
          }}
          sx={{ ...roundedField, width: { xs: "100%", sm: "auto" }, minWidth: { sm: 160 } }}
        >
          <MenuItem value="" sx={{ fontSize: 13 }}>Semua Tahun</MenuItem>
          {tahunOptions.map((tahun) => <MenuItem key={tahun} value={tahun} sx={{ fontSize: 13 }}>{tahun}</MenuItem>)}
        </TextField>
      </Box>

      <Paper elevation={0} sx={{
        p: { xs: 2.5, sm: 3.5 }, mb: 3,
        borderRadius: "16px",
        border: `1.5px solid #E2E8F0`,
        backgroundColor: "#FAFBFF",
      }}>
        <Box sx={{
          display: "flex",
          justifyContent: { xs: "stretch", sm: "space-between" },
          alignItems: { xs: "stretch", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          mb: 3, pb: 2,
          borderBottom: `1.5px solid ${COLORS.slateLight}`,
          gap: 2,
        }}>
          <Typography sx={{ fontSize: { xs: 16, sm: 18 }, fontWeight: 800, color: "#1E293B" }}>
            Tahap 1 — Desk Evaluasi
          </Typography>
          <Button
            variant="contained"
            onClick={() => handleExportXlsx(1)}
            startIcon={<Download />}
            disabled={exportingTahap !== null || buildExportGroups(1).length === 0}
            sx={{
              textTransform: "none", borderRadius: "12px", px: 3, py: 1.2, fontWeight: 700,
              backgroundColor: COLORS.success,
              boxShadow: "0 4px 12px rgba(5,150,105,0.2)",
              width: { xs: "100%", sm: "auto" },
              "&:hover": { backgroundColor: "#047857", boxShadow: "0 6px 16px rgba(5,150,105,0.3)" },
              "&:disabled": { backgroundColor: "#D1FAE5", color: "#6EE7B7" },
            }}
          >
            {exportingTahap === 1 ? "Mengekspor..." : "Ekspor Excel"}
          </Button>
        </Box>
        <StageSection
          tahap={1} list={listTahap1}
          kategoriFilter={kategoriFilter} tahunFilter={tahunFilter}
          expandedKeys={expandedKeys} setExpandedKeys={setExpandedKeys}
          detailMap={detailMap} setDetailMap={setDetailMap}
          loadingKeys={loadingKeys} setLoadingKeys={setLoadingKeys}
          page={pageMap[1] || 1} setPage={(v) => setPageMap((prev) => ({ ...prev, 1: v }))}
          id_program={id_program}
        />
      </Paper>

      <Paper elevation={0} sx={{
        p: { xs: 2.5, sm: 3.5 },
        borderRadius: "16px",
        border: `1.5px solid #E2E8F0`,
        backgroundColor: "#FAFBFF",
      }}>
        <Box sx={{
          display: "flex",
          justifyContent: { xs: "stretch", sm: "space-between" },
          alignItems: { xs: "stretch", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          mb: 3, pb: 2,
          borderBottom: `1.5px solid ${COLORS.slateLight}`,
          gap: 2,
        }}>
          <Typography sx={{ fontSize: { xs: 16, sm: 18 }, fontWeight: 800, color: "#1E293B" }}>
            Tahap 2 — Wawancara
          </Typography>
          <Button
            variant="contained"
            onClick={() => handleExportXlsx(2)}
            startIcon={<Download />}
            disabled={exportingTahap !== null || buildExportGroups(2).length === 0}
            sx={{
              textTransform: "none", borderRadius: "12px", px: 3, py: 1.2, fontWeight: 700,
              backgroundColor: COLORS.success,
              boxShadow: "0 4px 12px rgba(5,150,105,0.2)",
              width: { xs: "100%", sm: "auto" },
              "&:hover": { backgroundColor: "#047857", boxShadow: "0 6px 16px rgba(5,150,105,0.3)" },
              "&:disabled": { backgroundColor: "#D1FAE5", color: "#6EE7B7" },
            }}
          >
            {exportingTahap === 2 ? "Mengekspor..." : "Ekspor Excel"}
          </Button>
        </Box>
        <StageSection
          tahap={2} list={listTahap2}
          kategoriFilter={kategoriFilter} tahunFilter={tahunFilter}
          expandedKeys={expandedKeys} setExpandedKeys={setExpandedKeys}
          detailMap={detailMap} setDetailMap={setDetailMap}
          loadingKeys={loadingKeys} setLoadingKeys={setLoadingKeys}
          page={pageMap[2] || 1} setPage={(v) => setPageMap((prev) => ({ ...prev, 2: v }))}
          id_program={id_program}
        />
      </Paper>
    </Box>
  );
}