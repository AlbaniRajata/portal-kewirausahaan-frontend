import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
} from "@mui/material";
import { Search, Close, Visibility } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import MahasiswaSidebar from "../../components/layouts/MahasiswaSidebar";
import {
  getStatusPembimbing,
  getListDosen,
  ajukanPembimbing,
} from "../../api/mahasiswa";

const STATUS_PENGAJUAN = {
  0: { text: "Menunggu Respon", color: "warning" },
  1: { text: "Disetujui", color: "success" },
  2: { text: "Ditolak", color: "error" },
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const swalOptions = {
  customClass: { container: "swal-over-dialog" },
  didOpen: () => {
    const container = document.querySelector(".swal-over-dialog");
    if (container) container.style.zIndex = "99999";
  },
};

export default function PengajuanPembimbingPage() {
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingDosen, setLoadingDosen] = useState(true);
  const [statusData, setStatusData] = useState(null);
  const [dosenList, setDosenList] = useState([]);
  const [search, setSearch] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  const [alertType, setAlertType] = useState("error");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDosen, setSelectedDosen] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setLoadingStatus(true);
      const res = await getStatusPembimbing();
      if (res.success) {
        setStatusData(res.data);
      }
    } catch (err) {
      console.error("Error fetching status pembimbing:", err);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const fetchDosen = useCallback(async () => {
    try {
      setLoadingDosen(true);
      const res = await getListDosen();
      if (res.success) {
        setDosenList(res.data || []);
      }
    } catch (err) {
      console.error("Error fetching dosen:", err);
      setAlertMsg("Gagal memuat daftar dosen");
      setAlertType("error");
    } finally {
      setLoadingDosen(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchDosen();
  }, [fetchStatus, fetchDosen]);

  const filteredDosen = dosenList.filter(
    (d) =>
      (d.nama_lengkap || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.bidang_keahlian || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.nip || "").includes(search),
  );

  const bisaAjukan = statusData?.bisa_ajukan === true;
  const isKetua = statusData?.is_ketua === true;
  const pengajuan = statusData?.pengajuan;
  const statusPengajuan = pengajuan?.status;

  const handleOpenDetail = (dosen) => {
    setSelectedDosen(dosen);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedDosen(null);
  };

  const handleAjukan = async () => {
    if (!selectedDosen) return;

    const dosenName = selectedDosen.nama_lengkap;
    const dosenId = selectedDosen.id_user;

    const result = await Swal.fire({
      ...swalOptions,
      title: "Konfirmasi Pengajuan",
      html: `Anda akan mengajukan <b>${dosenName}</b> sebagai dosen pembimbing.<br/><br/>Lanjutkan?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0D59F2",
      cancelButtonColor: "#666",
      confirmButtonText: "Ya, Ajukan",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      setSubmitting(true);
      const res = await ajukanPembimbing({ id_dosen: dosenId });

      if (res.success) {
        handleCloseDialog();
        await Swal.fire({
          ...swalOptions,
          icon: "success",
          title: "Berhasil",
          text: res.message || "Pengajuan pembimbing berhasil dikirim",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        fetchStatus();
      } else {
        await Swal.fire({
          ...swalOptions,
          icon: "error",
          title: "Gagal",
          text: res.message || "Terjadi kesalahan",
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal mengajukan pembimbing";
      await Swal.fire({
        ...swalOptions,
        icon: "error",
        title: "Gagal",
        text: msg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getPengajuanDosenIni = (id_user) => {
    if (!pengajuan) return null;
    if (pengajuan.id_dosen === id_user) return pengajuan;
    return null;
  };

  return (
    <BodyLayout Sidebar={MahasiswaSidebar}>
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
            Pengajuan Pembimbing
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#777" }}>
            Ajukan dosen pembimbing untuk proposal Anda yang telah lolos seleksi
          </Typography>
        </Box>

        {alertMsg && (
          <Alert
            severity={alertType}
            sx={{ mb: 3 }}
            onClose={() => setAlertMsg("")}
          >
            {alertMsg}
          </Alert>
        )}

        {!isKetua && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Hanya ketua tim yang dapat mengajukan dosen pembimbing.
          </Alert>
        )}

        {loadingStatus ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : statusData ? (
          <Paper sx={{ p: 3, mb: 3, borderLeft: "4px solid #0D59F2" }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 2 }}>
              Status Pengajuan Pembimbing
            </Typography>

            {pengajuan?.nama_dosen && (
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>
                  Dosen Pembimbing
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                  {pengajuan.nama_dosen}
                </Typography>
              </Box>
            )}

            {pengajuan && (
              <>
                <Divider sx={{ my: 2 }} />

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>
                      Tanggal Diajukan
                    </Typography>
                    <Typography sx={{ fontSize: 14 }}>
                      {formatDate(pengajuan.created_at)}
                    </Typography>
                  </Box>
                  {pengajuan.responded_at && (
                    <Box>
                      <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>
                        Tanggal Respon
                      </Typography>
                      <Typography sx={{ fontSize: 14 }}>
                        {formatDate(pengajuan.responded_at)}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {pengajuan.catatan_dosen && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      backgroundColor: "#fff3e0",
                      borderRadius: 1,
                    }}
                  >
                    <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>
                      Catatan Dosen
                    </Typography>
                    <Typography sx={{ fontSize: 14 }}>
                      {pengajuan.catatan_dosen}
                    </Typography>
                  </Box>
                )}
              </>
            )}

            {!bisaAjukan && statusPengajuan === 1 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Pengajuan pembimbing Anda telah disetujui.
              </Alert>
            )}
            {!bisaAjukan && statusPengajuan === 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Pengajuan sedang menunggu respon dari dosen. Anda tidak dapat
                mengajukan dosen lain saat ini.
              </Alert>
            )}
            {bisaAjukan && statusPengajuan === 2 && isKetua && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Pengajuan sebelumnya ditolak. Silakan ajukan dosen pembimbing
                lain.
              </Alert>
            )}
            {bisaAjukan && !pengajuan && isKetua && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Pilih dosen dari daftar di bawah untuk mengajukan pembimbing.
              </Alert>
            )}
          </Paper>
        ) : (
          <Alert severity="info" sx={{ mb: 3 }}>
            Fitur pengajuan pembimbing hanya tersedia setelah proposal lolos
            seleksi wawancara.
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
              Daftar Dosen Pembimbing
            </Typography>
            <TextField
              size="small"
              placeholder="Cari nama, NIP, bidang keahlian..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18, color: "#999" }} />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />
          </Box>

          {loadingDosen ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress />
            </Box>
          ) : filteredDosen.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography sx={{ color: "#666" }}>
                {search ? "Dosen tidak ditemukan" : "Belum ada dosen tersedia"}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#0D59F2" }}>
                    <TableCell sx={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>
                      Nama Dosen
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>
                      NIP
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>
                      Bidang Keahlian
                    </TableCell>
                    {statusData && (
                      <TableCell sx={{ fontWeight: 700, color: "#fff", fontSize: 14, textAlign: "center" }}>
                        Aksi
                      </TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDosen.map((dosen) => {
                    const pengajuanDosenIni = getPengajuanDosenIni(
                      dosen.id_user,
                    );

                    return (
                      <TableRow 
                        key={dosen.id_user} 
                        hover
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: '#f8f9ff',
                          } 
                        }}
                      >
                        <TableCell>
                          <Typography sx={{ fontWeight: 500, fontSize: 14 }}>
                            {dosen.nama_lengkap}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ fontSize: 14 }}>
                            {dosen.nip || "-"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ fontSize: 14 }}>
                            {dosen.bidang_keahlian || "-"}
                          </Typography>
                        </TableCell>

                        {statusData && (
                          <TableCell align="center">
                            {!pengajuanDosenIni && bisaAjukan && isKetua && (
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleOpenDetail(dosen)}
                                sx={{
                                  textTransform: "none",
                                  backgroundColor: "#0D59F2",
                                  "&:hover": { backgroundColor: "#0a47c4" },
                                }}
                              >
                                Ajukan
                              </Button>
                            )}

                            {!pengajuanDosenIni && (!bisaAjukan || !isKetua) && (
                              <Button
                                size="small"
                                startIcon={<Visibility />}
                                variant="outlined"
                                onClick={() => handleOpenDetail(dosen)}
                                sx={{ textTransform: "none" }}
                              >
                                Lihat
                              </Button>
                            )}

                            {pengajuanDosenIni?.status === 0 && (
                              <Chip
                                label="Menunggu Respon"
                                color="warning"
                                size="small"
                              />
                            )}

                            {pengajuanDosenIni?.status === 1 && (
                              <Chip
                                label="Pembimbing Anda"
                                color="success"
                                size="small"
                              />
                            )}

                            {pengajuanDosenIni?.status === 2 && bisaAjukan && isKetua && (
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleOpenDetail(dosen)}
                                sx={{
                                  textTransform: "none",
                                  backgroundColor: "#0D59F2",
                                  "&:hover": { backgroundColor: "#0a47c4" },
                                }}
                              >
                                Ajukan Lagi
                              </Button>
                            )}

                            {pengajuanDosenIni?.status === 2 && (!bisaAjukan || !isKetua) && (
                              <Chip
                                label="Ditolak"
                                color="error"
                                size="small"
                              />
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, pr: 4 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
              Detail Dosen Pembimbing
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseDialog}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {selectedDosen && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 13, color: "#888", mb: 0.5 }}>
                  Nama Lengkap
                </Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
                  {selectedDosen.nama_lengkap}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 3,
                  mb: 3,
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 13, color: "#888", mb: 0.5 }}>
                    NIP
                  </Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                    {selectedDosen.nip || "-"}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 13, color: "#888", mb: 0.5 }}>
                    Bidang Keahlian
                  </Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                    {selectedDosen.bidang_keahlian || "-"}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ p: 2, backgroundColor: "#f8f9ff", borderRadius: 1 }}>
                <Typography sx={{ fontSize: 13, color: "#888", mb: 1 }}>
                  Status Pengajuan ke Dosen Ini
                </Typography>
                {(() => {
                  const pengajuanDosenIni = getPengajuanDosenIni(
                    selectedDosen.id_user,
                  );
                  if (!pengajuanDosenIni) {
                    return (
                      <Chip
                        label="Belum Diajukan"
                        color="default"
                        size="small"
                      />
                    );
                  }
                  return (
                    <Chip
                      label={
                        STATUS_PENGAJUAN[pengajuanDosenIni.status]?.text || "-"
                      }
                      color={
                        STATUS_PENGAJUAN[pengajuanDosenIni.status]?.color ||
                        "default"
                      }
                      size="small"
                    />
                  );
                })()}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="contained"
            onClick={handleCloseDialog}
            sx={{
              textTransform: "none",
              backgroundColor: "#6c757d",
              "&:hover": { backgroundColor: "#545b62" },
            }}
          >
            Tutup
          </Button>

          {bisaAjukan &&
            isKetua &&
            (!getPengajuanDosenIni(selectedDosen?.id_user) ||
              getPengajuanDosenIni(selectedDosen?.id_user)?.status === 2) && (
              <Button
                variant="contained"
                onClick={handleAjukan}
                disabled={submitting}
                sx={{
                  textTransform: "none",
                  backgroundColor: "#0D59F2",
                  "&:hover": { backgroundColor: "#0a47c4" },
                }}
              >
                {submitting ? "Memproses..." : "Ajukan sebagai Pembimbing"}
              </Button>
            )}
        </DialogActions>
      </Dialog>
    </BodyLayout>
  );
}