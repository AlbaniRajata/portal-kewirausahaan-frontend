import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Autocomplete,
  CircularProgress,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Add, Delete, Search } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import SidebarMahasiswa from "../../components/layouts/MahasiswaSidebar";
import { getTimStatus, getTimDetail, createTim, searchMahasiswa } from "../../api/mahasiswa";
import { getAllProgram } from "../../api/public";

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
  "&:hover": { backgroundColor: "#f8f9ff" },
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

const getStatusInfo = (status, peran) => {
  if (peran === 1) return { label: "Otomatis", color: "#e8f5e9", bg: "#2e7d32" };
  switch (status) {
    case 0: return { label: "Menunggu", color: "#fff8e1", bg: "#f57f17" };
    case 1: return { label: "Disetujui", color: "#e8f5e9", bg: "#2e7d32" };
    case 2: return { label: "Ditolak", color: "#fce4ec", bg: "#c62828" };
    default: return { label: "Unknown", color: "#f5f5f5", bg: "#666" };
  }
};

export default function AnggotaTimPage() {
  const [loading, setLoading] = useState(true);
  const [loadingProgram, setLoadingProgram] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searching, setSearching] = useState(false);

  const [timStatus, setTimStatus] = useState(null);
  const [timDetail, setTimDetail] = useState(null);
  const [programOptions, setProgramOptions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  const [formTim, setFormTim] = useState({
    nama_tim: "",
    id_program: null,
    anggota: [{ nim: "", nama_lengkap: "", id_user: null }],
  });

  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState("");

  useEffect(() => {
    fetchTimStatus();
    fetchProgram();
  }, []);

  const fetchTimStatus = async () => {
    try {
      setLoading(true);
      const response = await getTimStatus();
      setTimStatus(response.data);
      if (response.data.hasTim) {
        const detail = await getTimDetail();
        setTimDetail(detail.data);
      }
    } catch (err) {
      console.error("Error fetching tim status:", err);
      setAlert("Gagal memuat status tim. Silakan refresh halaman.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProgram = async () => {
    try {
      setLoadingProgram(true);
      const response = await getAllProgram();
      if (response.success) {
        setProgramOptions(response.data.map((item) => ({ label: item.keterangan, id: item.id_program })));
      }
    } catch (err) {
      console.error("Error fetching program:", err);
    } finally {
      setLoadingProgram(false);
    }
  };

  const handleSearchMahasiswa = async (index, nim) => {
    if (!nim || nim.length < 3) { setSearchResults([]); return; }
    try {
      setSearching(true);
      const response = await searchMahasiswa(nim);
      setSearchResults(response.data || []);
    } catch (err) {
      console.error("Error searching mahasiswa:", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectMahasiswa = (index, mahasiswa) => {
    const newAnggota = [...formTim.anggota];
    newAnggota[index] = { nim: mahasiswa.nim, nama_lengkap: mahasiswa.nama_lengkap, id_user: mahasiswa.id_user };
    setFormTim({ ...formTim, anggota: newAnggota });
    setSearchResults([]);
    setErrors((prev) => ({ ...prev, [`anggota_${index}`]: "" }));
  };

  const handleAddAnggota = () => {
    if (formTim.anggota.length >= 4) { setAlert("Maksimal 4 anggota (total 5 termasuk ketua)"); return; }
    setFormTim({ ...formTim, anggota: [...formTim.anggota, { nim: "", nama_lengkap: "", id_user: null }] });
  };

  const handleRemoveAnggota = (index) => {
    setFormTim({ ...formTim, anggota: formTim.anggota.filter((_, i) => i !== index) });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formTim.nama_tim?.trim()) newErrors.nama_tim = "Nama tim wajib diisi";
    if (!formTim.id_program) newErrors.id_program = "Program wajib dipilih";
    if (formTim.anggota.length < 2) newErrors.anggota = "Minimal 2 anggota harus ditambahkan";
    const nimSet = new Set();
    formTim.anggota.forEach((item, index) => {
      if (!item.nim || !item.id_user) newErrors[`anggota_${index}`] = "Mahasiswa belum dipilih";
      else if (nimSet.has(item.nim)) newErrors[`anggota_${index}`] = "NIM tidak boleh duplikat";
      nimSet.add(item.nim);
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) { setAlert("Mohon lengkapi semua field yang wajib diisi"); return; }
    setSubmitting(true); setAlert("");
    try {
      const payload = {
        nama_tim: formTim.nama_tim.trim(),
        id_program: formTim.id_program.id,
        anggota: formTim.anggota.map((item) => ({ nim: item.nim })),
      };
      const response = await createTim(payload);
      await Swal.fire({ icon: "success", title: "Berhasil", text: response.message || "Tim berhasil dibuat", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchTimStatus();
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Gagal membuat tim";
      setAlert(errorMessage);
      await Swal.fire({ icon: "error", title: "Gagal", text: errorMessage, confirmButtonText: "OK" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress />
        </Box>
      </BodyLayout>
    );
  }
0
  if (timStatus?.hasTim && (timStatus?.isKetua || (timStatus?.isAnggota && timStatus?.statusAnggota === 1))) {
    const allApproved = timDetail?.anggota?.every((item) => item.peran === 1 || item.status === 1);

    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <Box>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Anggota Tim</Typography>
          <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>Detail tim Anda</Typography>

          {timStatus?.isKetua && allApproved && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: "12px" }}>Semua anggota telah menyetujui undangan. Tim Anda sudah lengkap.</Alert>
          )}
          {timStatus?.isKetua && !allApproved && (
            <Alert severity="info" sx={{ mb: 3, borderRadius: "12px" }}>Anda sudah mengajukan anggota tim. Menunggu persetujuan anggota.</Alert>
          )}
          {timStatus?.isAnggota && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: "12px" }}>Anda adalah anggota dari tim ini.</Alert>
          )}

          <Paper sx={{ p: 4, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 4 }}>
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>Nama Tim</Typography>
                <TextField fullWidth value={timDetail?.nama_tim || ""} disabled sx={roundedField} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>Program</Typography>
                <TextField fullWidth value={timDetail?.keterangan || ""} disabled sx={roundedField} />
              </Box>
            </Box>

            <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 2 }}>Daftar Anggota</Typography>

            <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "hidden" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    {["Nama Lengkap", "NIM", "Prodi", "Peran", "Status"].map((h, i) => (
                      <TableCell key={i} sx={tableHeadCell}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timDetail?.anggota?.map((item, index) => {
                    const peranInfo = item.peran === 1
                      ? { label: "Ketua", color: "#e8eaf6", bg: "#3949ab" }
                      : { label: "Anggota", color: "#f5f5f5", bg: "#555" };
                    const statusInfo = getStatusInfo(item.status, item.peran);
                    return (
                      <TableRow key={index} sx={tableBodyRow}>
                        <TableCell><Typography sx={{ fontWeight: 600, fontSize: 14 }}>{item.nama_lengkap}</Typography></TableCell>
                        <TableCell><Typography sx={{ fontSize: 13 }}>{item.nim}</Typography></TableCell>
                        <TableCell><Typography sx={{ fontSize: 13 }}>{item.nama_prodi}</Typography></TableCell>
                        <TableCell><StatusPill label={peranInfo.label} bg={peranInfo.bg} color={peranInfo.color} /></TableCell>
                        <TableCell><StatusPill label={statusInfo.label} bg={statusInfo.bg} color={statusInfo.color} /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </BodyLayout>
    );
  }

  return (
    <BodyLayout Sidebar={SidebarMahasiswa}>
      <Box>
        <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Anggota Tim</Typography>
        <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>Lengkapi form di bawah ini untuk mengajukan anggota tim</Typography>

        {alert && <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }}>{alert}</Alert>}

        <Paper sx={{ p: 4, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>Pengajuan Anggota Tim</Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 4 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>Nama Tim</Typography>
              <TextField
                fullWidth
                placeholder="Masukkan nama tim Anda"
                value={formTim.nama_tim}
                onChange={(e) => { setFormTim({ ...formTim, nama_tim: e.target.value }); setErrors((prev) => ({ ...prev, nama_tim: "" })); setAlert(""); }}
                error={!!errors.nama_tim}
                helperText={errors.nama_tim}
                disabled={submitting}
                sx={roundedField}
              />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>Program</Typography>
              {loadingProgram ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}><CircularProgress size={24} /></Box>
              ) : (
                <Autocomplete
                  options={programOptions}
                  value={formTim.id_program}
                  onChange={(e, value) => { setFormTim({ ...formTim, id_program: value }); setErrors((prev) => ({ ...prev, id_program: "" })); setAlert(""); }}
                  getOptionLabel={(option) => option.label || ""}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  disabled={submitting}
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Pilih program" error={!!errors.id_program} helperText={errors.id_program} sx={roundedField} />
                  )}
                />
              )}
            </Box>
          </Box>

          <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 2 }}>Daftar Anggota</Typography>

          {formTim.anggota.map((item, index) => (
            <Box
              key={index}
              sx={{
                mb: 2, p: 2.5,
                border: "1.5px solid #f0f0f0",
                borderRadius: "14px",
                backgroundColor: "#fafafa",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#444" }}>
                  Anggota {index + 1}
                </Typography>
                {formTim.anggota.length > 1 && (
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveAnggota(index)}
                    disabled={submitting}
                    sx={{
                      color: "#e53935",
                      backgroundColor: "rgba(229,57,53,0.06)",
                      borderRadius: "8px",
                      "&:hover": { backgroundColor: "rgba(229,57,53,0.12)" },
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                )}
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>NIM</Typography>
                  <Autocomplete
                    freeSolo
                    options={searchResults}
                    getOptionLabel={(option) => typeof option === "string" ? option : option.nim || ""}
                    onInputChange={(e, value) => handleSearchMahasiswa(index, value)}
                    onChange={(e, value) => { if (value && typeof value === "object") handleSelectMahasiswa(index, value); }}
                    value={item.nim}
                    disabled={submitting}
                    loading={searching}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Masukkan NIM anggota"
                        error={!!errors[`anggota_${index}`]}
                        helperText={errors[`anggota_${index}`]}
                        sx={roundedField}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>{searching ? <CircularProgress size={20} /> : <Search sx={{ color: "#bbb", fontSize: 20 }} />}{params.InputProps.endAdornment}</>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box sx={{ py: 0.5 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{option.nim}</Typography>
                          <Typography sx={{ fontSize: 12, color: "#555" }}>{option.nama_lengkap}</Typography>
                          <Typography sx={{ fontSize: 11, color: "#999" }}>{option.jenjang} {option.nama_prodi}</Typography>
                        </Box>
                      </li>
                    )}
                  />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>Nama Lengkap</Typography>
                  <TextField fullWidth value={item.nama_lengkap} disabled placeholder="Akan otomatis terisi" sx={roundedField} />
                </Box>
              </Box>
            </Box>
          ))}

          {formTim.anggota.length < 4 && (
            <Button
              startIcon={<Add />}
              onClick={handleAddAnggota}
              disabled={submitting}
              sx={{
                mb: 3,
                textTransform: "none",
                borderRadius: "50px",
                color: "#0D59F2",
                border: "1.5px dashed rgba(13,89,242,0.3)",
                px: 2.5,
                py: 0.8,
                width: "100%",
                "&:hover": { backgroundColor: "rgba(13,89,242,0.04)", borderColor: "rgba(13,89,242,0.6)" },
              }}
            >
              Tambah Anggota
            </Button>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              sx={{
                px: 4, py: 1.2, textTransform: "none", fontWeight: 600,
                borderRadius: "50px",
                backgroundColor: "#0D59F2",
                "&:hover": { backgroundColor: "#0846c7" },
              }}
            >
              {submitting ? "Mengajukan..." : "Ajukan Anggota Tim"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </BodyLayout>
  );
}