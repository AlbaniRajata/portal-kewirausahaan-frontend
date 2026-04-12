import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, TextField, Button, Autocomplete,
  CircularProgress, Alert, IconButton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import { Add, Delete, Search, PersonAdd, RestartAlt } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import SidebarMahasiswa from "../../components/layouts/MahasiswaSidebar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import {
  getTimStatus, getTimDetail, createTim, searchMahasiswa,
  addAnggotaTim, resetTim, cekEligibilitasInbis,
} from "../../api/mahasiswa";
import { getAllProgram } from "../../api/public";

const roundedField = {
  "& .MuiOutlinedInput-root": { borderRadius: "15px" },
};

const getProgramStatus = (item) => {
  if (!item.pendaftaran_mulai || !item.pendaftaran_selesai)
    return { label: "Belum Diatur", color: "#bdbdbd", open: false };
  const now = new Date();
  const mulai = new Date(item.pendaftaran_mulai);
  const selesai = new Date(item.pendaftaran_selesai);
  if (now < mulai) return { label: "Belum Dibuka", color: "#1565c0", open: false };
  if (now >= mulai && now <= selesai) return { label: "Dibuka", color: "#2e7d32", open: true };
  return { label: "Sudah Ditutup", color: "#c62828", open: false };
};

const tableHeadCell = {
  fontWeight: 700, fontSize: 13, color: "#000",
  backgroundColor: "#fafafa", borderBottom: "2px solid #f0f0f0", py: 2,
};

const tableBodyRow = {
  "&:hover": { backgroundColor: "#f8f9ff" },
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

const getStatusInfo = (status, peran) => {
  if (peran === 1) return { label: "Otomatis", backgroundColor: "#2e7d32" };
  switch (status) {
    case 0: return { label: "Menunggu", backgroundColor: "#f57f17" };
    case 1: return { label: "Disetujui", backgroundColor: "#2e7d32" };
    case 2: return { label: "Ditolak", backgroundColor: "#c62828" };
    default: return { label: "Unknown", backgroundColor: "#666" };
  }
};

const getPeranInfo = (peran) => {
  return peran === 1
    ? { label: "Ketua", backgroundColor: "#3949ab" }
    : { label: "Anggota", backgroundColor: "#555" };
};

const INBIS_ID = 2;

export default function AnggotaTimPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingProgram, setLoadingProgram] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  const [timStatus, setTimStatus] = useState(null);
  const [timDetail, setTimDetail] = useState(null);
  const [programOptions, setProgramOptions] = useState([]);
  const [nimResults, setNimResults] = useState({});
  const [namaResults, setNamaResults] = useState({});
  const [inbisEligibility, setInbisEligibility] = useState(null);

  const [formTim, setFormTim] = useState({
    nama_tim: "",
    id_program: null,
    anggota: [
      { nim: "", nama_lengkap: "", id_user: null },
      { nim: "", nama_lengkap: "", id_user: null },
    ],
  });

  const [errors, setErrors] = useState({});

  const [showAddAnggota, setShowAddAnggota] = useState(false);
  const [newAnggota, setNewAnggota] = useState({ nim: "", nama_lengkap: "", id_user: null });
  const [newNimOptions, setNewNimOptions] = useState([]);
  const [newNamaOptions, setNewNamaOptions] = useState([]);
  const [addingAnggota, setAddingAnggota] = useState(false);
  const [addAnggotaError, setAddAnggotaError] = useState("");

  useEffect(() => {
    fetchTimStatus();
    fetchProgram();
  }, []);

  const fetchTimStatus = async () => {
    try {
      setLoading(true);
      const response = await getTimStatus();
      setTimStatus(response.data);
      const willRedirect =
        response.data.hasTim &&
        response.data.isAnggota &&
        response.data.statusAnggota === 0;
      if (response.data.hasTim && !willRedirect) {
        const detail = await getTimDetail();
        setTimDetail(detail.data);
      }
    } catch {
      await Swal.fire({
        icon: "error", title: "Gagal Memuat",
        text: "Gagal memuat status tim. Silahkan refresh halaman.",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProgram = async () => {
    try {
      setLoadingProgram(true);
      const response = await getAllProgram();
      if (response.success) {
        setProgramOptions(response.data.map((item) => {
          const status = getProgramStatus(item);
          return { label: item.keterangan, id: item.id_program, status };
        }));
      }
    } catch {
        await Swal.fire({
          icon: "error",
          title: "Gagal Memuat",
          text: "Gagal memuat opsi program. Silahkan refresh halaman.",
        });
    } finally {
      setLoadingProgram(false);
    }
  };

  const handleProgramChange = async (value) => {
    setFormTim({ ...formTim, id_program: value });
    setErrors((prev) => ({ ...prev, id_program: "" }));
    setInbisEligibility(null);

    if (value?.id === INBIS_ID) {
      setCheckingEligibility(true);
      try {
        const res = await cekEligibilitasInbis();
        setInbisEligibility(res.data);
      } catch {
        setInbisEligibility(null);
      } finally {
        setCheckingEligibility(false);
      }
    }
  };

  const handleSearchByNim = async (index, query) => {
    if (!query || query.length < 3) { setNimResults((p) => ({ ...p, [index]: [] })); return; }
    try {
      setSearching(true);
      const response = await searchMahasiswa(query);
      setNimResults((p) => ({ ...p, [index]: response.data || [] }));
    } catch {
      setNimResults((p) => ({ ...p, [index]: [] }));
    } finally {
      setSearching(false);
    }
  };

  const handleSearchByNama = async (index, query) => {
    if (!query || query.length < 3) { setNamaResults((p) => ({ ...p, [index]: [] })); return; }
    try {
      setSearching(true);
      const response = await searchMahasiswa(query);
      setNamaResults((p) => ({ ...p, [index]: response.data || [] }));
    } catch {
      setNamaResults((p) => ({ ...p, [index]: [] }));
    } finally {
      setSearching(false);
    }
  };

  const handleSelectMahasiswa = (index, mahasiswa) => {
    const updated = [...formTim.anggota];
    updated[index] = {
      nim: mahasiswa.nim,
      nama_lengkap: mahasiswa.nama_lengkap,
      id_user: mahasiswa.id_user,
    };
    setFormTim({ ...formTim, anggota: updated });
    setNimResults((p) => ({ ...p, [index]: [] }));
    setNamaResults((p) => ({ ...p, [index]: [] }));
    setErrors((prev) => ({ ...prev, [`anggota_${index}`]: "" }));
  };

  const handleAddAnggota = () => {
    setFormTim({
      ...formTim,
      anggota: [...formTim.anggota, { nim: "", nama_lengkap: "", id_user: null }],
    });
  };

  const handleRemoveAnggota = (index) => {
    setFormTim({ ...formTim, anggota: formTim.anggota.filter((_, i) => i !== index) });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formTim.nama_tim?.trim()) newErrors.nama_tim = "Nama tim wajib diisi";
    if (!formTim.id_program) newErrors.id_program = "Program wajib dipilih";

    if (formTim.id_program?.id === INBIS_ID && inbisEligibility && !inbisEligibility.eligible) {
      newErrors.id_program = "Anda tidak eligible untuk mendaftar program ini. Silahkan cek persyaratan pada informasi yang telah diberikan.";
    }

    if (formTim.anggota.length < 2) {
      newErrors.anggota = "Minimal 2 anggota harus ditambahkan (total 3 termasuk ketua)";
    }

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
    if (!validateForm()) return;

    const result = await Swal.fire({
      title: "Konfirmasi Pengajuan",
      text: "Pastikan data anggota tim sudah benar. Ajukan sekarang?",
      icon: "question", showCancelButton: true,
      confirmButtonColor: "#0D59F2", cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Ajukan", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;

    setSubmitting(true);
    try {
      const payload = {
        nama_tim: formTim.nama_tim.trim(),
        id_program: formTim.id_program.id,
        anggota: formTim.anggota.map((item) => ({ nim: item.nim })),
      };
      const response = await createTim(payload);
      await Swal.fire({
        icon: "success", title: "Berhasil",
        text: response.message || "Tim berhasil dibuat",
        timer: 2000, timerProgressBar: true, showConfirmButton: false,
      });
      fetchTimStatus();
    } catch (err) {
      await Swal.fire({
        icon: "error", title: "Gagal",
        text: err.response?.data?.message || "Gagal membuat tim",
        confirmButtonText: "OK",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSearchNewNim = async (query) => {
    if (!query || query.length < 3) { setNewNimOptions([]); return; }
    try {
      setSearching(true);
      const response = await searchMahasiswa(query);
      setNewNimOptions(response.data || []);
    } catch {
      setNewNimOptions([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchNewNama = async (query) => {
    if (!query || query.length < 3) { setNewNamaOptions([]); return; }
    try {
      setSearching(true);
      const response = await searchMahasiswa(query);
      setNewNamaOptions(response.data || []);
    } catch {
      setNewNamaOptions([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectNewMahasiswa = (mahasiswa) => {
    setNewAnggota({ nim: mahasiswa.nim, nama_lengkap: mahasiswa.nama_lengkap, id_user: mahasiswa.id_user });
    setNewNimOptions([]);
    setNewNamaOptions([]);
    setAddAnggotaError("");
  };

  const handleUndangAnggota = async () => {
    if (!newAnggota.id_user) {
      setAddAnggotaError("Pilih mahasiswa dari hasil pencarian");
      return;
    }
    const result = await Swal.fire({
      title: "Konfirmasi",
      text: `Kirim undangan ke "${newAnggota.nama_lengkap}"?`,
      icon: "question", showCancelButton: true,
      confirmButtonColor: "#0D59F2", cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Undang", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    setAddingAnggota(true);
    try {
      await addAnggotaTim({ nim: newAnggota.nim });
      await Swal.fire({
        icon: "success", title: "Berhasil",
        text: "Undangan berhasil dikirim",
        timer: 2000, timerProgressBar: true, showConfirmButton: false,
      });
      setShowAddAnggota(false);
      setNewAnggota({ nim: "", nama_lengkap: "", id_user: null });
      fetchTimStatus();
    } catch (err) {
      await Swal.fire({
        icon: "error", title: "Gagal",
        text: err.response?.data?.message || "Gagal kirim undangan",
        confirmButtonText: "OK",
      });
    } finally {
      setAddingAnggota(false);
    }
  };

  const handleResetTim = async () => {
    const result = await Swal.fire({
      title: "Reset Tim?",
      html: "Tim akan <strong>dihapus permanen</strong> dan Anda dapat membuat tim baru.<br/>Data yang sudah ada akan hilang.",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#d33", cancelButtonColor: "#666",
      confirmButtonText: "Ya, Reset", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    try {
      await resetTim();
      await Swal.fire({
        icon: "success", title: "Tim Direset",
        text: "Anda dapat mengajukan tim baru sekarang.",
        timer: 2000, timerProgressBar: true, showConfirmButton: false,
      });
      fetchTimStatus();
    } catch (err) {
      await Swal.fire({
        icon: "error", title: "Gagal",
        text: err.response?.data?.message || "Gagal reset tim",
        confirmButtonText: "OK",
      });
    }
  };

  if (loading) {
    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <Box sx={{ position: "relative", minHeight: "60vh" }}>
          <LoadingScreen message="Memuat data tim..." overlay minHeight="60vh" />
        </Box>
      </BodyLayout>
    );
  }

  if (timStatus?.hasTim && timStatus?.isAnggota && timStatus?.statusAnggota === 0) {
    navigate("/mahasiswa/undangan-anggota", { replace: true });
    return null;
  }

  if (timStatus?.hasTim && (timStatus?.isKetua || (timStatus?.isAnggota && timStatus?.statusAnggota === 1))) {
    const allApproved = timDetail?.anggota?.every((item) => item.peran === 1 || item.status === 1);
    const hasRejected = timDetail?.anggota?.some((item) => item.peran === 2 && item.status === 2);

    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <PageTransition>
          <Box>
            <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Anggota Tim</Typography>
            <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>Detail tim Anda</Typography>

            {timStatus?.isKetua && allApproved && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: "12px" }}>
                Semua anggota telah menyetujui undangan. Tim Anda sudah lengkap.
              </Alert>
            )}
            {timStatus?.isKetua && !allApproved && !hasRejected && (
              <Alert severity="info" sx={{ mb: 3, borderRadius: "12px" }}>
                Anda sudah mengajukan anggota tim. Menunggu persetujuan anggota.
              </Alert>
            )}
            {timStatus?.isKetua && hasRejected && (
              <Box sx={{ mb: 3, p: 2.5, borderRadius: "12px", backgroundColor: "#fce4ec", border: "1px solid #ef9a9a" }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#c62828", mb: 1 }}>
                  Ada anggota yang menolak undangan
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#c62828", mb: 2 }}>
                  Anda dapat mengundang anggota baru sebagai pengganti, atau mengajukan ulang tim dari awal.
                </Typography>
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                  <Button
                    size="small" variant="contained"
                    onClick={() => setShowAddAnggota((v) => !v)}
                    sx={{
                      textTransform: "none", borderRadius: "50px", fontWeight: 600, fontSize: 13, px: 2.5,
                      backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0846c7" },
                    }}
                  >
                    {showAddAnggota ? "Tutup Form" : "Undang Anggota Baru"}
                  </Button>
                  <Button
                    size="small" variant="outlined"
                    onClick={handleResetTim}
                    sx={{
                      textTransform: "none", borderRadius: "50px", fontWeight: 600, fontSize: 13, px: 2.5,
                      borderColor: "#d33", color: "#d33",
                      "&:hover": { backgroundColor: "rgba(211,51,51,0.06)", borderColor: "#d33" },
                    }}
                  >
                    Ajukan Ulang Tim
                  </Button>
                </Box>
              </Box>
            )}
            {timStatus?.isAnggota && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: "12px" }}>
                Anda adalah anggota dari tim ini.
              </Alert>
            )}

            {showAddAnggota && (
              <Paper sx={{ p: 3, mb: 3, borderRadius: "16px", border: "1.5px solid #90caf9", backgroundColor: "#f5faff" }}>
                <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 0.5 }}>Undang Anggota Baru</Typography>
                <Typography sx={{ fontSize: 13, color: "#777", mb: 2.5 }}>
                  Cari mahasiswa dan kirim undangan untuk menggantikan anggota yang ditolak.
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>NIM</Typography>
                    <Autocomplete
                      freeSolo filterOptions={(x) => x}
                      options={newNimOptions}
                      getOptionLabel={(option) => typeof option === "string" ? option : option.nim || ""}
                      getOptionDisabled={(option) => !!option.sudah_punya_tim}
                      onInputChange={(e, value) => handleSearchNewNim(value)}
                      onChange={(e, value) => { if (value && typeof value === "object") handleSelectNewMahasiswa(value); }}
                      value={newAnggota.nim} disabled={addingAnggota} loading={searching}
                      renderInput={(params) => (
                        <TextField
                          {...params} placeholder="Cari berdasarkan NIM"
                          error={!!addAnggotaError} sx={roundedField}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {searching ? <CircularProgress size={20} /> : <Search sx={{ color: "#bbb", fontSize: 20 }} />}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <li {...props} style={{ ...props.style, opacity: 1 }}>
                          <Box sx={{ py: 0.5 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{option.nim}</Typography>
                              {option.sudah_punya_tim && (
                                <Box sx={{ px: 1, py: 0.2, borderRadius: "50px", backgroundColor: "#fbe9e7", border: "1px solid #ef9a9a" }}>
                                  <Typography sx={{ fontSize: 10, color: "#c62828", fontWeight: 700 }}>Sudah dalam tim lain</Typography>
                                </Box>
                              )}
                            </Box>
                            <Typography sx={{ fontSize: 12, color: "#555" }}>{option.nama_lengkap}</Typography>
                            <Typography sx={{ fontSize: 11, color: "#999" }}>{option.jenjang} {option.nama_prodi}</Typography>
                          </Box>
                        </li>
                      )}
                    />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Nama Lengkap</Typography>
                    <Autocomplete
                      freeSolo filterOptions={(x) => x}
                      options={newNamaOptions}
                      getOptionLabel={(option) => typeof option === "string" ? option : option.nama_lengkap || ""}
                      getOptionDisabled={(option) => !!option.sudah_punya_tim}
                      onInputChange={(e, value) => handleSearchNewNama(value)}
                      onChange={(e, value) => { if (value && typeof value === "object") handleSelectNewMahasiswa(value); }}
                      value={newAnggota.nama_lengkap} disabled={addingAnggota} loading={searching}
                      renderInput={(params) => (
                        <TextField
                          {...params} placeholder="Cari berdasarkan nama" sx={roundedField}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {searching ? <CircularProgress size={20} /> : <Search sx={{ color: "#bbb", fontSize: 20 }} />}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <li {...props} style={{ ...props.style, opacity: 1 }}>
                          <Box sx={{ py: 0.5 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{option.nama_lengkap}</Typography>
                              {option.sudah_punya_tim && (
                                <Box sx={{ px: 1, py: 0.2, borderRadius: "50px", backgroundColor: "#fbe9e7", border: "1px solid #ef9a9a" }}>
                                  <Typography sx={{ fontSize: 10, color: "#c62828", fontWeight: 700 }}>Sudah dalam tim lain</Typography>
                                </Box>
                              )}
                            </Box>
                            <Typography sx={{ fontSize: 12, color: "#555" }}>{option.nim}</Typography>
                            <Typography sx={{ fontSize: 11, color: "#999" }}>{option.jenjang} {option.nama_prodi}</Typography>
                          </Box>
                        </li>
                      )}
                    />
                  </Box>
                </Box>
                {addAnggotaError && (
                  <Typography sx={{ color: "error.main", fontSize: 12, mb: 1.5 }}>{addAnggotaError}</Typography>
                )}
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
                  <Button
                    onClick={() => {
                      setShowAddAnggota(false);
                      setNewAnggota({ nim: "", nama_lengkap: "", id_user: null });
                      setAddAnggotaError("");
                    }}
                    sx={{
                      textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600,
                      color: "#666", border: "1.5px solid #e0e0e0",
                      "&:hover": { backgroundColor: "#f5f5f5" },
                    }}
                  >
                    Batal
                  </Button>
                  <Button
                    variant="contained" onClick={handleUndangAnggota} disabled={addingAnggota}
                    sx={{
                      textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600,
                      backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0846c7" },
                    }}
                  >
                    {addingAnggota ? "Mengirim..." : "Kirim Undangan"}
                  </Button>
                </Box>
              </Paper>
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
                      const peranInfo = getPeranInfo(item.peran);
                      const statusInfo = getStatusInfo(item.status, item.peran);
                      return (
                        <TableRow key={index} sx={tableBodyRow}>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{item.nama_lengkap}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13 }}>{item.nim}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13 }}>{item.nama_prodi}</Typography>
                          </TableCell>
                          <TableCell>
                            <StatusPill label={peranInfo.label} backgroundColor={peranInfo.backgroundColor} />
                          </TableCell>
                          <TableCell>
                            <StatusPill label={statusInfo.label} backgroundColor={statusInfo.backgroundColor} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </PageTransition>
      </BodyLayout>
    );
  }

  return (
    <BodyLayout Sidebar={SidebarMahasiswa}>
      <PageTransition>
        <Box>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Anggota Tim</Typography>
          <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>
            Lengkapi form di bawah ini untuk mengajukan anggota tim
          </Typography>

          <Paper sx={{ p: 4, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
            <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>Pengajuan Anggota Tim</Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 4 }}>
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>
                  Nama Tim <span style={{ color: "#ef5350" }}>*</span>
                </Typography>
                <TextField
                  fullWidth placeholder="Masukkan nama tim Anda"
                  value={formTim.nama_tim}
                  onChange={(e) => {
                    setFormTim({ ...formTim, nama_tim: e.target.value });
                    setErrors((prev) => ({ ...prev, nama_tim: "" }));
                  }}
                  error={!!errors.nama_tim} helperText={errors.nama_tim}
                  disabled={submitting} sx={roundedField}
                />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>
                  Program <span style={{ color: "#ef5350" }}>*</span>
                </Typography>
                {loadingProgram ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <>
                    <Autocomplete
                      options={programOptions}
                      value={formTim.id_program}
                      onChange={(e, value) => handleProgramChange(value)}
                      getOptionLabel={(option) => option.label || ""}
                      getOptionDisabled={(option) => !option.status?.open}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      disabled={submitting}
                      renderOption={(props, option) => (
                        <li {...props} style={{ ...props.style, opacity: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 1 }}>
                            <Typography sx={{ fontSize: 14 }}>{option.label}</Typography>
                            <Box sx={{
                              px: 1, py: 0.2, borderRadius: "50px",
                              backgroundColor: option.status?.color,
                              flexShrink: 0,
                            }}>
                              <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>
                                {option.status?.label}
                              </Typography>
                            </Box>
                          </Box>
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params} placeholder="Pilih program"
                          error={!!errors.id_program} helperText={errors.id_program}
                          sx={roundedField}
                        />
                      )}
                    />

                    {checkingEligibility && (
                      <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                        <CircularProgress size={14} />
                        <Typography sx={{ fontSize: 13, color: "#777" }}>Memeriksa eligibilitas...</Typography>
                      </Box>
                    )}

                    {!checkingEligibility && inbisEligibility !== null && (
                      <Box sx={{
                        mt: 1.5, p: 2, borderRadius: "12px",
                        backgroundColor: inbisEligibility.eligible ? "#e8f5e9" : "#fce4ec",
                        border: `1px solid ${inbisEligibility.eligible ? "#a5d6a7" : "#ef9a9a"}`,
                      }}>
                        {inbisEligibility.eligible ? (
                          <Typography sx={{ fontSize: 13, color: "#2e7d32", fontWeight: 600 }}>
                            Anda memenuhi syarat untuk mendaftar program INBIS.
                          </Typography>
                        ) : (
                          <>
                            <Typography sx={{ fontSize: 13, color: "#c62828", fontWeight: 700, mb: 0.5 }}>
                              Anda tidak eligible untuk mendaftar program ini
                            </Typography>
                            <Typography sx={{ fontSize: 13, color: "#c62828" }}>
                              {inbisEligibility.alasan}
                            </Typography>
                            {inbisEligibility.monev_progress && (
                              <Typography sx={{ fontSize: 12, color: "#c62828", mt: 0.5 }}>
                                Progress Monev PMW: {inbisEligibility.monev_progress.disetujui}/{inbisEligibility.monev_progress.total} luaran disetujui
                              </Typography>
                            )}
                          </>
                        )}
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Box>

            <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 2 }}>Daftar Anggota</Typography>

            {errors.anggota && (
              <Typography sx={{ color: "error.main", fontSize: 12, mb: 2 }}>{errors.anggota}</Typography>
            )}

            {formTim.anggota.map((item, index) => {
              const selectedIds = new Set(
                formTim.anggota
                  .filter((_, i) => i !== index)
                  .map((a) => a.id_user)
                  .filter(Boolean)
              );
              const filteredNimOptions = (nimResults[index] || []).filter((o) => !selectedIds.has(o.id_user));
              const filteredNamaOptions = (namaResults[index] || []).filter((o) => !selectedIds.has(o.id_user));

              return (
                <Box
                  key={index}
                  sx={{ mb: 2, p: 2.5, border: "1.5px solid #f0f0f0", borderRadius: "14px", backgroundColor: "#fafafa" }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#444" }}>
                      Anggota {index + 1}
                    </Typography>
                    {formTim.anggota.length > 2 && (
                      <IconButton
                        size="small" onClick={() => handleRemoveAnggota(index)} disabled={submitting}
                        sx={{
                          color: "#e53935", backgroundColor: "rgba(229,57,53,0.06)",
                          borderRadius: "8px", "&:hover": { backgroundColor: "rgba(229,57,53,0.12)" },
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
                        freeSolo filterOptions={(x) => x}
                        options={filteredNimOptions}
                        getOptionLabel={(option) => typeof option === "string" ? option : option.nim || ""}
                        getOptionDisabled={(option) => !!option.sudah_punya_tim}
                        onInputChange={(e, value) => handleSearchByNim(index, value)}
                        onChange={(e, value) => { if (value && typeof value === "object") handleSelectMahasiswa(index, value); }}
                        value={item.nim} disabled={submitting} loading={searching}
                        renderInput={(params) => (
                          <TextField
                            {...params} placeholder="Cari berdasarkan NIM"
                            error={!!errors[`anggota_${index}`]} helperText={errors[`anggota_${index}`]}
                            sx={roundedField}
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {searching ? <CircularProgress size={20} /> : <Search sx={{ color: "#bbb", fontSize: 20 }} />}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                        renderOption={(props, option) => (
                          <li {...props} style={{ ...props.style, opacity: 1 }}>
                            <Box sx={{ py: 0.5 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{option.nim}</Typography>
                                {option.sudah_punya_tim && (
                                  <Box sx={{ px: 1, py: 0.2, borderRadius: "50px", backgroundColor: "#fbe9e7", border: "1px solid #ef9a9a" }}>
                                    <Typography sx={{ fontSize: 10, color: "#c62828", fontWeight: 700 }}>Sudah dalam tim lain</Typography>
                                  </Box>
                                )}
                              </Box>
                              <Typography sx={{ fontSize: 12, color: "#555" }}>{option.nama_lengkap}</Typography>
                              <Typography sx={{ fontSize: 11, color: "#999" }}>{option.jenjang} {option.nama_prodi}</Typography>
                            </Box>
                          </li>
                        )}
                      />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>Nama Lengkap</Typography>
                      <Autocomplete
                        freeSolo filterOptions={(x) => x}
                        options={filteredNamaOptions}
                        getOptionLabel={(option) => typeof option === "string" ? option : option.nama_lengkap || ""}
                        getOptionDisabled={(option) => !!option.sudah_punya_tim}
                        onInputChange={(e, value) => handleSearchByNama(index, value)}
                        onChange={(e, value) => { if (value && typeof value === "object") handleSelectMahasiswa(index, value); }}
                        value={item.nama_lengkap} disabled={submitting} loading={searching}
                        renderInput={(params) => (
                          <TextField
                            {...params} placeholder="Cari berdasarkan nama"
                            sx={roundedField}
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {searching ? <CircularProgress size={20} /> : <Search sx={{ color: "#bbb", fontSize: 20 }} />}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                        renderOption={(props, option) => (
                          <li {...props} style={{ ...props.style, opacity: 1 }}>
                            <Box sx={{ py: 0.5 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{option.nama_lengkap}</Typography>
                                {option.sudah_punya_tim && (
                                  <Box sx={{ px: 1, py: 0.2, borderRadius: "50px", backgroundColor: "#fbe9e7", border: "1px solid #ef9a9a" }}>
                                    <Typography sx={{ fontSize: 10, color: "#c62828", fontWeight: 700 }}>Sudah dalam tim lain</Typography>
                                  </Box>
                                )}
                              </Box>
                              <Typography sx={{ fontSize: 12, color: "#555" }}>{option.nim}</Typography>
                              <Typography sx={{ fontSize: 11, color: "#999" }}>{option.jenjang} {option.nama_prodi}</Typography>
                            </Box>
                          </li>
                        )}
                      />
                    </Box>
                  </Box>
                </Box>
              );
            })}

            <Button
              onClick={handleAddAnggota} disabled={submitting}
              sx={{
                mb: 3, textTransform: "none", borderRadius: "50px",
                color: "#0D59F2", border: "1.5px dashed rgba(13,89,242,0.3)",
                px: 2.5, py: 0.8, width: "100%",
                "&:hover": { backgroundColor: "rgba(13,89,242,0.04)", borderColor: "rgba(13,89,242,0.6)" },
              }}
            >
              Tambah Anggota
            </Button>

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained" onClick={handleSubmit} disabled={submitting}
                sx={{
                  px: 4, py: 1.2, textTransform: "none", fontWeight: 600,
                  borderRadius: "50px", backgroundColor: "#0D59F2",
                  "&:hover": { backgroundColor: "#0846c7" },
                }}
              >
                {submitting ? "Mengajukan..." : "Ajukan Anggota Tim"}
              </Button>
            </Box>
          </Paper>
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}