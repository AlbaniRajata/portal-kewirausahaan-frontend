import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, TextField,
  InputAdornment, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Divider,
} from "@mui/material";
import { Search, Close, School, People } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import MahasiswaNavbar from "../../components/layouts/MahasiswaNavbar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import {
  getStatusPembimbing,
  getListDosen,
  ajukanPembimbing,
} from "../../api/mahasiswa";


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
  fontWeight: 700, fontSize: 13, color: "#000",
  backgroundColor: "#fafafa", borderBottom: "2px solid #f0f0f0", py: 2,
};

const tableBodyRow = {
  "&:hover": { backgroundColor: "#f8f9ff" },
  "& td": { borderBottom: "1px solid #f5f5f5", py: 2 },
};

const STATUS_PENGAJUAN = {
  0: { label: "Menunggu Respon", backgroundColor: "#f57f17" },
  1: { label: "Disetujui",       backgroundColor: "#2e7d32" },
  2: { label: "Ditolak",         backgroundColor: "#c62828" },
};

const swalOptions = {
  customClass: { container: "swal-over-dialog" },
  didOpen: () => {
    const container = document.querySelector(".swal-over-dialog");
    if (container) container.style.zIndex = "99999";
  },
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

const AlertBox = ({ children, color, bg, border }) => (
  <Box sx={{
    p: 2.5, borderRadius: "12px", backgroundColor: bg,
    border: `1.5px solid ${border}`,
    display: "flex", gap: 1.5, alignItems: "flex-start",
  }}>
    <Box sx={{ width: 8, height: 8, mt: 0.6, borderRadius: "50%", background: color, flexShrink: 0 }} />
    <Typography sx={{ fontSize: 13, color, lineHeight: 1.6 }}>{children}</Typography>
  </Box>
);

const InfoRow = ({ label, value }) => (
  <Box>
    <Typography sx={{ fontSize: 12, color: COLORS.slate, mb: 0.5 }}>{label}</Typography>
    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{value || "—"}</Typography>
  </Box>
);

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export default function PengajuanPembimbingPage() {
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingDosen, setLoadingDosen]   = useState(true);
  const [statusData, setStatusData]       = useState(null);
  const [dosenList, setDosenList]         = useState([]);
  const [search, setSearch]               = useState("");
  const [dialogOpen, setDialogOpen]       = useState(false);
  const [selectedDosen, setSelectedDosen] = useState(null);
  const [submitting, setSubmitting]       = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setLoadingStatus(true);
      const res = await getStatusPembimbing();
      if (res.success) setStatusData(res.data);
    } catch {} finally { setLoadingStatus(false); }
  }, []);

  const fetchDosen = useCallback(async () => {
    try {
      setLoadingDosen(true);
      const res = await getListDosen();
      if (res.success) setDosenList(res.data || []);
    } catch {
      await Swal.fire({ icon: "error", title: "Gagal Memuat", text: "Gagal memuat daftar dosen. Silahkan refresh halaman.", confirmButtonText: "OK" });
    } finally { setLoadingDosen(false); }
  }, []);

  useEffect(() => { fetchStatus(); fetchDosen(); }, [fetchStatus, fetchDosen]);

  const filteredDosen = dosenList.filter((d) =>
    (d.nama_lengkap || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.bidang_keahlian || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.nip || "").includes(search)
  );

  const bisaAjukan          = statusData?.bisa_ajukan === true;
  const isKetua             = statusData?.is_ketua === true;
  const pengajuan           = statusData?.pengajuan;
  const statusPengajuan     = pengajuan?.status;
  const isReassigned        = pengajuan?.is_reassigned === true;
  const catatanDosenDisplay = pengajuan?.catatan_dosen_display || (isReassigned ? null : pengajuan?.catatan_dosen);

  const handleOpenDetail  = (dosen) => { setSelectedDosen(dosen); setDialogOpen(true); };
  const handleCloseDialog = () => { setDialogOpen(false); setSelectedDosen(null); };

  const handleAjukan = async () => {
    if (!selectedDosen) return;
    const result = await Swal.fire({
      ...swalOptions,
      title: "Konfirmasi Pengajuan",
      html: `Anda akan mengajukan <b>${selectedDosen.nama_lengkap}</b> sebagai dosen pembimbing.<br/><br/>Lanjutkan?`,
      icon: "question", showCancelButton: true,
      confirmButtonColor: COLORS.primary, cancelButtonColor: "#666",
      confirmButtonText: "Ya, Ajukan", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    try {
      setSubmitting(true);
      const res = await ajukanPembimbing({ id_dosen: selectedDosen.id_user });
      if (res.success) {
        handleCloseDialog();
        await Swal.fire({ ...swalOptions, icon: "success", title: "Berhasil", text: res.message || "Pengajuan pembimbing berhasil dikirim", timer: 2000, timerProgressBar: true, showConfirmButton: false });
        fetchStatus();
      } else {
        await Swal.fire({ ...swalOptions, icon: "error", title: "Gagal", text: res.message || "Terjadi kesalahan" });
      }
    } catch (err) {
      await Swal.fire({ ...swalOptions, icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal mengajukan pembimbing" });
    } finally { setSubmitting(false); }
  };

  const getPengajuanDosenIni = (id_user) => {
    if (!pengajuan) return null;
    return pengajuan.id_dosen === id_user ? pengajuan : null;
  };

  return (
    <BodyLayout Sidebar={MahasiswaNavbar}>
      <PageTransition>
        <Box>

          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              Pengajuan Pembimbing
            </Typography>
            <Typography sx={{ fontSize: 16, color: "#6B7280" }}>
              Ajukan dosen pembimbing untuk tim Anda
            </Typography>
          </Box>

          {!isKetua && (
            <Box sx={{ mb: 3 }}>
              <AlertBox color={COLORS.primaryDark} bg={COLORS.primaryLight} border={COLORS.primaryMuted}>
                Hanya ketua tim yang dapat mengajukan dosen pembimbing.
              </AlertBox>
            </Box>
          )}

          {loadingStatus ? (
            <Box sx={{ position: "relative", minHeight: 140, mb: 3 }}>
              <LoadingScreen message="Memuat status pembimbing..." overlay minHeight="140px" />
            </Box>
          ) : statusData ? (
            <Paper elevation={0} sx={{ mb: 3, borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
              <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
              <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
                <SectionHeader
                  icon={School}
                  title="Status Pengajuan Pembimbing"
                  subtitle="Informasi pengajuan dosen pembimbing tim Anda"
                  gradient={`linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`}
                />

                {pengajuan?.nama_dosen && (
                  <Box sx={{
                    mb: 3, p: 3, borderRadius: "16px",
                    background: `linear-gradient(135deg, ${COLORS.primaryLight} 0%, ${COLORS.primary}08 100%)`,
                    border: `1.5px solid ${COLORS.primaryMuted}`,
                  }}>
                    <Typography sx={{ fontSize: 12, color: COLORS.primaryDark, fontWeight: 600, mb: 0.5 }}>
                      Dosen Pembimbing
                    </Typography>
                    <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
                      {pengajuan.nama_dosen}
                    </Typography>
                  </Box>
                )}

                {pengajuan && (
                  <>
                    <Divider sx={{ my: 2.5 }} />
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 3, mb: 2 }}>
                      <InfoRow label="Tanggal Diajukan" value={formatDate(pengajuan.created_at)} />
                      {pengajuan.responded_at && (
                        <InfoRow label="Tanggal Respon" value={formatDate(pengajuan.responded_at)} />
                      )}
                      {pengajuan.status !== undefined && (
                        <Box>
                          <Typography sx={{ fontSize: 12, color: COLORS.slate, mb: 0.5 }}>Status</Typography>
                          <StatusPill
                            label={STATUS_PENGAJUAN[pengajuan.status]?.label || "Unknown"}
                            backgroundColor={STATUS_PENGAJUAN[pengajuan.status]?.backgroundColor || "#666"}
                          />
                        </Box>
                      )}
                    </Box>

                    {catatanDosenDisplay && (
                      <Box sx={{ mt: 2.5, p: 2.5, backgroundColor: COLORS.warningLight, borderRadius: "12px", border: `1.5px solid #FDE68A` }}>
                        <Typography sx={{ fontSize: 12, color: COLORS.warning, fontWeight: 700, mb: 0.5 }}>
                          Catatan Dosen
                        </Typography>
                        <Typography sx={{ fontSize: 13.5, color: "#92400E", lineHeight: 1.6 }}>
                          {catatanDosenDisplay}
                        </Typography>
                      </Box>
                    )}
                  </>
                )}

                <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {isReassigned && (
                    <AlertBox color={COLORS.primaryDark} bg={COLORS.primaryLight} border={COLORS.primaryMuted}>
                      Dosen pembimbing Anda telah di-reassign oleh admin. Pembimbing saat ini:{" "}
                      <strong>{pengajuan?.nama_dosen || "—"}</strong>.
                    </AlertBox>
                  )}
                  {!bisaAjukan && statusPengajuan === 1 && (
                    <AlertBox color="#065F46" bg={COLORS.successLight} border="#6EE7B7">
                      Pengajuan pembimbing Anda telah disetujui.
                    </AlertBox>
                  )}
                  {!bisaAjukan && statusPengajuan === 0 && (
                    <AlertBox color={COLORS.primaryDark} bg={COLORS.primaryLight} border={COLORS.primaryMuted}>
                      Pengajuan sedang menunggu respon dari dosen. Anda tidak dapat mengajukan dosen lain saat ini.
                    </AlertBox>
                  )}
                  {bisaAjukan && statusPengajuan === 2 && isKetua && (
                    <AlertBox color="#92400E" bg={COLORS.warningLight} border="#FDE68A">
                      Pengajuan sebelumnya ditolak. Silahkan ajukan dosen pembimbing lain.
                    </AlertBox>
                  )}
                  {bisaAjukan && !pengajuan && isKetua && (
                    <AlertBox color={COLORS.primaryDark} bg={COLORS.primaryLight} border={COLORS.primaryMuted}>
                      Pilih dosen dari daftar di bawah untuk mengajukan pembimbing.
                    </AlertBox>
                  )}
                </Box>
              </Box>
            </Paper>
          ) : (
            <Box sx={{ mb: 3 }}>
              <AlertBox color={COLORS.primaryDark} bg={COLORS.primaryLight} border={COLORS.primaryMuted}>
                Fitur pengajuan pembimbing hanya tersedia untuk ketua tim yang sudah terdaftar dalam tim aktif.
              </AlertBox>
            </Box>
          )}

          <Paper elevation={0} sx={{ borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.secondary}, ${COLORS.success})` }} />
            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <SectionHeader
                icon={People}
                title="Daftar Dosen Pembimbing"
                subtitle="Pilih dosen untuk diajukan sebagai pembimbing tim"
                gradient={`linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.success} 100%)`}
              />

              <Box sx={{ mb: 3 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Cari nama, NIP, bidang keahlian..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ fontSize: 18, color: COLORS.slate }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ maxWidth: { xs: "100%", sm: 340 }, ...roundedField }}
                />
              </Box>

              {loadingDosen ? (
                <Box sx={{ position: "relative", minHeight: 240 }}>
                  <LoadingScreen message="Memuat daftar dosen..." overlay minHeight="240px" />
                </Box>
              ) : filteredDosen.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <Typography sx={{ color: COLORS.slate, fontSize: 14 }}>
                    {search ? "Dosen tidak ditemukan" : "Belum ada dosen tersedia"}
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "hidden", overflowX: "auto" }}>
                  <Table sx={{ minWidth: 500 }}>
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
                            <TableCell>
                              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{dosen.nama_lengkap}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13 }}>{dosen.nip || "—"}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13 }}>{dosen.bidang_keahlian || "—"}</Typography>
                            </TableCell>
                            {statusData && (
                              <TableCell align="center">
                                {!pengajuanDosenIni && bisaAjukan && isKetua && (
                                  <Button
                                    size="small" variant="contained"
                                    onClick={() => handleOpenDetail(dosen)}
                                    sx={{
                                      textTransform: "none", borderRadius: "10px",
                                      fontWeight: 600, fontSize: 12, px: 2,
                                      backgroundColor: COLORS.primary,
                                      "&:hover": { backgroundColor: COLORS.primaryDark },
                                    }}
                                  >
                                    Ajukan
                                  </Button>
                                )}
                                {!pengajuanDosenIni && (!bisaAjukan || !isKetua) && (
                                  <Button
                                    size="small" variant="outlined"
                                    onClick={() => handleOpenDetail(dosen)}
                                    sx={{
                                      textTransform: "none", borderRadius: "10px",
                                      fontWeight: 600, fontSize: 12, px: 2,
                                      borderColor: COLORS.primary, color: COLORS.primary,
                                      "&:hover": { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
                                    }}
                                  >
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
                                  <Button
                                    size="small" variant="contained"
                                    onClick={() => handleOpenDetail(dosen)}
                                    sx={{
                                      textTransform: "none", borderRadius: "10px",
                                      fontWeight: 600, fontSize: 12, px: 2,
                                      backgroundColor: COLORS.primary,
                                      "&:hover": { backgroundColor: COLORS.primaryDark },
                                    }}
                                  >
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
            </Box>
          </Paper>
        </Box>
      </PageTransition>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "20px", overflow: "hidden" } }}
      >
        <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />

        <DialogTitle sx={{ pb: 1, pt: 2.5, px: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: "10px",
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <School sx={{ color: "#fff", fontSize: 18 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Detail Dosen Pembimbing</Typography>
          </Box>
          <IconButton
            onClick={handleCloseDialog}
            sx={{
              position: "absolute", right: 12, top: 12,
              color: COLORS.slate,
              "&:hover": { backgroundColor: COLORS.slateLight },
              borderRadius: "10px",
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ px: 3, py: 3 }}>
          {selectedDosen && (
            <Box>
              <Box sx={{
                mb: 3, p: 2.5, borderRadius: "14px",
                background: `linear-gradient(135deg, ${COLORS.primaryLight} 0%, ${COLORS.primary}08 100%)`,
                border: `1.5px solid ${COLORS.primaryMuted}`,
              }}>
                <Typography sx={{ fontSize: 12, color: COLORS.primaryDark, fontWeight: 600, mb: 0.5 }}>
                  Nama Lengkap
                </Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1F2937" }}>
                  {selectedDosen.nama_lengkap}
                </Typography>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: 3 }}>
                <InfoRow label="NIP" value={selectedDosen.nip} />
                <InfoRow label="Bidang Keahlian" value={selectedDosen.bidang_keahlian} />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{
                p: 2.5, backgroundColor: COLORS.slateLight,
                borderRadius: "12px", border: `1.5px solid #CBD5E1`,
              }}>
                <Typography sx={{ fontSize: 12, color: COLORS.slate, fontWeight: 600, mb: 1.5 }}>
                  Status Pengajuan ke Dosen Ini
                </Typography>
                {(() => {
                  const p = getPengajuanDosenIni(selectedDosen.id_user);
                  if (!p) return <StatusPill label="Belum Diajukan" backgroundColor="#666" />;
                  return (
                    <StatusPill
                      label={STATUS_PENGAJUAN[p.status]?.label || "—"}
                      backgroundColor={STATUS_PENGAJUAN[p.status]?.backgroundColor || "#666"}
                    />
                  );
                })()}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{
          px: { xs: 2.5, sm: 3 }, py: { xs: 2, sm: 3 },
          gap: 1.5,
          flexDirection: { xs: "column", sm: "row" },
          "& > button": { width: { xs: "100%", sm: "auto" } },
        }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              backgroundColor: COLORS.error,
              textTransform: "none", borderRadius: "10px", px: 3, py: 1.2,
              fontWeight: 700, fontSize: 14, color: COLORS.slateLight,
            }}
          >
            Tutup
          </Button>
          {bisaAjukan && isKetua &&
            (!getPengajuanDosenIni(selectedDosen?.id_user) ||
              getPengajuanDosenIni(selectedDosen?.id_user)?.status === 2) && (
            <Button
              variant="contained"
              onClick={handleAjukan}
              disabled={submitting}
              sx={{
                textTransform: "none", borderRadius: "10px", px: 3, py: 1.2,
                fontWeight: 700, fontSize: 14,
                backgroundColor: COLORS.primary,
                "&:hover": { backgroundColor: COLORS.primaryDark },
                "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" },
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