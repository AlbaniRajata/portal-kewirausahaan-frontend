import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
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
  Alert,
  IconButton,
  Pagination,
} from "@mui/material";
import { CheckCircle, Cancel, Visibility, Close, PersonAdd } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import {
  getPendingMahasiswa,
  getDetailMahasiswa,
  approveMahasiswa,
  rejectMahasiswa,
  getPendingDosen,
  getDetailDosen,
  approveDosen,
  rejectDosen,
} from "../../api/admin";
import { getAllProdi } from "../../api/public";

const roundedField = {
  "& .MuiOutlinedInput-root": { borderRadius: "15px" },
};

const tableHeadCell = {
  fontWeight: 700,
  fontSize: 13,
  color: "#000",
  backgroundColor: "#fafafa",
  borderBottom: "2px solid #f0f0f0",
  py: 2,
};

const tableBodyRow = {
  "& td": { borderBottom: "1px solid #f5f5f5", py: 2 },
};

const StatusPill = ({ label, bg, color }) => (
  <Box sx={{
    display: "inline-flex", alignItems: "center",
    px: 1.5, py: 0.4, borderRadius: "50px",
    backgroundColor: bg, color, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
  }}>
    {label}
  </Box>
);

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const getStatusInfo = (status) => {
  const map = {
    0: { label: "Menunggu", bg: "#f57f17", color: "#fff8e1" },
    1: { label: "Disetujui", bg: "#2e7d32", color: "#e8f5e9" },
    2: { label: "Ditolak", bg: "#c62828", color: "#fce4ec" },
  };
  return map[status] || { label: "Unknown", bg: "#f5f5f5", color: "#666" };
};

export default function VerifikasiPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mahasiswaList, setMahasiswaList] = useState([]);
  const [dosenList, setDosenList] = useState([]);
  const [prodiOptions, setProdiOptions] = useState([]);
  const [openDetail, setOpenDetail] = useState(false);
  const [openReject, setOpenReject] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState("");

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const [filters, setFilters] = useState({
    status_verifikasi: "",
    email_verified: "",
    id_prodi: "",
    tanggal_dari: "",
    tanggal_sampai: "",
  });

  useEffect(() => { fetchProdi(); }, []);

  const fetchMahasiswa = useCallback(async () => {
    try {
      setLoading(true);
      const cleanFilters = {
        status_verifikasi: filters.status_verifikasi !== "" ? filters.status_verifikasi : undefined,
        email_verified: filters.email_verified !== "" ? filters.email_verified : undefined,
        id_prodi: filters.id_prodi || undefined,
        tanggal_dari: filters.tanggal_dari || undefined,
        tanggal_sampai: filters.tanggal_sampai || undefined,
      };
      const response = await getPendingMahasiswa(cleanFilters);
      setMahasiswaList(response.data.mahasiswa);
      setPage(1);
    } catch (err) {
      console.error("Error fetching mahasiswa:", err);
      setAlert("Gagal memuat data mahasiswa");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchDosen = useCallback(async () => {
    try {
      setLoading(true);
      const cleanFilters = {
        status_verifikasi: filters.status_verifikasi !== "" ? filters.status_verifikasi : undefined,
        email_verified: filters.email_verified !== "" ? filters.email_verified : undefined,
        id_prodi: filters.id_prodi || undefined,
        tanggal_dari: filters.tanggal_dari || undefined,
        tanggal_sampai: filters.tanggal_sampai || undefined,
      };
      const response = await getPendingDosen(cleanFilters);
      setDosenList(response.data.dosen);
      setPage(1);
    } catch (err) {
      console.error("Error fetching dosen:", err);
      setAlert("Gagal memuat data dosen");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (activeTab === 0) fetchMahasiswa();
    else fetchDosen();
  }, [activeTab, fetchMahasiswa, fetchDosen]);

  const fetchProdi = async () => {
    try {
      const response = await getAllProdi();
      if (response.success) setProdiOptions(response.data);
    } catch (err) {
      console.error("Error fetching prodi:", err);
    }
  };

  const handleViewDetail = async (user) => {
    setSelectedUser(user);
    setDetailData(null);
    setOpenDetail(true);
    setLoadingDetail(true);
    try {
      if (activeTab === 0) {
        const response = await getDetailMahasiswa(user.id_user);
        setDetailData(response.data.mahasiswa);
      } else {
        const response = await getDetailDosen(user.id_user);
        setDetailData(response.data.dosen);
      }
    } catch (err) {
      console.error("Error fetching user detail:", err);
      setAlert("Gagal memuat detail user");
      setOpenDetail(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleApprove = async () => {
    setOpenDetail(false);
    try {
      const result = await Swal.fire({
        title: "Konfirmasi",
        text: `Setujui ${activeTab === 0 ? "mahasiswa" : "dosen"} ${selectedUser.nama_lengkap || selectedUser.username}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#2e7d32", cancelButtonColor: "#666",
        confirmButtonText: "Ya, Setujui", cancelButtonText: "Batal",
      });
      if (!result.isConfirmed) { setOpenDetail(true); return; }
      if (activeTab === 0) await approveMahasiswa(selectedUser.id_user);
      else await approveDosen(selectedUser.id_user);
      await Swal.fire({ icon: "success", title: "Berhasil", text: `${activeTab === 0 ? "Mahasiswa" : "Dosen"} berhasil disetujui`, timer: 2000, timerProgressBar: true, showConfirmButton: false });
      if (activeTab === 0) fetchMahasiswa();
      else fetchDosen();
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menyetujui user", confirmButtonText: "OK" });
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
    if (!catatan || catatan.trim().length < 10) {
      setErrors({ catatan: "Catatan penolakan minimal 10 karakter" });
      return;
    }
    setOpenReject(false);
    try {
      const result = await Swal.fire({
        title: "Konfirmasi",
        text: `Tolak ${activeTab === 0 ? "mahasiswa" : "dosen"} ${selectedUser.nama_lengkap || selectedUser.username}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33", cancelButtonColor: "#666",
        confirmButtonText: "Ya, Tolak", cancelButtonText: "Batal",
      });
      if (!result.isConfirmed) { setOpenReject(true); return; }
      if (activeTab === 0) await rejectMahasiswa(selectedUser.id_user, catatan.trim());
      else await rejectDosen(selectedUser.id_user, catatan.trim());
      await Swal.fire({ icon: "success", title: "Berhasil", text: `${activeTab === 0 ? "Mahasiswa" : "Dosen"} ditolak`, timer: 2000, timerProgressBar: true, showConfirmButton: false });
      setCatatan("");
      setErrors({});
      if (activeTab === 0) fetchMahasiswa();
      else fetchDosen();
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menolak user", confirmButtonText: "OK" });
      setOpenReject(true);
    }
  };

  const currentList = activeTab === 0 ? mahasiswaList : dosenList;
  const totalPages = Math.ceil(currentList.length / rowsPerPage);
  const paginatedList = currentList.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <Box>
        <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Verifikasi Pengguna</Typography>
        <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>Kelola verifikasi mahasiswa dan dosen</Typography>

        {alert && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setAlert("")}>
            {alert}
          </Alert>
        )}

        <Paper sx={{ borderRadius: "16px", border: "1px solid #f0f0f0", overflow: "hidden" }}>
          <Box sx={{ borderBottom: "1px solid #f0f0f0" }}>
            <Tabs
              value={activeTab}
              onChange={(e, v) => { setActiveTab(v); setPage(1); }}
              sx={{
                px: 2,
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#888",
                  minHeight: 52,
                  "&.Mui-selected": { fontWeight: 700, color: "#0D59F2" },
                },
                "& .MuiTabs-indicator": { backgroundColor: "#0D59F2", height: 3, borderRadius: "3px 3px 0 0" },
              }}
            >
              <Tab label="Mahasiswa" />
              <Tab label="Dosen" />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
              <Box sx={{ minWidth: 180, flex: "1 1 auto" }}>
                <TextField
                  select fullWidth size="small"
                  label="Status Verifikasi"
                  value={filters.status_verifikasi}
                  onChange={(e) => setFilters({ ...filters, status_verifikasi: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  SelectProps={{ displayEmpty: true }}
                  sx={roundedField}
                >
                  <MenuItem value="">Semua</MenuItem>
                  <MenuItem value={0}>Menunggu</MenuItem>
                  <MenuItem value={1}>Disetujui</MenuItem>
                  <MenuItem value={2}>Ditolak</MenuItem>
                </TextField>
              </Box>
              <Box sx={{ minWidth: 180, flex: "1 1 auto" }}>
                <TextField
                  select fullWidth size="small"
                  label="Email Verified"
                  value={filters.email_verified}
                  onChange={(e) => setFilters({ ...filters, email_verified: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  SelectProps={{ displayEmpty: true }}
                  sx={roundedField}
                >
                  <MenuItem value="">Semua</MenuItem>
                  <MenuItem value="true">Sudah Verified</MenuItem>
                  <MenuItem value="false">Belum Verified</MenuItem>
                </TextField>
              </Box>
              <Box sx={{ minWidth: 200, flex: "1 1 auto" }}>
                <TextField
                  select fullWidth size="small"
                  label="Program Studi"
                  value={filters.id_prodi}
                  onChange={(e) => setFilters({ ...filters, id_prodi: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  SelectProps={{ displayEmpty: true }}
                  sx={roundedField}
                >
                  <MenuItem value="">Semua</MenuItem>
                  {prodiOptions.map((prodi) => (
                    <MenuItem key={prodi.id_prodi} value={prodi.id_prodi}>
                      {prodi.jenjang} {prodi.nama_prodi}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box sx={{ minWidth: 160, flex: "1 1 auto" }}>
                <TextField
                  fullWidth type="date" size="small"
                  label="Tanggal Dari"
                  value={filters.tanggal_dari}
                  onChange={(e) => setFilters({ ...filters, tanggal_dari: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={roundedField}
                />
              </Box>
              <Box sx={{ minWidth: 160, flex: "1 1 auto" }}>
                <TextField
                  fullWidth type="date" size="small"
                  label="Tanggal Sampai"
                  value={filters.tanggal_sampai}
                  onChange={(e) => setFilters({ ...filters, tanggal_sampai: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={roundedField}
                />
              </Box>
            </Box>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
            ) : paginatedList.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 10 }}>
                <Box sx={{ width: 100, height: 100, borderRadius: "50%", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
                  <PersonAdd sx={{ fontSize: 48, color: "#ccc" }} />
                </Box>
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#444", mb: 1 }}>
                  Tidak ada data {activeTab === 0 ? "mahasiswa" : "dosen"}
                </Typography>
                <Typography sx={{ fontSize: 14, color: "#999" }}>
                  Data verifikasi akan muncul di sini
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "hidden", mb: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {["Nama Lengkap", activeTab === 0 ? "NIM" : "NIP", "Email", "Prodi", "Tanggal Daftar", "Status", "Aksi"].map((h, i) => (
                          <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 6 && { textAlign: "center" }) }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedList.map((user) => {
                        const si = getStatusInfo(user.status_verifikasi);
                        return (
                          <TableRow key={user.id_user} sx={tableBodyRow}>
                            <TableCell>
                              <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{user.nama_lengkap || user.username}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13 }}>{activeTab === 0 ? user.nim : user.nip}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13 }}>{user.email}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13 }}>{user.jenjang} {user.nama_prodi}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13 }}>{formatDate(user.created_at)}</Typography>
                            </TableCell>
                            <TableCell>
                              <StatusPill label={si.label} bg={si.bg} color={si.color} />
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Visibility sx={{ fontSize: 14 }} />}
                                onClick={() => handleViewDetail(user)}
                                sx={{
                                  textTransform: "none", borderRadius: "50px",
                                  fontSize: 12, fontWeight: 600, px: 2,
                                  borderColor: "#0D59F2", color: "#0D59F2",
                                  "&:hover": { backgroundColor: "#f0f4ff" },
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

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontSize: 13, color: "#777" }}>
                    Menampilkan {((page - 1) * rowsPerPage) + 1}-{Math.min(page * rowsPerPage, currentList.length)} dari {currentList.length} data
                  </Typography>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(e, value) => setPage(value)}
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

        <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth
          PaperProps={{ sx: { borderRadius: "16px" } }}>
          <DialogTitle sx={{ pb: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Detail {activeTab === 0 ? "Mahasiswa" : "Dosen"}</Typography>
            <IconButton onClick={() => setOpenDetail(false)} sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ px: 3, py: 3 }}>
            {loadingDetail ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress /></Box>
            ) : detailData ? (
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Nama Lengkap</Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{detailData.nama_lengkap || "-"}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Username</Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{detailData.username}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Email</Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{detailData.email}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>{activeTab === 0 ? "NIM" : "NIP"}</Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{activeTab === 0 ? detailData.nim : detailData.nip}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Program Studi</Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{detailData.jenjang} {detailData.nama_prodi}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Jurusan</Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{detailData.nama_jurusan || "-"}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Kampus</Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{detailData.nama_kampus || "-"}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>{activeTab === 0 ? "Tahun Masuk" : "Bidang Keahlian"}</Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                    {activeTab === 0 ? detailData.tahun_masuk : (detailData.bidang_keahlian || "-")}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>No. HP</Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{detailData.no_hp || "-"}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Email Verified</Typography>
                  <StatusPill
                    label={detailData.email_verified_at ? "Sudah" : "Belum"}
                    bg={detailData.email_verified_at ? "#2e7d32" : "#c62828"}
                    color={detailData.email_verified_at ? "#e8f5e9" : "#fce4ec"}
                  />
                </Box>
                <Box sx={{ gridColumn: "1 / -1" }}>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Alamat</Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{detailData.alamat || "-"}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Status Verifikasi</Typography>
                  <StatusPill
                    label={getStatusInfo(detailData.status_verifikasi).label}
                    bg={getStatusInfo(detailData.status_verifikasi).bg}
                    color={getStatusInfo(detailData.status_verifikasi).color}
                  />
                </Box>
                {activeTab === 0 && detailData.foto_ktm && (
                  <Box sx={{ gridColumn: "1 / -1" }}>
                    <Typography sx={{ fontSize: 12, color: "#888", mb: 1 }}>Foto KTM</Typography>
                    <img
                      src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/ktm/${detailData.foto_ktm}`}
                      alt="KTM"
                      style={{ maxWidth: "100%", maxHeight: 400, objectFit: "contain", border: "1px solid #e0e0e0", borderRadius: 12 }}
                    />
                  </Box>
                )}
                {detailData.catatan && (
                  <Box sx={{ gridColumn: "1 / -1", p: 2.5, backgroundColor: "#fce4ec", borderRadius: "12px", border: "1px solid #ef9a9a" }}>
                    <Typography sx={{ fontSize: 12, color: "#c62828", fontWeight: 700, mb: 0.5 }}>Catatan Penolakan</Typography>
                    <Typography sx={{ fontSize: 14 }}>{detailData.catatan}</Typography>
                  </Box>
                )}
              </Box>
            ) : null}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button onClick={() => setOpenDetail(false)}
              sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600, color: "#666", border: "1.5px solid #e0e0e0", "&:hover": { backgroundColor: "#f5f5f5" } }}>
              Tutup
            </Button>
            {detailData?.status_verifikasi === 0 && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Cancel sx={{ fontSize: 14 }} />}
                  onClick={handleOpenReject}
                  sx={{
                    textTransform: "none", borderRadius: "50px",
                    px: 3, py: 1, fontWeight: 600,
                    borderColor: "#e53935", color: "#e53935",
                    "&:hover": { backgroundColor: "rgba(229,57,53,0.06)" },
                  }}
                >
                  Tolak
                </Button>
                <Button
                  variant="contained"
                  startIcon={<CheckCircle sx={{ fontSize: 14 }} />}
                  onClick={handleApprove}
                  sx={{
                    textTransform: "none", borderRadius: "50px",
                    px: 3, py: 1, fontWeight: 600,
                    backgroundColor: "#2e7d32", "&:hover": { backgroundColor: "#1b5e20" },
                  }}
                >
                  Setujui
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        <Dialog open={openReject} onClose={handleCloseReject} maxWidth="sm" fullWidth
          PaperProps={{ sx: { borderRadius: "16px" } }}>
          <DialogTitle sx={{ pb: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Tolak {activeTab === 0 ? "Mahasiswa" : "Dosen"}</Typography>
            <IconButton onClick={handleCloseReject} sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ px: 3, py: 3 }}>
            <Box sx={{ p: 2.5, backgroundColor: "#fce4ec", borderRadius: "12px", border: "1px solid #ef9a9a", mb: 3 }}>
              <Typography sx={{ fontSize: 12, color: "#c62828", fontWeight: 700, mb: 0.5 }}>
                {activeTab === 0 ? "Mahasiswa" : "Dosen"} yang akan ditolak
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{selectedUser?.nama_lengkap || selectedUser?.username}</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
                Catatan Penolakan <span style={{ color: "#ef5350" }}>*</span>
              </Typography>
              <TextField
                fullWidth multiline rows={4}
                placeholder="Masukkan alasan penolakan (minimal 10 karakter)..."
                value={catatan}
                onChange={(e) => { setCatatan(e.target.value); setErrors({}); }}
                error={!!errors.catatan}
                helperText={errors.catatan}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button onClick={handleCloseReject}
              sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600, color: "#666", border: "1.5px solid #e0e0e0", "&:hover": { backgroundColor: "#f5f5f5" } }}>
              Batal
            </Button>
            <Button variant="contained" onClick={handleReject}
              sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600, backgroundColor: "#e53935", "&:hover": { backgroundColor: "#c62828" } }}>
              Tolak
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </BodyLayout>
  );
}