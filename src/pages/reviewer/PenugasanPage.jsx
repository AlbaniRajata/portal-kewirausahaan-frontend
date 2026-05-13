import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box, Paper, Typography, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, InputAdornment, Tabs, Tab, Collapse,
} from "@mui/material";
import { Close, Assignment, FilterList, Search, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import ReviewerNavbar from "../../components/layouts/ReviewerNavbar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import { getListPenugasan, acceptPenugasan, rejectPenugasan, getPeringkat, bulkSubmitPenilaian } from "../../api/reviewer";

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
  fontWeight: 700, fontSize: 13, color: "#374151",
  backgroundColor: "#f9fafb", borderBottom: "2px solid #e5e7eb", py: 2.5,
  textTransform: "uppercase", letterSpacing: "0.025em"
};

const tableBodyRow = {
  "&:hover": { backgroundColor: "#f3f4f6" },
  "& td": { borderBottom: "1px solid #f1f5f9", py: 2.2 },
};

const SectionHeader = ({ icon: Icon, title, subtitle, gradient }) => (
  <Box sx={{
    display: "flex", alignItems: "center", gap: 2, mb: 3,
    p: 2.5, borderRadius: "14px", background: gradient,
  }}>
    <Box sx={{
      width: 44, height: 44, borderRadius: "12px",
      background: "rgba(255,255,255,0.25)",
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(4px)",
    }}>
      <Icon sx={{ color: "#fff", fontSize: 22 }} />
    </Box>
    <Box>
      <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{title}</Typography>
      {subtitle && <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.8)", mt: 0.3 }}>{subtitle}</Typography>}
    </Box>
  </Box>
);

const StatusPill = ({ label, backgroundColor }) => (
  <Box sx={{
    display: "inline-flex", alignItems: "center",
    px: 1.5, py: 0.4, borderRadius: "50px",
    backgroundColor, color: "#fff",
    fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
  }}>
    {label}
  </Box>
);

const FieldLabel = ({ children, required }) => (
  <Typography sx={{ fontWeight: 600, mb: 0.8, fontSize: 13, color: "#374151", display: "flex", gap: 0.4 }}>
    {children}
    {required && <span style={{ color: COLORS.error }}>*</span>}
  </Typography>
);

const getStatusInfo = (status) => {
  const map = {
    0: { label: "Menunggu Response", backgroundColor: "#f57f17" },
    1: { label: "Disetujui",         backgroundColor: COLORS.success },
    2: { label: "Ditolak",           backgroundColor: COLORS.error },
    3: { label: "Draft Penilaian",   backgroundColor: COLORS.secondary },
    4: { label: "Selesai Dinilai",   backgroundColor: "#6a1b9a" },
  };
  return map[status] || { label: "Unknown", backgroundColor: COLORS.slate };
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const toNumberOrNull = (value) => {
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const isAcceptedStatus = (status) => [1, 3, 4].includes(Number(status));

const RowPeringkat = ({ item, index, selected, onSelect, onEdit, onSubmit }) => {
  const [open, setOpen] = useState(false);
  const canSubmit = Number(item.status_distribusi) === 3;
  const statusInfo = getStatusInfo(item.status_distribusi);

  return (
    <>
      <TableRow 
        sx={{ 
          ...tableBodyRow, 
          backgroundColor: selected ? COLORS.primaryLight : "inherit",
          "& td": { borderBottom: open ? "none" : "1px solid #f5f5f5", py: 2 } 
        }}
      >
        <TableCell align="center">
          {canSubmit && (
            <input 
              type="checkbox" 
              checked={selected} 
              onChange={(e) => { e.stopPropagation(); onSelect(item.id_distribusi); }}
              style={{ width: 18, height: 18, cursor: "pointer" }}
            />
          )}
        </TableCell>
        <TableCell align="center" onClick={() => setOpen(!open)} sx={{ cursor: "pointer" }}>
          <Box sx={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, borderRadius: "50%",
            backgroundColor: index < 3 ? COLORS.primaryLight : COLORS.slateLight,
            color: index < 3 ? COLORS.primary : COLORS.slate,
            fontWeight: 700, fontSize: 14
          }}>
            {item.peringkat}
          </Box>
        </TableCell>
        <TableCell onClick={() => setOpen(!open)} sx={{ cursor: "pointer" }}>
          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{item.judul}</Typography>
        </TableCell>
        <TableCell onClick={() => setOpen(!open)} sx={{ cursor: "pointer" }}>
          <Typography sx={{ fontSize: 13 }}>{item.nama_tim}</Typography>
        </TableCell>
        <TableCell onClick={() => setOpen(!open)} sx={{ cursor: "pointer" }}>
          <Typography sx={{ fontSize: 13 }}>{item.nama_kategori}</Typography>
        </TableCell>
        <TableCell align="center" onClick={() => setOpen(!open)} sx={{ cursor: "pointer" }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16, color: COLORS.primary }}>
            {item.total_nilai}
          </Typography>
        </TableCell>
        <TableCell align="center">
          <StatusPill label={statusInfo.label} backgroundColor={statusInfo.backgroundColor} />
        </TableCell>
        <TableCell align="center">
          <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
            {item.status_distribusi === 3 && (
              <>
                <Button 
                  size="small" 
                  onClick={() => onEdit(item.id_distribusi)}
                  variant="contained"
                  sx={{
                    textTransform: "none", borderRadius: "10px",
                    fontSize: 12, fontWeight: 600, px: 2,
                    background: `linear-gradient(135deg, ${COLORS.warning}, #F59E0B)`,
                    boxShadow: "none",
                    "&:hover": { background: `linear-gradient(135deg, #D97706, ${COLORS.warning})`, boxShadow: "none" },
                    "&:disabled": { background: "#E5E7EB", color: "#9CA3AF", boxShadow: "none" },
                  }}
                >
                  Edit
                </Button>
                <Button 
                  size="small" 
                  onClick={() => onSubmit(item)}
                  variant="contained"
                  sx={{
                    textTransform: "none", borderRadius: "10px",
                    fontSize: 12, fontWeight: 600, px: 2,
                    background: `linear-gradient(135deg, ${COLORS.success}, #10B981)`,
                    boxShadow: "none",
                    "&:hover": { background: `linear-gradient(135deg, #059669, ${COLORS.success})`, boxShadow: "none" },
                  }}
                >
                  Ajukan
                </Button>
              </>
            )}
          </Box>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ px: 4, py: 3, backgroundColor: "#fcfdff" }}>
              <Box sx={{ 
                p: 3, borderRadius: "16px", backgroundColor: "#fff", 
                border: "1px solid #eef2ff", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" 
              }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                  <Box sx={{ width: 4, height: 20, borderRadius: 2, backgroundColor: COLORS.primary }} />
                  <Typography variant="h6" sx={{ fontSize: 15, fontWeight: 700, color: COLORS.primaryDark }}>
                    Rincian Penilaian Kriteria
                  </Typography>
                </Box>
                
                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #f0f3ff", borderRadius: "12px", overflow: "hidden" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f8faff" }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12, color: COLORS.slate, py: 1.5 }}>KRITERIA</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12, color: COLORS.slate, py: 1.5 }}>BOBOT</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12, color: COLORS.slate, py: 1.5 }}>SKOR (1-5)</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12, color: COLORS.slate, py: 1.5 }}>NILAI AKHIR</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(item.detail_nilai || []).map((dn) => (
                        <TableRow key={dn.id_kriteria} sx={{ "&:last-child td": { border: 0 }, "&:hover": { backgroundColor: "#fcfdff" } }}>
                          <TableCell sx={{ fontSize: 13, fontWeight: 500, color: "#334155", py: 1.8 }}>{dn.nama_kriteria}</TableCell>
                          <TableCell align="center" sx={{ fontSize: 13, color: COLORS.slate }}>{dn.bobot}%</TableCell>
                          <TableCell align="center">
                            <Box sx={{ 
                              display: "inline-flex", px: 1.2, py: 0.3, borderRadius: "6px", 
                              backgroundColor: "#f1f5f9", fontWeight: 700, fontSize: 12, color: "#475569" 
                            }}>
                              {dn.skor}
                            </Box>
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: 14, fontWeight: 700, color: COLORS.primary }}>
                            {dn.nilai}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default function PenugasanPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [penugasan, setPenugasan] = useState([]);
  const [tahapFilter, setTahapFilter] = useState(() => {
    const param = searchParams.get("tahap");
    return param || localStorage.getItem("reviewer_penugasan_tahap") || "1";
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [rejectDialog, setRejectDialog] = useState({ open: false, penugasan: null });
  const [catatan, setCatatan] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [pairApprovalMap, setPairApprovalMap] = useState({});
  const [activeTab, setActiveTab] = useState(() => {
    const param = searchParams.get("tab");
    return Number(param) || Number(localStorage.getItem("reviewer_penugasan_tab")) || 0;
  });
  const [peringkatList, setPeringkatList] = useState([]);
  const [loadingPeringkat, setLoadingPeringkat] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const isFirstRender = useRef(true);

  // Sync state to URL and LocalStorage
  useEffect(() => {
    localStorage.setItem("reviewer_penugasan_tahap", tahapFilter);
    localStorage.setItem("reviewer_penugasan_tab", activeTab);
    
    setSearchParams(prev => {
      prev.set("tahap", tahapFilter);
      prev.set("tab", activeTab);
      return prev;
    }, { replace: true });
  }, [tahapFilter, activeTab, setSearchParams]);

  // Smart Initial Default (If no saved preference and Stage 1 is empty, try Stage 2)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      const saved = localStorage.getItem("reviewer_penugasan_tahap");
      const param = searchParams.get("tahap");
      
      if (!saved && !param) {
        const checkSmartDefault = async () => {
          try {
            const res1 = await getListPenugasan("1");
            if (res1.success && res1.data.penugasan?.length === 0) {
              const res2 = await getListPenugasan("2");
              if (res2.success && res2.data.penugasan?.length > 0) {
                setTahapFilter("2");
              }
            }
          } catch (e) { /* ignore */ }
        };
        checkSmartDefault();
      }
    }
  }, []);

  const fetchPenugasan = useCallback(async () => {
    try {
      setLoading(true);
      setPairApprovalMap({});
      const response = await getListPenugasan(tahapFilter, statusFilter);
      if (response.success) {
        const list = response.data.penugasan || [];
        setPenugasan(list);
        if (tahapFilter === "2" && list.length > 0) {
          const details = list.map((item) => {
            const tahap = toNumberOrNull(item?.urutan_tahap ?? item?.tahap);
            const statusReviewer = toNumberOrNull(item?.status_reviewer);
            const statusJuri = toNumberOrNull(item?.status_juri);
            const blocked = tahap === 2 && !(isAcceptedStatus(statusReviewer) && isAcceptedStatus(statusJuri));
            return [item.id_distribusi, { tahap, statusReviewer, statusJuri, blocked }];
          });
          setPairApprovalMap(Object.fromEntries(details));
        }
      } else {
        await Swal.fire({ icon: "warning", title: "Peringatan", text: response.message || "Gagal memuat daftar penugasan", confirmButtonText: "OK" });
      }
    } catch {
      await Swal.fire({ icon: "error", title: "Gagal Memuat", text: "Gagal memuat daftar penugasan. Silahkan refresh halaman.", confirmButtonText: "OK" });
    } finally {
      setLoading(false);
    }
  }, [tahapFilter, statusFilter]);

  useEffect(() => { fetchPenugasan(); }, [fetchPenugasan]);

  const fetchPeringkatData = useCallback(async () => {
    try {
      setLoadingPeringkat(true);
      const response = await getPeringkat(tahapFilter);
      if (response.success) {
        setPeringkatList(response.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingPeringkat(false);
    }
  }, [tahapFilter]);

  useEffect(() => {
    if (activeTab === 1) {
      fetchPeringkatData();
      setSelectedIds([]);
    }
  }, [activeTab, fetchPeringkatData]);

  const handleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const submittable = peringkatList.filter(item => Number(item.status_distribusi) === 3).map(item => item.id_distribusi);
    if (selectedIds.length === submittable.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(submittable);
    }
  };

  const handleBulkSubmit = async () => {
    if (selectedIds.length === 0) return;

    const result = await Swal.fire({
      title: "Konfirmasi Submit Bulk",
      html: `Anda akan mengajukan <b>${selectedIds.length} penilaian</b> sekaligus.<br/><br/>Tindakan ini tidak dapat dibatalkan. Yakin?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: COLORS.success,
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Ajukan Semua",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      setBulkSubmitting(true);
      const response = await bulkSubmitPenilaian(selectedIds);
      if (response.success) {
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: response.message,
          timer: 3000,
          timerProgressBar: true,
        });
        fetchPeringkatData();
        fetchPenugasan();
        setSelectedIds([]);
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: response.message });
      }
    } catch (err) {
      Swal.fire({ 
        icon: "error", 
        title: "Terjadi Kesalahan", 
        text: err.response?.data?.message || "Gagal melakukan bulk submit" 
      });
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleAccept = async (item) => {
    const result = await Swal.fire({
      title: "Konfirmasi",
      html: `Terima penugasan untuk proposal:<br/><br/><b>${item.judul}</b>?`,
      icon: "question", showCancelButton: true,
      confirmButtonColor: COLORS.success, cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Terima", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    try {
      setSubmitting(true);
      const response = await acceptPenugasan(item.id_distribusi);
      if (response.success) {
        Swal.fire({ icon: "success", title: "Berhasil", text: response.message, timer: 2000, timerProgressBar: true, showConfirmButton: false });
        fetchPenugasan();
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: response.message, confirmButtonText: "OK" });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Terjadi kesalahan saat menerima penugasan", confirmButtonText: "OK" });
    } finally {
      setSubmitting(false); }
  };

  const handleOpenReject = (item) => {
    setRejectDialog({ open: true, penugasan: item });
    setCatatan(""); setErrors({});
  };

  const handleCloseReject = () => {
    setRejectDialog({ open: false, penugasan: null });
    setCatatan(""); setErrors({});
  };

  const handleReject = async () => {
    if (!catatan || catatan.trim().length < 5) {
      setErrors({ catatan: "Catatan penolakan minimal 5 karakter" });
      return;
    }
    setRejectDialog((prev) => ({ ...prev, open: false }));
    const result = await Swal.fire({
      title: "Konfirmasi",
      html: `Tolak penugasan untuk proposal:<br/><br/><b>${rejectDialog.penugasan.judul}</b>?`,
      icon: "warning", showCancelButton: true,
      confirmButtonColor: COLORS.error, cancelButtonColor: "#666",
      confirmButtonText: "Ya, Tolak", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) { setRejectDialog((prev) => ({ ...prev, open: true })); return; }
    try {
      setSubmitting(true);
      const response = await rejectPenugasan(rejectDialog.penugasan.id_distribusi, catatan.trim());
      if (response.success) {
        Swal.fire({ icon: "success", title: "Berhasil", text: response.message, timer: 2000, timerProgressBar: true, showConfirmButton: false });
        handleCloseReject();
        fetchPenugasan();
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: response.message, confirmButtonText: "OK" });
        setRejectDialog((prev) => ({ ...prev, open: true }));
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Terjadi kesalahan saat menolak penugasan", confirmButtonText: "OK" });
      setRejectDialog((prev) => ({ ...prev, open: true }));
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = penugasan.filter((item) => {
    const matchSearch =
      (item.judul        || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.nama_tim     || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.keterangan   || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.nama_kategori || "").toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const blockedTahap2Count = penugasan.filter((item) => pairApprovalMap[item.id_distribusi]?.blocked).length;

  return (
    <BodyLayout Sidebar={ReviewerNavbar}>
      <PageTransition>
        <Box>

          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              Penugasan Saya
            </Typography>
            <Typography sx={{ fontSize: 16, color: "#6B7280" }}>
              Kelola penugasan penilaian proposal
            </Typography>
          </Box>

          <Paper elevation={0} sx={{ mb: 3, borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <SectionHeader
                icon={FilterList}
                title="Filter Penugasan"
                subtitle="Saring berdasarkan tahap, status, atau kata kunci"
                gradient={`linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`}
              />
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ minWidth: 200, flex: "1 1 auto" }}>
                  <TextField
                    select fullWidth label="Tahap"
                    value={tahapFilter}
                    onChange={(e) => setTahapFilter(e.target.value)}
                    sx={roundedField}
                  >
                    <MenuItem value="1">Tahap 1 - Desk Evaluasi</MenuItem>
                    <MenuItem value="2">Tahap 2 - Wawancara</MenuItem>
                  </TextField>
                </Box>
                <Box sx={{ minWidth: 200, flex: "1 1 auto" }}>
                  <TextField
                    select fullWidth label="Status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={roundedField}
                  >
                    <MenuItem value="">Semua Status</MenuItem>
                    <MenuItem value="0">Menunggu Response</MenuItem>
                    <MenuItem value="1">Disetujui</MenuItem>
                    <MenuItem value="2">Ditolak</MenuItem>
                    <MenuItem value="3">Draft Penilaian</MenuItem>
                    <MenuItem value="4">Selesai Dinilai</MenuItem>
                  </TextField>
                </Box>
                <Box sx={{ minWidth: 280, flex: "2 1 auto" }}>
                  <TextField
                    fullWidth label="Cari"
                    placeholder="Cari judul, tim, program, kategori..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ fontSize: 18, color: COLORS.slate }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={roundedField}
                  />
                </Box>
              </Box>
            </Box>
          </Paper>

          {tahapFilter === "2" && blockedTahap2Count > 0 && (
            <Box sx={{
              mb: 3, p: 2.5, borderRadius: "12px",
              backgroundColor: COLORS.warningLight, border: `1.5px solid #FCD34D`,
              display: "flex", gap: 1.5, alignItems: "flex-start",
            }}>
              <Box sx={{ width: 8, height: 8, mt: 0.5, borderRadius: "50%", background: COLORS.warning, flexShrink: 0 }} />
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORS.warning, mb: 0.25 }}>
                  Penilaian tahap 2 belum aktif untuk sebagian penugasan.
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#92400E" }}>
                  {blockedTahap2Count} penugasan menunggu reviewer dan juri sama-sama menyetujui penugasan.
                </Typography>
              </Box>
            </Box>
          )}

          <Paper elevation={0} sx={{ mb: 3, borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.secondary}, ${COLORS.success})` }} />
            
            <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, mt: 1.5 }}>
              <Tabs
                value={activeTab}
                onChange={(e, val) => setActiveTab(val)}
                sx={{
                  "& .MuiTab-root": {
                    textTransform: "none", fontSize: 15, fontWeight: 600,
                    color: "#9CA3AF", minHeight: 48,
                    "&.Mui-selected": { color: COLORS.primary },
                  },
                  "& .MuiTabs-indicator": {
                    backgroundColor: COLORS.primary, height: 3,
                    borderRadius: "3px 3px 0 0",
                  },
                }}
              >
                <Tab label="Daftar Penugasan" />
                <Tab label="Hasil Peringkat" />
              </Tabs>
            </Box>

            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              {activeTab === 0 ? (
                <SectionHeader
                  icon={Assignment}
                  title="Daftar Penugasan"
                  subtitle={`${filtered.length} penugasan ditemukan`}
                  gradient={`linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.success} 100%)`}
                />
              ) : (
                <SectionHeader
                  icon={Assignment}
                  title="Hasil Peringkat Penilaian"
                  subtitle={`${peringkatList.length} proposal dinilai`}
                  gradient={`linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`}
                />
              )}

              {activeTab === 0 && (
                <>
                  {loading ? (
                <Box sx={{ position: "relative", minHeight: 320 }}>
                  <LoadingScreen message="Memuat penugasan reviewer..." overlay minHeight="320px" />
                </Box>
              ) : filtered.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <Box sx={{
                    width: 90, height: 90, borderRadius: "50%",
                    backgroundColor: COLORS.slateLight,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    mx: "auto", mb: 2.5,
                  }}>
                    <Assignment sx={{ fontSize: 44, color: "#CBD5E1" }} />
                  </Box>
                  <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#374151", mb: 0.5 }}>
                    Belum Ada Penugasan
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: COLORS.slate }}>
                    {search || statusFilter ? "Tidak ada penugasan yang sesuai filter" : "Penugasan penilaian yang diberikan akan muncul di sini"}
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "hidden", overflowX: "auto" }}>
                  <Table sx={{ minWidth: 800 }}>
                    <TableHead>
                      <TableRow>
                        {["Judul Proposal", "Nama Tim", "Program", "Kategori", "Timeline Penilaian", "Status", "Aksi"].map((h, i) => (
                          <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 6 && { textAlign: "center" }) }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtered.map((item) => {
                        const si = getStatusInfo(item.status);
                        return (
                          <TableRow key={item.id_distribusi} sx={tableBodyRow}>
                            <TableCell>
                              <Typography sx={{ fontWeight: 600, fontSize: 14, maxWidth: 280, lineHeight: 1.4 }}>{item.judul}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13 }}>{item.nama_tim}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13 }}>{item.keterangan}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13 }}>{item.nama_kategori}</Typography>
                            </TableCell>
                            <TableCell>
                              {item.penilaian_mulai && item.penilaian_selesai ? (
                                <Box>
                                  <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{formatDate(item.penilaian_mulai)}</Typography>
                                  <Typography sx={{ fontSize: 11, color: "#CBD5E1" }}>s/d</Typography>
                                  <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{formatDate(item.penilaian_selesai)}</Typography>
                                </Box>
                              ) : (
                                <Typography sx={{ fontSize: 13, color: "#CBD5E1" }}>-</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <StatusPill label={si.label} backgroundColor={si.backgroundColor} />
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: "inline-flex", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
                                {item.status === 0 && (
                                  <>
                                    <Button
                                      size="small" variant="contained"
                                      onClick={() => handleOpenReject(item)}
                                      disabled={submitting}
                                      sx={{
                                        textTransform: "none", borderRadius: "10px",
                                        fontSize: 12, fontWeight: 600, px: 2,
                                        background: COLORS.error,
                                        boxShadow: "none",
                                        "&:hover": { background: `linear-gradient(135deg, #B91C1C, ${COLORS.error})`, boxShadow: "none" },
                                        "&:disabled": { background: "#E5E7EB", color: "#9CA3AF", boxShadow: "none" },
                                      }}
                                    >
                                      Tolak
                                    </Button>
                                    <Button
                                      size="small" variant="contained"
                                      onClick={() => handleAccept(item)}
                                      disabled={submitting}
                                      sx={{
                                        textTransform: "none", borderRadius: "10px",
                                        fontSize: 12, fontWeight: 600, px: 2,
                                        background: COLORS.success,
                                        boxShadow: "none",
                                        "&:hover": { background: `linear-gradient(135deg, #047857, ${COLORS.success})`, boxShadow: "none" },
                                        "&:disabled": { background: "#E5E7EB", color: "#9CA3AF", boxShadow: "none" },
                                      }}
                                    >
                                      {submitting ? "Memproses..." : "Terima"}
                                    </Button>
                                  </>
                                )}
                                {item.status !== 0 && (
                                  <>
                                    <Button
                                      size="small" variant="outlined"
                                      onClick={() => navigate(`/reviewer/penugasan/${item.id_distribusi}?tab=0`)}
                                      sx={{
                                        textTransform: "none", borderRadius: "10px",
                                        fontSize: 12, fontWeight: 600, px: 2,
                                        borderColor: COLORS.primary, color: COLORS.primary,
                                        "&:hover": { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
                                      }}
                                    >
                                      Detail
                                    </Button>
                                    {item.status === 1 && (
                                      <Button
                                        size="small" variant="contained"
                                        onClick={() => navigate(`/reviewer/penugasan/${item.id_distribusi}?tab=1`)}
                                        disabled={!!pairApprovalMap[item.id_distribusi]?.blocked}
                                        sx={{
                                          textTransform: "none", borderRadius: "10px",
                                          fontSize: 12, fontWeight: 600, px: 2,
                                          background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
                                          boxShadow: "none",
                                          "&:hover": { background: `linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.primary})`, boxShadow: "none" },
                                          "&:disabled": { background: "#E5E7EB", color: "#9CA3AF", boxShadow: "none" },
                                        }}
                                      >
                                        Nilai
                                      </Button>
                                    )}
                                    {item.status === 3 && (
                                      <Button
                                        size="small" variant="contained"
                                        onClick={() => navigate(`/reviewer/penugasan/${item.id_distribusi}?tab=1`)}
                                        disabled={!!pairApprovalMap[item.id_distribusi]?.blocked}
                                        sx={{
                                          textTransform: "none", borderRadius: "10px",
                                          fontSize: 12, fontWeight: 600, px: 2,
                                          background: `linear-gradient(135deg, ${COLORS.warning}, #F59E0B)`,
                                          boxShadow: "none",
                                          "&:hover": { background: `linear-gradient(135deg, #D97706, ${COLORS.warning})`, boxShadow: "none" },
                                          "&:disabled": { background: "#E5E7EB", color: "#9CA3AF", boxShadow: "none" },
                                        }}
                                      >
                                        Edit
                                      </Button>
                                    )}
                                    {item.status === 4 && (
                                      <Button
                                        size="small" variant="contained"
                                        onClick={() => navigate(`/reviewer/penugasan/${item.id_distribusi}?tab=1`)}
                                        disabled={true}
                                        sx={{
                                          textTransform: "none", borderRadius: "10px",
                                          fontSize: 12, fontWeight: 600, px: 2,
                                          background: "#E5E7EB", color: "#9CA3AF",
                                          boxShadow: "none",
                                        }}
                                      >
                                        Selesai
                                      </Button>
                                    )}
                                  </>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              
              {activeTab === 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ fontSize: 13, color: COLORS.slate }}>Total: {penugasan.length} penugasan</Typography>
                </Box>
              )}
            </>
          )}

          {activeTab === 1 && (
            <>
              {loadingPeringkat ? (
                <Box sx={{ position: "relative", minHeight: 320 }}>
                  <LoadingScreen message="Memuat peringkat..." overlay minHeight="320px" />
                </Box>
              ) : peringkatList.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <Typography sx={{ fontSize: 16, color: COLORS.slate }}>Belum ada hasil peringkat</Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ fontSize: 14, color: COLORS.slate, fontWeight: 500 }}>
                      Pilih draf penilaian yang ingin diajukan (Status: Draft)
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      disabled={selectedIds.length === 0 || bulkSubmitting}
                      onClick={handleBulkSubmit}
                      sx={{
                        textTransform: "none", borderRadius: "10px", fontWeight: 700,
                        backgroundColor: COLORS.success,
                        px: 4, py: 1.5,
                        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
                        "&:hover": { backgroundColor: "#059669", boxShadow: "0 6px 16px rgba(16, 185, 129, 0.3)" },
                        "&:disabled": { background: "#E5E7EB", color: "#9CA3AF" },
                      }}
                    >
                      {bulkSubmitting ? "Memproses..." : `Simpan & Ajukan (${selectedIds.length} Terpilih)`}
                    </Button>
                  </Box>
                  <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "hidden", overflowX: "auto" }}>
                    <Table sx={{ minWidth: 980 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell align="center" sx={tableHeadCell}>
                            <input 
                              type="checkbox" 
                              onChange={handleSelectAll}
                              checked={peringkatList.length > 0 && selectedIds.length === peringkatList.filter(item => Number(item.status_distribusi) === 3).length && selectedIds.length > 0}
                              style={{ width: 18, height: 18, cursor: "pointer" }}
                            />
                          </TableCell>
                          {[
                            "Peringkat",
                            "Judul Proposal",
                            "Nama Tim",
                            "Kategori",
                            "Total Nilai",
                            "Status",
                            "Aksi",
                          ].map((h, i) => (
                            <TableCell
                              key={i}
                              sx={{
                                ...tableHeadCell,
                                ...(i === 0 || i === 4 || i === 5 || i === 6 ? { textAlign: "center" } : {}),
                              }}
                            >
                              {h}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {peringkatList.map((item, i) => (
                          <RowPeringkat 
                            key={item.id_proposal} 
                            item={item} 
                            index={i} 
                            selected={selectedIds.includes(item.id_distribusi)}
                            onSelect={handleSelect}
                            onEdit={(id) => navigate(`/reviewer/penugasan/${id}?tab=1`)}
                            onSubmit={async (item) => {
                              const result = await Swal.fire({
                                title: "Konfirmasi Ajukan Nilai",
                                html: `Anda akan mengajukan penilaian untuk proposal:<br/><br/><b>${item.judul}</b>.<br/><br/>Tindakan ini tidak dapat dibatalkan.`,
                                icon: "warning",
                                showCancelButton: true,
                                confirmButtonColor: COLORS.success,
                                cancelButtonColor: "#d33",
                                confirmButtonText: "Ya, Ajukan",
                                cancelButtonText: "Batal",
                              });

                              if (result.isConfirmed) {
                                try {
                                  const { submitPenilaian } = await import("../../api/reviewer");
                                  const response = await submitPenilaian(item.id_distribusi);
                                  if (response.success) {
                                    Swal.fire({ icon: "success", title: "Berhasil", text: response.message, timer: 2000, showConfirmButton: false });
                                    fetchPeringkatData();
                                    fetchPenugasan();
                                  } else {
                                    Swal.fire({ icon: "error", title: "Gagal", text: response.message });
                                  }
                                } catch (err) {
                                  Swal.fire({ icon: "error", title: "Terjadi Kesalahan", text: err.response?.data?.message || "Gagal mengajukan penilaian" });
                                }
                              }
                            }}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </>
          )}
            </Box>
          </Paper>

        </Box>
      </PageTransition>

      <Dialog
        open={rejectDialog.open}
        onClose={handleCloseReject}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "20px", overflow: "hidden" } }}
      >
        <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.error}, #EF4444)` }} />

        <DialogTitle sx={{ pb: 1.5, pt: 2.5, px: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: "10px",
              background: `linear-gradient(135deg, ${COLORS.error}, #EF4444)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Close sx={{ color: "#fff", fontSize: 18 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: 16, color: "#1F2937" }}>Tolak Penugasan</Typography>
          </Box>
          <IconButton
            onClick={handleCloseReject}
            sx={{ position: "absolute", right: 12, top: 14, color: COLORS.slate, borderRadius: "10px", "&:hover": { backgroundColor: COLORS.slateLight } }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ px: 3, py: 3 }}>
          <Box sx={{
            mb: 3, p: 2.5, borderRadius: "12px",
            backgroundColor: COLORS.errorLight, border: `1.5px solid #FCA5A5`,
            display: "flex", gap: 1.5, alignItems: "flex-start",
          }}>
            <Box sx={{ width: 8, height: 8, mt: 0.5, borderRadius: "50%", background: COLORS.error, flexShrink: 0 }} />
            <Box>
              <Typography sx={{ fontSize: 12, color: COLORS.error, fontWeight: 700, mb: 0.3 }}>
                Proposal yang akan ditolak
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#991B1B" }}>
                {rejectDialog.penugasan?.judul}
              </Typography>
            </Box>
          </Box>

          <FieldLabel required>Catatan Penolakan</FieldLabel>
          <TextField
            fullWidth multiline rows={4}
            placeholder="Masukkan catatan penolakan (minimal 5 karakter)..."
            value={catatan}
            onChange={(e) => { setCatatan(e.target.value); setErrors({}); }}
            error={!!errors.catatan} helperText={errors.catatan}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px", backgroundColor: "#fff",
                "&:hover fieldset": { borderColor: COLORS.error },
                "&.Mui-focused fieldset": { borderColor: COLORS.error },
                "&.Mui-focused": { boxShadow: `0 0 0 3px ${COLORS.errorLight}` },
              },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={handleCloseReject}
            sx={{
              textTransform: "none", borderRadius: "12px", px: 3, py: 1,
              fontWeight: 700, fontSize: 14, color: COLORS.slate,
              border: `1.5px solid #CBD5E1`,
              "&:hover": { backgroundColor: COLORS.slateLight },
            }}
          >
            Batal
          </Button>
          <Button
            variant="contained" onClick={handleReject} disabled={!!submitting}
            sx={{
              textTransform: "none", borderRadius: "12px", px: 3, py: 1,
              fontWeight: 700, fontSize: 14,
              background: `linear-gradient(135deg, ${COLORS.error}, #EF4444)`,
              boxShadow: `0 4px 15px rgba(220,38,38,0.35)`,
              "&:hover": { background: `linear-gradient(135deg, #B91C1C, ${COLORS.error})`, boxShadow: `0 6px 20px rgba(220,38,38,0.45)` },
              "&:disabled": { background: "#E5E7EB", color: "#9CA3AF", boxShadow: "none" },
            }}
          >
            {submitting ? "Memproses..." : "Tolak Penugasan"}
          </Button>
        </DialogActions>
      </Dialog>

    </BodyLayout>
  );
}