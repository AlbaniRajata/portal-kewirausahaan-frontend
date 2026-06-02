import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, TextField, Button, Autocomplete,
  CircularProgress, Alert, IconButton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import { Add, Delete, Search, PersonAdd, RestartAlt, Groups, Shield } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import MahasiswaNavbar from "../../components/layouts/MahasiswaNavbar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import {
  getTimStatus, getTimDetail, createTim, searchMahasiswa,
  addAnggotaTim, resetTim, cekEligibilitasInbis,
  getRiwayatTim, lanjutInbis,
} from "../../api/mahasiswa";
import { getAllProgram } from "../../api/public";
import { validateFormSecurity } from "../../utils/inputSecurity";

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

const FieldLabel = ({ children, required }) => (
  <Typography sx={{ fontWeight: 600, mb: 0.8, fontSize: 13, color: "#374151", display: "flex", gap: 0.4 }}>
    {children}
    {required && <span style={{ color: COLORS.error }}>*</span>}
  </Typography>
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
  fontWeight: 700, fontSize: 13, color: "#1F2937",
  backgroundColor: COLORS.slateLight, borderBottom: `2px solid #E5E7EB`, py: 2,
};

const tableBodyRow = {
  "&:hover": { backgroundColor: "#F8FAFF" },
  "& td": { borderBottom: "1px solid #F3F4F6", py: 2 },
};

const getStatusInfo = (status, peran) => {
  if (peran === 1) return { label: "Otomatis", backgroundColor: COLORS.success };
  switch (status) {
    case 0: return { label: "Menunggu", backgroundColor: COLORS.warning };
    case 1: return { label: "Disetujui", backgroundColor: COLORS.success };
    case 2: return { label: "Ditolak", backgroundColor: COLORS.error };
    default: return { label: "Unknown", backgroundColor: COLORS.slate };
  }
};

const getPeranInfo = (peran) => {
  return peran === 1
    ? { label: "Ketua", backgroundColor: COLORS.primary }
    : { label: "Anggota", backgroundColor: COLORS.slate };
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
  
  const [riwayatTim, setRiwayatTim] = useState([]);
  const [inbisStatus, setInbisStatus] = useState(null);
  const [processingInbis, setProcessingInbis] = useState(false);

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
        
        try {
          const inbisRes = await cekEligibilitasInbis();
          setInbisStatus(inbisRes.data);
        } catch {
          setInbisStatus(null);
        }
      }
      
      try {
        const riwayatRes = await getRiwayatTim();
        setRiwayatTim(riwayatRes.data || []);
      } catch {
        setRiwayatTim([]);
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
        icon: "error", title: "Gagal Memuat",
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
    updated[index] = { nim: mahasiswa.nim, nama_lengkap: mahasiswa.nama_lengkap, id_user: mahasiswa.id_user };
    setFormTim({ ...formTim, anggota: updated });
    setNimResults((p) => ({ ...p, [index]: [] }));
    setNamaResults((p) => ({ ...p, [index]: [] }));
    setErrors((prev) => ({ ...prev, [`anggota_${index}`]: "" }));
  };

  const handleAddAnggota = () => {
    setFormTim({ ...formTim, anggota: [...formTim.anggota, { nim: "", nama_lengkap: "", id_user: null }] });
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

    const securityCheck = validateFormSecurity({
      nama_tim: formTim.nama_tim,
    });
    if (!securityCheck.isValid) {
      setErrors((prev) => ({ ...prev, [securityCheck.field]: securityCheck.message }));
      return;
    }

    const result = await Swal.fire({
      title: "Konfirmasi Pengajuan",
      text: "Pastikan data anggota tim sudah benar. Ajukan sekarang?",
      icon: "question", showCancelButton: true,
      confirmButtonColor: COLORS.primary, cancelButtonColor: COLORS.error,
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

    const securityCheck = validateFormSecurity({
      nim: newAnggota.nim,
      nama_lengkap: newAnggota.nama_lengkap,
    });
    if (!securityCheck.isValid) {
      setAddAnggotaError(securityCheck.message);
      return;
    }

    const result = await Swal.fire({
      title: "Konfirmasi",
      text: `Kirim undangan ke "${newAnggota.nama_lengkap}"?`,
      icon: "question", showCancelButton: true,
      confirmButtonColor: COLORS.primary, cancelButtonColor: COLORS.error,
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
      confirmButtonColor: COLORS.error, cancelButtonColor: COLORS.slate,
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

  const handleLanjutInbis = async (gunakanAnggotaSama) => {
    const { value: formValues } = await Swal.fire({
      title: "Lanjut ke Program INBIS",
      html: `
        <div style="text-align: left; margin-bottom: 15px; font-size: 14px;">
          Tim PMW Anda akan diarsipkan. Silahkan masukkan nama tim baru untuk program INBIS.
        </div>
        <input id="swal-input-nama-tim" class="swal2-input" placeholder="Nama Tim INBIS" value="${timDetail?.nama_tim || ''}" style="width: 80%; margin: 0 auto; display: block;">
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Ya, Lanjutkan",
      cancelButtonText: "Batal",
      confirmButtonColor: COLORS.primary,
      cancelButtonColor: COLORS.slate,
      preConfirm: () => {
        const nama_tim = document.getElementById("swal-input-nama-tim").value;
        if (!nama_tim) {
          Swal.showValidationMessage("Nama tim wajib diisi");
        }
        return { nama_tim };
      }
    });

    if (formValues) {
      setProcessingInbis(true);
      try {
        const payload = {
          nama_tim: formValues.nama_tim,
          gunakan_anggota_sama: gunakanAnggotaSama,
        };
        const res = await lanjutInbis(payload);
        await Swal.fire({
          icon: "success", title: "Berhasil",
          text: res.message || "Tim berhasil dilanjutkan ke INBIS",
        });
        fetchTimStatus();
      } catch (err) {
        await Swal.fire({
          icon: "error", title: "Gagal",
          text: err.response?.data?.message || "Gagal memproses pendaftaran INBIS",
        });
      } finally {
        setProcessingInbis(false);
      }
    }
  };

  const MahasiswaOption = ({ option }) => (
    <Box sx={{ py: 0.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{option.nim || option.nama_lengkap}</Typography>
        {option.sudah_punya_tim && (
          <Box sx={{ px: 1, py: 0.2, borderRadius: "50px", backgroundColor: COLORS.errorLight, border: `1.5px solid #FCA5A5` }}>
            <Typography sx={{ fontSize: 10, color: COLORS.error, fontWeight: 700 }}>Sudah dalam tim lain</Typography>
          </Box>
        )}
      </Box>
      <Typography sx={{ fontSize: 12, color: "#555" }}>{option.nama_lengkap || option.nim}</Typography>
      <Typography sx={{ fontSize: 11, color: COLORS.slate }}>{option.jenjang} {option.nama_prodi}</Typography>
    </Box>
  );

  if (loading) {
    return (
      <BodyLayout Sidebar={MahasiswaNavbar}>
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
      <BodyLayout Sidebar={MahasiswaNavbar}>
        <PageTransition>
          <Box>
            <Box sx={{ mb: 4 }}>
              <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
                Anggota Tim
              </Typography>
              <Typography sx={{ fontSize: 16, color: "#6B7280" }}>
                Detail dan manajemen anggota tim Anda
              </Typography>
            </Box>

            {timStatus?.isKetua && allApproved && (
              <Box sx={{
                mb: 3, p: 2.5, borderRadius: "14px",
                background: COLORS.successLight,
                border: `1.5px solid #6EE7B7`,
                display: "flex", gap: 1.5, alignItems: "flex-start",
              }}>
                <Box sx={{ width: 8, height: 8, mt: 0.8, borderRadius: "50%", background: COLORS.success, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 13.5, color: "#065F46", fontWeight: 600 }}>
                  Semua anggota telah menyetujui undangan. Tim Anda sudah lengkap.
                </Typography>
              </Box>
            )}

            {timStatus?.isKetua && !allApproved && !hasRejected && (
              <Box sx={{
                mb: 3, p: 2.5, borderRadius: "14px",
                background: COLORS.primaryLight,
                border: `1.5px solid ${COLORS.primaryMuted}`,
                display: "flex", gap: 1.5, alignItems: "flex-start",
              }}>
                <Box sx={{ width: 8, height: 8, mt: 0.8, borderRadius: "50%", background: COLORS.primary, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 13.5, color: COLORS.primaryDark, fontWeight: 600 }}>
                  Anda sudah mengajukan anggota tim. Menunggu persetujuan anggota.
                </Typography>
              </Box>
            )}

            {timStatus?.isKetua && hasRejected && (
              <Box sx={{
                mb: 3, p: 2.5, borderRadius: "14px",
                background: COLORS.errorLight,
                border: `1.5px solid #FCA5A5`,
              }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORS.error, mb: 0.5 }}>
                  Ada anggota yang menolak undangan
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#7F1D1D", mb: 2, lineHeight: 1.6 }}>
                  Anda dapat mengundang anggota baru sebagai pengganti, atau mengajukan ulang tim dari awal.
                </Typography>
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                  <Button
                    size="small" variant="contained"
                    onClick={() => setShowAddAnggota((v) => !v)}
                    sx={{
                      textTransform: "none", borderRadius: "10px", fontWeight: 600, fontSize: 13, px: 2.5,
                      background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
                      boxShadow: "none",
                      "&:hover": { background: `linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.primary})`, boxShadow: "none" },
                    }}
                  >
                    {showAddAnggota ? "Tutup Form" : "Undang Anggota Baru"}
                  </Button>
                  <Button
                    size="small" variant="outlined"
                    onClick={handleResetTim}
                    sx={{
                      textTransform: "none", borderRadius: "10px", fontWeight: 600, fontSize: 13, px: 2.5,
                      borderColor: COLORS.error, color: COLORS.error,
                      "&:hover": { backgroundColor: COLORS.errorLight, borderColor: COLORS.error },
                    }}
                  >
                    Ajukan Ulang Tim
                  </Button>
                </Box>
              </Box>
            )}

            {timStatus?.isAnggota && (
              <Box sx={{
                mb: 3, p: 2.5, borderRadius: "14px",
                background: COLORS.successLight,
                border: `1.5px solid #6EE7B7`,
                display: "flex", gap: 1.5, alignItems: "flex-start",
              }}>
                <Box sx={{ width: 8, height: 8, mt: 0.8, borderRadius: "50%", background: COLORS.success, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 13.5, color: "#065F46", fontWeight: 600 }}>
                  Anda adalah anggota dari tim ini.
                </Typography>
              </Box>
            )}

            {showAddAnggota && (
              <Paper elevation={0} sx={{
                mb: 3, borderRadius: "20px",
                border: `1.5px solid ${COLORS.primaryMuted}`,
                overflow: "hidden",
              }}>
                <Box sx={{ height: 4, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
                <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
                  <SectionHeader
                    icon={PersonAdd}
                    title="Undang Anggota Baru"
                    subtitle="Cari mahasiswa dan kirim undangan pengganti"
                    gradient={`linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`}
                  />
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: 3 }}>
                    <Box>
                      <FieldLabel>NIM</FieldLabel>
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
                            <MahasiswaOption option={option} />
                          </li>
                        )}
                      />
                    </Box>
                    <Box>
                      <FieldLabel>Nama Lengkap</FieldLabel>
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
                            <MahasiswaOption option={option} />
                          </li>
                        )}
                      />
                    </Box>
                  </Box>
                  {addAnggotaError && (
                    <Typography sx={{ color: COLORS.error, fontSize: 12, mb: 2 }}>{addAnggotaError}</Typography>
                  )}
                  <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, flexWrap: "wrap" }}>
                    <Button
                      onClick={() => {
                        setShowAddAnggota(false);
                        setNewAnggota({ nim: "", nama_lengkap: "", id_user: null });
                        setAddAnggotaError("");
                      }}
                      sx={{
                        textTransform: "none", borderRadius: "10px", px: 3, fontWeight: 600, fontSize: 14,
                        backgroundColor: COLORS.error, color: "#fff",
                        "&:hover": { backgroundColor: "#B91C1C" },
                      }}
                    >
                      Batal
                    </Button>
                    <Button
                      variant="contained" onClick={handleUndangAnggota} disabled={addingAnggota}
                      sx={{
                        px: 4, py: 1.3, textTransform: "none", fontWeight: 700, borderRadius: "10px", fontSize: 14,
                        backgroundColor: COLORS.primary,
                        "&:hover": { backgroundColor: COLORS.primaryDark },
                        "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" },
                      }}
                    >
                      {addingAnggota ? "Mengirim..." : "Kirim Undangan"}
                    </Button>
                  </Box>
                </Box>
              </Paper>
            )}

            <Paper elevation={0} sx={{
              borderRadius: "20px",
              border: "1.5px solid #E5E7EB",
              overflow: "hidden",
            }}>
              <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
              <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
                <SectionHeader
                  icon={Groups}
                  title="Detail Tim"
                  subtitle="Informasi dan daftar anggota tim"
                  gradient={`linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`}
                />

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: 4 }}>
                  <Box>
                    <FieldLabel>Nama Tim</FieldLabel>
                    <TextField fullWidth value={timDetail?.nama_tim || ""} disabled sx={roundedField} />
                  </Box>
                  <Box>
                    <FieldLabel>Program</FieldLabel>
                    <TextField fullWidth value={timDetail?.keterangan || ""} disabled sx={roundedField} />
                  </Box>
                </Box>
                
                {inbisStatus && inbisStatus.lolos_pmw !== false && (
                  <Box sx={{
                    mb: 3, p: 2, borderRadius: "12px",
                    background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)",
                    border: `1px solid #34D399`,
                  }}>
                    <Typography sx={{ fontSize: 14, color: "#065F46", fontWeight: 700, mb: 0.5 }}>
                      Selamat! Tim Anda lolos tahap seleksi (wawancara)
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: "#064E3B", mb: inbisStatus.eligible ? 1.5 : 0 }}>
                      Tim Anda eligible untuk mendaftar program Inkubator Bisnis.
                      {!inbisStatus.eligible && inbisStatus.alasan && ` (${inbisStatus.alasan})`}
                    </Typography>
                    
                    {inbisStatus.eligible && timStatus?.isKetua && (
                      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 1.5 }}>
                        <Button
                          variant="contained" size="small"
                          onClick={() => handleLanjutInbis(true)} disabled={processingInbis}
                          sx={{ textTransform: "none", borderRadius: "8px", fontWeight: 600, backgroundColor: COLORS.primary }}
                        >
                          Lanjut INBIS (Anggota Sama)
                        </Button>
                        <Button
                          variant="outlined" size="small"
                          onClick={() => handleLanjutInbis(false)} disabled={processingInbis}
                          sx={{ textTransform: "none", borderRadius: "8px", fontWeight: 600, borderColor: COLORS.primary, color: COLORS.primary }}
                        >
                          Lanjut INBIS (Anggota Berbeda)
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}

                <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 2, color: "#1F2937" }}>Daftar Anggota</Typography>

                <TableContainer sx={{ borderRadius: "14px", border: "1.5px solid #E5E7EB", overflow: "hidden", overflowX: "auto" }}>
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
                              <Typography sx={{ fontWeight: 600, fontSize: 14, color: "#1F2937" }}>{item.nama_lengkap}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13, color: COLORS.slate }}>{item.nim}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13, color: COLORS.slate }}>{item.nama_prodi}</Typography>
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
              </Box>
            </Paper>

            {riwayatTim && riwayatTim.length > 0 && (
              <Paper elevation={0} sx={{
                mt: 3, borderRadius: "20px",
                border: "1.5px solid #E5E7EB",
                overflow: "hidden",
              }}>
                <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.slate}, ${COLORS.slateLight})` }} />
                <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
                  <SectionHeader
                    icon={RestartAlt}
                    title="Riwayat Tim (Arsip)"
                    subtitle="Daftar tim Anda pada program sebelumnya"
                    gradient={`linear-gradient(135deg, ${COLORS.slate} 0%, #9CA3AF 100%)`}
                  />
                  <TableContainer sx={{ borderRadius: "14px", border: "1.5px solid #E5E7EB", overflow: "hidden", overflowX: "auto" }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          {["Nama Tim", "Program", "Peran", "Tanggal Dibuat", "Tanggal Diarsipkan"].map((h, i) => (
                            <TableCell key={i} sx={tableHeadCell}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {riwayatTim.map((item, index) => {
                          const peranInfo = getPeranInfo(item.peran);
                          return (
                            <TableRow key={index} sx={tableBodyRow}>
                              <TableCell>
                                <Typography sx={{ fontWeight: 600, fontSize: 14, color: "#1F2937" }}>{item.nama_tim}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ fontSize: 13, color: COLORS.slate }}>{item.nama_program}</Typography>
                              </TableCell>
                              <TableCell>
                                <StatusPill label={peranInfo.label} backgroundColor={peranInfo.backgroundColor} />
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ fontSize: 13, color: COLORS.slate }}>
                                  {new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ fontSize: 13, color: COLORS.slate }}>
                                  {item.archived_at ? new Date(item.archived_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Paper>
            )}
          </Box>
        </PageTransition>
      </BodyLayout>
    );
  }

  return (
    <BodyLayout Sidebar={MahasiswaNavbar}>
      <PageTransition>
        <Box>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              Anggota Tim
            </Typography>
            <Typography sx={{ fontSize: 16, color: "#6B7280" }}>
              Lengkapi form di bawah ini untuk mengajukan anggota tim
            </Typography>
          </Box>

          <Paper elevation={0} sx={{
            mb: 3, borderRadius: "20px",
            border: "1.5px solid #E5E7EB",
            overflow: "hidden",
          }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />

            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <SectionHeader
                icon={Shield}
                title="Pengajuan Anggota Tim"
                subtitle="Isi nama tim, pilih program, dan tambahkan anggota"
                gradient={`linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`}
              />

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: 4 }}>
                <Box>
                  <FieldLabel required>Nama Tim</FieldLabel>
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
                  <FieldLabel required>Program</FieldLabel>
                  {loadingProgram ? (
                    <Box sx={{ display: "flex", alignItems: "center", py: 2 }}>
                      <CircularProgress size={22} sx={{ color: COLORS.primary }} />
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
                              <Box sx={{ px: 1, py: 0.2, borderRadius: "50px", backgroundColor: option.status?.color, flexShrink: 0 }}>
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
                          <CircularProgress size={14} sx={{ color: COLORS.primary }} />
                          <Typography sx={{ fontSize: 13, color: COLORS.slate }}>Memeriksa eligibilitas...</Typography>
                        </Box>
                      )}

                      {!checkingEligibility && inbisEligibility !== null && (
                        <Box sx={{
                          mt: 1.5, p: 2, borderRadius: "12px",
                          backgroundColor: inbisEligibility.eligible ? COLORS.successLight : COLORS.errorLight,
                          border: `1.5px solid ${inbisEligibility.eligible ? "#6EE7B7" : "#FCA5A5"}`,
                        }}>
                          {inbisEligibility.eligible ? (
                            <Typography sx={{ fontSize: 13, color: "#065F46", fontWeight: 600 }}>
                              Anda memenuhi syarat untuk mendaftar program INBIS.
                            </Typography>
                          ) : (
                            <>
                              <Typography sx={{ fontSize: 13, color: COLORS.error, fontWeight: 700, mb: 0.5 }}>
                                Anda tidak eligible untuk mendaftar program ini
                              </Typography>
                              <Typography sx={{ fontSize: 13, color: "#7F1D1D" }}>
                                {inbisEligibility.alasan}
                              </Typography>
                              {inbisEligibility.monev_progress && (
                                <Typography sx={{ fontSize: 12, color: "#7F1D1D", mt: 0.5 }}>
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

              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 1, color: "#1F2937" }}>Daftar Anggota</Typography>
                {errors.anggota && (
                  <Typography sx={{ color: COLORS.error, fontSize: 12, mb: 2 }}>{errors.anggota}</Typography>
                )}
              </Box>

              {formTim.anggota.map((item, index) => {
                const selectedIds = new Set(
                  formTim.anggota.filter((_, i) => i !== index).map((a) => a.id_user).filter(Boolean)
                );
                const filteredNimOptions = (nimResults[index] || []).filter((o) => !selectedIds.has(o.id_user));
                const filteredNamaOptions = (namaResults[index] || []).filter((o) => !selectedIds.has(o.id_user));

                return (
                  <Box
                    key={index}
                    sx={{
                      mb: 2.5, p: 3,
                      border: `1.5px solid ${errors[`anggota_${index}`] ? "#FCA5A5" : "#E5E7EB"}`,
                      borderRadius: "16px",
                      background: errors[`anggota_${index}`] ? COLORS.errorLight : COLORS.slateLight,
                      transition: "border-color 0.2s, background 0.2s",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Box sx={{
                          width: 30, height: 30, borderRadius: "8px",
                          background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{index + 1}</Typography>
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#374151" }}>
                          Anggota {index + 1}
                        </Typography>
                      </Box>
                      {formTim.anggota.length > 2 && (
                        <IconButton
                          size="small" onClick={() => handleRemoveAnggota(index)} disabled={submitting}
                          sx={{
                            color: COLORS.error, backgroundColor: COLORS.errorLight,
                            borderRadius: "8px",
                            "&:hover": { backgroundColor: "#FEE2E2" },
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </Box>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
                      <Box>
                        <FieldLabel>NIM</FieldLabel>
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
                              <MahasiswaOption option={option} />
                            </li>
                          )}
                        />
                      </Box>
                      <Box>
                        <FieldLabel>Nama Lengkap</FieldLabel>
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
                              <MahasiswaOption option={option} />
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
                  mb: 4, textTransform: "none", borderRadius: "12px",
                  color: COLORS.primary, border: `1.5px dashed rgba(13,89,242,0.35)`,
                  px: 3, py: 1.2, width: "100%", fontWeight: 600, fontSize: 14,
                  "&:hover": { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
                }}
              >
                Tambah Anggota
              </Button>

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained" onClick={handleSubmit} disabled={submitting}
                  sx={{
                    px: 4, py: 1.3, textTransform: "none", fontWeight: 700, borderRadius: "10px", fontSize: 14,
                    backgroundColor: COLORS.primary,
                    "&:hover": { backgroundColor: COLORS.primaryDark },
                    "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" },
                  }}
                >
                  {submitting ? "Mengajukan..." : "Ajukan Anggota Tim"}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}