import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  LinearProgress,
  Chip,
} from "@mui/material";
import {
  Close,
  ArrowBack,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  RadioButtonUnchecked,
  AttachFile,
  Link as LinkIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import { useParams, useNavigate } from "react-router-dom";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import {
  getProgressLuaranTim,
  getDetailLuaranTim,
  reviewLuaranTim,
} from "../../api/admin";
import { downloadFile } from "../../utils/download";

const COLORS = {
  primary:      "#0D59F2",
  primaryLight: "#E0F2FE",
  primaryDark:  "#0369A1",
  primaryMuted: "#93C5FD",
  secondary:    "#2563EB",
  accent:       "#3B82F6",
  slate:        "#64748B",
  slateLight:   "#F1F5F9",
  warning:      "#D97706",
  warningLight: "#FFFBEB",
  error:        "#DC2626",
  success:      "#059669",
  successLight: "#ECFDF5",
};

const STATUS_MAP = {
  0: {
    label: "Belum Dikerjakan",
    bg: COLORS.slate,
    icon: <RadioButtonUnchecked sx={{ fontSize: 16 }} />,
  },
  1: {
    label: "Submitted",
    bg: COLORS.warning,
    icon: <HourglassEmpty sx={{ fontSize: 16 }} />,
  },
  2: {
    label: "Disetujui",
    bg: COLORS.success,
    icon: <CheckCircle sx={{ fontSize: 16 }} />,
  },
  3: {
    label: "Ditolak",
    bg: COLORS.error,
    icon: <Cancel sx={{ fontSize: 16 }} />,
  },
};

const TIPE_MAP = {
  1: { label: "File", bg: COLORS.primary },
  2: { label: "Link", bg: "#7C3AED" },
  3: { label: "File & Link", bg: COLORS.success },
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

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isDeadlineLewat = (deadline) =>
  deadline && new Date() > new Date(deadline);

const StatusPill = ({ status }) => {
  const s = STATUS_MAP[status ?? 0];
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1.5,
        py: 0.4,
        borderRadius: "50px",
        backgroundColor: s.bg,
        color: "#fff",
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {s.icon}
      {s.label}
    </Box>
  );
};

export default function MonevProgressPage() {
  const { id_program } = useParams();
  const navigate = useNavigate();
  const [progressList, setProgressList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTim, setSelectedTim] = useState(null);
  const [detailLuaran, setDetailLuaran] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [openReview, setOpenReview] = useState(false);
  const [selectedLuaranTim, setSelectedLuaranTim] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    status: "",
    catatan_admin: "",
  });
  const [reviewErrors, setReviewErrors] = useState({});
  const [submittingReview, setSubmittingReview] = useState(false);
  const [tahun, setTahun] = useState("");

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getProgressLuaranTim(id_program);
      setProgressList(res.data || []);
    } catch {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Gagal memuat progress tim",
        confirmButtonColor: "#0D59F2",
      });
    } finally {
      setLoading(false);
    }
  }, [id_program]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const getYearFromProgress = (tim) => {
    const dateValue = tim.tahun || tim.created_at || tim.updated_at || tim.tanggal_submit;
    if (!dateValue) return null;
    if (/^\d{4}$/.test(String(dateValue))) return Number(dateValue);
    const year = new Date(dateValue).getFullYear();
    return Number.isNaN(year) ? null : year;
  };

  const tahunOptions = Array.from(new Set(
    progressList
      .map((tim) => getYearFromProgress(tim))
      .filter(Boolean)
  )).sort((a, b) => b - a);

  const filteredProgressList = tahun === ""
    ? progressList
    : progressList.filter((tim) => getYearFromProgress(tim) === Number(tahun));

  const handleViewDetail = async (tim) => {
    setSelectedTim(tim);
    setDetailLuaran([]);
    setOpenDetail(true);
    setLoadingDetail(true);
    try {
      const res = await getDetailLuaranTim(id_program, tim.id_tim);
      setDetailLuaran(res.data || []);
    } catch {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Gagal memuat detail luaran tim",
        confirmButtonColor: "#0D59F2",
      });
      setOpenDetail(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenReview = (luaranTim) => {
  setOpenDetail(false);
  setSelectedLuaranTim(luaranTim);
  setReviewForm({ status: "", catatan_admin: "" });
  setReviewErrors({});
  setTimeout(() => setOpenReview(true), 200);
};

  const handleCloseReview = () => {
  setOpenReview(false);
  setSelectedLuaranTim(null);
  setReviewForm({ status: "", catatan_admin: "" });
  setReviewErrors({});
  setTimeout(() => setOpenDetail(true), 200);
};

  const validateReview = () => {
    const e = {};
    if (!reviewForm.status) e.status = "Keputusan wajib dipilih";
    if (
      parseInt(reviewForm.status) === 3 &&
      reviewForm.catatan_admin.trim().length < 5
    ) {
      e.catatan_admin = "Catatan wajib diisi minimal 5 karakter jika ditolak";
    }
    setReviewErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmitReview = async () => {
    if (!validateReview()) return;
    setOpenReview(false);
    const statusNum = parseInt(reviewForm.status);
    const result = await Swal.fire({
      title: "Konfirmasi Review",
      text: `${statusNum === 2 ? "Setujui" : "Tolak"} luaran "${selectedLuaranTim?.nama_luaran}" dari tim "${selectedTim?.nama_tim}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: statusNum === 2 ? "#2e7d32" : "#e53935",
      cancelButtonColor: "#666",
      confirmButtonText: statusNum === 2 ? "Ya, Setujui" : "Ya, Tolak",
      cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) {
  setOpenReview(true);
  return;
}
    setSubmittingReview(true);
    try {
      await reviewLuaranTim(selectedLuaranTim.id_luaran_tim, {
        status: statusNum,
        catatan_admin: reviewForm.catatan_admin.trim() || null,
      });
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text:
          statusNum === 2
            ? "Luaran berhasil disetujui"
            : "Luaran berhasil ditolak",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      handleCloseReview();
const res = await getDetailLuaranTim(id_program, selectedTim.id_tim);
setDetailLuaran(res.data || []);
fetchProgress();
setTimeout(() => setOpenDetail(true), 200);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.response?.data?.message || "Gagal melakukan review",
        confirmButtonColor: "#0D59F2",
      });
      setOpenReview(true);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box sx={{ px: 1, py: 1 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate("/admin/monev")}
            sx={{
              textTransform: "none",
              color: COLORS.slate,
              fontSize: 13,
              fontWeight: 600,
              p: 0,
              mb: 2,
              minWidth: 0,
              transition: "all 0.2s",
              "&:hover": { backgroundColor: "transparent", color: COLORS.primary },
            }}
          >
            Kembali
          </Button>

          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: { xs: 26, sm: 32, md: 36 }, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              Progress Luaran Tim
            </Typography>
            <Typography sx={{ fontSize: { xs: 14, sm: 16 }, color: "#6B7280" }}>
              Monitor dan review pengumpulan luaran per tim
            </Typography>
          </Box>

          <Paper
            sx={{
              borderRadius: "20px",
              border: "1.5px solid #E5E7EB",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            }}
          >
            <Box sx={{ height: 4, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
            <Box sx={{ p: { xs: 2.5, sm: 3.5 }, borderBottom: `1.5px solid ${COLORS.slateLight}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <TextField
                select
                size="small"
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
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
                {tahunOptions.map((itemTahun) => (
                  <MenuItem key={itemTahun} value={String(itemTahun)} sx={{ fontSize: 13 }}>{itemTahun}</MenuItem>
                ))}
              </TextField>
              <Typography sx={{ fontSize: 14, color: COLORS.slate, fontWeight: 500 }}>
                Total <b>{filteredProgressList.length} tim</b>
              </Typography>
            </Box>
            {loading ? (
              <Box sx={{ position: "relative", minHeight: 320 }}>
                <LoadingScreen message="Memuat progress tim..." overlay minHeight="320px" />
              </Box>
            ) : filteredProgressList.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 10 }}>
                <Typography
                  sx={{ fontSize: 20, fontWeight: 700, color: "#444", mb: 1 }}
                >
                  Belum Ada Tim
                </Typography>
                <Typography sx={{ fontSize: 14, color: "#999" }}>
                  Belum ada tim yang terdaftar pada program ini
                </Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {[
                        "Nama Tim",
                        "Ketua",
                        "NIM",
                        "Progress",
                        "Submitted",
                        "Disetujui",
                        "Ditolak",
                        "Aksi",
                      ].map((h, i) => (
                        <th
                          key={i}
                          style={{
                            ...tableHeadCell,
                            textAlign: i === 7 ? "center" : "left",
                            padding: "12px 16px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProgressList.map((tim) => {
                      const pct =
                        tim.total_luaran > 0
                          ? Math.round(
                              (tim.total_disetujui / tim.total_luaran) * 100,
                            )
                          : 0;
                      return (
                        <tr
                          key={tim.id_tim}
                          style={{ borderBottom: "1px solid #f5f5f5" }}
                        >
                          <td style={{ padding: "14px 16px" }}>
                            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                              {tim.nama_tim}
                            </Typography>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                              {tim.nama_ketua}
                            </Typography>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <Typography sx={{ fontSize: 13, color: "#555" }}>
                              {tim.nim}
                            </Typography>
                          </td>
                          <td style={{ padding: "14px 16px", minWidth: 180 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <LinearProgress
                                variant="determinate"
                                value={pct}
                                sx={{
                                  flex: 1,
                                  height: 8,
                                  borderRadius: 4,
                                  backgroundColor: "#f0f0f0",
                                  "& .MuiLinearProgress-bar": {
                                    backgroundColor:
                                      pct === 100 ? "#2e7d32" : "#0D59F2",
                                    borderRadius: 4,
                                  },
                                }}
                              />
                              <Typography
                                sx={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "#555",
                                  minWidth: 36,
                                }}
                              >
                                {pct}%
                              </Typography>
                            </Box>
                            <Typography
                              sx={{ fontSize: 11, color: "#888", mt: 0.5 }}
                            >
                              {tim.total_disetujui}/{tim.total_luaran} luaran
                            </Typography>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <Chip
                              label={tim.total_submitted}
                              size="small"
                              sx={{
                                backgroundColor: "#f57f17",
                                color: "#fff",
                                fontWeight: 700,
                              }}
                            />
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <Chip
                              label={tim.total_disetujui}
                              size="small"
                              sx={{
                                backgroundColor: "#2e7d32",
                                color: "#fff",
                                fontWeight: 700,
                              }}
                            />
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <Chip
                              label={tim.total_ditolak}
                              size="small"
                              sx={{
                                backgroundColor: "#c62828",
                                color: "#fff",
                                fontWeight: 700,
                              }}
                            />
                          </td>
                          <td
                            style={{
                              padding: "14px 16px",
                              textAlign: "center",
                            }}
                          >
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleViewDetail(tim)}
                              sx={{
                                textTransform: "none",
                                borderRadius: "50px",
                                fontSize: 12,
                                fontWeight: 600,
                                px: 2,
                                borderColor: "#0D59F2",
                                color: "#0D59F2",
                                "&:hover": { backgroundColor: "#f0f4ff" },
                              }}
                            >
                              Detail
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Box>
            )}
          </Paper>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
          <Button
            onClick={() => navigate("/admin/monev")}
            sx={{
              textTransform: "none",
              borderRadius: "12px",
              px: 4,
              py: 1.2,
              fontWeight: 600,
              backgroundColor: "#FDB022",
              color: "#fff",
              "&:hover": { backgroundColor: "#e09a1a" },
            }}
          >
            Kembali
          </Button>
        </Box>

        <Dialog
          open={openDetail}
          onClose={() => setOpenDetail(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: { xs: "16px", sm: "24px" }, overflow: "hidden" } }}
        >
          <Box sx={{ p: { xs: 1.5, sm: 2 }, display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, color: "#fff" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Detail Luaran Tim</Typography>
              {selectedTim && (
                <Typography sx={{ fontSize: 13, opacity: 0.9, mt: 0.5, fontWeight: 500 }}>{selectedTim.nama_tim}</Typography>
              )}
            </Box>
            <IconButton
              onClick={() => setOpenDetail(false)}
              sx={{ color: "#fff", "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" } }}
            >
              <Close />
            </IconButton>
          </Box>

          <DialogContent sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 } }}>
            {loadingDetail ? (
              <Box sx={{ position: "relative", minHeight: 220 }}>
                <LoadingScreen message="Memuat detail luaran..." overlay minHeight="220px" />
              </Box>
            ) : detailLuaran.length === 0 ? (
              <Typography sx={{ textAlign: "center", color: "#999", py: 4 }}>
                Belum ada data luaran
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {detailLuaran.map((luaran) => {
                  const tipe = TIPE_MAP[luaran.tipe] || {};
                  const lewat = isDeadlineLewat(luaran.deadline);
                  return (
                    <Box
                      key={luaran.id_luaran}
                      sx={{
                        border: `1px solid ${luaran.status === 2 ? "#a5d6a7" : luaran.status === 1 ? "#ffe082" : "#f0f0f0"}`,
                        borderRadius: "12px",
                        p: 2.5,
                        backgroundColor:
                          luaran.status === 2
                            ? "#f9fffe"
                            : luaran.status === 1
                              ? "#fffdf5"
                              : "#fafafa",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 1.5,
                        }}
                      >
                        <Box sx={{ flex: 1, mr: 2 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              mb: 0.25,
                            }}
                          >
                            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                              {luaran.nama_luaran}
                            </Typography>
                            <Chip
                              label={tipe.label}
                              size="small"
                              sx={{
                                backgroundColor: tipe.bg,
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: 11,
                              }}
                            />
                          </Box>
                          {luaran.keterangan && (
                            <Typography sx={{ fontSize: 12, color: "#777" }}>
                              {luaran.keterangan}
                            </Typography>
                          )}
                        </Box>
                        <StatusPill status={luaran.status ?? 0} />
                      </Box>

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 1.5,
                          mb: 1.5,
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontSize: 11, color: "#888" }}>
                            Deadline
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 13,
                              fontWeight: 600,
                              color:
                                lewat && luaran.status !== 2
                                  ? "#c62828"
                                  : "#333",
                            }}
                          >
                            {formatDate(luaran.deadline)}
                          </Typography>
                          {lewat && luaran.status !== 2 && (
                            <Typography
                              sx={{
                                fontSize: 11,
                                color: "#c62828",
                                fontWeight: 600,
                              }}
                            >
                              Sudah Lewat
                            </Typography>
                          )}
                        </Box>
                        {luaran.submitted_at && (
                          <Box>
                            <Typography sx={{ fontSize: 11, color: "#888" }}>
                              Dikumpulkan
                            </Typography>
                            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                              {formatDate(luaran.submitted_at)}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {luaran.id_luaran_tim && (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                            mb: luaran.status === 1 ? 1.5 : 0,
                          }}
                        >
                          {luaran.file_luaran && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <AttachFile
                                sx={{ fontSize: 16, color: "#1565c0" }}
                              />
                              <Button
                                onClick={() => downloadFile(luaran.file_luaran, "luaran")}
                                size="small"
                                sx={{
                                  textTransform: "none",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: "#0D59F2",
                                  p: 0,
                                  minWidth: 0,
                                  "&:hover": {
                                    backgroundColor: "transparent",
                                    textDecoration: "underline",
                                  },
                                }}
                              >
                                {luaran.file_luaran}
                              </Button>
                            </Box>
                          )}
                          {luaran.link_luaran?.length > 0 &&
                            luaran.link_luaran.map((url, idx) => (
                              <Box
                                key={idx}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <LinkIcon
                                  sx={{ fontSize: 16, color: "#6a1b9a" }}
                                />
                                <Button
                                  component="a"
                                  href={url}
                                  target="_blank"
                                  size="small"
                                  sx={{
                                    textTransform: "none",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "#6a1b9a",
                                    p: 0,
                                    minWidth: 0,
                                    "&:hover": {
                                      backgroundColor: "transparent",
                                      textDecoration: "underline",
                                    },
                                  }}
                                >
                                  {url}
                                </Button>
                              </Box>
                            ))}
                          {luaran.catatan_admin && (
                            <Box
                              sx={{
                                mt: 0.5,
                                p: 1.5,
                                backgroundColor: "#fce4ec",
                                borderRadius: "8px",
                                border: "1px solid #ef9a9a",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: 11,
                                  color: "#c62828",
                                  fontWeight: 700,
                                  mb: 0.25,
                                }}
                              >
                                Catatan Admin
                              </Typography>
                              <Typography sx={{ fontSize: 13 }}>
                                {luaran.catatan_admin}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}

                      {luaran.status === 1 && (
                        <Box
                          sx={{ display: "flex", justifyContent: "flex-end" }}
                        >
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleOpenReview(luaran)}
                            sx={{
                              textTransform: "none",
                              borderRadius: "50px",
                              fontSize: 12,
                              fontWeight: 600,
                              px: 2.5,
                              backgroundColor: "#0D59F2",
                              "&:hover": { backgroundColor: "#0846c7" },
                            }}
                          >
                            Review
                          </Button>
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 2, sm: 3 }, backgroundColor: "#F8FAFC", borderTop: "1.5px solid #E2E8F0", gap: 1.5, justifyContent: "flex-end", "& > button": { width: { xs: "100%", sm: "auto" } } }}>
            <Button
              onClick={() => setOpenDetail(false)}
              sx={{
                textTransform: "none",
                borderRadius: "50px",
                px: 4,
                fontWeight: 600,
                backgroundColor: "#FDB022",
                color: "#fff",
                "&:hover": { backgroundColor: "#e09a1a" },
              }}
            >
              Tutup
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openReview}
          onClose={handleCloseReview}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: { xs: "16px", sm: "24px" }, overflow: "hidden" } }}
        >
          <Box sx={{ p: { xs: 1.5, sm: 2 }, display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, color: "#fff" }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Review Luaran</Typography>
            <IconButton
              onClick={handleCloseReview}
              sx={{ color: "#fff", "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" } }}
            >
              <Close />
            </IconButton>
          </Box>

          <DialogContent sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 } }}>
            <Box
              sx={{
                p: 2,
                backgroundColor: "#f0f4ff",
                borderRadius: "12px",
                border: "1px solid #90caf9",
                mb: 3,
              }}
            >
              <Typography
                sx={{
                  fontSize: 12,
                  color: "#1565c0",
                  fontWeight: 700,
                  mb: 0.25,
                }}
              >
                Luaran yang direview
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                {selectedLuaranTim?.nama_luaran}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#777", mt: 0.25 }}>
                Tim: {selectedTim?.nama_tim}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
                  Keputusan <span style={{ color: "#ef5350" }}>*</span>
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={reviewForm.status}
                  onChange={(e) => {
                    setReviewForm({ ...reviewForm, status: e.target.value });
                    setReviewErrors({ ...reviewErrors, status: "" });
                  }}
                  error={!!reviewErrors.status}
                  helperText={reviewErrors.status}
                  disabled={submittingReview}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                >
                  <MenuItem value="">Pilih keputusan</MenuItem>
                  <MenuItem value={2}>Setujui</MenuItem>
                  <MenuItem value={3}>Tolak</MenuItem>
                </TextField>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
                  Catatan{" "}
                  {parseInt(reviewForm.status) === 3 && (
                    <span style={{ color: "#ef5350" }}>*</span>
                  )}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder={
                    parseInt(reviewForm.status) === 3
                      ? "Wajib diisi jika ditolak (min. 5 karakter)..."
                      : "Opsional..."
                  }
                  value={reviewForm.catatan_admin}
                  onChange={(e) => {
                    setReviewForm({
                      ...reviewForm,
                      catatan_admin: e.target.value,
                    });
                    setReviewErrors({ ...reviewErrors, catatan_admin: "" });
                  }}
                  error={!!reviewErrors.catatan_admin}
                  helperText={reviewErrors.catatan_admin}
                  disabled={submittingReview}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button
              onClick={handleCloseReview}
              disabled={submittingReview}
              sx={{
                textTransform: "none",
                borderRadius: "50px",
                px: 4,
                fontWeight: 600,
                backgroundColor: "#FDB022",
                color: "#fff",
                "&:hover": { backgroundColor: "#e09a1a" },
              }}
            >
              Batal
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitReview}
              disabled={submittingReview}
              sx={{
                textTransform: "none",
                borderRadius: "50px",
                px: 4,
                fontWeight: 600,
                backgroundColor:
                  parseInt(reviewForm.status) === 3 ? "#e53935" : "#2e7d32",
                "&:hover": {
                  backgroundColor:
                    parseInt(reviewForm.status) === 3 ? "#c62828" : "#1b5e20",
                },
              }}
            >
              {submittingReview
                ? "Memproses..."
                : parseInt(reviewForm.status) === 3
                  ? "Tolak Luaran"
                  : "Setujui Luaran"}
            </Button>
          </DialogActions>
        </Dialog>
      </PageTransition>
    </BodyLayout>
  );
}
