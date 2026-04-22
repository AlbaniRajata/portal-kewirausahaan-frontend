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
  CircularProgress,
  IconButton,
  Pagination,
  Tooltip,
} from "@mui/material";
import {
  Close,
  PersonAdd,
} from "@mui/icons-material";
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

const roundedField = { "& .MuiOutlinedInput-root": { borderRadius: "15px" } };

const tableHeadCell = {
  fontWeight: 700,
  fontSize: 13,
  color: "#000",
  backgroundColor: "#fafafa",
  borderBottom: "2px solid #f0f0f0",
  py: 2,
};

const tableBodyRow = { "& td": { borderBottom: "1px solid #f5f5f5", py: 2 } };

const stickyAksiHead = {
  ...tableHeadCell,
  textAlign: "center",
  position: "sticky",
  right: 0,
  backgroundColor: "#fafafa",
  zIndex: 2,
  boxShadow: "-2px 0 6px rgba(0,0,0,0.04)",
};

const stickyAksiCell = {
  position: "sticky",
  right: 0,
  backgroundColor: "#fff",
  zIndex: 1,
  boxShadow: "-2px 0 6px rgba(0,0,0,0.04)",
  borderBottom: "1px solid #f5f5f5",
  py: 2,
};

const StatusPill = ({ label, backgroundColor }) => (
  <Box
    sx={{
      display: "inline-flex",
      alignItems: "center",
      px: 1.5,
      py: 0.4,
      borderRadius: "50px",
      backgroundColor,
      color: "#fff",
      fontSize: 12,
      fontWeight: 700,
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </Box>
);

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const STATUS_MAP = {
  0: { label: "Menunggu", backgroundColor: "#f57f17" },
  1: { label: "Disetujui", backgroundColor: "#2e7d32" },
  2: { label: "Ditolak", backgroundColor: "#c62828" },
};

const swalOverDialogOptions = {
  customClass: { container: "swal-over-dialog" },
  didOpen: () => {
    const container = document.querySelector(".swal-over-dialog");
    if (container) container.style.zIndex = "99999";
  },
};

const getStatusInfo = (status) =>
  STATUS_MAP[status] || { label: "Unknown", backgroundColor: "#bdbdbd" };

export default function VerifikasiPage() {
  const [loading, setLoading] = useState(true);
  const [mahasiswaList, setMahasiswaList] = useState([]);
  const [prodiOptions, setProdiOptions] = useState([]);
  const [openDetail, setOpenDetail] = useState(false);
  const [openReject, setOpenReject] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [errors, setErrors] = useState({});
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [tahunFilter, setTahunFilter] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState({
    status_verifikasi: "",
    email_verified: "",
    id_prodi: "",
    tanggal_dari: "",
    tanggal_sampai: "",
  });

  const tahunOptions = Array.from({ length: 6 }, (_, idx) => new Date().getFullYear() - idx);

  const getDateRangeFilters = useCallback(() => {
    if (tahunFilter) {
      return {
        tanggal_dari: `${tahunFilter}-01-01`,
        tanggal_sampai: `${tahunFilter}-12-31`,
      };
    }
    return {
      tanggal_dari: filters.tanggal_dari || undefined,
      tanggal_sampai: filters.tanggal_sampai || undefined,
    };
  }, [tahunFilter, filters.tanggal_dari, filters.tanggal_sampai]);

  useEffect(() => {
    getAllProdi()
      .then((res) => {
        setProdiOptions(res.data || []);
      })
      .catch(() => {});
  }, []);

  const fetchMahasiswa = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPendingMahasiswa({
        status_verifikasi:
          filters.status_verifikasi !== ""
            ? parseInt(filters.status_verifikasi)
            : undefined,
        email_verified:
          filters.email_verified !== "" ? filters.email_verified : undefined,
        id_prodi: filters.id_prodi || undefined,
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
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Gagal memuat data mahasiswa",
        confirmButtonColor: "#0D59F2",
      });
    } finally {
      setLoading(false);
    }
  }, [
    getDateRangeFilters,
    filters.status_verifikasi,
    filters.email_verified,
    filters.id_prodi,
    page,
  ]);

  useEffect(() => {
    setPage(1);
  }, [tahunFilter, filters.status_verifikasi, filters.email_verified, filters.id_prodi]);

  useEffect(() => {
    fetchMahasiswa();
  }, [fetchMahasiswa]);

  const handleViewDetail = async (user) => {
    setSelectedUser(user);
    setDetailData(null);
    setOpenDetail(true);
    setLoadingDetail(true);
    try {
      const res = await getDetailMahasiswa(user.id_user);
      setDetailData(res.data);
    } catch {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Gagal memuat detail pengguna",
        confirmButtonColor: "#0D59F2",
      });
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
      confirmButtonColor: "#2e7d32",
      cancelButtonColor: "#666",
      confirmButtonText: "Ya, Setujui",
      cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) {
      setOpenDetail(true);
      return;
    }
    try {
      await approveMahasiswa(selectedUser.id_user);
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Mahasiswa berhasil disetujui",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      fetchMahasiswa();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.response?.data?.message || "Gagal menyetujui pengguna",
        confirmButtonColor: "#0D59F2",
      });
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
      confirmButtonColor: "#d33",
      cancelButtonColor: "#666",
      confirmButtonText: "Ya, Tolak",
      cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) {
      return;
    }
    try {
      await rejectMahasiswa(selectedUser.id_user, catatan.trim());
      setOpenReject(false);
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Mahasiswa berhasil ditolak",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      setCatatan("");
      setErrors({});
      fetchMahasiswa();
    } catch (err) {
      await Swal.fire({
        ...swalOverDialogOptions,
        icon: "error",
        title: "Gagal",
        text: err.response?.data?.message || "Gagal menolak pengguna",
        confirmButtonColor: "#0D59F2",
      });
    }
  };

const paginatedList = mahasiswaList;

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
            Verifikasi Pengguna
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>
            Kelola verifikasi mahasiswa
          </Typography>

          <Paper
            sx={{
              borderRadius: "16px",
              border: "1px solid #f0f0f0",
              overflow: "hidden",
            }}
          >
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Status Verifikasi"
                  value={filters.status_verifikasi}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      status_verifikasi: e.target.value,
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{ ...roundedField, minWidth: 160, flex: "1 1 160px" }}
                >
                  <MenuItem value="">Semua</MenuItem>
                  <MenuItem value={0}>Menunggu</MenuItem>
                  <MenuItem value={1}>Disetujui</MenuItem>
                  <MenuItem value={2}>Ditolak</MenuItem>
                </TextField>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Email Verified"
                  value={filters.email_verified}
                  onChange={(e) =>
                    setFilters({ ...filters, email_verified: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{ ...roundedField, minWidth: 160, flex: "1 1 160px" }}
                >
                  <MenuItem value="">Semua</MenuItem>
                  <MenuItem value="true">Sudah Verified</MenuItem>
                  <MenuItem value="false">Belum Verified</MenuItem>
                </TextField>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Program Studi"
                  value={filters.id_prodi}
                  onChange={(e) =>
                    setFilters({ ...filters, id_prodi: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{ ...roundedField, minWidth: 200, flex: "1 1 200px" }}
                >
                  <MenuItem value="">Semua</MenuItem>
                  {prodiOptions.map((prodi) => (
                    <MenuItem key={prodi.id_prodi} value={prodi.id_prodi}>
                      {prodi.jenjang} {prodi.nama_prodi}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  type="date"
                  size="small"
                  label="Tanggal Dari"
                  value={filters.tanggal_dari}
                  onChange={(e) =>
                    setFilters({ ...filters, tanggal_dari: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{ ...roundedField, minWidth: 150, flex: "1 1 150px" }}
                />
                <TextField
                  fullWidth
                  type="date"
                  size="small"
                  label="Tanggal Sampai"
                  value={filters.tanggal_sampai}
                  onChange={(e) =>
                    setFilters({ ...filters, tanggal_sampai: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  sx={{ ...roundedField, minWidth: 150, flex: "1 1 150px" }}
                />
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Tahun"
                  value={tahunFilter}
                  onChange={(e) => setTahunFilter(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ ...roundedField, minWidth: 150, flex: "1 1 150px" }}
                >
                  <MenuItem value="">Semua Tahun</MenuItem>
                  {tahunOptions.map((tahun) => (
                    <MenuItem key={tahun} value={String(tahun)}>{tahun}</MenuItem>
                  ))}
                </TextField>
              </Box>

              {loading ? (
                <Box sx={{ position: "relative", minHeight: 320 }}>
                  <LoadingScreen message="Memuat data verifikasi..." overlay minHeight="320px" />
                </Box>
              ) : paginatedList.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 10 }}>
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: "50%",
                      backgroundColor: "#f5f5f5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: 3,
                    }}
                  >
                    <PersonAdd sx={{ fontSize: 48, color: "#ccc" }} />
                  </Box>
                  <Typography
                    sx={{ fontSize: 20, fontWeight: 700, color: "#444", mb: 1 }}
                  >
                    Tidak ada data mahasiswa
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: "#999" }}>
                    Data verifikasi akan muncul di sini
                  </Typography>
                </Box>
              ) : (
                <>
                  <TableContainer
                    sx={{
                      borderRadius: "12px",
                      border: "1px solid #f0f0f0",
                      overflow: "auto",
                      mb: 3,
                    }}
                  >
                    <Table>
                      <TableHead>
                        <TableRow>
                          {[
                            "Username",
                            "NIM",
                            "Email",
                            "Prodi",
                            "Tanggal Daftar",
                            "Status",
                          ].map((h, i) => (
                            <TableCell key={i} sx={tableHeadCell}>
                              {h}
                            </TableCell>
                          ))}
                          <TableCell sx={stickyAksiHead}>Aksi</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedList.map((user) => {
                          const si = getStatusInfo(user.status_verifikasi);
                          return (
                            <TableRow key={user.id_user} sx={tableBodyRow}>
                              <TableCell>
                                <Typography
                                  sx={{ fontWeight: 700, fontSize: 14 }}
                                >
                                  {user.nama_lengkap || user.username}
                                </Typography>
                                <Typography sx={{ fontSize: 12, color: "#aaa" }}>
                                  @{user.username}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ fontSize: 13 }}>
                                  {user.nim}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ fontSize: 13 }}>
                                  {user.email}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ width: 220, maxWidth: 220 }}>
                                <Tooltip
                                  title={`${user.jenjang || ""} ${user.nama_prodi || ""}`.trim()}
                                >
                                  <Typography
                                    sx={{
                                      fontSize: 13,
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      display: "block",
                                    }}
                                  >
                                    {user.jenjang} {user.nama_prodi}
                                  </Typography>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ fontSize: 13 }}>
                                  {formatDate(user.created_at)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <StatusPill
                                  label={si.label}
                                  backgroundColor={si.backgroundColor}
                                />
                              </TableCell>
                              <TableCell sx={stickyAksiCell}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: 1,
                                    justifyContent: "center",
                                    flexWrap: "nowrap",
                                  }}
                                >
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleViewDetail(user)}
                                    sx={{
                                      textTransform: "none",
                                      borderRadius: "50px",
                                      fontSize: 12,
                                      fontWeight: 600,
                                      px: 2,
                                      borderColor: "#0D59F2",
                                      color: "#0D59F2",
                                      "&:hover": {
                                        backgroundColor: "#f0f4ff",
                                        borderColor: "#0D59F2",
                                      },
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

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography sx={{ fontSize: 13, color: "#777" }}>
                      Menampilkan {totalItems > 0 ? (page - 1) * rowsPerPage + 1 : 0}–
                      {Math.min(page * rowsPerPage, totalItems)} dari{" "}
                      {totalItems} data
                    </Typography>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={(e, v) => setPage(v)}
                      color="primary"
                      shape="rounded"
                      showFirstButton
                      showLastButton
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
            PaperProps={{ sx: { borderRadius: "16px" } }}
          >
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ pr: 4 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
                  Detail Mahasiswa
                </Typography>
                {selectedUser && (
                  <Typography sx={{ fontSize: 13, color: "#777", mt: 0.5 }}>
                    {selectedUser.nama_lengkap || selectedUser.username}
                  </Typography>
                )}
              </Box>
              <IconButton
                onClick={() => setOpenDetail(false)}
                sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ px: 3, py: 3 }}>
              {loadingDetail ? (
                <Box sx={{ position: "relative", minHeight: 220 }}>
                  <LoadingScreen message="Memuat detail pengguna..." overlay minHeight="220px" />
                </Box>
              ) : detailData ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 3,
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>
                      Nama Lengkap
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                      {detailData.nama_lengkap || "-"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>
                      Username
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                      {detailData.username}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>
                      Email
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                      {detailData.email}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>
                      NIM
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                      {detailData.nim}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>
                      Program Studi
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                      {detailData.jenjang} {detailData.nama_prodi}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>
                      Jurusan
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                      {detailData.nama_jurusan || "-"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>
                      Kampus
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                      {detailData.nama_kampus || "-"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>
                      Tahun Masuk
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                      {detailData.tahun_masuk}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>
                      No. HP
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                      {detailData.no_hp || "-"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>
                      Email Verified
                    </Typography>
                    <StatusPill
                      label={detailData.email_verified_at ? "Sudah" : "Belum"}
                      backgroundColor={
                        detailData.email_verified_at ? "#2e7d32" : "#c62828"
                      }
                    />
                  </Box>
                  <Box sx={{ gridColumn: "1 / -1" }}>
                    <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>
                      Alamat
                    </Typography>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                      {detailData.alamat || "-"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>
                      Status Verifikasi
                    </Typography>
                    <StatusPill
                      label={getStatusInfo(detailData.status_verifikasi).label}
                      backgroundColor={
                        getStatusInfo(detailData.status_verifikasi)
                          .backgroundColor
                      }
                    />
                  </Box>
                  {detailData.foto_ktm && (
                    <Box sx={{ gridColumn: "1 / -1" }}>
                      <Typography sx={{ fontSize: 12, color: "#888", mb: 1 }}>
                        Foto KTM
                      </Typography>
                      <img
                        src={`/uploads/ktm/${detailData.foto_ktm}`}
                        alt="KTM"
                        style={{
                          maxWidth: "100%",
                          maxHeight: 400,
                          objectFit: "contain",
                          border: "1px solid #e0e0e0",
                          borderRadius: 12,
                        }}
                      />
                    </Box>
                  )}
                  {detailData.catatan && (
                    <Box
                      sx={{
                        gridColumn: "1 / -1",
                        p: 2.5,
                        backgroundColor: "#fce4ec",
                        borderRadius: "12px",
                        border: "1px solid #ef9a9a",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: "#c62828",
                          fontWeight: 700,
                          mb: 0.5,
                        }}
                      >
                        Catatan Penolakan
                      </Typography>
                      <Typography sx={{ fontSize: 14 }}>
                        {detailData.catatan}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : null}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
              <Button
                onClick={() => setOpenDetail(false)}
                variant="contained"
                sx={{
                  textTransform: "none",
                  borderRadius: "50px",
                  px: 4,
                  fontWeight: 600,
                  backgroundColor: "#FDB022",
                  "&:hover": { backgroundColor: "#e09a1a" },
                }}
              >
                Tutup
              </Button>
              {detailData?.status_verifikasi === 0 && (
                <>
                  <Button
                    variant="outlined"
                    onClick={handleOpenReject}
                    sx={{
                      textTransform: "none",
                      borderRadius: "50px",
                      px: 3,
                      py: 1,
                      fontWeight: 600,
                      borderColor: "#e53935",
                      color: "#e53935",
                      "&:hover": { backgroundColor: "rgba(229,57,53,0.06)" },
                    }}
                  >
                    Tolak
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleApprove}
                    sx={{
                      textTransform: "none",
                      borderRadius: "50px",
                      px: 3,
                      py: 1,
                      fontWeight: 600,
                      backgroundColor: "#2e7d32",
                      "&:hover": { backgroundColor: "#1b5e20" },
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
            PaperProps={{ sx: { borderRadius: "16px" } }}
          >
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ pr: 4 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
                  Tolak Mahasiswa
                </Typography>
                {selectedUser && (
                  <Typography sx={{ fontSize: 13, color: "#777", mt: 0.5 }}>
                    {selectedUser.nama_lengkap || selectedUser.username}
                  </Typography>
                )}
              </Box>
              <IconButton
                onClick={handleCloseReject}
                sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ px: 3, py: 3 }}>
              <Box
                sx={{
                  p: 2.5,
                  backgroundColor: "#fce4ec",
                  borderRadius: "12px",
                  border: "1px solid #ef9a9a",
                  mb: 3,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 12,
                    color: "#c62828",
                    fontWeight: 700,
                    mb: 0.5,
                  }}
                >
                  Mahasiswa yang akan ditolak
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                  {selectedUser?.nama_lengkap || selectedUser?.username}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
                  Catatan Penolakan <span style={{ color: "#ef5350" }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Masukkan catatan penolakan (minimal 5 karakter)..."
                  value={catatan}
                  onChange={(e) => {
                    setCatatan(e.target.value);
                    setErrors({});
                  }}
                  error={!!errors.catatan}
                  helperText={errors.catatan}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
              <Button
                onClick={handleCloseReject}
                variant="contained"
                sx={{
                  textTransform: "none",
                  borderRadius: "50px",
                  px: 4,
                  fontWeight: 600,
                  backgroundColor: "#FDB022",
                  "&:hover": { backgroundColor: "#e09a1a" },
                }}
              >
                Batal
              </Button>
              <Button
                variant="contained"
                onClick={handleReject}
                sx={{
                  textTransform: "none",
                  borderRadius: "50px",
                  px: 3,
                  fontWeight: 600,
                  backgroundColor: "#e53935",
                  "&:hover": { backgroundColor: "#c62828" },
                }}
              >
                Tolak
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}
