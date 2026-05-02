import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Pagination,
  Tooltip,
} from "@mui/material";
import { Close, PersonAdd } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import {
  getPendingMahasiswa,
  getDetailMahasiswa,
  approveMahasiswa,
  rejectMahasiswa,
} from "../../api/admin";
import { getAllProdi } from "../../api/public";

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

const StatusPill = ({ label, type }) => {
  const colorMap = {
    warning: { bg: COLORS.warningLight, text: COLORS.warning },
    success: { bg: COLORS.successLight, text: COLORS.success },
    error:   { bg: "#FEF2F2",           text: COLORS.error },
    primary: { bg: COLORS.primaryLight,  text: COLORS.primary },
    slate:   { bg: COLORS.slateLight,    text: COLORS.slate },
  };
  const colors = colorMap[type] || colorMap.slate;
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
    day: "2-digit", month: "short", year: "numeric",
  });
};

const STATUS_MAP = {
  0: { label: "Menunggu",  type: "warning" },
  1: { label: "Disetujui", type: "success" },
  2: { label: "Ditolak",   type: "error"   },
};

const getStatusInfo = (status) =>
  STATUS_MAP[status] || { label: "Unknown", type: "slate" };

const swalOverDialogOptions = {
  customClass: { container: "swal-over-dialog" },
  didOpen: () => {
    const container = document.querySelector(".swal-over-dialog");
    if (container) container.style.zIndex = "99999";
  },
};

export default function VerifikasiPage() {
  const [loading, setLoading]           = useState(true);
  const [mahasiswaList, setMahasiswaList] = useState([]);
  const [prodiOptions, setProdiOptions]   = useState([]);
  const [openDetail, setOpenDetail]       = useState(false);
  const [openReject, setOpenReject]       = useState(false);
  const [selectedUser, setSelectedUser]   = useState(null);
  const [detailData, setDetailData]       = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [catatan, setCatatan]             = useState("");
  const [errors, setErrors]               = useState({});
  const [page, setPage]                   = useState(1);
  const rowsPerPage = 10;
  const [tahunFilter, setTahunFilter]     = useState("");
  const [totalItems, setTotalItems]       = useState(0);
  const [totalPages, setTotalPages]       = useState(1);

  const [filters, setFilters] = useState({
    status_verifikasi: "",
    email_verified:    "",
    id_prodi:          "",
    tanggal_dari:      "",
    tanggal_sampai:    "",
  });

  const tahunOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  const getDateRangeFilters = useCallback(() => {
    if (tahunFilter) {
      return { tanggal_dari: `${tahunFilter}-01-01`, tanggal_sampai: `${tahunFilter}-12-31` };
    }
    return {
      tanggal_dari:    filters.tanggal_dari    || undefined,
      tanggal_sampai:  filters.tanggal_sampai  || undefined,
    };
  }, [tahunFilter, filters.tanggal_dari, filters.tanggal_sampai]);

  useEffect(() => {
    getAllProdi().then((res) => setProdiOptions(res.data || [])).catch(() => {});
  }, []);

  const fetchMahasiswa = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPendingMahasiswa({
        status_verifikasi: filters.status_verifikasi !== "" ? parseInt(filters.status_verifikasi) : undefined,
        email_verified:    filters.email_verified    !== "" ? filters.email_verified               : undefined,
        id_prodi:          filters.id_prodi          || undefined,
        ...getDateRangeFilters(),
        page,
        limit: rowsPerPage,
      });
      setMahasiswaList(res.data || []);
      if (res.pagination) {
        setTotalItems(res.pagination.total || 0);
        setTotalPages(res.pagination.total_pages || 1);
      }
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat data mahasiswa", confirmButtonColor: COLORS.primary });
    } finally {
      setLoading(false);
    }
  }, [getDateRangeFilters, filters.status_verifikasi, filters.email_verified, filters.id_prodi, page]);

  useEffect(() => { setPage(1); }, [tahunFilter, filters.status_verifikasi, filters.email_verified, filters.id_prodi]);
  useEffect(() => { fetchMahasiswa(); }, [fetchMahasiswa]);

  const handleViewDetail = async (user) => {
    setSelectedUser(user);
    setDetailData(null);
    setOpenDetail(true);
    setLoadingDetail(true);
    try {
      const res = await getDetailMahasiswa(user.id_user);
      setDetailData(res.data);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat detail pengguna", confirmButtonColor: COLORS.primary });
      setOpenDetail(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleApprove = async () => {
    setOpenDetail(false);
    const result = await Swal.fire({
      title: "Konfirmasi",
      text: `Setujui mahasiswa ${selectedUser?.nama_lengkap || selectedUser?.username}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: COLORS.success, cancelButtonColor: COLORS.slate,
      confirmButtonText: "Ya, Setujui", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) { setOpenDetail(true); return; }
    try {
      await approveMahasiswa(selectedUser.id_user);
      await Swal.fire({ icon: "success", title: "Berhasil", text: "Mahasiswa berhasil disetujui", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchMahasiswa();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menyetujui pengguna", confirmButtonColor: COLORS.primary });
      setOpenDetail(true);
    }
  };

  const handleOpenReject = () => {
    setOpenDetail(false);
    setOpenReject(true);
    setCatatan("");
    setErrors({});
  };

  const handleCloseReject = () => {
    setOpenReject(false);
    setOpenDetail(true);
    setCatatan("");
    setErrors({});
  };

  const handleReject = async () => {
    if (!catatan || catatan.trim().length < 5) {
      setErrors({ catatan: "Catatan penolakan minimal 5 karakter" });
      return;
    }
    const result = await Swal.fire({
      ...swalOverDialogOptions,
      title: "Konfirmasi",
      text: `Tolak mahasiswa ${selectedUser?.nama_lengkap || selectedUser?.username}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: COLORS.error, cancelButtonColor: COLORS.slate,
      confirmButtonText: "Ya, Tolak", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    try {
      await rejectMahasiswa(selectedUser.id_user, catatan.trim());
      setOpenReject(false);
      await Swal.fire({ icon: "success", title: "Berhasil", text: "Mahasiswa berhasil ditolak", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      setCatatan("");
      setErrors({});
      fetchMahasiswa();
    } catch (err) {
      await Swal.fire({
        ...swalOverDialogOptions,
        icon: "error", title: "Gagal",
        text: err.response?.data?.message || "Gagal menolak pengguna",
        confirmButtonColor: COLORS.primary,
      });
    }
  };

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box sx={{ px: 1, py: 1 }}>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: { xs: 26, sm: 32, md: 36 }, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              Verifikasi Pengguna
            </Typography>
            <Typography sx={{ fontSize: { xs: 14, sm: 16 }, color: "#6B7280" }}>
              Kelola verifikasi akun mahasiswa dalam sistem
            </Typography>
          </Box>

          <Paper sx={{
            borderRadius: "20px",
            border: "1.5px solid #E5E7EB",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}>
            <Box sx={{ height: 4, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />

            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <Box sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 1fr",
                  lg: "repeat(3, minmax(0, 1fr))",
                  xl: "repeat(6, minmax(0, 1fr))",
                },
                gap: { xs: 1.25, sm: 1.5, lg: 2 },
                mb: 4,
                alignItems: "stretch",
              }}>
                <TextField
                  select size="small"
                  value={filters.status_verifikasi}
                  onChange={(e) => setFilters({ ...filters, status_verifikasi: e.target.value })}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (v) => (
                      <span style={{ fontSize: 14, color: v === "" ? "#9CA3AF" : "inherit" }}>
                        {v === "" ? "Semua Status" : v === "0" ? "Menunggu" : v === "1" ? "Disetujui" : "Ditolak"}
                      </span>
                    ),
                  }}
                  sx={{ ...roundedField, width: "100%" }}
                >
                  <MenuItem value="" sx={{ fontSize: 13 }}>Semua Status</MenuItem>
                  <MenuItem value={0} sx={{ fontSize: 13 }}>Menunggu</MenuItem>
                  <MenuItem value={1} sx={{ fontSize: 13 }}>Disetujui</MenuItem>
                  <MenuItem value={2} sx={{ fontSize: 13 }}>Ditolak</MenuItem>
                </TextField>

                <TextField
                  select size="small"
                  value={filters.email_verified}
                  onChange={(e) => setFilters({ ...filters, email_verified: e.target.value })}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (v) => (
                      <span style={{ fontSize: 14, color: !v ? "#9CA3AF" : "inherit" }}>
                        {!v ? "Semua Email" : v === "true" ? "Sudah Verified" : "Belum Verified"}
                      </span>
                    ),
                  }}
                  sx={{ ...roundedField, width: "100%" }}
                >
                  <MenuItem value="" sx={{ fontSize: 13 }}>Semua Email</MenuItem>
                  <MenuItem value="true" sx={{ fontSize: 13 }}>Sudah Verified</MenuItem>
                  <MenuItem value="false" sx={{ fontSize: 13 }}>Belum Verified</MenuItem>
                </TextField>

                <TextField
                  select size="small"
                  value={filters.id_prodi}
                  onChange={(e) => setFilters({ ...filters, id_prodi: e.target.value })}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (v) => (
                      <span style={{ fontSize: 14, color: !v ? "#9CA3AF" : "inherit" }}>
                        {!v ? "Semua Prodi" : prodiOptions.find(p => p.id_prodi === v)?.nama_prodi || v}
                      </span>
                    ),
                  }}
                  sx={{ ...roundedField, width: "100%" }}
                >
                  <MenuItem value="" sx={{ fontSize: 13 }}>Semua Prodi</MenuItem>
                  {prodiOptions.map((p) => (
                    <MenuItem key={p.id_prodi} value={p.id_prodi} sx={{ fontSize: 13 }}>
                      {p.jenjang} {p.nama_prodi}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  type="date" size="small"
                  label="Tanggal Dari"
                  value={filters.tanggal_dari}
                  onChange={(e) => setFilters({ ...filters, tanggal_dari: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ ...roundedField, width: "100%" }}
                />

                <TextField
                  type="date" size="small"
                  label="Tanggal Sampai"
                  value={filters.tanggal_sampai}
                  onChange={(e) => setFilters({ ...filters, tanggal_sampai: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ ...roundedField, width: "100%" }}
                />

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
                  sx={{ ...roundedField, width: "100%" }}
                >
                  <MenuItem value="" sx={{ fontSize: 13 }}>Semua Tahun</MenuItem>
                  {tahunOptions.map((tahun) => (
                    <MenuItem key={tahun} value={String(tahun)} sx={{ fontSize: 13 }}>{tahun}</MenuItem>
                  ))}
                </TextField>
              </Box>

              {loading ? (
                <Box sx={{ position: "relative", minHeight: 400 }}>
                  <LoadingScreen message="Memuat data verifikasi..." overlay minHeight="400px" />
                </Box>
              ) : mahasiswaList.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 12 }}>
                  <Box sx={{
                    width: 120, height: 120, borderRadius: "50%",
                    backgroundColor: COLORS.slateLight,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    mx: "auto", mb: 3,
                  }}>
                    <PersonAdd sx={{ fontSize: 52, color: COLORS.primaryMuted }} />
                  </Box>
                  <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#1F2937", mb: 1 }}>
                    Tidak ada data mahasiswa
                  </Typography>
                  <Typography sx={{ fontSize: 16, color: COLORS.slate }}>
                    Data verifikasi akan muncul di sini
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
                    <Table>
                      <TableHead>
                        <TableRow>
                          {["NAMA LENGKAP", "NIM", "EMAIL", "PRODI", "TANGGAL DAFTAR", "STATUS", "AKSI"].map((h, i) => (
                            <TableCell key={i} sx={tableHeadCell}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {mahasiswaList.map((user) => {
                          const si = getStatusInfo(user.status_verifikasi);
                          return (
                            <TableRow key={user.id_user} sx={tableBodyRow}>
                              <TableCell>
                                <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                                  {user.nama_lengkap || user.username}
                                </Typography>
                                <Typography sx={{ fontSize: 12, color: "#aaa" }}>@{user.username}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ fontSize: 13 }}>{user.nim}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ fontSize: 13 }}>{user.email}</Typography>
                              </TableCell>
                              <TableCell sx={{ width: 220, maxWidth: 220 }}>
                                <Tooltip title={`${user.jenjang || ""} ${user.nama_prodi || ""}`.trim()}>
                                  <Typography sx={{
                                    fontSize: 13, whiteSpace: "nowrap",
                                    overflow: "hidden", textOverflow: "ellipsis", display: "block",
                                  }}>
                                    {user.jenjang} {user.nama_prodi}
                                  </Typography>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ fontSize: 13 }}>{formatDate(user.created_at)}</Typography>
                              </TableCell>
                              <TableCell>
                                <StatusPill label={si.label} type={si.type} />
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: "flex", gap: 1 }}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleViewDetail(user)}
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
                                </Box>
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
                      Menampilkan <b>{totalItems > 0 ? (page - 1) * rowsPerPage + 1 : 0}–{Math.min(page * rowsPerPage, totalItems)}</b> dari <b>{totalItems}</b> data
                    </Typography>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={(e, v) => setPage(v)}
                      color="primary"
                      shape="rounded"
                      showFirstButton
                      showLastButton
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

          <Dialog
            open={openDetail}
            onClose={() => setOpenDetail(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: { xs: "16px", sm: "24px" }, overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" } }}
          >
            <DialogTitle sx={{ p: 0 }}>
              <Box sx={{
                background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)`,
                p: 3, color: "#fff", position: "relative",
              }}>
                <Typography sx={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.01em" }}>
                  Detail Mahasiswa
                </Typography>
                {selectedUser && (
                  <Typography sx={{ fontSize: 13, opacity: 0.9, mt: 0.5, fontWeight: 500 }}>
                    {selectedUser.nama_lengkap || selectedUser.username}
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

            <DialogContent sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 } }}>
              {loadingDetail ? (
                <Box sx={{ position: "relative", minHeight: 220 }}>
                  <LoadingScreen message="Memuat detail pengguna..." overlay minHeight="220px" />
                </Box>
              ) : detailData ? (
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mt: 1 }}>
                  {[
                    { label: "Nama Lengkap",    value: detailData.nama_lengkap || "-" },
                    { label: "Username",         value: detailData.username },
                    { label: "Email",            value: detailData.email },
                    { label: "NIM",              value: detailData.nim },
                    { label: "Program Studi",    value: `${detailData.jenjang} ${detailData.nama_prodi}` },
                    { label: "Jurusan",          value: detailData.nama_jurusan || "-" },
                    { label: "Kampus",           value: detailData.nama_kampus  || "-" },
                    { label: "Tahun Masuk",      value: detailData.tahun_masuk },
                    { label: "No. HP",           value: detailData.no_hp || "-" },
                  ].map(({ label, value }) => (
                    <Box key={label}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.slate, textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.75 }}>
                        {label}
                      </Typography>
                      <Typography sx={{ fontWeight: 600, fontSize: 14, color: "#1E293B" }}>{value}</Typography>
                    </Box>
                  ))}

                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.slate, textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.75 }}>
                      Email Verified
                    </Typography>
                    <StatusPill
                      label={detailData.email_verified_at ? "Sudah" : "Belum"}
                      type={detailData.email_verified_at ? "success" : "error"}
                    />
                  </Box>

                  <Box>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.slate, textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.75 }}>
                      Status Verifikasi
                    </Typography>
                    <StatusPill
                      label={getStatusInfo(detailData.status_verifikasi).label}
                      type={getStatusInfo(detailData.status_verifikasi).type}
                    />
                  </Box>

                  <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.slate, textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.75 }}>
                      Alamat
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: 14, color: "#1E293B" }}>{detailData.alamat || "-"}</Typography>
                  </Box>

                  {detailData.foto_ktm && (
                    <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.slate, textTransform: "uppercase", letterSpacing: "0.05em", mb: 1 }}>
                        Foto KTM
                      </Typography>
                      <img
                        src={`/uploads/ktm/${detailData.foto_ktm}`}
                        alt="KTM"
                        style={{ maxWidth: "100%", maxHeight: 400, objectFit: "contain", border: `1.5px solid ${COLORS.slateLight}`, borderRadius: 12 }}
                      />
                    </Box>
                  )}

                  {detailData.catatan && (
                    <Box sx={{
                      gridColumn: { sm: "1 / -1" },
                      p: 2.5, borderRadius: "12px",
                      backgroundColor: "#FEF2F2",
                      border: `1.5px solid ${COLORS.errorLight}`,
                    }}>
                      <Typography sx={{ fontSize: 12, color: COLORS.error, fontWeight: 700, mb: 0.5 }}>
                        Catatan Penolakan
                      </Typography>
                      <Typography sx={{ fontSize: 14, color: "#7F1D1D" }}>{detailData.catatan}</Typography>
                    </Box>
                  )}
                </Box>
              ) : null}
            </DialogContent>

            <DialogActions sx={{
              px: { xs: 2.5, sm: 4 }, py: { xs: 2, sm: 3 },
              backgroundColor: "#F8FAFC",
              borderTop: "1.5px solid #E2E8F0",
              gap: 1.5,
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "flex-end",
              "& > button": { width: { xs: "100%", sm: "auto" } },
            }}>
              <Button
                onClick={() => setOpenDetail(false)}
                sx={{
                  textTransform: "none", borderRadius: "12px", px: 4, py: 1, fontWeight: 700,
                  color: COLORS.slate, border: `1.5px solid ${COLORS.slateLight}`,
                  "&:hover": { backgroundColor: COLORS.slateLight },
                }}
              >
                Tutup
              </Button>
              {detailData?.status_verifikasi === 0 && (
                <>
                  <Button
                    variant="contained"
                    onClick={handleOpenReject}
                    sx={{
                      textTransform: "none", borderRadius: "12px", px: 4, fontWeight: 700,
                      backgroundColor: COLORS.error,
                      boxShadow: "0 4px 12px rgba(220,38,38,0.2)",
                      "&:hover": { backgroundColor: "#B91C1C", boxShadow: "0 6px 16px rgba(220,38,38,0.3)" },
                    }}
                  >
                    Tolak
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleApprove}
                    sx={{
                      textTransform: "none", borderRadius: "12px", px: 4, fontWeight: 700,
                      backgroundColor: COLORS.success,
                      boxShadow: "0 4px 12px rgba(5,150,105,0.2)",
                      "&:hover": { backgroundColor: "#047857", boxShadow: "0 6px 16px rgba(5,150,105,0.3)" },
                    }}
                  >
                    Setujui
                  </Button>
                </>
              )}
            </DialogActions>
          </Dialog>

          <Dialog
            open={openReject}
            onClose={handleCloseReject}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: { xs: "16px", sm: "24px" }, overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" } }}
          >
            <DialogTitle sx={{ p: 0 }}>
              <Box sx={{
                background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)`,
                p: 3, color: "#fff", position: "relative",
              }}>
                <Typography sx={{ fontWeight: 800, fontSize: 18 }}>Tolak Mahasiswa</Typography>
                {selectedUser && (
                  <Typography sx={{ fontSize: 13, opacity: 0.9, mt: 0.5, fontWeight: 500 }}>
                    {selectedUser.nama_lengkap || selectedUser.username}
                  </Typography>
                )}
                <IconButton
                  onClick={handleCloseReject}
                  sx={{ position: "absolute", right: 16, top: 20, color: "#fff", "&:hover": { backgroundColor: "rgba(255,255,255,0.15)" } }}
                >
                  <Close sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>
            </DialogTitle>

            <DialogContent sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 } }}>
              <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                <Box sx={{
                  p: 2.5, borderRadius: "12px",
                  backgroundColor: "#FEF2F2",
                  border: `1.5px solid ${COLORS.errorLight}`,
                }}>
                  <Typography sx={{ fontSize: 12, color: COLORS.error, fontWeight: 700, mb: 0.5 }}>
                    Mahasiswa yang akan ditolak
                  </Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#7F1D1D" }}>
                    {selectedUser?.nama_lengkap || selectedUser?.username}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>
                    Catatan Penolakan <span style={{ color: COLORS.error }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth multiline rows={4}
                    placeholder="Masukkan catatan penolakan (minimal 5 karakter)..."
                    value={catatan}
                    onChange={(e) => { setCatatan(e.target.value); setErrors({}); }}
                    error={!!errors.catatan}
                    helperText={errors.catatan}
                    sx={roundedField}
                  />
                </Box>
              </Box>
            </DialogContent>

            <DialogActions sx={{
              px: { xs: 2.5, sm: 4 }, py: { xs: 2, sm: 3 },
              backgroundColor: "#F8FAFC",
              borderTop: "1.5px solid #E2E8F0",
              gap: 1.5,
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "flex-end",
              "& > button": { width: { xs: "100%", sm: "auto" } },
            }}>
              <Button
                onClick={handleCloseReject}
                sx={{
                  textTransform: "none", borderRadius: "12px", px: 4, py: 1, fontWeight: 700,
                  color: COLORS.slate, border: `1.5px solid ${COLORS.slateLight}`,
                  "&:hover": { backgroundColor: COLORS.slateLight },
                }}
              >
                Batal
              </Button>
              <Button
                variant="contained"
                onClick={handleReject}
                sx={{
                  textTransform: "none", borderRadius: "12px", px: 4, fontWeight: 700,
                  backgroundColor: COLORS.error,
                  boxShadow: "0 4px 12px rgba(220,38,38,0.2)",
                  "&:hover": { backgroundColor: "#B91C1C", boxShadow: "0 6px 16px rgba(220,38,38,0.3)" },
                }}
              >
                Tolak Mahasiswa
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}