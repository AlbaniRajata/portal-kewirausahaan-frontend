import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, CircularProgress,
  TextField, InputAdornment, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Divider,
} from "@mui/material";
import { Search, Close, Visibility } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import MahasiswaSidebar from "../../components/layouts/MahasiswaSidebar";
import PageTransition from "../../components/PageTransition";
import {
  getStatusPembimbing, getListDosen, ajukanPembimbing,
} from "../../api/mahasiswa";

const roundedField = {
  "& .MuiOutlinedInput-root": { borderRadius: "15px" },
};

const tableHeadCell = {
  fontWeight: 700, fontSize: 13, color: "#000",
  backgroundColor: "#fafafa", borderBottom: "2px solid #f0f0f0", py: 2,
};

const tableBodyRow = {
  "& td": { borderBottom: "1px solid #f5f5f5", py: 2 },
};

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

const STATUS_PENGAJUAN = {
  0: { label: "Menunggu Respon",  backgroundColor: "#f57f17" },
  1: { label: "Disetujui",        backgroundColor: "#2e7d32" },
  2: { label: "Ditolak",          backgroundColor: "#c62828" },
};

const InfoBox = ({ children, color, borderColor, bgColor }) => (
  <Box sx={{ p: 2, borderRadius: "12px", backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
    <Typography sx={{ fontSize: 14, color, fontWeight: 500 }}>{children}</Typography>
  </Box>
);

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDosen, setSelectedDosen] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setLoadingStatus(true);
      const res = await getStatusPembimbing();
      if (res.success) setStatusData(res.data);
    } catch {
      // status gagal dimuat, tampilkan null
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const fetchDosen = useCallback(async () => {
    try {
      setLoadingDosen(true);
      const res = await getListDosen();
      if (res.success) setDosenList(res.data || []);
    } catch {
      await Swal.fire({
        icon: "error", title: "Gagal Memuat",
        text: "Gagal memuat daftar dosen. Silakan refresh halaman.",
        confirmButtonText: "OK",
      });
    } finally {
      setLoadingDosen(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); fetchDosen(); }, [fetchStatus, fetchDosen]);

  const filteredDosen = dosenList.filter((d) =>
    (d.nama_lengkap || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.bidang_keahlian || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.nip || "").includes(search)
  );

  const bisaAjukan = statusData?.bisa_ajukan === true;
  const isKetua = statusData?.is_ketua === true;
  const pengajuan = statusData?.pengajuan;
  const statusPengajuan = pengajuan?.status;

  const handleOpenDetail = (dosen) => { setSelectedDosen(dosen); setDialogOpen(true); };
  const handleCloseDialog = () => { setDialogOpen(false); setSelectedDosen(null); };

  const handleAjukan = async () => {
    if (!selectedDosen) return;
    const result = await Swal.fire({
      ...swalOptions,
      title: "Konfirmasi Pengajuan",
      html: `Anda akan mengajukan <b>${selectedDosen.nama_lengkap}</b> sebagai dosen pembimbing.<br/><br/>Lanjutkan?`,
      icon: "question", showCancelButton: true,
      confirmButtonColor: "#0D59F2", cancelButtonColor: "#666",
      confirmButtonText: "Ya, Ajukan", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    try {
      setSubmitting(true);
      const res = await ajukanPembimbing({ id_dosen: selectedDosen.id_user });
      if (res.success) {
        handleCloseDialog();
        await Swal.fire({
          ...swalOptions, icon: "success", title: "Berhasil",
          text: res.message || "Pengajuan pembimbing berhasil dikirim",
          timer: 2000, timerProgressBar: true, showConfirmButton: false,
        });
        fetchStatus();
      } else {
        await Swal.fire({ ...swalOptions, icon: "error", title: "Gagal", text: res.message || "Terjadi kesalahan" });
      }
    } catch (err) {
      await Swal.fire({
        ...swalOptions, icon: "error", title: "Gagal",
        text: err.response?.data?.message || "Gagal mengajukan pembimbing",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getPengajuanDosenIni = (id_user) => {
    if (!pengajuan) return null;
    return pengajuan.id_dosen === id_user ? pengajuan : null;
  };

  return (
    <BodyLayout Sidebar={MahasiswaSidebar}>
      <PageTransition>
        <Box>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Pengajuan Pembimbing</Typography>
            <Typography sx={{ fontSize: 14, color: "#777" }}>
              Ajukan dosen pembimbing untuk proposal Anda yang telah lolos seleksi
            </Typography>
          </Box>

          {!isKetua && (
            <Box sx={{ mb: 3 }}>
              <InfoBox color="#1565c0" borderColor="#90caf9" bgColor="#e3f2fd">
                Hanya ketua tim yang dapat mengajukan dosen pembimbing.
              </InfoBox>
            </Box>
          )}

          {loadingStatus ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : statusData ? (
            <Paper sx={{ p: 4, mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0", borderLeft: "4px solid #0D59F2" }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 3 }}>Status Pengajuan Pembimbing</Typography>

              {pengajuan?.nama_dosen && (
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Dosen Pembimbing</Typography>
                  <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{pengajuan.nama_dosen}</Typography>
                </Box>
              )}

              {pengajuan && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3 }}>
                    <Box>
                      <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Tanggal Diajukan</Typography>
                      <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{formatDate(pengajuan.created_at)}</Typography>
                    </Box>
                    {pengajuan.responded_at && (
                      <Box>
                        <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Tanggal Respon</Typography>
                        <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{formatDate(pengajuan.responded_at)}</Typography>
                      </Box>
                    )}
                    {pengajuan.status !== undefined && (
                      <Box>
                        <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Status</Typography>
                        <StatusPill
                          label={STATUS_PENGAJUAN[pengajuan.status]?.label || "Unknown"}
                          backgroundColor={STATUS_PENGAJUAN[pengajuan.status]?.backgroundColor || "#666"}
                        />
                      </Box>
                    )}
                  </Box>

                  {pengajuan.catatan_dosen && (
                    <Box sx={{ mt: 3, p: 2.5, backgroundColor: "#fff8e1", borderRadius: "12px", border: "1px solid #ffe082" }}>
                      <Typography sx={{ fontSize: 12, color: "#f57f17", fontWeight: 700, mb: 0.5 }}>Catatan Dosen</Typography>
                      <Typography sx={{ fontSize: 14 }}>{pengajuan.catatan_dosen}</Typography>
                    </Box>
                  )}
                </>
              )}

              <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
                {!bisaAjukan && statusPengajuan === 1 && (
                  <InfoBox color="#2e7d32" borderColor="#a5d6a7" bgColor="#e8f5e9">
                    Pengajuan pembimbing Anda telah disetujui.
                  </InfoBox>
                )}
                {!bisaAjukan && statusPengajuan === 0 && (
                  <InfoBox color="#1565c0" borderColor="#90caf9" bgColor="#e3f2fd">
                    Pengajuan sedang menunggu respon dari dosen. Anda tidak dapat mengajukan dosen lain saat ini.
                  </InfoBox>
                )}
                {bisaAjukan && statusPengajuan === 2 && isKetua && (
                  <InfoBox color="#f57f17" borderColor="#ffe082" bgColor="#fff8e1">
                    Pengajuan sebelumnya ditolak. Silakan ajukan dosen pembimbing lain.
                  </InfoBox>
                )}
                {bisaAjukan && !pengajuan && isKetua && (
                  <InfoBox color="#1565c0" borderColor="#90caf9" bgColor="#e3f2fd">
                    Pilih dosen dari daftar di bawah untuk mengajukan pembimbing.
                  </InfoBox>
                )}
              </Box>
            </Paper>
          ) : (
            <Box sx={{ mb: 3 }}>
              <InfoBox color="#1565c0" borderColor="#90caf9" bgColor="#e3f2fd">
                Fitur pengajuan pembimbing hanya tersedia setelah proposal lolos seleksi wawancara.
              </InfoBox>
            </Box>
          )}

          <Paper sx={{ p: 4, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Daftar Dosen Pembimbing</Typography>
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
                sx={{ minWidth: 300, ...roundedField }}
              />
            </Box>

            {loadingDosen ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                <CircularProgress />
              </Box>
            ) : filteredDosen.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography sx={{ color: "#999", fontSize: 14 }}>
                  {search ? "Dosen tidak ditemukan" : "Belum ada dosen tersedia"}
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "hidden" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      {["Nama Dosen", "NIP", "Bidang Keahlian", ...(statusData ? ["Aksi"] : [])].map((h, i) => (
                        <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 3 && { textAlign: "center" }) }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredDosen.map((dosen) => {
                      const pengajuanDosenIni = getPengajuanDosenIni(dosen.id_user);
                      return (
                        <TableRow key={dosen.id_user} sx={tableBodyRow}>
                          <TableCell><Typography sx={{ fontWeight: 600, fontSize: 14 }}>{dosen.nama_lengkap}</Typography></TableCell>
                          <TableCell><Typography sx={{ fontSize: 13 }}>{dosen.nip || "-"}</Typography></TableCell>
                          <TableCell><Typography sx={{ fontSize: 13 }}>{dosen.bidang_keahlian || "-"}</Typography></TableCell>
                          {statusData && (
                            <TableCell align="center">
                              {!pengajuanDosenIni && bisaAjukan && isKetua && (
                                <Button size="small" variant="contained" onClick={() => handleOpenDetail(dosen)}
                                  sx={{ textTransform: "none", borderRadius: "50px", fontWeight: 600, fontSize: 12, px: 2, backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" } }}>
                                  Ajukan
                                </Button>
                              )}
                              {!pengajuanDosenIni && (!bisaAjukan || !isKetua) && (
                                <Button size="small" startIcon={<Visibility sx={{ fontSize: 14 }} />} variant="outlined"
                                  onClick={() => handleOpenDetail(dosen)}
                                  sx={{ textTransform: "none", borderRadius: "50px", fontWeight: 600, fontSize: 12, px: 2, borderColor: "#0D59F2", color: "#0D59F2", "&:hover": { backgroundColor: "#f0f4ff" } }}>
                                  Lihat
                                </Button>
                              )}
                              {pengajuanDosenIni?.status === 0 && (
                                <StatusPill label="Menunggu Respon" backgroundColor="#f57f17" />
                              )}
                              {pengajuanDosenIni?.status === 1 && (
                                <StatusPill label="Pembimbing Anda" backgroundColor="#2e7d32" />
                              )}
                              {pengajuanDosenIni?.status === 2 && bisaAjukan && isKetua && (
                                <Button size="small" variant="contained" onClick={() => handleOpenDetail(dosen)}
                                  sx={{ textTransform: "none", borderRadius: "50px", fontWeight: 600, fontSize: 12, px: 2, backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" } }}>
                                  Ajukan Lagi
                                </Button>
                              )}
                              {pengajuanDosenIni?.status === 2 && (!bisaAjukan || !isKetua) && (
                                <StatusPill label="Ditolak" backgroundColor="#c62828" />
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
      </PageTransition>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Detail Dosen Pembimbing</Typography>
          <IconButton onClick={handleCloseDialog} sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ px: 3, py: 3 }}>
          {selectedDosen && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Nama Lengkap</Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{selectedDosen.nama_lengkap}</Typography>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>NIP</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{selectedDosen.nip || "-"}</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Bidang Keahlian</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{selectedDosen.bidang_keahlian || "-"}</Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ p: 2.5, backgroundColor: "#f8f9ff", borderRadius: "12px", border: "1px solid #f0f0f0" }}>
                <Typography sx={{ fontSize: 12, color: "#888", mb: 1.5 }}>Status Pengajuan ke Dosen Ini</Typography>
                {(() => {
                  const p = getPengajuanDosenIni(selectedDosen.id_user);
                  if (!p) return <StatusPill label="Belum Diajukan" backgroundColor="#666" />;
                  return <StatusPill label={STATUS_PENGAJUAN[p.status]?.label || "-"} backgroundColor={STATUS_PENGAJUAN[p.status]?.backgroundColor || "#666"} />;
                })()}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          {bisaAjukan && isKetua &&
            (!getPengajuanDosenIni(selectedDosen?.id_user) ||
              getPengajuanDosenIni(selectedDosen?.id_user)?.status === 2) && (
            <Button variant="contained" onClick={handleAjukan} disabled={submitting}
              sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600, backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" } }}>
              {submitting ? "Memproses..." : "Ajukan sebagai Pembimbing"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </BodyLayout>
  );
}