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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Grid,
} from "@mui/material";
import { CheckCircle, Cancel, Visibility } from "@mui/icons-material";
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
  const [alert, setAlert] = useState("");

  const [filters, setFilters] = useState({
    status_verifikasi: "",
    email_verified: "",
    id_prodi: "",
    tanggal_dari: "",
    tanggal_sampai: "",
  });

  useEffect(() => {
    fetchProdi();
  }, []);

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
    } catch (err) {
      console.error("Error fetching dosen:", err);
      setAlert("Gagal memuat data dosen");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (activeTab === 0) {
      fetchMahasiswa();
    } else {
      fetchDosen();
    }
  }, [activeTab, fetchMahasiswa, fetchDosen]);

  const fetchProdi = async () => {
    try {
      const response = await getAllProdi();
      if (response.success) {
        setProdiOptions(response.data);
      }
    } catch (err) {
      console.error("Error fetching prodi:", err);
    }
  };

  const handleViewDetail = async (user) => {
    setSelectedUser(user);
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
      console.error("Error fetching detail:", err);
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
        confirmButtonColor: "#0D59F2",
        cancelButtonColor: "#d33",
        confirmButtonText: "Ya, Setujui",
        cancelButtonText: "Batal",
      });

      if (!result.isConfirmed) {
        setOpenDetail(true);
        return;
      }

      if (activeTab === 0) {
        await approveMahasiswa(selectedUser.id_user);
      } else {
        await approveDosen(selectedUser.id_user);
      }

      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: `${activeTab === 0 ? "Mahasiswa" : "Dosen"} berhasil disetujui`,
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      if (activeTab === 0) {
        fetchMahasiswa();
      } else {
        fetchDosen();
      }
    } catch (err) {
      console.error("Error approving:", err);
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.response?.data?.message || "Gagal menyetujui user",
        confirmButtonText: "OK",
      });
      setOpenDetail(true);
    }
  };

  const handleReject = async () => {
    if (activeTab === 0 && (!catatan || catatan.trim() === "")) {
      setAlert("Catatan penolakan wajib diisi");
      return;
    }

    setOpenReject(false);
    setOpenDetail(false);

    try {
      const result = await Swal.fire({
        title: "Konfirmasi",
        text: `Tolak ${activeTab === 0 ? "mahasiswa" : "dosen"} ${selectedUser.nama_lengkap || selectedUser.username}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#666",
        confirmButtonText: "Ya, Tolak",
        cancelButtonText: "Batal",
      });

      if (!result.isConfirmed) {
        setOpenDetail(true);
        setCatatan("");
        setAlert("");
        return;
      }

      if (activeTab === 0) {
        await rejectMahasiswa(selectedUser.id_user, catatan);
      } else {
        await rejectDosen(selectedUser.id_user);
      }

      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: `${activeTab === 0 ? "Mahasiswa" : "Dosen"} ditolak`,
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      setCatatan("");
      setAlert("");
      if (activeTab === 0) {
        fetchMahasiswa();
      } else {
        fetchDosen();
      }
    } catch (err) {
      console.error("Error rejecting:", err);
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.response?.data?.message || "Gagal menolak user",
        confirmButtonText: "OK",
      });
      setOpenReject(true);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 0:
        return { label: "Menunggu", color: "warning" };
      case 1:
        return { label: "Disetujui", color: "success" };
      case 2:
        return { label: "Ditolak", color: "error" };
      default:
        return { label: "Unknown", color: "default" };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <Box>
        <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
          Verifikasi User
        </Typography>
        <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>
          Kelola verifikasi mahasiswa dan dosen
        </Typography>

        {alert && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setAlert("")}>
            {alert}
          </Alert>
        )}

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              px: 2,
            }}
          >
            <Tab label="Mahasiswa" />
            <Tab label="Dosen" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
              <Box sx={{ minWidth: 200, flex: "1 1 auto" }}>
                <TextField
                  select
                  fullWidth
                  label="Status Verifikasi"
                  value={filters.status_verifikasi}
                  onChange={(e) =>
                    setFilters({ ...filters, status_verifikasi: e.target.value })
                  }
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  SelectProps={{
                    displayEmpty: true,
                  }}
                >
                  <MenuItem value="">Semua</MenuItem>
                  <MenuItem value={0}>Menunggu</MenuItem>
                  <MenuItem value={1}>Disetujui</MenuItem>
                  <MenuItem value={2}>Ditolak</MenuItem>
                </TextField>
              </Box>

              <Box sx={{ minWidth: 200, flex: "1 1 auto" }}>
                <TextField
                  select
                  fullWidth
                  label="Email Verified"
                  value={filters.email_verified}
                  onChange={(e) =>
                    setFilters({ ...filters, email_verified: e.target.value })
                  }
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  SelectProps={{
                    displayEmpty: true,
                  }}
                >
                  <MenuItem value="">Semua</MenuItem>
                  <MenuItem value="true">Sudah Verified</MenuItem>
                  <MenuItem value="false">Belum Verified</MenuItem>
                </TextField>
              </Box>

              <Box sx={{ minWidth: 200, flex: "1 1 auto" }}>
                <TextField
                  select
                  fullWidth
                  label="Program Studi"
                  value={filters.id_prodi}
                  onChange={(e) =>
                    setFilters({ ...filters, id_prodi: e.target.value })
                  }
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  SelectProps={{
                    displayEmpty: true,
                  }}
                >
                  <MenuItem value="">Semua</MenuItem>
                  {prodiOptions.map((prodi) => (
                    <MenuItem key={prodi.id_prodi} value={prodi.id_prodi}>
                      {prodi.jenjang} {prodi.nama_prodi}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box sx={{ minWidth: 200, flex: "1 1 auto" }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Tanggal Dari"
                  value={filters.tanggal_dari}
                  onChange={(e) =>
                    setFilters({ ...filters, tanggal_dari: e.target.value })
                  }
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              <Box sx={{ minWidth: 200, flex: "1 1 auto" }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Tanggal Sampai"
                  value={filters.tanggal_sampai}
                  onChange={(e) =>
                    setFilters({ ...filters, tanggal_sampai: e.target.value })
                  }
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Box>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nama Lengkap</TableCell>
                      <TableCell>{activeTab === 0 ? "NIM" : "NIP"}</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Prodi</TableCell>
                      <TableCell>Tanggal Daftar</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Aksi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeTab === 0 ? (
                      mahasiswaList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            Tidak ada data mahasiswa
                          </TableCell>
                        </TableRow>
                      ) : (
                        mahasiswaList.map((mhs) => {
                          const statusInfo = getStatusLabel(mhs.status_verifikasi);
                          return (
                            <TableRow key={mhs.id_user}>
                              <TableCell>{mhs.nama_lengkap || mhs.username}</TableCell>
                              <TableCell>{mhs.nim}</TableCell>
                              <TableCell>{mhs.email}</TableCell>
                              <TableCell>
                                {mhs.jenjang} {mhs.nama_prodi}
                              </TableCell>
                              <TableCell>{formatDate(mhs.created_at)}</TableCell>
                              <TableCell>
                                <Chip
                                  label={statusInfo.label}
                                  color={statusInfo.color}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Button
                                  size="small"
                                  startIcon={<Visibility />}
                                  onClick={() => handleViewDetail(mhs)}
                                  sx={{ textTransform: "none" }}
                                >
                                  Detail
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )
                    ) : dosenList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          Tidak ada data dosen
                        </TableCell>
                      </TableRow>
                    ) : (
                      dosenList.map((dsn) => {
                        const statusInfo = getStatusLabel(dsn.status_verifikasi);
                        return (
                          <TableRow key={dsn.id_user}>
                            <TableCell>{dsn.nama_lengkap || dsn.username}</TableCell>
                            <TableCell>{dsn.nip}</TableCell>
                            <TableCell>{dsn.email}</TableCell>
                            <TableCell>
                              {dsn.jenjang} {dsn.nama_prodi}
                            </TableCell>
                            <TableCell>{formatDate(dsn.created_at)}</TableCell>
                            <TableCell>
                              <Chip
                                label={statusInfo.label}
                                color={statusInfo.color}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                startIcon={<Visibility />}
                                onClick={() => handleViewDetail(dsn)}
                                sx={{ textTransform: "none" }}
                              >
                                Detail
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Paper>

        <Dialog
          open={openDetail}
          onClose={() => setOpenDetail(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Detail {activeTab === 0 ? "Mahasiswa" : "Dosen"}
          </DialogTitle>
          <DialogContent dividers>
            {loadingDetail ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                <CircularProgress />
              </Box>
            ) : detailData ? (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">
                    Nama Lengkap
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {detailData.nama_lengkap || "-"}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">
                    Username
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {detailData.username}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {detailData.email}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">
                    {activeTab === 0 ? "NIM" : "NIP"}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {activeTab === 0 ? detailData.nim : detailData.nip}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">
                    Program Studi
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {detailData.jenjang} {detailData.nama_prodi}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">
                    Jurusan
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {detailData.nama_jurusan || "-"}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">
                    Kampus
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {detailData.nama_kampus || "-"}
                  </Typography>
                </Grid>

                {activeTab === 0 && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      Tahun Masuk
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {detailData.tahun_masuk}
                    </Typography>
                  </Grid>
                )}

                {activeTab === 1 && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      Bidang Keahlian
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {detailData.bidang_keahlian || "-"}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">
                    No. HP
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {detailData.no_hp || "-"}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Alamat
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {detailData.alamat || "-"}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">
                    Email Verified
                  </Typography>
                  <Box sx={{ mb: 2, mt: 0.5 }}>
                    {detailData.email_verified_at ? (
                      <Chip label="Sudah" color="success" size="small" />
                    ) : (
                      <Chip label="Belum" color="error" size="small" />
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="text.secondary">
                    Status Verifikasi
                  </Typography>
                  <Box sx={{ mb: 2, mt: 0.5 }}>
                    <Chip
                      label={getStatusLabel(detailData.status_verifikasi).label}
                      color={getStatusLabel(detailData.status_verifikasi).color}
                      size="small"
                    />
                  </Box>
                </Grid>

                {activeTab === 0 && detailData.foto_ktm && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Foto KTM
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <img
                        src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/ktm/${detailData.foto_ktm}`}
                        alt="KTM"
                        style={{
                          maxWidth: "100%",
                          maxHeight: 400,
                          objectFit: "contain",
                          border: "1px solid #e0e0e0",
                          borderRadius: 8,
                        }}
                      />
                    </Box>
                  </Grid>
                )}

                {activeTab === 0 && detailData.catatan && (
                  <Grid item xs={12}>
                    <Alert severity="error">
                      <Typography variant="caption" color="text.secondary">
                        Catatan Penolakan
                      </Typography>
                      <Typography variant="body2">{detailData.catatan}</Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDetail(false)}>Tutup</Button>
            {detailData?.status_verifikasi === 0 && (
              <>
                <Button
                  onClick={() => {
                    setOpenDetail(false);
                    setOpenReject(true);
                  }}
                  color="error"
                  startIcon={<Cancel />}
                  sx={{ textTransform: "none" }}
                >
                  Tolak
                </Button>
                <Button
                  onClick={handleApprove}
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle />}
                  sx={{ textTransform: "none" }}
                >
                  Setujui
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        <Dialog 
          open={openReject} 
          onClose={() => {
            setOpenReject(false);
            setOpenDetail(true);
            setCatatan("");
            setAlert("");
          }} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>Tolak {activeTab === 0 ? "Mahasiswa" : "Dosen"}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Anda akan menolak {activeTab === 0 ? "mahasiswa" : "dosen"}:{" "}
              <strong>{selectedUser?.nama_lengkap || selectedUser?.username}</strong>
            </Typography>

            {activeTab === 0 && (
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Catatan Penolakan"
                placeholder="Masukkan alasan penolakan..."
                value={catatan}
                onChange={(e) => {
                  setCatatan(e.target.value);
                  setAlert("");
                }}
                error={!!alert}
                helperText={alert}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setOpenReject(false);
                setOpenDetail(true);
                setCatatan("");
                setAlert("");
              }}
            >
              Batal
            </Button>
            <Button onClick={handleReject} color="error" variant="contained">
              Tolak
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </BodyLayout>
  );
}