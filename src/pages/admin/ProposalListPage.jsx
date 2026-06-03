import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button,
  TextField, MenuItem, Autocomplete, Pagination,
} from "@mui/material";
import { Description, Download } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getXLSX } from "../../utils/xlsxLazy";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import { getPesertaDetail, getProposalDetailAdmin, getProposalList } from "../../api/admin";

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
    transition: "all 0.2s ease-in-out",
    "&:hover fieldset": { borderColor: COLORS.primary },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary, borderWidth: "2px" },
    "&.Mui-focused": { boxShadow: `0 0 0 4px ${COLORS.primaryLight}` },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: COLORS.primary, fontWeight: 700 },
};

const tableHeadCell = {
  fontWeight: 800,
  fontSize: 12,
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  backgroundColor: "#F8FAFC",
  borderBottom: `2px solid ${COLORS.primaryMuted}`,
  py: 2.5,
};

const tableBodyRow = {
  "&:hover": { backgroundColor: "#F1F5F9/50" },
  "& td": { borderBottom: "1.5px solid #E2E8F0", py: 2 },
};

const pageCard = {
  borderRadius: "20px",
  border: "1.5px solid #E2E8F0",
  overflow: "hidden",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  position: "relative",
};

const STATUS_MAP = {
  0: { label: "Draft",                       colorType: "slate"   },
  1: { label: "Diajukan",                    colorType: "primary" },
  2: { label: "Ditugaskan ke Reviewer",      colorType: "info"    },
  3: { label: "Tidak Lolos Desk Evaluasi",   colorType: "error"   },
  4: { label: "Lolos Desk Evaluasi",         colorType: "success" },
  5: { label: "Wawancara",             colorType: "warning" },
  6: { label: "Tidak Lolos Wawancara",       colorType: "error"   },
  7: { label: "Lolos Wawancara",             colorType: "success" },
  8: { label: "Pembimbing Diajukan",         colorType: "primary" },
  9: { label: "Pembimbing Disetujui",        colorType: "success" },
  10: { label: "Nonaktif / Mengundurkan Diri", colorType: "error" },
};

const STATUS_BG_MAP = {
  0: "#666",     1: "#1565c0", 2: "#3949ab",
  3: "#c62828",  4: "#2e7d32", 5: "#3949ab",
  6: "#c62828",  7: "#2e7d32", 8: "#1565c0",
  9: "#2e7d32", 10: "#c62828",
};

const COLOR_TYPE_MAP = {
  warning: { bg: COLORS.warningLight,  text: COLORS.warning  },
  success: { bg: COLORS.successLight,  text: COLORS.success  },
  error:   { bg: COLORS.errorLight,    text: COLORS.error    },
  primary: { bg: COLORS.primaryLight,  text: COLORS.primary  },
  info:    { bg: "#E0F2FE",            text: "#0284C7"       },
  slate:   { bg: COLORS.slateLight,    text: COLORS.slate    },
};

const StatusPill = ({ label, colorType = "slate", backgroundColor }) => {
  if (backgroundColor) {
    return (
      <Box sx={{
        display: "inline-flex", alignItems: "center",
        px: 1.5, py: 0.4, borderRadius: "50px",
        backgroundColor, color: "#fff",
        fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
      }}>
        {label}
      </Box>
    );
  }
  const colors = COLOR_TYPE_MAP[colorType] || COLOR_TYPE_MAP.slate;
  return (
    <Box sx={{
      display: "inline-flex", alignItems: "center",
      px: 1.5, py: 0.5, borderRadius: "8px",
      backgroundColor: colors.bg, color: colors.text,
      fontSize: 11, fontWeight: 800,
      whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.02em",
    }}>
      {label}
    </Box>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
};

const getDosenPembimbingName = (item) =>
  item?.nama_dosen || item?.nama_pembimbing || item?.dosen_pembimbing ||
  item?.pembimbing?.nama_dosen || item?.pembimbing?.nama_lengkap ||
  item?.pengajuan_pembimbing?.nama_dosen || "-";

const getKategoriName = (proposal) =>
  proposal?.nama_kategori || proposal?.kategori?.nama_kategori ||
  proposal?.kategori?.nama || "Tanpa Kategori";

const getExportTitle = (tahunFilter) => {
  return tahunFilter ? `DAFTAR PROPOSAL ${tahunFilter}` : "DAFTAR PROPOSAL";
};

const getFileName = (tahunFilter) => {
  return tahunFilter ? `DaftarProposal_${tahunFilter}` : "DaftarProposal";
};

const getAnggotaPeranLabel = (anggota) => {
  const peran = anggota?.peran;
  return (peran === 1 || String(peran).toLowerCase() === "ketua") ? "Ketua" : "Anggota";
};

const getAnggotaKey     = (a) => String(a?.id_user || a?.id || a?.nim || a?.username || "");
const getAnggotaProdi   = (a, p) => { const j = a?.jenjang ? `${a.jenjang} ` : ""; const jp = p?.jenjang ? `${p.jenjang} ` : ""; return a?.prodi || `${j}${a?.nama_prodi || ""}`.trim() || `${jp}${p?.nama_prodi || ""}`.trim() || "-"; };
const getAnggotaJurusan = (a, p) => a?.nama_jurusan || a?.jurusan || a?.mahasiswa?.nama_jurusan || p?.nama_jurusan || "-";
const getAnggotaNoHp    = (a, p) => a?.no_hp || a?.nomor_hp || a?.hp || a?.mahasiswa?.no_hp || p?.no_hp || "-";

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
          nim:        anggota?.nim  || "-",
          prodi:      getAnggotaProdi(anggota, pd),
          jurusan:    getAnggotaJurusan(anggota, pd),
          noHp:       getAnggotaNoHp(anggota, pd),
        };
      });
  }
  return [{
    keterangan: "Ketua",
    nama:    proposal?.ketua?.nama_lengkap  || "-",
    nim:     proposal?.ketua?.nim           || "-",
    prodi:   getAnggotaProdi(proposal?.ketua, null),
    jurusan: getAnggotaJurusan(proposal?.ketua, null),
    noHp:    getAnggotaNoHp(proposal?.ketua, null),
  }];
};

const middleAlignWorksheetColumns = (XLSX, worksheet, columns = [], startRow = 0, endRow = 0) => {
  for (let row = startRow; row <= endRow; row += 1) {
    columns.forEach((col) => {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellRef];
      if (!cell) return;
      cell.s = { ...(cell.s || {}), alignment: { ...(cell.s?.alignment || {}), vertical: "center" } };
    });
  }
};

const statusOptions = Object.entries(STATUS_MAP).map(([value, { label }]) => ({
  value: parseInt(value), label,
}));

export default function ProposalListPage() {
  const navigate = useNavigate();
  const [loading, setLoading]           = useState(true);
  const [proposalList, setProposalList] = useState([]);
  const [page, setPage]                 = useState(1);
  const [exporting, setExporting]       = useState(false);
  const rowsPerPage = 10;

  const [filters, setFilters] = useState({ kategori: "", status: [], tahun: "", search: "" });

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);

      const fetchAllPages = async (baseFilters) => {
        const limit = 100;
        let currentPage = 1;
        let totalPages = 1;
        const merged = [];

        do {
          const res = await getProposalList({ ...baseFilters, page: currentPage, limit });
          const data = res?.data || [];
          merged.push(...data);

          const apiTotalPages = Number(res?.pagination?.total_pages || 1);
          totalPages = Number.isNaN(apiTotalPages) || apiTotalPages < 1 ? 1 : apiTotalPages;

          if (data.length === 0 || currentPage >= totalPages) break;
          currentPage += 1;
        } while (currentPage <= 100);

        return merged;
      };

      let allProposals = [];
      if (filters.status.length === 0) {
        allProposals = await fetchAllPages({});
      } else {
        const promises = filters.status.map((statusValue) =>
          fetchAllPages({ status: statusValue })
        );
        const results = await Promise.all(promises);
        allProposals = results.flatMap((list) => list || []);
        allProposals = Array.from(new Map(allProposals.map((p) => [p.id_proposal, p])).values());
      }
      setProposalList(allProposals);
      setPage(1);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat daftar proposal", confirmButtonColor: COLORS.primary });
    } finally {
      setLoading(false);
    }
  }, [filters.status]);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  const tahunOptions = Array.from(new Set(
    proposalList
      .map((item) => {
        const d = item.tanggal_submit || item.created_at;
        if (!d) return null;
        const y = new Date(d).getFullYear();
        return Number.isNaN(y) ? null : y;
      })
      .filter(Boolean)
  )).sort((a, b) => b - a);

  const kategoriOptions = Array.from(new Set(
    proposalList
      .map((item) => getKategoriName(item))
      .filter((value) => value && value !== "Tanpa Kategori")
  )).sort((a, b) => a.localeCompare(b, "id-ID"));

  const normalizedKategoriFilter = filters.kategori.trim().toLowerCase();

  const searchFilter = filters.search.toLowerCase();
  const filteredProposalList = proposalList.filter((item) => {
    const d = item.tanggal_submit || item.created_at;
    const matchesTahun = filters.tahun === "" || (d && new Date(d).getFullYear() === Number(filters.tahun));
    const kategoriName = getKategoriName(item).trim().toLowerCase();
    const matchesKategori = filters.kategori === "" || kategoriName === normalizedKategoriFilter;
    
    let matchesSearch = true;
    if (searchFilter) {
      const judul = (item.judul || "").toLowerCase();
      const namaTim = (item.nama_tim || "").toLowerCase();
      const ketua = (item.ketua?.nama_lengkap || item.ketua?.username || "").toLowerCase();
      const pembimbing = getDosenPembimbingName(item).toLowerCase();
      matchesSearch = judul.includes(searchFilter) || 
                      namaTim.includes(searchFilter) || 
                      ketua.includes(searchFilter) || 
                      pembimbing.includes(searchFilter);
    }
    
    return matchesTahun && matchesKategori && matchesSearch;
  });

  useEffect(() => {
    setPage(1);
  }, [filters.kategori, filters.tahun, filters.search]);

  const totalPages    = Math.ceil(filteredProposalList.length / rowsPerPage);
  const paginatedList = filteredProposalList.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const buildGroupedExportData = () => {
    const grouped = new Map();
    [...filteredProposalList]
      .sort((a, b) => {
        const kA = getKategoriName(a), kB = getKategoriName(b);
        if (kA !== kB) return kA.localeCompare(kB, "id-ID");
        return (a?.judul || "").localeCompare(b?.judul || "", "id-ID");
      })
      .forEach((proposal) => {
        const k = getKategoriName(proposal);
        if (!grouped.has(k)) grouped.set(k, []);
        grouped.get(k).push(proposal);
      });
    return Array.from(grouped.entries()).map(([kategori, items]) => ({ kategori, items }));
  };

  const exportHeaders = ["NO", "NAMA USAHA", "NO", "KETERANGAN", "NAMA", "NIM", "PRODI", "JURUSAN", "NO HP", "DOSEN PEMBIMBING"];

  const buildDetailedExportGroups = async () => {
    const groupedData   = buildGroupedExportData();
    const allProposals  = groupedData.flatMap((g) => g.items);
    const detailMap     = new Map();
    const pesertaDetailMap = new Map();

    if (allProposals.length > 0) {
      const results = await Promise.allSettled(allProposals.map((p) => getProposalDetailAdmin(p.id_proposal)));
      results.forEach((result, index) => {
        const id = allProposals[index]?.id_proposal;
        if (!id) return;
        if (result.status === "fulfilled") detailMap.set(id, result.value?.data || null);
      });
    }

    const pesertaQueue = new Map();
    allProposals.forEach((proposal) => {
      const detail = detailMap.get(proposal.id_proposal);
      const anggotaRaw = detail?.anggota_tim || detail?.anggota || proposal?.anggota_tim || [];
      if (!Array.isArray(anggotaRaw)) return;
      anggotaRaw.forEach((anggota) => {
        const key    = getAnggotaKey(anggota);
        const idUser = anggota?.id_user || anggota?.id;
        const idProgram = proposal?.id_program || proposal?.program?.id_program || null;
        if (!key || !idUser || !idProgram) return;
        if (!pesertaQueue.has(key)) pesertaQueue.set(key, { idUser, idProgram });
      });
    });

    if (pesertaQueue.size > 0) {
      const targets = Array.from(pesertaQueue.entries());
      const results = await Promise.allSettled(targets.map(([, v]) => getPesertaDetail(v.idUser, v.idProgram)));
      results.forEach((result, index) => {
        if (result.status !== "fulfilled") return;
        const key = targets[index]?.[0];
        if (!key) return;
        pesertaDetailMap.set(key, result.value?.data || null);
      });
    }

    return groupedData.map((group) => ({
      kategori: group.kategori,
      items: group.items.map((proposal) => ({ ...proposal, detail: detailMap.get(proposal.id_proposal) || null })),
      pesertaDetailMap,
    }));
  };

  const buildExportFileName = () => {
    return getFileName(filters.tahun);
  };

  const handleExportXlsx = async () => {
    if (filteredProposalList.length === 0) {
      Swal.fire({ icon: "info", title: "Tidak ada data", text: "Tidak ada proposal untuk diekspor", confirmButtonColor: COLORS.primary });
      return;
    }
    setExporting(true);
    try {
      const XLSX = await getXLSX();
      const groupedData = await buildDetailedExportGroups();
      const aoa     = [[getExportTitle(filters.tahun)], []];
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
          const startRow = rowIndex;
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
            ]);
            anggotaNomor += 1;
            rowIndex += 1;
          });
          const endRow = rowIndex - 1;
          dataRowRanges.push({ startRow, endRow });
          if (anggotaRows.length > 1) {
            merges.push({ s: { r: startRow, c: 0 }, e: { r: endRow, c: 0 } });
            merges.push({ s: { r: startRow, c: 1 }, e: { r: endRow, c: 1 } });
            merges.push({ s: { r: startRow, c: 9 }, e: { r: endRow, c: 9 } });
          }
        });
        aoa.push([]);
        rowIndex += 1;
      });

      const worksheet = XLSX.utils.aoa_to_sheet(aoa);
      dataRowRanges.forEach(({ startRow, endRow }) => {
        middleAlignWorksheetColumns(XLSX, worksheet, [0, 1, 9], startRow, endRow);
      });
      worksheet["!merges"] = merges;
      worksheet["!cols"]   = [
        { wch: 6 }, { wch: 48 }, { wch: 6 }, { wch: 14 }, { wch: 28 },
        { wch: 16 }, { wch: 32 }, { wch: 20 }, { wch: 17 }, { wch: 30 },
      ];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Proposal");
      // Browser-compatible export (no cellStyles for browser compatibility)
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${buildExportFileName()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal mengekspor file XLSX", confirmButtonColor: COLORS.primary });
    } finally {
      setExporting(false);
    }
  };

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box sx={{ px: 1, py: 1 }}>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: { xs: 26, sm: 32, md: 36 }, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              Daftar Proposal
            </Typography>
            <Typography sx={{ fontSize: { xs: 14, sm: 16 }, color: "#6B7280" }}>
              Kelola dan monitor proposal kewirausahaan
            </Typography>
          </Box>

          <Paper elevation={0} sx={{ ...pageCard, mb: 3 }}>
            <Box sx={{ height: "6px", background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />

            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <Box sx={{
                display: "flex",
                gap: { xs: 1.25, sm: 2 },
                flexDirection: { xs: "column", lg: "row" },
                alignItems: { xs: "stretch", lg: "center" },
              }}>
                <TextField
                  placeholder="Cari proposal atau tim..."
                  size="small"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  sx={{
                    ...roundedField,
                    width: { xs: "100%", lg: "auto" },
                    minWidth: { xs: 0, lg: 220 },
                    flex: { lg: "0 1 220px" },
                  }}
                />
                <Autocomplete
                  multiple
                  options={statusOptions}
                  value={statusOptions.filter((opt) => filters.status.includes(opt.value))}
                  onChange={(e, newValue) => setFilters({ ...filters, status: newValue.map((v) => v.value) })}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  size="small"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={filters.status.length === 0 ? "Semua Status" : ""}
                      sx={roundedField}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <StatusPill
                        key={index}
                        label={option.label}
                        backgroundColor={STATUS_BG_MAP[option.value] || "#666"}
                        {...getTagProps({ index })}
                      />
                    ))
                  }
                  sx={{
                    width: { xs: "100%", lg: "auto" },
                    minWidth: { xs: 0, lg: 280 },
                    flex: { lg: "1 1 280px" },
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      "&:hover fieldset": { borderColor: COLORS.primary },
                      "&.Mui-focused fieldset": { borderColor: COLORS.primary },
                      "&.Mui-focused": { boxShadow: `0 0 0 3px ${COLORS.primaryLight}` },
                    },
                  }}
                />

                <TextField
                  select size="small"
                  value={filters.kategori}
                  onChange={(e) => setFilters({ ...filters, kategori: e.target.value })}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (v) => (
                      <span style={{ fontSize: 14, color: !v ? "#9CA3AF" : "inherit" }}>
                        {!v ? "Semua Kategori" : v}
                      </span>
                    ),
                  }}
                  sx={{
                    ...roundedField,
                    width: { xs: "100%", lg: "auto" },
                    minWidth: { xs: 0, lg: 220 },
                    flex: { lg: "0 1 220px" },
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: 13 }}>Semua Kategori</MenuItem>
                  {kategoriOptions.map((kategori) => (
                    <MenuItem key={kategori} value={kategori} sx={{ fontSize: 13 }}>
                      {kategori}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select size="small"
                  value={filters.tahun}
                  onChange={(e) => setFilters({ ...filters, tahun: e.target.value })}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (v) => (
                      <span style={{ fontSize: 14, color: !v ? "#9CA3AF" : "inherit" }}>
                        {!v ? "Semua Tahun" : v}
                      </span>
                    ),
                  }}
                  sx={{
                    ...roundedField,
                    width: { xs: "100%", lg: "auto" },
                    minWidth: { xs: 0, lg: 150 },
                    flex: { lg: "0 1 150px" },
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: 13 }}>Semua Tahun</MenuItem>
                  {tahunOptions.map((tahun) => (
                    <MenuItem key={tahun} value={String(tahun)} sx={{ fontSize: 13 }}>{tahun}</MenuItem>
                  ))}
                </TextField>

                <Button
                  variant="contained"
                  onClick={handleExportXlsx}
                  startIcon={<Download />}
                  disabled={filteredProposalList.length === 0 || exporting}
                  sx={{
                    textTransform: "none",
                    borderRadius: "12px",
                    px: { xs: 2, sm: 3 },
                    py: 1.2,
                    fontWeight: 700,
                    backgroundColor: COLORS.success,
                    boxShadow: "0 4px 12px rgba(5, 150, 105, 0.2)",
                    width: { xs: "100%", lg: "auto" },
                    ml: { lg: "auto" },
                    "&:hover": {
                      backgroundColor: "#047857",
                      boxShadow: "0 6px 16px rgba(5, 150, 105, 0.3)",
                    },
                    "&:disabled": { backgroundColor: "#D1FAE5", color: "#6EE7B7" },
                  }}
                >
                  {exporting ? "Mengekspor..." : "Ekspor Excel"}
                </Button>
              </Box>
            </Box>
          </Paper>

          <Paper elevation={0} sx={pageCard}>
            <Box sx={{ height: "6px", background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />

            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              {loading ? (
                <Box sx={{ position: "relative", minHeight: 400 }}>
                  <LoadingScreen message="Memuat daftar proposal..." overlay minHeight="400px" />
                </Box>
              ) : paginatedList.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 12 }}>
                  <Box sx={{
                    width: 120, height: 120, borderRadius: "50%",
                    backgroundColor: COLORS.slateLight,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    mx: "auto", mb: 3,
                  }}>
                    <Description sx={{ fontSize: 52, color: COLORS.primaryMuted }} />
                  </Box>
                  <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#1F2937", mb: 1 }}>
                    Belum Ada Proposal
                  </Typography>
                  <Typography sx={{ fontSize: 16, color: COLORS.slate }}>
                    Proposal yang diajukan akan muncul di sini
                  </Typography>
                </Box>
              ) : (
                <>
                  <TableContainer sx={{
                    borderRadius: "16px",
                    border: `1.5px solid ${COLORS.slateLight}`,
                    overflow: "auto",
                    mb: 4,
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                  }}>
                    <Table sx={{ minWidth: 900 }}>
                      <TableHead>
                        <TableRow>
                          {["JUDUL PROPOSAL", "NAMA TIM", "KETUA TIM", "DOSEN PEMBIMBING", "KATEGORI", "STATUS", "TANGGAL SUBMIT", "AKSI"].map((h, i) => (
                            <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 7 && { textAlign: "center" }) }}>
                              {h}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedList.map((proposal) => {
                          const si = STATUS_MAP[proposal.status];
                          return (
                            <TableRow key={proposal.id_proposal} sx={tableBodyRow}>
                              <TableCell sx={{ maxWidth: 280 }}>
                                <Typography sx={{ fontWeight: 600, fontSize: 14, color: "#1E293B" }}>
                                  {proposal.judul}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                  {getKategoriName(proposal)}
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ fontWeight: 600, fontSize: 14, color: "#1E293B" }}>
                                  {proposal.ketua.nama_lengkap}
                                </Typography>
                                <Typography sx={{ fontSize: 12, color: "#aaa" }}>@{proposal.ketua.username}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ fontSize: 13, color: "#475569" }}>
                                  {getDosenPembimbingName(proposal)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ fontSize: 13, color: "#475569" }}>{getKategoriName(proposal)}</Typography>
                              </TableCell>
                              <TableCell>
                                <StatusPill
                                  label={si?.label || "Unknown"}
                                  colorType={si?.colorType || "slate"}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ fontSize: 13, color: "#475569" }}>
                                  {formatDate(proposal.tanggal_submit)}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => navigate(`/admin/proposal/${proposal.id_proposal}`)}
                                  sx={{
                                    textTransform: "none",
                                    color: COLORS.primary,
                                    borderColor: COLORS.primaryMuted,
                                    borderRadius: "10px",
                                    fontWeight: 700,
                                    fontSize: 12,
                                    px: 2,
                                    "&:hover": { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
                                  }}
                                >
                                  Detail
                                </Button>
                              </TableCell>
                            </TableRow>
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
                    gap: 2,
                  }}>
                    <Typography sx={{ fontSize: 14, color: COLORS.slate, fontWeight: 500 }}>
                      Menampilkan{" "}
                      <b>{((page - 1) * rowsPerPage) + 1}–{Math.min(page * rowsPerPage, filteredProposalList.length)}</b>
                      {" "}dari <b>{filteredProposalList.length}</b> proposal
                    </Typography>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={(e, v) => setPage(v)}
                      color="primary"
                      shape="rounded"
                      size="small"
                      sx={{
                        "& .MuiPaginationItem-root": {
                          fontWeight: 700,
                          borderRadius: "10px",
                          "&.Mui-selected": {
                            backgroundColor: COLORS.primary,
                            color: "#fff",
                            "&:hover": { backgroundColor: COLORS.primaryDark },
                          },
                        },
                      }}
                    />
                  </Box>
                </>
              )}
            </Box>
          </Paper>
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}