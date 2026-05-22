import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, LinearProgress, Chip,
} from "@mui/material";
import {
  Close, CheckCircle, Cancel, HourglassEmpty,
  RadioButtonUnchecked, AttachFile, Link as LinkIcon,
  AssignmentTurnedIn, FormatListBulleted,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import MahasiswaNavbar from "../../components/layouts/MahasiswaNavbar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import { getLuaranMahasiswa, submitLuaran, deleteLuaran } from "../../api/mahasiswa";
import { getProposalStatus } from "../../api/mahasiswa";
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

const SectionHeader = ({ icon: Icon, title, subtitle, gradient }) => (
  <Box sx={{
    display: "flex", alignItems: "center", gap: 2, mb: 3,
    p: 2.5, borderRadius: "14px",
    background: gradient,
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

const FieldLabel = ({ children }) => (
  <Typography sx={{ fontWeight: 600, mb: 0.8, fontSize: 13, color: "#374151" }}>
    {children}
  </Typography>
);

const StatusPill = ({ status }) => {
  const s = STATUS_MAP[status ?? 0];
  return (
    <Box sx={{
      display: "inline-flex", alignItems: "center", gap: 0.5,
      px: 1.5, py: 0.4, borderRadius: "50px",
      backgroundColor: s.bg, color: "#fff",
      fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
    }}>
      {s.icon}
      {s.label}
    </Box>
  );
};

const InfoBox = ({ children, type = "info" }) => {
  const styles = {
    info: { bg: COLORS.primaryLight, border: COLORS.primaryMuted, dot: COLORS.primary, text: COLORS.primaryDark },
    warning: { bg: COLORS.warningLight, border: "#FDE68A", dot: COLORS.warning, text: "#92400E" },
    error: { bg: COLORS.errorLight, border: "#FCA5A5", dot: COLORS.error, text: "#7F1D1D" },
    success: { bg: COLORS.successLight, border: "#6EE7B7", dot: COLORS.success, text: "#065F46" },
  };
  const s = styles[type] || styles.info;
  return (
    <Box sx={{
      mb: 3, p: 2.5, borderRadius: "14px",
      background: s.bg, border: `1.5px solid ${s.border}`,
      display: "flex", gap: 1.5, alignItems: "flex-start",
    }}>
      <Box sx={{ width: 8, height: 8, mt: 0.8, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      <Typography sx={{ fontSize: 13.5, color: s.text, fontWeight: 600, lineHeight: 1.6 }}>
        {children}
      </Typography>
    </Box>
  );
};

const STATUS_MAP = {
  0: { label: "Belum Dikerjakan", bg: COLORS.slate, icon: <RadioButtonUnchecked sx={{ fontSize: 16 }} /> },
  1: { label: "Tersimpan", bg: COLORS.warning, icon: <HourglassEmpty sx={{ fontSize: 16 }} /> },
  2: { label: "Disetujui", bg: COLORS.success, icon: <CheckCircle sx={{ fontSize: 16 }} /> },
  3: { label: "Ditolak", bg: COLORS.error, icon: <Cancel sx={{ fontSize: 16 }} /> },
};

const TIPE_MAP = {
  1: { label: "File", bg: COLORS.primary },
  2: { label: "Link", bg: "#6a1b9a" },
  3: { label: "File & Link", bg: COLORS.success },
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

const swalOptions = {
  customClass: { container: "swal-over-dialog" },
  didOpen: () => {
    const container = document.querySelector(".swal-over-dialog");
    if (container) container.style.zIndex = "99999";
  },
};

export default function MonevPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [hasMonevAccess, setHasMonevAccess] = useState(true);
  const [openSubmit, setOpenSubmit] = useState(false);
  const [selectedLuaran, setSelectedLuaran] = useState(null);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [links, setLinks] = useState([""]);
  const [linksError, setLinksError] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchLuaran = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLuaranMahasiswa();
      if (res.success) {
        setData(res.data);
        setStatusMessage(null);
      } else {
        setStatusMessage(res.message || "Gagal memuat data luaran");
      }
    } catch (err) {
      setStatusMessage(
        err.response?.data?.message ||
          "Gagal memuat data luaran. Silahkan refresh halaman.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLuaran();
  }, [fetchLuaran]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getProposalStatus();
        if (!active) return;
        if (res?.success && res.data?.proposal && Number(res.data.proposal.status) >= 7) {
          setHasMonevAccess(true);
        } else {
          setHasMonevAccess(false);
        }
      } catch (err) {
        if (active) setHasMonevAccess(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const handleOpenSubmit = (luaran) => {
    setSelectedLuaran(luaran);
    setFile(null);
    setFileError("");
    const existingLinks = luaran.link_luaran?.length
      ? luaran.link_luaran
      : [""];
    setLinks(existingLinks);
    setLinksError([]);
    setOpenSubmit(true);
  };

  const handleCloseSubmit = () => {
    setOpenSubmit(false);
    setSelectedLuaran(null);
    setFile(null);
    setFileError("");
    setLinks([""]);
    setLinksError([]);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      setFileError("File harus berformat PDF");
      e.target.value = "";
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setFileError("Ukuran file maksimal 10 MB");
      e.target.value = "";
      return;
    }
    setFile(selected);
    setFileError("");
  };

  const handleAddLink = () => setLinks([...links, ""]);

  const handleChangeLink = (idx, value) => {
    const updated = [...links];
    updated[idx] = value;
    setLinks(updated);
    const updatedErrors = [...linksError];
    updatedErrors[idx] = "";
    setLinksError(updatedErrors);
  };

  const handleRemoveLink = (idx) => {
    setLinks(links.filter((_, i) => i !== idx));
    setLinksError(linksError.filter((_, i) => i !== idx));
  };

  const validate = () => {
    let valid = true;
    const tipe = selectedLuaran?.tipe;

    if (tipe === 1 || tipe === 3) {
      if (!file && !selectedLuaran?.file_luaran) {
        setFileError("File wajib diunggah");
        valid = false;
      }
    }

    if (tipe === 2 || tipe === 3) {
      if (links.length === 0) {
        setLinksError(["Minimal satu link wajib diisi"]);
        valid = false;
      } else {
        const errors = links.map((l) => {
          if (!l.trim()) return "Link tidak boleh kosong";
          try {
            new URL(l.trim());
            return "";
          } catch {
            return "Format link tidak valid, gunakan URL yang benar";
          }
        });
        setLinksError(errors);
        if (errors.some((e) => e)) valid = false;
      }
    }

    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const result = await Swal.fire({
      ...swalOptions,
      title: "Konfirmasi Simpan",
      text: `Simpan luaran "${selectedLuaran.nama_luaran}"? Luaran dapat diubah atau dihapus sampai disetujui admin.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0D59F2",
      cancelButtonColor: "#666",
      confirmButtonText: "Ya, Simpan",
      cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;

    setSubmitting(true);
    handleCloseSubmit();
    try {
      const formData = new FormData();
      if (file) formData.append("file_luaran", file);
      if (selectedLuaran.tipe !== 1) {
        formData.append(
          "links",
          JSON.stringify(links.map((l) => l.trim()).filter(Boolean)),
        );
      }
      await submitLuaran(selectedLuaran.id_luaran, formData);
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Luaran berhasil disimpan",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      fetchLuaran();
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.response?.data?.message || "Gagal menyimpan luaran",
        confirmButtonText: "OK",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLuaran = async (luaran) => {
    const result = await Swal.fire({
      ...swalOptions,
      title: "Hapus Luaran?",
      text: `Hapus luaran "${luaran.nama_luaran}" dari penyimpanan?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: COLORS.error,
      cancelButtonColor: COLORS.slate,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;

    try {
      setSubmitting(true);
      await deleteLuaran(luaran.id_luaran);
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Luaran berhasil dihapus",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      fetchLuaran();
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.response?.data?.message || "Gagal menghapus luaran",
        confirmButtonText: "OK",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const canSaveLuaran = (luaran) => {
    if (!data?.tim || data.tim.peran !== 1) return false;
    if (luaran.status === 2) return false;
    if (isDeadlineLewat(luaran.deadline)) return false;
    return true;
  };

  const canDeleteLuaran = (luaran) => {
    if (!data?.tim || data.tim.peran !== 1) return false;
    if (!luaran.id_luaran_tim) return false;
    if (luaran.status === 2) return false;
    return true;
  };

  if (loading) {
    return (
      <BodyLayout Sidebar={MahasiswaNavbar}>
        <Box sx={{ position: "relative", minHeight: "60vh" }}>
          <LoadingScreen message="Memuat data monev..." overlay minHeight="60vh" />
        </Box>
      </BodyLayout>
    );
  }

  return (
    <BodyLayout Sidebar={MahasiswaNavbar}>
      <PageTransition>
        <Box>

          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              Monitoring & Evaluasi
            </Typography>
            <Typography sx={{ fontSize: 16, color: "#6B7280" }}>
              Pantau dan simpan luaran kegiatan program Anda
            </Typography>
          </Box>

          {hasMonevAccess === false && (
            <InfoBox type="warning">
              Monev akan menampilkan detail dan penyimpanan luaran setelah tim Anda lolos tahap 2. Saat ini tim Anda belum lolos tahap 2.
            </InfoBox>
          )}

          {statusMessage && (
            <InfoBox type="warning">{statusMessage}</InfoBox>
          )}

          {!statusMessage && data && (
            <>
              {data.tim.peran !== 1 && hasMonevAccess !== false && (
                <InfoBox type="info">
                  Hanya ketua tim yang dapat menyimpan dan mengelola luaran. Anda dapat memantau progress di halaman ini.
                </InfoBox>
              )}

              <Paper elevation={0} sx={{ borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden", mb: 3 }}>
                <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
                <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
                  <SectionHeader
                    icon={FormatListBulleted}
                    title="Progress Luaran"
                    subtitle="Pantau achievement luaran kegiatan"
                    gradient={`linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`}
                  />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={data.progress.total > 0 ? Math.round((data.progress.disetujui / data.progress.total) * 100) : 0}
                      sx={{
                        flex: 1, height: 10, borderRadius: 5,
                        backgroundColor: COLORS.slateLight,
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: data.progress.disetujui === data.progress.total && data.progress.total > 0 ? COLORS.success : COLORS.primary,
                          borderRadius: 5,
                        },
                      }}
                    />
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#1F2937", minWidth: 52 }}>
                      {data.progress.total > 0 ? Math.round((data.progress.disetujui / data.progress.total) * 100) : 0}%
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", overflowX: "auto", pb: 1 }}>
                    {[
                      { label: "Total", value: data.progress.total, bg: COLORS.slate },
                      { label: "Disetujui", value: data.progress.disetujui, bg: COLORS.success },
                      { label: "Tersimpan", value: data.progress.submitted, bg: COLORS.warning },
                      { label: "Ditolak", value: data.progress.ditolak, bg: COLORS.error },
                      { label: "Belum", value: data.progress.belum, bg: "#9CA3AF" },
                    ].map((item) => (
                      <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Chip label={item.value} size="small" sx={{ backgroundColor: item.bg, color: "#fff", fontWeight: 700 }} />
                        <Typography sx={{ fontSize: 13, color: COLORS.slate }}>{item.label}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Paper>

              {hasMonevAccess !== false && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {data.luaran.map((luaran) => {
                    const tipe = TIPE_MAP[luaran.tipe] || {};
                    const lewat = isDeadlineLewat(luaran.deadline);
                    const bisa = canSaveLuaran(luaran);
                    const canDelete = canDeleteLuaran(luaran);

                    return (
                      <Paper key={luaran.id_luaran} elevation={0} sx={{
                        borderRadius: "20px", border: "1.5px solid #E5E7EB",
                        overflow: "hidden",
                        background: luaran.status === 2 ? COLORS.successLight : luaran.status === 3 ? COLORS.errorLight : "#fff",
                      }}>
                        <Box sx={{ height: 4, background: luaran.status === 2 ? `linear-gradient(90deg, ${COLORS.success}, #34D399)` : luaran.status === 3 ? `linear-gradient(90deg, ${COLORS.error}, #FCA5A5)` : `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
                        <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                            <Box sx={{ flex: 1, mr: 2 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: 16, color: "#1F2937" }}>{luaran.nama_luaran}</Typography>
                                <Chip label={tipe.label} size="small" sx={{ backgroundColor: tipe.bg, color: "#fff", fontWeight: 700, fontSize: 11 }} />
                              </Box>
                              {luaran.keterangan && <Typography sx={{ fontSize: 13, color: COLORS.slate }}>{luaran.keterangan}</Typography>}
                            </Box>
                            <StatusPill status={luaran.status ?? 0} />
                          </Box>

                          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 2 }}>
                            <Box>
                              <Typography sx={{ fontSize: 11, color: COLORS.slate, mb: 0.25 }}>Deadline</Typography>
                              <Typography sx={{ fontSize: 13, fontWeight: 600, color: lewat && luaran.status !== 2 ? COLORS.error : "#333" }}>
                                {formatDate(luaran.deadline)}
                              </Typography>
                              {lewat && luaran.status !== 2 && <Typography sx={{ fontSize: 11, color: COLORS.error, fontWeight: 600 }}>Sudah Lewat</Typography>}
                            </Box>
                            {luaran.submitted_at && (
                              <Box>
                                <Typography sx={{ fontSize: 11, color: COLORS.slate, mb: 0.25 }}>Disimpan</Typography>
                                <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#1F2937" }}>{formatDate(luaran.submitted_at)}</Typography>
                              </Box>
                            )}
                          </Box>

                          {luaran.id_luaran_tim && (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
                              {luaran.file_luaran && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <AttachFile sx={{ fontSize: 16, color: COLORS.primary }} />
                                  <Button onClick={() => downloadFile(luaran.file_luaran, "luaran")} size="small" sx={{
                                    textTransform: "none", fontSize: 12, fontWeight: 600, color: COLORS.primary, p: 0, minWidth: 0,
                                    "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
                                  }}>
                                    {luaran.file_luaran}
                                  </Button>
                                </Box>
                              )}
                              {luaran.link_luaran?.length > 0 && luaran.link_luaran.map((url, idx) => (
                                <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <LinkIcon sx={{ fontSize: 16, color: "#6a1b9a" }} />
                                  <Button component="a" href={url} target="_blank" rel="noopener noreferrer" size="small" sx={{
                                    textTransform: "none", fontSize: 12, fontWeight: 600, color: "#6a1b9a", p: 0, minWidth: 0,
                                    "&:hover": { backgroundColor: "transparent", textDecoration: "underline" },
                                  }}>
                                    {url}
                                  </Button>
                                </Box>
                              ))}
                              {luaran.catatan_admin && (
                                <Box sx={{ p: 2, backgroundColor: COLORS.errorLight, borderRadius: "12px", border: `1.5px solid #FCA5A5` }}>
                                  <Typography sx={{ fontSize: 12, color: COLORS.error, fontWeight: 700, mb: 0.5 }}>Catatan Admin</Typography>
                                  <Typography sx={{ fontSize: 13, color: "#7F1D1D" }}>{luaran.catatan_admin}</Typography>
                                </Box>
                              )}
                            </Box>
                          )}

                          <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1 }}>
                            {bisa && (
                              <Button variant="contained" size="small" onClick={() => handleOpenSubmit(luaran)} disabled={submitting} sx={{
                                textTransform: "none", borderRadius: "10px", fontSize: 13, fontWeight: 700,
                                backgroundColor: luaran.id_luaran_tim ? COLORS.warning : COLORS.primary,
                                "&:hover": { backgroundColor: luaran.id_luaran_tim ? "#B45309" : COLORS.primaryDark },
                              }}>
                                {luaran.id_luaran_tim ? "Edit" : "Simpan"}
                              </Button>
                            )}
                            {canDelete && (
                              <Button variant="outlined" size="small" onClick={() => handleDeleteLuaran(luaran)} disabled={submitting} sx={{
                                textTransform: "none", borderRadius: "10px", fontSize: 13, fontWeight: 700,
                                borderColor: COLORS.errorLight,
                                color: COLORS.error,
                                "&:hover": { backgroundColor: COLORS.errorLight, borderColor: COLORS.error },
                              }}>
                                Hapus
                              </Button>
                            )}
                            {!bisa && lewat && !luaran.id_luaran_tim && luaran.status !== 2 ? (
                              <Typography sx={{ fontSize: 12, color: COLORS.error, fontWeight: 600 }}>Deadline telah lewat</Typography>
                            ) : null}
                          </Box>
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              )}
            </>
          )}

          {!statusMessage && hasMonevAccess !== false && (!data || data.luaran?.length === 0) && (
            <Paper elevation={0} sx={{ borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
              <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
              <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
                <SectionHeader
                  icon={AssignmentTurnedIn}
                  title="Belum Ada Luaran"
                  subtitle="Data luaran kegiatan akan muncul di sini"
                  gradient={`linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`}
                />
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <Box sx={{
                    width: 100, height: 100, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${COLORS.slateLight}, #E2E8F0)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    mx: "auto", mb: 3, border: `3px solid ${COLORS.primaryMuted}`,
                  }}>
                    <AssignmentTurnedIn sx={{ fontSize: 48, color: COLORS.slate }} />
                  </Box>
                  <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#1F2937", mb: 1 }}>Belum Ada Luaran</Typography>
                  <Typography sx={{ fontSize: 14, color: COLORS.slate, maxWidth: 420, mx: "auto", lineHeight: 1.7 }}>
                    Luaran kegiatan akan muncul di sini setelah admin menetapkannya
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}
        </Box>

        <Dialog open={openSubmit} onClose={handleCloseSubmit} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
          <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ pr: 4 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 18, color: "#1F2937" }}>
                {selectedLuaran?.id_luaran_tim ? "Edit Luaran" : "Simpan Luaran"}
              </Typography>
              {selectedLuaran && <Typography sx={{ fontSize: 13, color: COLORS.slate, mt: 0.25 }}>{selectedLuaran.nama_luaran}</Typography>}
            </Box>
            <IconButton onClick={handleCloseSubmit} sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}>
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ px: 3, py: 3 }}>
            {selectedLuaran?.status === 3 && selectedLuaran?.catatan_admin && (
              <Box sx={{ mb: 3, p: 2, backgroundColor: COLORS.errorLight, borderRadius: "12px", border: `1.5px solid #FCA5A5` }}>
                <Typography sx={{ fontSize: 12, color: COLORS.error, fontWeight: 700, mb: 0.5 }}>Catatan Penolakan Admin</Typography>
                <Typography sx={{ fontSize: 13, color: "#7F1D1D" }}>{selectedLuaran.catatan_admin}</Typography>
              </Box>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {(selectedLuaran?.tipe === 1 || selectedLuaran?.tipe === 3) && (
                <Box>
                  <FieldLabel>File Luaran (PDF) <span style={{ color: COLORS.error }}>*</span></FieldLabel>
                  {selectedLuaran?.file_luaran && !file && (
                    <Box sx={{ mb: 1.5, p: 1.5, borderRadius: "10px", backgroundColor: COLORS.primaryLight, border: `1.5px solid ${COLORS.primaryMuted}`, display: "flex", alignItems: "center", gap: 1 }}>
                      <AttachFile sx={{ fontSize: 16, color: COLORS.primary }} />
                      <Typography sx={{ fontSize: 12, color: COLORS.primary, fontWeight: 600 }}>File sebelumnya: {selectedLuaran.file_luaran}</Typography>
                    </Box>
                  )}
                  <Box component="label" htmlFor="file-luaran-upload" sx={{
                    border: `2px dashed ${fileError ? COLORS.error : "#E5E7EB"}`,
                    borderRadius: "12px", p: 3, textAlign: "center",
                    backgroundColor: "#fafafa", cursor: "pointer", display: "block", transition: "all 0.2s",
                    "&:hover": { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
                  }}>
                    <input type="file" accept="application/pdf" id="file-luaran-upload" style={{ display: "none" }} onChange={handleFileChange} />
                    {file ? (
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                        <AttachFile sx={{ fontSize: 18, color: COLORS.primary }} />
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORS.primary }}>{file.name}</Typography>
                      </Box>
                    ) : (
                      <>
                        <Typography sx={{ fontSize: 13, color: COLORS.slate, fontWeight: 600, mb: 0.5 }}>Klik untuk pilih file PDF</Typography>
                        <Typography sx={{ fontSize: 12, color: COLORS.slate }}>Maksimal 10 MB</Typography>
                      </>
                    )}
                  </Box>
                  {fileError && <Typography sx={{ fontSize: 12, color: COLORS.error, mt: 0.5 }}>{fileError}</Typography>}
                </Box>
              )}

              {(selectedLuaran?.tipe === 2 || selectedLuaran?.tipe === 3) && (
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
                    <FieldLabel>Link URL <span style={{ color: COLORS.error }}>*</span></FieldLabel>
                    <Button size="small" onClick={handleAddLink} sx={{
                      textTransform: "none", fontSize: 12, fontWeight: 600, color: COLORS.primary, p: 0, minWidth: 0,
                      "&:hover": { backgroundColor: "transparent" },
                    }}>
                      + Tambah Link
                    </Button>
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {links.map((l, idx) => (
                      <Box key={idx} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                        <TextField fullWidth placeholder="https://..." value={l} onChange={(e) => handleChangeLink(idx, e.target.value)} error={!!linksError[idx]} helperText={linksError[idx]} sx={roundedField} />
                        {links.length > 1 && (
                          <IconButton size="small" onClick={() => handleRemoveLink(idx)} sx={{
                            mt: 0.5, color: COLORS.error, backgroundColor: COLORS.errorLight, borderRadius: "8px",
                            "&:hover": { backgroundColor: "#FEE2E2" },
                          }}>
                            <Close fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{
            px: { xs: 2.5, sm: 3 }, py: { xs: 2, sm: 3 },
            gap: 1.5,
            flexDirection: { xs: "column", sm: "row" },
            "& > button": { width: { xs: "100%", sm: "auto" } },
          }}>
            <Button onClick={handleCloseSubmit} sx={{
              textTransform: "none", borderRadius: "10px", px: 3, py: 1.2, fontWeight: 600,
              backgroundColor: COLORS.error, color: "#fff",
              "&:hover": { backgroundColor: "#B91C1C" },
            }}>
              Batal
            </Button>
            <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{
              textTransform: "none", borderRadius: "10px", px: 4, py: 1.2, fontWeight: 700,
              backgroundColor: COLORS.primary,
              "&:hover": { backgroundColor: COLORS.primaryDark },
              "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" },
            }}>
              {submitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogActions>
        </Dialog>
      </PageTransition>
    </BodyLayout>
  );
}