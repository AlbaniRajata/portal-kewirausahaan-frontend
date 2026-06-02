import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Dialog,
  DialogContent, DialogActions, TextField, MenuItem, Autocomplete,
  IconButton, Pagination, Tooltip, InputAdornment, Divider,
} from "@mui/material";
import { Close, Search, Visibility, VisibilityOff } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import {
  getMahasiswaList, getDosenList, getReviewerListKelola, getJuriListKelola,
  getProdi, createMahasiswa, updateMahasiswa, createDosen, updateDosen,
  createReviewer, updateReviewer, createJuri, updateJuri,
  toggleUserActive, resetPassword, getMyProgram,
} from "../../api/admin";
import { getAllProgram } from "../../api/public";

const COLORS = {
  primary: "#0D59F2",
  primaryLight: "#E0F2FE",
  primaryDark: "#0369A1",
  primaryMuted: "#93C5FD",
  secondary: "#2563EB",
  accent: "#3B82F6",
  slate: "#64748B",
  slateLight: "#F1F5F9",
  success: "#059669",
  successLight: "#ECFDF5",
  warning: "#D97706",
  warningLight: "#FFFBEB",
  error: "#DC2626",
  errorLight: "#ff7070",
};

const roundedField = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "#fff",
    transition: "all 0.2s ease-in-out",
    "&:hover fieldset": { borderColor: COLORS.primary },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary, borderWidth: "2px" },
    "&.Mui-focused": { boxShadow: `0 0 0 4px ${COLORS.primaryLight}` },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: COLORS.primary, fontWeight: 700 },
};

const tableHeadCell = {
  fontWeight: 800,
  fontSize: 12,
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  backgroundColor: "#F8FAFC",
  borderBottom: `2px solid ${COLORS.primaryMuted}`,
  py: 2.5,
};

const tableBodyRow = {
  "&:hover": { backgroundColor: "#F1F5F9/50" },
  "& td": { borderBottom: "1.5px solid #E2E8F0", py: 2 },
};

const pageCard = {
  borderRadius: "20px",
  border: "1.5px solid #E2E8F0",
  overflow: "hidden",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  position: "relative",
};

const FieldLabel = ({ children, required }) => (
  <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>
    {children} {required && <span style={{ color: COLORS.error }}>*</span>}
  </Typography>
);

const StatusPill = ({ active }) => (
  <Box sx={{
    display: "inline-flex",
    alignItems: "center",
    px: 1.5,
    py: 0.4,
    borderRadius: "50px",
    backgroundColor: active ? COLORS.successLight : COLORS.errorLight,
    color: active ? COLORS.success : COLORS.error,
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: "nowrap",
    border: `1px solid ${active ? COLORS.success : COLORS.error}20`,
  }}>
    <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: active ? COLORS.success : COLORS.error, mr: 1 }} />
    {active ? "Aktif" : "Nonaktif"}
  </Box>
);

const TABS = [
  { label: "Mahasiswa", key: "mahasiswa" },
  { label: "Dosen", key: "dosen" },
  { label: "Reviewer", key: "reviewer" },
  { label: "Juri", key: "juri" },
];

const emptyForms = {
  mahasiswa: { username: "", email: "", password: "", nama_lengkap: "", no_hp: "", alamat: "", nim: "", id_prodi: "", tahun_masuk: "" },
  dosen: { username: "", email: "", password: "", nama_lengkap: "", no_hp: "", alamat: "", nip: "", id_prodi: "", bidang_keahlian: "" },
  reviewer: { username: "", email: "", password: "", nama_lengkap: "", no_hp: "", alamat: "", institusi: "", bidang_keahlian: "", id_program: "" },
  juri: { username: "", email: "", password: "", nama_lengkap: "", no_hp: "", alamat: "", institusi: "", bidang_keahlian: "", id_program: "" },
};

const TAHUN_OPTIONS = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i);

const initFilters = {
  mahasiswa: { search: "", is_active: "", id_prodi: "", tahun: "" },
  dosen: { search: "", is_active: "", id_prodi: "", tahun: "" },
  reviewer: { search: "", is_active: "", tahun: "" },
  juri: { search: "", is_active: "", tahun: "" },
};

const truncateWithEllipsis = (text, max = 42) => {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const formatProdiLabel = (prodi) => {
  if (!prodi) return "";
  const jenjang = prodi.jenjang || "";
  const namaProdi = prodi.nama_prodi || "";
  const namaJurusan = prodi.nama_jurusan || "";
  const namaKampus = prodi.nama_kampus || "";
  return `${jenjang} ${namaProdi} - ${namaJurusan} (${namaKampus})`.trim();
};

export default function KelolaPenggunaPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState({ mahasiswa: [], dosen: [], reviewer: [], juri: [] });
  const [prodiList, setProdiList] = useState([]);
  const [programList, setProgramList] = useState([]);
  const [myProgram, setMyProgram] = useState(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const [filters, setFilters] = useState(initFilters);
  const [dialog, setDialog] = useState({ open: false, mode: "create", role: "mahasiswa", data: null });
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const tabKey = TABS[activeTab].key;
  const currentFilter = filters[tabKey];

  const fetchData = useCallback(async (role, currentFilters) => {
    setLoading(true);
    try {
      const f = currentFilters[role];
      const params = { limit: 100, page: 1 };
      if (f.search) params.search = f.search;
      if (f.is_active !== "") params.is_active = f.is_active;
      if (f.id_prodi) params.id_prodi = f.id_prodi;

      let res;
      if (role === "mahasiswa" || role === "dosen") {
        const fetcher = role === "mahasiswa" ? getMahasiswaList : getDosenList;
        let currentPage = 1;
        let totalPages = 1;
        const mergedData = [];

        do {
          res = await fetcher({ ...params, page: currentPage });
          const rawData = res.data || [];
          const dataArray = Array.isArray(rawData) ? rawData : (rawData.data || rawData.items || rawData.list || []);
          mergedData.push(...dataArray);

          const apiTotalPages = Number(res?.pagination?.total_pages || 1);
          totalPages = Number.isNaN(apiTotalPages) || apiTotalPages < 1 ? 1 : apiTotalPages;
          currentPage += 1;
        } while (currentPage <= totalPages);

        setLists((prev) => ({ ...prev, [role]: mergedData }));
      } else {
        if (role === "reviewer") res = await getReviewerListKelola(params);
        else res = await getJuriListKelola(params);

        const rawData = res.data || [];
        const dataArray = Array.isArray(rawData) ? rawData : (rawData.data || rawData.items || rawData.list || []);
        setLists((prev) => ({ ...prev, [role]: dataArray }));
      }
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat data pengguna", confirmButtonColor: "#0D59F2" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(tabKey, filters);
    setPage(1);
  }, [tabKey, filters, fetchData]);

  useEffect(() => {
    getProdi().then((res) => {
      const prodi = res.data || [];
      setProdiList(prodi);
    }).catch(() => {});

    getAllProgram().then((res) => {
      const programs = res.data || [];
      setProgramList(programs);
    }).catch(() => {});

    getMyProgram().then((res) => {
      setMyProgram(res.data || null);
    }).catch(() => {});
  }, []);

  const setFilter = useCallback((key, val) => {
    setFilters((prev) => ({ ...prev, [tabKey]: { ...prev[tabKey], [key]: val } }));
    setPage(1);
  }, [tabKey]);

  const currentList = lists[tabKey];

  const getYearFromUser = (user) => {
    if (tabKey === "mahasiswa" && user.tahun_masuk) return Number(user.tahun_masuk);
    const dateValue = user.created_at || user.updated_at;
    if (!dateValue) return null;
    const year = new Date(dateValue).getFullYear();
    return Number.isNaN(year) ? null : year;
  };

  const yearOptions = Array.from(new Set(
    currentList
      .map((user) => getYearFromUser(user))
      .filter(Boolean)
  )).sort((a, b) => b - a);

  const filteredList = currentFilter.tahun === ""
    ? currentList
    : currentList.filter((user) => getYearFromUser(user) === Number(currentFilter.tahun));

  const totalPages = Math.ceil(filteredList.length / rowsPerPage);
  const paginatedList = filteredList.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleOpenCreate = () => {
    const f = { ...emptyForms[tabKey] };
    if ((tabKey === "reviewer" || tabKey === "juri") && myProgram?.id_program) {
      f.id_program = String(myProgram.id_program);
    }
    setForm(f);
    setErrors({});
    setShowPassword(false);
    setShowNewPassword(false);
    setDialog({ open: true, mode: "create", role: tabKey, data: null });
  };

  const handleOpenEdit = (user) => {
    const f = {
      nama_lengkap: user.nama_lengkap || "",
      email: user.email || "",
      no_hp: user.no_hp || "",
      alamat: user.alamat || "",
      new_password: "",
    };
    if (tabKey === "mahasiswa") Object.assign(f, { nim: user.nim || "", id_prodi: user.id_prodi || "", tahun_masuk: user.tahun_masuk || "" });
    else if (tabKey === "dosen") Object.assign(f, { nip: user.nip || "", id_prodi: user.id_prodi || "", bidang_keahlian: user.bidang_keahlian || "" });
    else Object.assign(f, { institusi: user.institusi || "", bidang_keahlian: user.bidang_keahlian || "", id_program: user.id_program || "" });
    setForm(f);
    setErrors({});
    setShowPassword(false);
    setShowNewPassword(false);
    setDialog({ open: true, mode: "edit", role: tabKey, data: user });
  };

  const findProdiOption = (idProdi) => {
    if (!idProdi) return null;
    return prodiList.find((p) => String(p.id_prodi) === String(idProdi)) || null;
  };

  const handleCloseDialog = () => {
    setDialog({ open: false, mode: "create", role: tabKey, data: null });
    setForm({});
    setErrors({});
    setShowPassword(false);
    setShowNewPassword(false);
  };

  const validate = (currentDialog, currentForm, currentTabKey) => {
    const e = {};
    if (currentDialog.mode === "create") {
      if (!currentForm.username?.trim()) e.username = "Username wajib diisi";
      if (!currentForm.password || currentForm.password.length < 8) e.password = "Password minimal 8 karakter";
    }
    if (currentDialog.mode === "edit" && currentForm.new_password && currentForm.new_password.length < 8) {
      e.new_password = "Password minimal 8 karakter";
    }
    if (!currentForm.nama_lengkap?.trim()) e.nama_lengkap = "Nama lengkap wajib diisi";
    if (!currentForm.email?.trim()) e.email = "Email wajib diisi";
    if (currentTabKey === "mahasiswa") {
      if (!currentForm.nim?.trim()) e.nim = "NIM wajib diisi";
      if (!currentForm.id_prodi) e.id_prodi = "Prodi wajib dipilih";
      if (!currentForm.tahun_masuk) e.tahun_masuk = "Tahun masuk wajib dipilih";
    }
    if (currentTabKey === "dosen") {
      if (!currentForm.nip?.trim()) e.nip = "NIP wajib diisi";
      if (!currentForm.id_prodi) e.id_prodi = "Prodi wajib dipilih";
    }
    if (currentTabKey === "reviewer" || currentTabKey === "juri") {
      if (!currentForm.id_program) e.id_program = "Program wajib dipilih";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    const cur = dialog;
    const curForm = form;
    const curTabKey = cur.role;

    if (!validate(cur, curForm, curTabKey)) return;

    setDialog({ ...cur, open: false });

    const result = await Swal.fire({
      title: "Konfirmasi",
      text: cur.mode === "create" ? `Tambah ${cur.role} baru?` : `Simpan perubahan data ${cur.role}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0D59F2", cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Simpan", cancelButtonText: "Tidak",
    });

    if (!result.isConfirmed) { setDialog({ ...cur, open: true }); setForm(curForm); return; }

    try {
      setSubmitting(true);
      if (cur.mode === "create") {
        if (curTabKey === "mahasiswa") await createMahasiswa(curForm);
        else if (curTabKey === "dosen") await createDosen(curForm);
        else if (curTabKey === "reviewer") await createReviewer(curForm);
        else await createJuri(curForm);
      } else {
        if (curTabKey === "mahasiswa") await updateMahasiswa(cur.data.id_user, curForm);
        else if (curTabKey === "dosen") await updateDosen(cur.data.id_user, curForm);
        else if (curTabKey === "reviewer") await updateReviewer(cur.data.id_user, curForm);
        else await updateJuri(cur.data.id_user, curForm);

        if (curForm.new_password) {
          await resetPassword(cur.data.id_user, { password: curForm.new_password });
        }
      }
      await Swal.fire({ icon: "success", title: "Berhasil", text: cur.mode === "create" ? `${curTabKey} berhasil ditambahkan` : `Data ${curTabKey} berhasil diperbarui`, timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchData(curTabKey, filters);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Terjadi kesalahan", confirmButtonColor: "#0D59F2" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user) => {
    // Jika dosen, reviewer, atau juri, lakukan delete (hard delete)
    const isNonMahasiswa = tabKey !== "mahasiswa";
    
    if (isNonMahasiswa) {
      // Untuk dosen, reviewer, juri: delete
      const result = await Swal.fire({
        title: "Hapus Pengguna?",
        html: `<b>${user.nama_lengkap || user.username}</b> akan dihapus permanen.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: COLORS.error,
        cancelButtonColor: COLORS.slate,
        confirmButtonText: "Ya, Hapus",
        cancelButtonText: "Batal",
      });
      if (!result.isConfirmed) return;
      try {
        await toggleUserActive(user.id_user, false);
        await Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: `Pengguna berhasil dihapus`,
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        fetchData(tabKey, filters);
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: err.response?.data?.message || "Terjadi kesalahan",
          confirmButtonColor: COLORS.primary,
        });
      }
    } else {
      // Untuk mahasiswa: toggle active status (soft delete)
      const newStatus = !user.is_active;
      const result = await Swal.fire({
        title: newStatus ? "Aktifkan Pengguna?" : "Nonaktifkan Pengguna?",
        html: `<b>${user.nama_lengkap || user.username}</b> akan ${newStatus ? "diaktifkan" : "dinonaktifkan"}.`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: newStatus ? COLORS.success : COLORS.error,
        cancelButtonColor: COLORS.slate,
        confirmButtonText: "Ya",
        cancelButtonText: "Batal",
      });
      if (!result.isConfirmed) return;
      try {
        await toggleUserActive(user.id_user, newStatus);
        await Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: `Pengguna berhasil ${newStatus ? "diaktifkan" : "dinonaktifkan"}`,
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        fetchData(tabKey, filters);
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: err.response?.data?.message || "Terjadi kesalahan",
          confirmButtonColor: COLORS.primary,
        });
      }
    }
  };

  const renderFilters = () => (
    <Box
      sx={{
        display: "flex",
        gap: { xs: 1.25, xl: 2 },
        mb: 4,
        alignItems: "center",
        flexWrap: "wrap",
        flexDirection: "row",
        "@media (max-width: 1440px)": {
          flexDirection: "column",
          alignItems: "stretch",
        },
        "@media (min-width: 1441px)": {
          flexDirection: "row",
          alignItems: "center",
        },
      }}
    >
      <TextField
        size="small"
        placeholder="Cari nama, email..."
        value={currentFilter.search}
        onChange={(e) => setFilter("search", e.target.value)}
        InputProps={{
          startAdornment: (
            <IconButton size="small" sx={{ p: 0, mr: 1, color: COLORS.primary }}>
              <Search sx={{ fontSize: { xs: 18, sm: 20 } }} />
            </IconButton>
          ),
        }}
        sx={{
          ...roundedField,
          width: { xs: "100%", xl: "auto" },
          minWidth: { xs: "100%", xl: 240 },
          maxWidth: { xs: "100%", sm: 360, xl: 280 },
          flex: { xl: "1 1 240px" },
        }}
      />
      <TextField
        select
        size="small"
        value={currentFilter.is_active}
        onChange={(e) => setFilter("is_active", e.target.value)}
        SelectProps={{
          displayEmpty: true,
          renderValue: (v) => (
            <span style={{ fontSize: 14, color: !v ? "#9CA3AF" : "inherit" }}>
              {!v ? "Semua Status" : (v === "true" ? "Aktif" : "Nonaktif")}
            </span>
          ),
        }}
        sx={{
          ...roundedField,
          width: { xs: "100%", xl: "auto" },
          minWidth: { xs: "100%", xl: 180 },
          flex: { xl: "0 1 180px" },
        }}
      >
        <MenuItem value="" sx={{ fontSize: 13 }}>Semua Status</MenuItem>
        <MenuItem value="true" sx={{ fontSize: 13 }}>Aktif</MenuItem>
        <MenuItem value="false" sx={{ fontSize: 13 }}>Nonaktif</MenuItem>
      </TextField>
      <TextField
        select
        size="small"
        value={currentFilter.tahun}
        onChange={(e) => setFilter("tahun", e.target.value)}
        SelectProps={{
          displayEmpty: true,
          renderValue: (v) => (
            <span style={{ fontSize: 14, color: !v ? "#9CA3AF" : "inherit" }}>
              {!v ? "Semua Tahun" : v}
            </span>
          ),
        }}
        sx={{
          ...roundedField,
          width: { xs: "100%", xl: "auto" },
          minWidth: { xs: "100%", xl: 160 },
          flex: { xl: "0 1 160px" },
        }}
      >
        <MenuItem value="" sx={{ fontSize: 13 }}>Semua Tahun</MenuItem>
        {yearOptions.map((tahun) => (
          <MenuItem key={tahun} value={String(tahun)} sx={{ fontSize: 13 }}>
            {tahun}
          </MenuItem>
        ))}
      </TextField>

      {tabKey === "mahasiswa" && (
        <>
          <Autocomplete
            size="small"
            options={prodiList}
            value={findProdiOption(currentFilter.id_prodi)}
            onChange={(e, value) => setFilter("id_prodi", value ? String(value.id_prodi) : "")}
            getOptionLabel={(option) => formatProdiLabel(option)}
            isOptionEqualToValue={(option, value) => String(option.id_prodi) === String(value?.id_prodi)}
            filterOptions={(options, { inputValue }) => {
              if (!inputValue) return options;
              const s = inputValue.toLowerCase();
              return options.filter((o) =>
                String(o?.nama_prodi || "").toLowerCase().includes(s) ||
                String(o?.jenjang || "").toLowerCase().includes(s) ||
                String(o?.nama_jurusan || "").toLowerCase().includes(s) ||
                String(o?.nama_kampus || "").toLowerCase().includes(s)
              );
            }}
            renderInput={(params) => (
              <TextField {...params} placeholder="Ketik atau pilih prodi" sx={roundedField} />
            )}
            sx={{
              width: { xs: "100%", xl: "auto" },
              minWidth: { xs: "100%", xl: 320 },
              flex: { xl: "0 1 320px" },
            }}
          />
        </>
      )}

      {tabKey === "dosen" && (
        <Autocomplete
          size="small"
          options={prodiList}
          value={findProdiOption(currentFilter.id_prodi)}
          onChange={(e, value) => setFilter("id_prodi", value ? String(value.id_prodi) : "")}
          getOptionLabel={(option) => formatProdiLabel(option)}
          isOptionEqualToValue={(option, value) => String(option.id_prodi) === String(value?.id_prodi)}
          filterOptions={(options, { inputValue }) => {
            if (!inputValue) return options;
            const s = inputValue.toLowerCase();
            return options.filter((o) =>
              String(o?.nama_prodi || "").toLowerCase().includes(s) ||
              String(o?.jenjang || "").toLowerCase().includes(s) ||
              String(o?.nama_jurusan || "").toLowerCase().includes(s) ||
              String(o?.nama_kampus || "").toLowerCase().includes(s)
            );
          }}
          renderInput={(params) => (
            <TextField {...params} placeholder="Ketik atau pilih prodi" sx={roundedField} />
          )}
          sx={{
            width: { xs: "100%", xl: "auto" },
            minWidth: { xs: "100%", xl: 320 },
            flex: { xl: "0 1 320px" },
          }}
        />
      )}

      <Button
        variant="contained"
        onClick={handleOpenCreate}
        sx={{
          textTransform: "none",
          borderRadius: "12px",
          px: { xs: 2, sm: 3 },
          py: 1.2,
          fontWeight: 700,
          backgroundColor: COLORS.primary,
          boxShadow: "0 4px 12px rgba(13, 89, 242, 0.2)",
          width: { xs: "100%", xl: "auto" },
          minWidth: { xl: 150 },
          ml: { xl: "auto" },
          "&:hover": { 
            backgroundColor: COLORS.primaryDark,
            boxShadow: "0 6px 16px rgba(13, 89, 242, 0.3)",
          },
        }}
      >
        Tambah {TABS[activeTab].label}
      </Button>
    </Box>
  );

  const renderColumns = () => {
    if (tabKey === "mahasiswa") return ["NAMA LENGKAP", "NIM", "EMAIL", "PRODI", "TAHUN MASUK", "STATUS", "AKSI"];
    if (tabKey === "dosen") return ["NAMA LENGKAP", "NIP", "EMAIL", "PRODI", "BIDANG KEAHLIAN", "STATUS", "AKSI"];
    return ["NAMA LENGKAP", "EMAIL", "INSTITUSI", "PROGRAM", "BIDANG KEAHLIAN", "STATUS", "AKSI"];
  };

  const renderRow = (user) => {
    const cells = [];
    cells.push(
      <TableCell key="nama" sx={{ width: 260, minWidth: 240, pl: { xs: 1.5, sm: 3 } }}>
        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{user.nama_lengkap || user.username}</Typography>
      </TableCell>
    );
    if (tabKey === "mahasiswa") {
      cells.push(<TableCell key="nim"><Typography sx={{ fontSize: 13 }}>{user.nim}</Typography></TableCell>);
      cells.push(<TableCell key="email"><Typography sx={{ fontSize: 13 }}>{user.email}</Typography></TableCell>);
      cells.push(
        <TableCell key="prodi" sx={{ width: 220, maxWidth: 220 }}>
          <Tooltip title={`${user.jenjang || ""} ${user.nama_prodi || ""}`.trim()}>
            <Typography sx={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
              {user.jenjang} {user.nama_prodi}
            </Typography>
          </Tooltip>
        </TableCell>
      );
      cells.push(<TableCell key="tahun"><Typography sx={{ fontSize: 13 }}>{user.tahun_masuk}</Typography></TableCell>);
    } else if (tabKey === "dosen") {
      cells.push(<TableCell key="nip"><Typography sx={{ fontSize: 13 }}>{user.nip}</Typography></TableCell>);
      cells.push(<TableCell key="email"><Typography sx={{ fontSize: 13 }}>{user.email}</Typography></TableCell>);
      cells.push(
        <TableCell key="prodi" sx={{ width: 220, maxWidth: 220 }}>
          <Tooltip title={`${user.jenjang || ""} ${user.nama_prodi || ""}`.trim()}>
            <Typography sx={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
              {user.jenjang} {user.nama_prodi}
            </Typography>
          </Tooltip>
        </TableCell>
      );
      cells.push(<TableCell key="keahlian"><Typography sx={{ fontSize: 13 }}>{user.bidang_keahlian || "-"}</Typography></TableCell>);
    } else {
      cells.push(<TableCell key="email"><Typography sx={{ fontSize: 13 }}>{user.email}</Typography></TableCell>);
      cells.push(<TableCell key="institusi"><Typography sx={{ fontSize: 13 }}>{user.institusi || "-"}</Typography></TableCell>);
      cells.push(<TableCell key="program"><Typography sx={{ fontSize: 13, fontWeight: 600, color: COLORS.primaryDark }}>{user.nama_program || "-"}</Typography></TableCell>);
      cells.push(<TableCell key="keahlian"><Typography sx={{ fontSize: 13 }}>{user.bidang_keahlian || "-"}</Typography></TableCell>);
    }
    cells.push(<TableCell key="status"><StatusPill active={user.is_active} /></TableCell>);
    return cells;
  };

  const renderFormFields = (currentDialog, currentForm, currentTabKey) => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, py: 1 }}>
      {currentDialog.mode === "create" && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
          <Box>
            <FieldLabel required>Username</FieldLabel>
            <TextField
              fullWidth
              placeholder="Username"
              value={currentForm.username || ""}
              onChange={(e) => {
                setForm({ ...currentForm, username: e.target.value });
                setErrors((prev) => ({ ...prev, username: "" }));
              }}
              error={!!errors.username}
              helperText={errors.username}
              sx={roundedField}
            />
          </Box>
          <Box>
            <FieldLabel required>Password</FieldLabel>
            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              placeholder="Minimal 8 karakter"
              value={currentForm.password || ""}
              onChange={(e) => {
                setForm({ ...currentForm, password: e.target.value });
                setErrors((prev) => ({ ...prev, password: "" }));
              }}
              error={!!errors.password}
              helperText={errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" size="small">
                      {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={roundedField}
            />
          </Box>
        </Box>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
        <Box>
          <FieldLabel required>Nama Lengkap</FieldLabel>
          <TextField
            fullWidth
            placeholder="Nama lengkap"
            value={currentForm.nama_lengkap || ""}
            onChange={(e) => {
              setForm({ ...currentForm, nama_lengkap: e.target.value });
              setErrors((prev) => ({ ...prev, nama_lengkap: "" }));
            }}
            error={!!errors.nama_lengkap}
            helperText={errors.nama_lengkap}
            sx={roundedField}
          />
        </Box>
        <Box>
          <FieldLabel required>Email</FieldLabel>
          <TextField
            fullWidth
            placeholder="email@example.com"
            value={currentForm.email || ""}
            onChange={(e) => {
              setForm({ ...currentForm, email: e.target.value });
              setErrors((prev) => ({ ...prev, email: "" }));
            }}
            error={!!errors.email}
            helperText={errors.email}
            sx={roundedField}
          />
        </Box>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
        <Box>
          <FieldLabel>No. WhatsApp</FieldLabel>
          <TextField
            fullWidth
            placeholder="08xx..."
            value={currentForm.no_hp || ""}
            onChange={(e) => setForm({ ...currentForm, no_hp: e.target.value })}
            sx={roundedField}
          />
        </Box>
        {currentTabKey === "mahasiswa" && (
          <Box>
            <FieldLabel required>NIM</FieldLabel>
            <TextField
              fullWidth
              placeholder="NIM mahasiswa"
              value={currentForm.nim || ""}
              onChange={(e) => {
                setForm({ ...currentForm, nim: e.target.value });
                setErrors((prev) => ({ ...prev, nim: "" }));
              }}
              error={!!errors.nim}
              helperText={errors.nim}
              sx={roundedField}
            />
          </Box>
        )}
        {currentTabKey === "dosen" && (
          <Box>
            <FieldLabel required>NIP</FieldLabel>
            <TextField
              fullWidth
              placeholder="NIP dosen"
              value={currentForm.nip || ""}
              onChange={(e) => {
                setForm({ ...currentForm, nip: e.target.value });
                setErrors((prev) => ({ ...prev, nip: "" }));
              }}
              error={!!errors.nip}
              helperText={errors.nip}
              sx={roundedField}
            />
          </Box>
        )}
      </Box>

      {(currentTabKey === "mahasiswa" || currentTabKey === "dosen") && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
          <Box>
            <FieldLabel required>Program Studi</FieldLabel>
            <Autocomplete
              fullWidth
              size="small"
              options={prodiList}
              value={findProdiOption(currentForm.id_prodi)}
              onChange={(e, value) => {
                setForm({ ...currentForm, id_prodi: value ? String(value.id_prodi) : "" });
                setErrors((prev) => ({ ...prev, id_prodi: "" }));
              }}
              getOptionLabel={(option) => formatProdiLabel(option)}
              isOptionEqualToValue={(option, value) => String(option.id_prodi) === String(value?.id_prodi)}
              filterOptions={(options, { inputValue }) => {
                if (!inputValue) return options;
                const s = inputValue.toLowerCase();
                return options.filter((o) =>
                  String(o?.nama_prodi || "").toLowerCase().includes(s) ||
                  String(o?.jenjang || "").toLowerCase().includes(s) ||
                  String(o?.nama_jurusan || "").toLowerCase().includes(s) ||
                  String(o?.nama_kampus || "").toLowerCase().includes(s)
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Ketik atau pilih prodi"
                  error={!!errors.id_prodi}
                  helperText={errors.id_prodi}
                  sx={{
                    ...roundedField,
                    "& .MuiOutlinedInput-root": {
                      ...roundedField["& .MuiOutlinedInput-root"],
                      minHeight: 50,
                    },
                  }}
                />
              )}
            />
          </Box>
          {currentTabKey === "mahasiswa" ? (
            <Box>
              <FieldLabel required>Tahun Masuk</FieldLabel>
              <TextField
                fullWidth
                size="small"
                placeholder="Ketik tahun masuk"
                value={currentForm.tahun_masuk || ""}
                onChange={(e) => {
                  setForm({ ...currentForm, tahun_masuk: e.target.value });
                  setErrors((prev) => ({ ...prev, tahun_masuk: "" }));
                }}
                error={!!errors.tahun_masuk}
                helperText={errors.tahun_masuk}
                sx={{
                  ...roundedField,
                  "& .MuiOutlinedInput-root": {
                    ...roundedField["& .MuiOutlinedInput-root"],
                    minHeight: 50,
                  },
                }}
              />
            </Box>
          ) : (
            <Box>
              <FieldLabel>Bidang Keahlian</FieldLabel>
              <TextField
                fullWidth
                placeholder="Bidang keahlian"
                value={currentForm.bidang_keahlian || ""}
                onChange={(e) => setForm({ ...currentForm, bidang_keahlian: e.target.value })}
                sx={roundedField}
              />
            </Box>
          )}
        </Box>
      )}

      {(currentTabKey === "reviewer" || currentTabKey === "juri") && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
          <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
            <FieldLabel required>Program</FieldLabel>
            <Autocomplete
              fullWidth
              size="small"
              options={programList}
              value={programList.find(p => String(p.id_program) === String(currentForm.id_program)) || null}
              onChange={(e, value) => {
                setForm({ ...currentForm, id_program: value ? String(value.id_program) : "" });
                setErrors((prev) => ({ ...prev, id_program: "" }));
              }}
              getOptionLabel={(option) => option.nama_program || option.keterangan || ""}
              isOptionEqualToValue={(option, value) => String(option.id_program) === String(value?.id_program)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Pilih program"
                  error={!!errors.id_program}
                  helperText={errors.id_program}
                  sx={roundedField}
                />
              )}
            />
          </Box>
          <Box>
            <FieldLabel>Institusi</FieldLabel>
            <TextField
              fullWidth
              placeholder="Institusi asal"
              value={currentForm.institusi || ""}
              onChange={(e) => setForm({ ...currentForm, institusi: e.target.value })}
              sx={roundedField}
            />
          </Box>
          <Box>
            <FieldLabel>Bidang Keahlian</FieldLabel>
            <TextField
              fullWidth
              placeholder="Bidang keahlian"
              value={currentForm.bidang_keahlian || ""}
              onChange={(e) => setForm({ ...currentForm, bidang_keahlian: e.target.value })}
              sx={roundedField}
            />
          </Box>
        </Box>
      )}

      <Box>
        <FieldLabel>Alamat</FieldLabel>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Alamat lengkap (opsional)"
          value={currentForm.alamat || ""}
          onChange={(e) => setForm({ ...currentForm, alamat: e.target.value })}
          sx={{
            ...roundedField,
            "& .MuiOutlinedInput-root": { ...roundedField["& .MuiOutlinedInput-root"], py: 1.5 },
          }}
        />
      </Box>

      {currentDialog.mode === "edit" && (
        <>
          <Divider sx={{ my: 1, borderColor: COLORS.slateLight }} />
          <Box sx={{
            p: 3,
            backgroundColor: COLORS.primaryLight + "30",
            borderRadius: "16px",
            border: `1.5px dashed ${COLORS.primaryMuted}`,
          }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORS.primaryDark, mb: 0.5 }}>
              Reset Password
            </Typography>
            <Typography sx={{ fontSize: 12, color: COLORS.slate, mb: 2.5 }}>
              Kosongkan jika tidak ingin mengubah password akun ini.
            </Typography>
            <TextField
              fullWidth
              type={showNewPassword ? "text" : "password"}
              placeholder="Password baru (opsional, min. 8 karakter)"
              value={currentForm.new_password || ""}
              onChange={(e) => {
                setForm({ ...currentForm, new_password: e.target.value });
                setErrors((prev) => ({ ...prev, new_password: "" }));
              }}
              error={!!errors.new_password}
              helperText={errors.new_password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowNewPassword((s) => !s)} edge="end" size="small">
                      {showNewPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={roundedField}
            />
          </Box>
        </>
      )}
    </Box>
  );

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
            Kelola Pengguna
          </Typography>
          <Typography sx={{ fontSize: 16, color: "#6B7280" }}>
            Manajemen akun mahasiswa, dosen, reviewer, dan juri dalam sistem portal kewirausahaan
          </Typography>
        </Box>

        <Paper 
          elevation={0} 
          sx={{
            borderRadius: "20px",
            border: "1.5px solid #E2E8F0",
            overflow: "hidden",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
            position: "relative",
          }}
        >
          <Box sx={{ height: "6px", background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
          
          <Box sx={{ borderBottom: `1px solid ${COLORS.slateLight}`, overflowX: "auto", backgroundColor: "#fff" }}>
            <Tabs
              value={activeTab}
              onChange={(e, v) => {
                setActiveTab(v);
                setPage(1);
              }}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                minHeight: 52,
                px: { xs: 1, sm: 2 },
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontSize: { xs: 13, sm: 14 },
                  fontWeight: 700,
                  color: COLORS.slate,
                  minHeight: 52,
                  px: { xs: 2, sm: 3 },
                  "&.Mui-selected": { color: COLORS.primary },
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: COLORS.primary,
                  height: 3,
                  borderRadius: "3px 3px 0 0",
                },
              }}
            >
              {TABS.map((t, i) => (
                <Tab key={i} label={t.label} />
              ))}
            </Tabs>
          </Box>

          <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
            {renderFilters()}

            {loading ? (
              <Box sx={{ position: "relative", minHeight: 400 }}>
                <LoadingScreen message="Memuat data pengguna..." overlay minHeight="400px" />
              </Box>
            ) : paginatedList.length === 0 ? (
                <Paper elevation={0} sx={{ p: { xs: 5, sm: 10 }, textAlign: "center", borderRadius: "20px", border: "1.5px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
                  <Typography sx={{ fontSize: { xs: 18, sm: 22 }, fontWeight: 800, color: "#1E293B", mb: 1 }}>
                    Belum ada {TABS[activeTab].label}
                  </Typography>
                  <Typography sx={{ fontSize: { xs: 14, sm: 16 }, color: COLORS.slate, fontWeight: 500 }}>
                    Klik tombol di atas untuk menambahkan {TABS[activeTab].label} baru
                  </Typography>
                </Paper>
              ) : (
                <>
                  <TableContainer sx={{ borderRadius: "16px", border: "1.5px solid #E2E8F0", overflow: "hidden", overflowX: "auto", mb: 4 }}>
                    <Table sx={{ minWidth: 600 }}>
                      <TableHead>
                        <TableRow>
                          {renderColumns().map((h, i) => (
                            <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 0 && { width: 260, minWidth: 240, pl: { xs: 1.5, sm: 3 } }), ...(h === "AKSI" && { textAlign: "center" }) }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedList.map((user) => (
                          <TableRow key={user.id_user} sx={tableBodyRow}>
                            {renderRow(user)}
                            <TableCell>
                              <Box sx={{ display: "flex", gap: { xs: 0.5, sm: 1.5 }, justifyContent: "center", flexWrap: "wrap" }}>
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  onClick={() => handleOpenEdit(user)}
                                  sx={{
                                    textTransform: "none",
                                    color: COLORS.primary,
                                    borderColor: COLORS.primaryMuted,
                                    borderRadius: "10px",
                                    fontWeight: 700,
                                    fontSize: { xs: 11, sm: 12 },
                                    px: { xs: 1, sm: 2 },
                                    "&:hover": { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary }
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  color={tabKey !== "mahasiswa" ? "error" : (user.is_active ? "error" : "success")}
                                  onClick={() => handleToggleActive(user)}
                                  sx={{
                                    textTransform: "none",
                                    borderColor: tabKey !== "mahasiswa" ? COLORS.errorLight : (user.is_active ? COLORS.errorLight : "#dcfce7"),
                                    borderRadius: "10px",
                                    fontWeight: 700,
                                    fontSize: { xs: 11, sm: 12 },
                                    px: { xs: 1, sm: 2 },
                                    "&:hover": { backgroundColor: tabKey !== "mahasiswa" ? COLORS.errorLight : (user.is_active ? COLORS.errorLight : "#dcfce7"), borderColor: tabKey !== "mahasiswa" ? COLORS.error : (user.is_active ? COLORS.error : COLORS.success) }
                                  }}
                                >
                                  {tabKey !== "mahasiswa" ? "Hapus" : (user.is_active ? "Nonaktifkan" : "Aktifkan")}
                                </Button>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 2, px: 1 }}>
                    <Typography sx={{ fontSize: 14, color: COLORS.slate, fontWeight: 600 }}>
                      Menampilkan <span style={{ color: "#1E293B" }}>{((page - 1) * rowsPerPage) + 1}–{Math.min(page * rowsPerPage, filteredList.length)}</span> dari <span style={{ color: "#1E293B" }}>{filteredList.length}</span> data
                    </Typography>
                    <Pagination 
                      count={totalPages} 
                      page={page} 
                      onChange={(e, v) => setPage(v)} 
                      color="primary" 
                      shape="rounded"
                      size="small"
                      sx={{
                        "& .MuiPaginationItem-root": {
                          fontWeight: 700,
                          borderRadius: "10px",
                          "&.Mui-selected": {
                            backgroundColor: COLORS.primary,
                            color: "#fff",
                            "&:hover": { backgroundColor: COLORS.primaryDark },
                          },
                        },
                      }}
                    />
                  </Box>
                </>
              )}
            </Box>
          </Paper>
        <Dialog open={dialog.open} onClose={handleCloseDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: { xs: "16px", sm: "24px" }, overflow: "hidden" } }}>
          <Box sx={{ p: { xs: 1.5, sm: 2 }, display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, color: "#fff" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1 }}>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: 16, sm: 18 } }}>
                {dialog.mode === "create" ? `Tambah ${TABS[activeTab].label}` : `Edit Data ${TABS[activeTab].label}`}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseDialog} sx={{ color: "#fff", "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" } }}>
              <Close />
            </IconButton>
          </Box>
          <DialogContent sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 3, sm: 4 } }}>
            <Box>
              {renderFormFields(dialog, form, tabKey)}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 2, sm: 3 }, backgroundColor: "#F8FAFC", borderTop: "1.5px solid #E2E8F0", gap: 1.5, flexDirection: { xs: "column", sm: "row" }, "& > button": { width: { xs: "100%", sm: "auto" } } }}>
              <Button 
                variant="contained"
                onClick={handleCloseDialog} 
                disabled={submitting}
                sx={{
                  textTransform: "none", borderRadius: "12px", px: 3, fontWeight: 700,
                  backgroundColor: COLORS.error,
                  boxShadow: "0 4px 12px rgba(220,38,38,0.2)",
                  "&:hover": { 
                    backgroundColor: "#B91C1C",
                    boxShadow: "0 6px 16px rgba(220,38,38,0.3)",
                  },
                }}
              >
                Batal
              </Button>
            <Button 
              variant="contained" 
              onClick={handleSave} 
              disabled={submitting}
              sx={{
                textTransform: "none", borderRadius: "12px", px: 4, fontWeight: 700,
                backgroundColor: COLORS.primary,
                boxShadow: "0 4px 12px rgba(13, 89, 242, 0.2)",
                "&:hover": { 
                  backgroundColor: COLORS.primaryDark,
                  boxShadow: "0 6px 16px rgba(13, 89, 242, 0.3)",
                },
              }}
            >
              {submitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogActions>
        </Dialog>
      </PageTransition>
    </BodyLayout>
  );
}