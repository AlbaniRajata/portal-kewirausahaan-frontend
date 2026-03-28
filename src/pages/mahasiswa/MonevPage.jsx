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
  IconButton,
  LinearProgress,
  Chip,
} from "@mui/material";
import {
  Close,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  RadioButtonUnchecked,
  AttachFile,
  Link as LinkIcon,
  AssignmentTurnedIn,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import SidebarMahasiswa from "../../components/layouts/MahasiswaSidebar";
import PageTransition from "../../components/PageTransition";
import { getLuaranMahasiswa, submitLuaran } from "../../api/mahasiswa";

const STATUS_MAP = {
  0: {
    label: "Belum Dikerjakan",
    color: "#777",
    bg: "#f5f5f5",
    icon: <RadioButtonUnchecked sx={{ fontSize: 16 }} />,
  },
  1: {
    label: "Submitted",
    color: "#f57f17",
    bg: "#fff8e1",
    icon: <HourglassEmpty sx={{ fontSize: 16 }} />,
  },
  2: {
    label: "Disetujui",
    color: "#2e7d32",
    bg: "#e8f5e9",
    icon: <CheckCircle sx={{ fontSize: 16 }} />,
  },
  3: {
    label: "Ditolak",
    color: "#c62828",
    bg: "#ffebee",
    icon: <Cancel sx={{ fontSize: 16 }} />,
  },
};

const TIPE_MAP = {
  1: { label: "File", color: "#1565c0", bg: "#e3f2fd" },
  2: { label: "Link", color: "#6a1b9a", bg: "#f3e5f5" },
  3: { label: "File & Link", color: "#2e7d32", bg: "#e8f5e9" },
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
        color: s.color,
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

const InfoBox = ({ children, color, borderColor, bgColor }) => (
  <Box
    sx={{
      mb: 3,
      p: 2,
      borderRadius: "12px",
      backgroundColor: bgColor,
      border: `1px solid ${borderColor}`,
    }}
  >
    <Typography sx={{ fontSize: 14, color, fontWeight: 500 }}>
      {children}
    </Typography>
  </Box>
);

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
          "Gagal memuat data luaran. Silakan refresh halaman.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLuaran();
  }, [fetchLuaran]);

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
      title: "Konfirmasi Submit",
      text: `Submit luaran "${selectedLuaran.nama_luaran}"? Luaran tidak dapat diubah setelah disubmit hingga direview admin.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0D59F2",
      cancelButtonColor: "#666",
      confirmButtonText: "Ya, Submit",
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
        text: "Luaran berhasil dikumpulkan",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      fetchLuaran();
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.response?.data?.message || "Gagal mengumpulkan luaran",
        confirmButtonText: "OK",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmitLuaran = (luaran) => {
    if (!data?.tim || data.tim.peran !== 1) return false;
    if (luaran.status === 1 || luaran.status === 2) return false;
    if (isDeadlineLewat(luaran.deadline)) return false;
    return true;
  };

  if (loading) {
    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
          <CircularProgress />
        </Box>
      </BodyLayout>
    );
  }

  return (
    <BodyLayout Sidebar={SidebarMahasiswa}>
      <PageTransition>
        <Box>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
            Monitoring dan Evaluasi
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>
            Pantau dan kumpulkan luaran kegiatan program Anda
          </Typography>

          {statusMessage && (
            <InfoBox color="#f57f17" borderColor="#ffe082" bgColor="#fff8e1">
              {statusMessage}
            </InfoBox>
          )}

          {!statusMessage && data && (
            <>
              {data.tim.peran !== 1 && (
                <InfoBox
                  color="#1565c0"
                  borderColor="#90caf9"
                  bgColor="#e3f2fd"
                >
                  Hanya ketua tim yang dapat mengumpulkan luaran. Anda dapat
                  memantau progress di halaman ini.
                </InfoBox>
              )}

              <Paper
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: "16px",
                  border: "1px solid #f0f0f0",
                }}
              >
                <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 2 }}>
                  Progress Luaran
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 1.5,
                  }}
                >
                  <LinearProgress
                    variant="determinate"
                    value={
                      data.progress.total > 0
                        ? Math.round(
                            (data.progress.disetujui / data.progress.total) *
                              100,
                          )
                        : 0
                    }
                    sx={{
                      flex: 1,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: "#f0f0f0",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor:
                          data.progress.disetujui === data.progress.total &&
                          data.progress.total > 0
                            ? "#2e7d32"
                            : "#0D59F2",
                        borderRadius: 5,
                      },
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#555",
                      minWidth: 48,
                    }}
                  >
                    {data.progress.total > 0
                      ? Math.round(
                          (data.progress.disetujui / data.progress.total) * 100,
                        )
                      : 0}
                    %
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {[
                    {
                      label: "Total",
                      value: data.progress.total,
                      color: "#555",
                      bg: "#f5f5f5",
                    },
                    {
                      label: "Disetujui",
                      value: data.progress.disetujui,
                      color: "#2e7d32",
                      bg: "#e8f5e9",
                    },
                    {
                      label: "Submitted",
                      value: data.progress.submitted,
                      color: "#f57f17",
                      bg: "#fff8e1",
                    },
                    {
                      label: "Ditolak",
                      value: data.progress.ditolak,
                      color: "#c62828",
                      bg: "#ffebee",
                    },
                    {
                      label: "Belum",
                      value: data.progress.belum,
                      color: "#777",
                      bg: "#f5f5f5",
                    },
                  ].map((item) => (
                    <Box
                      key={item.label}
                      sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                    >
                      <Chip
                        label={item.value}
                        size="small"
                        sx={{
                          backgroundColor: item.bg,
                          color: item.color,
                          fontWeight: 700,
                        }}
                      />
                      <Typography sx={{ fontSize: 13, color: "#777" }}>
                        {item.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {data.luaran.map((luaran) => {
                  const tipe = TIPE_MAP[luaran.tipe] || {};
                  const lewat = isDeadlineLewat(luaran.deadline);
                  const bisa = canSubmitLuaran(luaran);

                  return (
                    <Paper
                      key={luaran.id_luaran}
                      sx={{
                        p: 3,
                        borderRadius: "16px",
                        border: `1px solid ${luaran.status === 2 ? "#a5d6a7" : luaran.status === 1 ? "#ffe082" : "#f0f0f0"}`,
                        backgroundColor:
                          luaran.status === 2
                            ? "#f9fffe"
                            : luaran.status === 1
                              ? "#fffdf5"
                              : "#fff",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        <Box sx={{ flex: 1, mr: 2 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              mb: 0.5,
                            }}
                          >
                            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
                              {luaran.nama_luaran}
                            </Typography>
                            <Chip
                              label={tipe.label}
                              size="small"
                              sx={{
                                backgroundColor: tipe.bg,
                                color: tipe.color,
                                fontWeight: 700,
                                fontSize: 11,
                              }}
                            />
                          </Box>
                          {luaran.keterangan && (
                            <Typography sx={{ fontSize: 13, color: "#777" }}>
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
                          gap: 2,
                          mb: 2,
                        }}
                      >
                        <Box>
                          <Typography
                            sx={{ fontSize: 11, color: "#888", mb: 0.25 }}
                          >
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
                            <Typography
                              sx={{ fontSize: 11, color: "#888", mb: 0.25 }}
                            >
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
                            mb: 2,
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
                                component="a"
                                href={`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/luaran/${luaran.file_luaran}`}
                                target="_blank"
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

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          alignItems: "center",
                        }}
                      >
                        {bisa ? (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleOpenSubmit(luaran)}
                            disabled={submitting}
                            sx={{
                              textTransform: "none",
                              borderRadius: "50px",
                              fontSize: 13,
                              fontWeight: 600,
                              px: 3,
                              backgroundColor:
                                luaran.status === 3 ? "#f57f17" : "#0D59F2",
                              "&:hover": {
                                backgroundColor:
                                  luaran.status === 3 ? "#e65100" : "#0846c7",
                              },
                            }}
                          >
                            {luaran.status === 3
                              ? "Kumpulkan Ulang"
                              : "Kumpulkan"}
                          </Button>
                        ) : lewat &&
                          luaran.status !== 2 &&
                          luaran.status !== 1 ? (
                          <Typography
                            sx={{
                              fontSize: 12,
                              color: "#c62828",
                              fontWeight: 600,
                            }}
                          >
                            Deadline telah lewat
                          </Typography>
                        ) : null}
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            </>
          )}

          {!statusMessage && (!data || data.luaran?.length === 0) && (
            <Paper
              sx={{
                py: 10,
                borderRadius: "16px",
                border: "1px solid #f0f0f0",
                textAlign: "center",
              }}
            >
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
                <AssignmentTurnedIn sx={{ fontSize: 48, color: "#ccc" }} />
              </Box>
              <Typography
                sx={{ fontSize: 20, fontWeight: 700, color: "#444", mb: 1 }}
              >
                Belum Ada Luaran
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#999" }}>
                Luaran kegiatan akan muncul di sini setelah admin menetapkannya
              </Typography>
            </Paper>
          )}
        </Box>

        <Dialog
          open={openSubmit}
          onClose={handleCloseSubmit}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: "16px" } }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ pr: 4 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
                {selectedLuaran?.status === 3
                  ? "Kumpulkan Ulang Luaran"
                  : "Kumpulkan Luaran"}
              </Typography>
              {selectedLuaran && (
                <Typography sx={{ fontSize: 13, color: "#777", mt: 0.25 }}>
                  {selectedLuaran.nama_luaran}
                </Typography>
              )}
            </Box>
            <IconButton
              onClick={handleCloseSubmit}
              sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}
            >
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ px: 3, py: 3 }}>
            {selectedLuaran?.status === 3 && selectedLuaran?.catatan_admin && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
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
                  Catatan Penolakan Admin
                </Typography>
                <Typography sx={{ fontSize: 13 }}>
                  {selectedLuaran.catatan_admin}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {(selectedLuaran?.tipe === 1 || selectedLuaran?.tipe === 3) && (
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>
                    File Luaran (PDF){" "}
                    <span style={{ color: "#ef5350" }}>*</span>
                  </Typography>
                  {selectedLuaran?.file_luaran && !file && (
                    <Box
                      sx={{
                        mb: 1.5,
                        p: 1.5,
                        borderRadius: "10px",
                        backgroundColor: "#f0f4ff",
                        border: "1px solid #90caf9",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <AttachFile sx={{ fontSize: 16, color: "#1565c0" }} />
                      <Typography
                        sx={{ fontSize: 12, color: "#1565c0", fontWeight: 600 }}
                      >
                        File sebelumnya: {selectedLuaran.file_luaran}
                      </Typography>
                    </Box>
                  )}
                  <Box
                    component="label"
                    htmlFor="file-luaran-upload"
                    sx={{
                      border: `2px dashed ${fileError ? "#d32f2f" : "#e0e0e0"}`,
                      borderRadius: "12px",
                      p: 3,
                      textAlign: "center",
                      backgroundColor: "#fafafa",
                      cursor: "pointer",
                      display: "block",
                      transition: "all 0.2s",
                      "&:hover": {
                        backgroundColor: "#f0f4ff",
                        borderColor: "#0D59F2",
                      },
                    }}
                  >
                    <input
                      type="file"
                      accept="application/pdf"
                      id="file-luaran-upload"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                    {file ? (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                        }}
                      >
                        <AttachFile sx={{ fontSize: 18, color: "#1565c0" }} />
                        <Typography
                          sx={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#1565c0",
                          }}
                        >
                          {file.name}
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        <Typography
                          sx={{
                            fontSize: 13,
                            color: "#555",
                            fontWeight: 600,
                            mb: 0.5,
                          }}
                        >
                          Klik untuk pilih file PDF
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: "#999" }}>
                          Maksimal 10 MB
                        </Typography>
                      </>
                    )}
                  </Box>
                  {fileError && (
                    <Typography
                      sx={{ fontSize: 12, color: "#d32f2f", mt: 0.5 }}
                    >
                      {fileError}
                    </Typography>
                  )}
                </Box>
              )}

              {(selectedLuaran?.tipe === 2 || selectedLuaran?.tipe === 3) && (
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 0.75,
                    }}
                  >
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                      Link URL <span style={{ color: "#ef5350" }}>*</span>
                    </Typography>
                    <Button
                      size="small"
                      onClick={handleAddLink}
                      sx={{
                        textTransform: "none",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#0D59F2",
                        p: 0,
                        minWidth: 0,
                        "&:hover": { backgroundColor: "transparent" },
                      }}
                    >
                      + Tambah Link
                    </Button>
                  </Box>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                  >
                    {links.map((l, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: "flex",
                          gap: 1,
                          alignItems: "flex-start",
                        }}
                      >
                        <TextField
                          fullWidth
                          placeholder="https://..."
                          value={l}
                          onChange={(e) =>
                            handleChangeLink(idx, e.target.value)
                          }
                          error={!!linksError[idx]}
                          helperText={linksError[idx]}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "12px",
                            },
                          }}
                        />
                        {links.length > 1 && (
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveLink(idx)}
                            sx={{
                              mt: 0.5,
                              color: "#e53935",
                              backgroundColor: "rgba(229,57,53,0.06)",
                              borderRadius: "8px",
                              "&:hover": {
                                backgroundColor: "rgba(229,57,53,0.12)",
                              },
                            }}
                          >
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

          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button
              onClick={handleCloseSubmit}
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
              onClick={handleSubmit}
              disabled={submitting}
              sx={{
                textTransform: "none",
                borderRadius: "50px",
                px: 4,
                fontWeight: 600,
                backgroundColor: "#0D59F2",
                "&:hover": { backgroundColor: "#0846c7" },
              }}
            >
              {submitting ? "Mengumpulkan..." : "Kumpulkan"}
            </Button>
          </DialogActions>
        </Dialog>
      </PageTransition>
    </BodyLayout>
  );
}
