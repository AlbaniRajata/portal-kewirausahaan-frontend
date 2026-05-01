import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem,
  IconButton, Pagination, InputAdornment, Divider, Chip,
} from "@mui/material";
import { Close, PersonAdd, Search, Groups } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import { getMyProgram, getTimList, getTimDetail, getPesertaList, getPesertaDetail } from "../../api/admin";

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
  errorLight:   "#FEF2F2",
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
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#374151",
  backgroundColor: "#F8FAFC",
  borderBottom: `2px solid ${COLORS.primaryMuted}`,
  py: 2,
  px: 2,
  whiteSpace: "nowrap",
};

const tableBodyRow = {
  "& td": { borderBottom: `1px solid ${COLORS.slateLight}`, py: 2, px: 2 },
  "&:hover": { backgroundColor: "#F8FAFC" },
};

const ANGGOTA_STATUS = {
  0: { label: "Menunggu",  colorType: "warning" },
  1: { label: "Disetujui", colorType: "success" },
  2: { label: "Ditolak",   colorType: "error" },
};

const LOLOS_STATUS = {
  0: { label: "Belum Dinilai", colorType: "slate" },
  1: { label: "Lolos",         colorType: "success" },
  2: { label: "Tidak Lolos",   colorType: "error" },
};

const PROPOSAL_STATUS = {
  0: { label: "Draft",                       colorType: "slate" },
  1: { label: "Diajukan",                    colorType: "primary" },
  2: { label: "Ditugaskan Reviewer Tahap 1", colorType: "info" },
  3: { label: "Tidak Lolos Desk Evaluasi",   colorType: "error" },
  4: { label: "Lolos Desk Evaluasi",         colorType: "success" },
  5: { label: "Panel Wawancara",             colorType: "warning" },
  6: { label: "Tidak Lolos Wawancara",       colorType: "error" },
  7: { label: "Lolos Wawancara",             colorType: "success" },
  8: { label: "Pembimbing Diajukan",         colorType: "primary" },
  9: { label: "Pembimbing Disetujui",        colorType: "success" },
};

const COLOR_TYPE_MAP = {
  warning:   { bg: COLORS.warningLight,  text: COLORS.warning },
  success:   { bg: COLORS.successLight,  text: COLORS.success },
  error:     { bg: COLORS.errorLight,    text: COLORS.error },
  primary:   { bg: COLORS.primaryLight,  text: COLORS.primary },
  info:      { bg: "#E0F2FE",            text: "#0284C7" },
  slate:     { bg: COLORS.slateLight,    text: COLORS.slate },
};

const StatusPill = ({ label, colorType = "slate" }) => {
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

const DetailRow = ({ label, value }) => (
  <Box>
    <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.slate, textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.75 }}>
      {label}
    </Typography>
    <Typography sx={{ fontWeight: 600, fontSize: 14, color: "#1E293B" }}>{value || "-"}</Typography>
  </Box>
);

const formatDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};

const formatCurrency = (v) => {
  if (!v) return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(v);
};

const getDosenPembimbingName = (item) =>
  item?.nama_dosen ||
  item?.nama_pembimbing ||
  item?.dosen_pembimbing ||
  item?.pembimbing?.nama_dosen ||
  item?.pembimbing?.nama_lengkap ||
  item?.pengajuan_pembimbing?.nama_dosen ||
  "-";

export default function TimPesertaPage() {
  const [activeTab, setActiveTab]       = useState(0);
  const [loading, setLoading]           = useState(true);
  const [timList, setTimList]           = useState([]);
  const [pesertaList, setPesertaList]   = useState([]);
  const [programList, setProgramList]   = useState([]);
  const [page, setPage]                 = useState(1);
  const rowsPerPage = 10;

  const [filters, setFilters] = useState({ search: "", id_program: "", tahun: "" });

  const [openDetail, setOpenDetail]       = useState(false);
  const [detailData, setDetailData]       = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedItem, setSelectedItem]   = useState(null);

  useEffect(() => {
    getMyProgram()
      .then((res) => {
        const myProgram = res?.data;
        if (myProgram?.id_program) {
          setProgramList([myProgram]);
          setFilters((prev) => ({ ...prev, id_program: myProgram.id_program }));
        }
      })
      .catch(() => {
        Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat data program", confirmButtonColor: COLORS.primary });
      });
  }, []);

  const fetchTim = useCallback(async () => {
    setLoading(true);
    try {
      if (!filters.id_program) { setTimList([]); return; }
      const params = {};
      if (filters.id_program) params.id_program = filters.id_program;
      if (filters.search) params.search = filters.search;
      const res = await getTimList(params);
      setTimList(res.data || []);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat data tim", confirmButtonColor: COLORS.primary });
    } finally {
      setLoading(false);
    }
  }, [filters.id_program, filters.search]);

  const fetchPeserta = useCallback(async () => {
    setLoading(true);
    try {
      if (!filters.id_program) { setPesertaList([]); return; }
      const params = {};
      if (filters.id_program) params.id_program = filters.id_program;
      if (filters.search) params.search = filters.search;
      const res = await getPesertaList(params);
      setPesertaList(res.data || []);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat data peserta", confirmButtonColor: COLORS.primary });
    } finally {
      setLoading(false);
    }
  }, [filters.id_program, filters.search]);

  useEffect(() => {
    setPage(1);
    if (activeTab === 0) fetchTim();
    else fetchPeserta();
  }, [activeTab, fetchTim, fetchPeserta]);

  const handleViewTimDetail = async (item) => {
    setSelectedItem(item);
    setDetailData(null);
    setOpenDetail(true);
    setLoadingDetail(true);
    try {
      const res = await getTimDetail(item.id_tim);
      setDetailData(res.data);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat detail tim", confirmButtonColor: COLORS.primary });
      setOpenDetail(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleViewPesertaDetail = async (item) => {
    setSelectedItem(item);
    setDetailData(null);
    setOpenDetail(true);
    setLoadingDetail(true);
    try {
      const res = await getPesertaDetail(item.id_user, item.id_program);
      setDetailData(res.data);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat detail peserta", confirmButtonColor: COLORS.primary });
      setOpenDetail(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const currentList = activeTab === 0 ? timList : pesertaList;

  const getYearFromItem = (item) => {
    const dateValue = activeTab === 0
      ? (item.created_at || item.tanggal_submit || item.wawancara_at)
      : (item.tahun || item.created_at || item.tanggal_submit);
    if (!dateValue) return null;
    if (/^\d{4}$/.test(String(dateValue))) return Number(dateValue);
    const year = new Date(dateValue).getFullYear();
    return Number.isNaN(year) ? null : year;
  };

  const tahunOptions = Array.from(new Set(
    currentList.map((item) => getYearFromItem(item)).filter(Boolean)
  )).sort((a, b) => b - a);

  const filteredList = filters.tahun === ""
    ? currentList
    : currentList.filter((item) => getYearFromItem(item) === Number(filters.tahun));

  const totalPages   = Math.ceil(filteredList.length / rowsPerPage);
  const paginatedList = filteredList.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  /* ─── Detail renderers ─── */
  const renderTimDetail = () => {
    if (!detailData) return null;
    const ps = detailData.proposal ? (PROPOSAL_STATUS[detailData.proposal.status] || PROPOSAL_STATUS[0]) : null;
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
          <DetailRow label="Nama Tim"       value={detailData.nama_tim} />
          <DetailRow label="Program"        value={detailData.nama_program} />
          <DetailRow label="Tanggal Dibuat" value={formatDate(detailData.created_at)} />
        </Box>

        <Divider sx={{ borderColor: COLORS.slateLight }} />
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#1E293B" }}>Anggota Tim</Typography>
        {detailData.anggota?.length > 0 ? (
          <TableContainer sx={{ borderRadius: "12px", border: `1.5px solid ${COLORS.slateLight}` }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Nama", "NIM", "Peran", "Prodi", "Status"].map((h, i) => (
                    <TableCell key={i} sx={{ ...tableHeadCell, fontSize: 11 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {detailData.anggota.map((a) => {
                  const as = ANGGOTA_STATUS[a.status] || ANGGOTA_STATUS[0];
                  return (
                    <TableRow key={a.id_user} sx={tableBodyRow}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{a.nama_lengkap || a.username}</Typography>
                        <Typography sx={{ fontSize: 11, color: COLORS.slate }}>{a.email}</Typography>
                      </TableCell>
                      <TableCell><Typography sx={{ fontSize: 12 }}>{a.nim}</Typography></TableCell>
                      <TableCell>
                        <Chip label={a.peran === 1 ? "Ketua" : "Anggota"} size="small"
                          sx={{ fontSize: 11, fontWeight: 700, backgroundColor: a.peran === 1 ? COLORS.primaryLight : COLORS.slateLight, color: a.peran === 1 ? COLORS.primary : COLORS.slate }} />
                      </TableCell>
                      <TableCell><Typography sx={{ fontSize: 12 }}>{a.jenjang} {a.nama_prodi}</Typography></TableCell>
                      <TableCell><StatusPill label={as.label} colorType={as.colorType} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography sx={{ fontSize: 13, color: COLORS.slate }}>Belum ada anggota</Typography>
        )}

        <Divider sx={{ borderColor: COLORS.slateLight }} />
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#1E293B" }}>Proposal</Typography>
        {detailData.proposal ? (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
            <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
              <DetailRow label="Judul Proposal" value={detailData.proposal.judul} />
            </Box>
            <DetailRow label="Kategori"         value={detailData.proposal.nama_kategori} />
            <DetailRow label="Modal Diajukan"   value={formatCurrency(detailData.proposal.modal_diajukan)} />
            <DetailRow label="Dosen Pembimbing" value={getDosenPembimbingName(detailData.proposal)} />
            <DetailRow label="Tanggal Submit"   value={formatDate(detailData.proposal.tanggal_submit)} />
            <DetailRow label="Jadwal Wawancara" value={formatDate(detailData.proposal.wawancara_at)} />
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.slate, textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.75 }}>Status Proposal</Typography>
              {ps && <StatusPill label={ps.label} colorType={ps.colorType} />}
            </Box>
          </Box>
        ) : (
          <Typography sx={{ fontSize: 13, color: COLORS.slate }}>Belum ada proposal</Typography>
        )}
      </Box>
    );
  };

  const renderPesertaDetail = () => {
    if (!detailData) return null;
    const ls = LOLOS_STATUS[detailData.status_lolos]      || LOLOS_STATUS[0];
    const as = detailData.status_anggota !== undefined     ? (ANGGOTA_STATUS[detailData.status_anggota] || ANGGOTA_STATUS[0]) : null;
    const ps = detailData.proposal                         ? (PROPOSAL_STATUS[detailData.proposal.status] || PROPOSAL_STATUS[0]) : null;
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
          <DetailRow label="Nama Lengkap"  value={detailData.nama_lengkap} />
          <DetailRow label="Username"      value={detailData.username} />
          <DetailRow label="Email"         value={detailData.email} />
          <DetailRow label="NIM"           value={detailData.nim} />
          <DetailRow label="No. HP"        value={detailData.no_hp} />
          <DetailRow label="Tahun Masuk"   value={detailData.tahun_masuk} />
          <DetailRow label="Program Studi" value={`${detailData.jenjang} ${detailData.nama_prodi}`} />
          <DetailRow label="Jurusan"       value={detailData.nama_jurusan} />
          <DetailRow label="Kampus"        value={detailData.nama_kampus} />
          <DetailRow label="Program"       value={detailData.nama_program} />
          <DetailRow label="Tahun Daftar"  value={detailData.tahun} />
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.slate, textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.75 }}>Status Lolos</Typography>
            <StatusPill label={ls.label} colorType={ls.colorType} />
          </Box>
        </Box>

        <Divider sx={{ borderColor: COLORS.slateLight }} />
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#1E293B" }}>Informasi Tim</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
          <DetailRow label="Nama Tim" value={detailData.nama_tim} />
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.slate, textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.75 }}>Peran di Tim</Typography>
            {detailData.peran !== undefined && detailData.peran !== null ? (
              <Chip label={detailData.peran === 1 ? "Ketua" : "Anggota"} size="small"
                sx={{ fontSize: 12, fontWeight: 700, backgroundColor: detailData.peran === 1 ? COLORS.primaryLight : COLORS.slateLight, color: detailData.peran === 1 ? COLORS.primary : COLORS.slate }} />
            ) : <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#1E293B" }}>-</Typography>}
          </Box>
          {as && (
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.slate, textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.75 }}>Status Keanggotaan</Typography>
              <StatusPill label={as.label} colorType={as.colorType} />
            </Box>
          )}
          {detailData.catatan_anggota && (
            <Box sx={{ gridColumn: { sm: "1 / -1" }, p: 2.5, backgroundColor: COLORS.errorLight, borderRadius: "12px", border: `1.5px solid ${COLORS.error}20` }}>
              <Typography sx={{ fontSize: 12, color: COLORS.error, fontWeight: 700, mb: 0.5 }}>Catatan</Typography>
              <Typography sx={{ fontSize: 13, color: "#7F1D1D" }}>{detailData.catatan_anggota}</Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ borderColor: COLORS.slateLight }} />
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#1E293B" }}>Proposal Tim</Typography>
        {detailData.proposal ? (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
            <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
              <DetailRow label="Judul Proposal" value={detailData.proposal.judul} />
            </Box>
            <DetailRow label="Kategori"         value={detailData.proposal.nama_kategori} />
            <DetailRow label="Modal Diajukan"   value={formatCurrency(detailData.proposal.modal_diajukan)} />
            <DetailRow label="Dosen Pembimbing" value={getDosenPembimbingName(detailData.proposal)} />
            <DetailRow label="Tanggal Submit"   value={formatDate(detailData.proposal.tanggal_submit)} />
            <DetailRow label="Jadwal Wawancara" value={formatDate(detailData.proposal.wawancara_at)} />
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.slate, textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.75 }}>Status Proposal</Typography>
              {ps && <StatusPill label={ps.label} colorType={ps.colorType} />}
            </Box>
          </Box>
        ) : (
          <Typography sx={{ fontSize: 13, color: COLORS.slate }}>Belum ada proposal</Typography>
        )}
      </Box>
    );
  };

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box sx={{ px: 1, py: 1 }}>
          {/* Page Header */}
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: { xs: 26, sm: 32, md: 36 }, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              Tim & Peserta
            </Typography>
            <Typography sx={{ fontSize: { xs: 14, sm: 16 }, color: "#6B7280" }}>
              Manajemen data tim dan peserta program kewirausahaan
            </Typography>
          </Box>

          <Paper sx={{
            borderRadius: "20px",
            border: "1.5px solid #E5E7EB",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}>
            {/* Accent bar */}
            <Box sx={{ height: 4, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />

            {/* Tabs */}
            <Box sx={{ borderBottom: "1px solid #F1F5F9", backgroundColor: "#fff" }}>
              <Tabs
                value={activeTab}
                onChange={(e, v) => { setActiveTab(v); setPage(1); }}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  px: { xs: 2, sm: 3 },
                  "& .MuiTab-root": {
                    textTransform: "none", fontSize: { xs: 13, sm: 14 }, fontWeight: 600,
                    color: COLORS.slate, minHeight: 60, transition: "all 0.2s",
                    "&.Mui-selected": { color: COLORS.primary },
                  },
                  "& .MuiTabs-indicator": { backgroundColor: COLORS.primary, height: 3, borderRadius: "3px 3px 0 0" },
                }}
              >
                <Tab label="Data Tim" />
                <Tab label="Daftar Peserta" />
              </Tabs>
            </Box>

            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              {/* Filter Bar */}
              <Box sx={{
                display: "flex",
                gap: { xs: 1.25, sm: 2 },
                mb: 4,
                flexWrap: "wrap",
                alignItems: { xs: "stretch", sm: "center" },
                flexDirection: { xs: "column", sm: "row" },
              }}>
                <TextField
                  size="small"
                  placeholder={activeTab === 0 ? "Cari nama tim, ketua..." : "Cari nama, email, NIM..."}
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ fontSize: 20, color: COLORS.slate }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    ...roundedField,
                    width: { xs: "100%", sm: "auto" },
                    minWidth: { sm: 260 },
                    flex: { sm: "1 1 260px" },
                  }}
                />
                <TextField
                  select size="small"
                  value={filters.id_program}
                  onChange={(e) => setFilters({ ...filters, id_program: e.target.value })}
                  disabled
                  sx={{
                    ...roundedField,
                    width: { xs: "100%", sm: "auto" },
                    minWidth: { sm: 200 },
                    flex: { sm: "0 1 200px" },
                  }}
                >
                  {programList.map((p) => (
                    <MenuItem key={p.id_program} value={p.id_program} sx={{ fontSize: 13 }}>{p.keterangan}</MenuItem>
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
                    width: { xs: "100%", sm: "auto" },
                    minWidth: { sm: 150 },
                    flex: { sm: "0 1 150px" },
                  }}
                >
                  <MenuItem value="" sx={{ fontSize: 13 }}>Semua Tahun</MenuItem>
                  {tahunOptions.map((tahun) => (
                    <MenuItem key={tahun} value={String(tahun)} sx={{ fontSize: 13 }}>{tahun}</MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Content */}
              {loading ? (
                <Box sx={{ position: "relative", minHeight: 400 }}>
                  <LoadingScreen message="Memuat data..." overlay minHeight="400px" />
                </Box>
              ) : paginatedList.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 12 }}>
                  <Box sx={{
                    width: 120, height: 120, borderRadius: "50%",
                    backgroundColor: COLORS.slateLight,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    mx: "auto", mb: 3,
                  }}>
                    {activeTab === 0
                      ? <Groups sx={{ fontSize: 52, color: COLORS.primaryMuted }} />
                      : <PersonAdd sx={{ fontSize: 52, color: COLORS.primaryMuted }} />
                    }
                  </Box>
                  <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#1F2937", mb: 1 }}>
                    Tidak ada data {activeTab === 0 ? "tim" : "peserta"}
                  </Typography>
                  <Typography sx={{ fontSize: 16, color: COLORS.slate }}>
                    {filters.search ? "Coba kata kunci pencarian lain" : "Belum ada data yang terdaftar pada program ini"}
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
                    "& table": { minWidth: { xs: 800, sm: 900 } },
                    "&::-webkit-scrollbar": { height: 6 },
                    "&::-webkit-scrollbar-thumb": { backgroundColor: COLORS.slateLight, borderRadius: "3px" },
                  }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          {activeTab === 0
                            ? ["NAMA TIM", "PROGRAM", "KETUA", "DOSEN PEMBIMBING", "ANGGOTA", "PROPOSAL", "AKSI"].map((h, i) => (
                                <TableCell key={i} sx={tableHeadCell}>{h}</TableCell>
                              ))
                            : ["NAMA PESERTA", "NIM", "PROGRAM", "TIM", "DOSEN PEMBIMBING", "PERAN", "STATUS LOLOS", "AKSI"].map((h, i) => (
                                <TableCell key={i} sx={tableHeadCell}>{h}</TableCell>
                              ))
                          }
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {activeTab === 0
                          ? paginatedList.map((item) => {
                              const proposalStatus = item.id_proposal ? (PROPOSAL_STATUS[item.status_proposal] || PROPOSAL_STATUS[0]) : null;
                              return (
                                <TableRow key={item.id_tim} sx={tableBodyRow}>
                                  <TableCell>
                                    <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#1E293B" }}>{item.nama_tim}</Typography>
                                  </TableCell>
                                  <TableCell><Typography sx={{ fontSize: 13, color: "#475569" }}>{item.nama_program}</Typography></TableCell>
                                  <TableCell>
                                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>{item.nama_ketua || "-"}</Typography>
                                    {item.nim_ketua && <Typography sx={{ fontSize: 11, color: COLORS.slate }}>{item.nim_ketua}</Typography>}
                                  </TableCell>
                                  <TableCell><Typography sx={{ fontSize: 13, color: "#475569", whiteSpace: "nowrap" }}>{getDosenPembimbingName(item)}</Typography></TableCell>
                                  <TableCell><Typography sx={{ fontSize: 13, color: "#475569" }}>{item.jumlah_anggota} orang</Typography></TableCell>
                                  <TableCell>
                                    {proposalStatus
                                      ? <StatusPill label={proposalStatus.label} colorType={proposalStatus.colorType} />
                                      : <Typography sx={{ fontSize: 12, color: COLORS.slate }}>Belum ada</Typography>
                                    }
                                  </TableCell>
                                  <TableCell align="center">
                                    <Button size="small" variant="outlined"
                                      onClick={() => handleViewTimDetail(item)}
                                      sx={{
                                        textTransform: "none", borderRadius: "10px",
                                        fontSize: 12, fontWeight: 700, px: 2,
                                        color: COLORS.primary, borderColor: COLORS.primaryMuted,
                                        "&:hover": { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
                                      }}
                                    >
                                      Detail
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          : paginatedList.map((item) => {
                              const ls = LOLOS_STATUS[item.status_lolos] || LOLOS_STATUS[0];
                              return (
                                <TableRow key={`${item.id_user}-${item.id_program}`} sx={tableBodyRow}>
                                  <TableCell>
                                    <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#1E293B" }}>{item.nama_lengkap || item.username}</Typography>
                                    <Typography sx={{ fontSize: 11, color: COLORS.slate }}>@{item.username}</Typography>
                                  </TableCell>
                                  <TableCell><Typography sx={{ fontSize: 13, color: "#475569" }}>{item.nim}</Typography></TableCell>
                                  <TableCell><Typography sx={{ fontSize: 13, color: "#475569" }}>{item.nama_program}</Typography></TableCell>
                                  <TableCell><Typography sx={{ fontSize: 13, color: "#475569" }}>{item.nama_tim || "-"}</Typography></TableCell>
                                  <TableCell><Typography sx={{ fontSize: 13, color: "#475569", whiteSpace: "nowrap" }}>{getDosenPembimbingName(item)}</Typography></TableCell>
                                  <TableCell>
                                    {item.peran !== undefined && item.peran !== null
                                      ? <Chip label={item.peran === 1 ? "Ketua" : "Anggota"} size="small"
                                          sx={{ fontSize: 11, fontWeight: 700, backgroundColor: item.peran === 1 ? COLORS.primaryLight : COLORS.slateLight, color: item.peran === 1 ? COLORS.primary : COLORS.slate }} />
                                      : <Typography sx={{ fontSize: 12, color: COLORS.slate }}>-</Typography>
                                    }
                                  </TableCell>
                                  <TableCell><StatusPill label={ls.label} colorType={ls.colorType} /></TableCell>
                                  <TableCell align="center">
                                    <Button size="small" variant="outlined"
                                      onClick={() => handleViewPesertaDetail(item)}
                                      sx={{
                                        textTransform: "none", borderRadius: "10px",
                                        fontSize: 12, fontWeight: 700, px: 2,
                                        color: COLORS.primary, borderColor: COLORS.primaryMuted,
                                        "&:hover": { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
                                      }}
                                    >
                                      Detail
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                        }
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Pagination */}
                  <Box sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                  }}>
                    <Typography sx={{ fontSize: 14, color: COLORS.slate, fontWeight: 500 }}>
                      Menampilkan <b>{((page - 1) * rowsPerPage) + 1}–{Math.min(page * rowsPerPage, filteredList.length)}</b> dari <b>{filteredList.length}</b> data
                    </Typography>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={(e, v) => setPage(v)}
                      color="primary"
                      shape="rounded"
                      sx={{
                        "& .MuiPaginationItem-root": {
                          fontWeight: 600,
                          borderRadius: "8px",
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
          </Paper>

          {/* Dialog Detail */}
          <Dialog
            open={openDetail}
            onClose={() => setOpenDetail(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)", overflow: "hidden", m: { xs: 1, sm: 2 }, maxHeight: { xs: "calc(100vh - 16px)", sm: "calc(100vh - 32px)" } } }}
          >
            <DialogTitle sx={{ p: 0 }}>
              <Box sx={{
                background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)`,
                p: { xs: 2.5, sm: 3 }, color: "#fff", position: "relative",
              }}>
                <Typography sx={{ fontWeight: 800, fontSize: { xs: 16, sm: 18 }, letterSpacing: "-0.01em" }}>
                  {activeTab === 0 ? "Detail Tim" : "Detail Peserta"}
                </Typography>
                {selectedItem && (
                  <Typography sx={{ fontSize: { xs: 12, sm: 13 }, opacity: 0.9, mt: 0.5, fontWeight: 500 }}>
                    {activeTab === 0 ? selectedItem.nama_tim : (selectedItem.nama_lengkap || selectedItem.username)}
                  </Typography>
                )}
                <IconButton
                  onClick={() => setOpenDetail(false)}
                  sx={{ position: "absolute", right: 16, top: 20, color: "#fff", "&:hover": { backgroundColor: "rgba(255,255,255,0.15)" } }}
                >
                  <Close sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>
            </DialogTitle>

            <DialogContent sx={{ px: { xs: 2.5, sm: 4 }, py: 3 }}>
              {loadingDetail ? (
                <Box sx={{ position: "relative", minHeight: 300 }}>
                  <LoadingScreen message="Memuat detail..." overlay minHeight="300px" />
                </Box>
              ) : (
                <Box sx={{ mt: 1 }}>
                  {activeTab === 0 ? renderTimDetail() : renderPesertaDetail()}
                </Box>
              )}
            </DialogContent>

            <DialogActions sx={{
              px: { xs: 2.5, sm: 4 }, py: 3,
              backgroundColor: "#F8FAFC",
              borderTop: "1.5px solid #E2E8F0",
              justifyContent: "flex-end",
            }}>
              <Button
                onClick={() => setOpenDetail(false)}
                variant="contained"
                sx={{
                  textTransform: "none", borderRadius: "12px", px: 4, py: 1, fontWeight: 700,
                  backgroundColor: COLORS.primary,
                  boxShadow: `0 4px 12px ${COLORS.primary}40`,
                  "&:hover": { backgroundColor: COLORS.primaryDark, boxShadow: `0 6px 16px ${COLORS.primary}60` },
                }}
              >
                Tutup
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}