import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, CircularProgress,
  Alert, IconButton, Pagination, Tooltip, InputAdornment, Divider,
} from "@mui/material";
import {
  Add, Edit, Close, PersonAdd, ToggleOn, ToggleOff,
  Search, Visibility, VisibilityOff,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import {
  getMahasiswaList, createMahasiswa, updateMahasiswa,
  getDosenList, createDosen, updateDosen,
  getReviewerListKelola, createReviewer, updateReviewer,
  getJuriListKelola, createJuri, updateJuri,
  toggleUserActive, resetPassword,
} from "../../api/admin";
import { getProdi } from "../../api/admin";

const roundedField = { "& .MuiOutlinedInput-root": { borderRadius: "15px" } };
const tableHeadCell = {
  fontWeight: 700, fontSize: 13, color: "#000",
  backgroundColor: "#fafafa", borderBottom: "2px solid #f0f0f0", py: 2,
};
const tableBodyRow = { "& td": { borderBottom: "1px solid #f5f5f5", py: 2 } };
const stickyAksiHead = {
  ...tableHeadCell, textAlign: "center",
  position: "sticky", right: 0, backgroundColor: "#fafafa",
  zIndex: 2, boxShadow: "-2px 0 6px rgba(0,0,0,0.04)",
};
const stickyAksiCell = {
  position: "sticky", right: 0, backgroundColor: "#fff", zIndex: 1,
  boxShadow: "-2px 0 6px rgba(0,0,0,0.04)", borderBottom: "1px solid #f5f5f5", py: 2,
};

const StatusPill = ({ active }) => (
  <Box sx={{
    display: "inline-flex", alignItems: "center",
    px: 1.5, py: 0.4, borderRadius: "50px",
    backgroundColor: active ? "#2e7d32" : "#757575",
    color: active ? "#e8f5e9" : "#f5f5f5",
    fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
  }}>
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
  reviewer: { username: "", email: "", password: "", nama_lengkap: "", no_hp: "", alamat: "", institusi: "", bidang_keahlian: "" },
  juri: { username: "", email: "", password: "", nama_lengkap: "", no_hp: "", alamat: "", institusi: "", bidang_keahlian: "" },
};

const TAHUN_OPTIONS = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i);

const initFilters = {
  mahasiswa: { search: "", is_active: "", id_prodi: "", id_jurusan: "" },
  dosen: { search: "", is_active: "", id_prodi: "" },
  reviewer: { search: "", is_active: "" },
  juri: { search: "", is_active: "" },
};

export default function KelolaPenggunaPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState({ mahasiswa: [], dosen: [], reviewer: [], juri: [] });
  const [prodiList, setProdiList] = useState([]);
  const [jurusanList, setJurusanList] = useState([]);
  const [globalAlert, setGlobalAlert] = useState("");
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
      const params = {};
      if (f.search) params.search = f.search;
      if (f.is_active !== "") params.is_active = f.is_active;
      if (f.id_prodi) params.id_prodi = f.id_prodi;
      if (role === "mahasiswa" && f.id_jurusan) params.id_jurusan = f.id_jurusan;

      let res;
      if (role === "mahasiswa") res = await getMahasiswaList(params);
      else if (role === "dosen") res = await getDosenList(params);
      else if (role === "reviewer") res = await getReviewerListKelola(params);
      else res = await getJuriListKelola(params);

      if (res.success) setLists((prev) => ({ ...prev, [role]: res.data || [] }));
      else setGlobalAlert(res.message);
    } catch (err) {
      console.error("Gagal memuat data pengguna:", err);
      setGlobalAlert("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(tabKey, filters);
    setPage(1);
  }, [tabKey, filters, fetchData]);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const rProdi = await getProdi();
        if (rProdi.success) {
          const prodi = rProdi.data || [];
          setProdiList(prodi);

          const seen = new Set();
          const uniqueJurusan = [];
          prodi.forEach((p) => {
            if (p.id_jurusan && !seen.has(p.id_jurusan)) {
              seen.add(p.id_jurusan);
              uniqueJurusan.push({ id_jurusan: p.id_jurusan, nama_jurusan: p.nama_jurusan });
            }
          });
          setJurusanList(uniqueJurusan);
        }
      } catch (err) {
        console.error("Gagal memuat prodi:", err);
      }
    };
    loadMeta();
  }, []);

  const setFilter = useCallback((key, val) => {
    setFilters((prev) => ({ ...prev, [tabKey]: { ...prev[tabKey], [key]: val } }));
    setPage(1);
  }, [tabKey]);

  const currentList = lists[tabKey];
  const totalPages = Math.ceil(currentList.length / rowsPerPage);
  const paginatedList = currentList.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleOpenCreate = () => {
    setForm(emptyForms[tabKey]);
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
    else Object.assign(f, { institusi: user.institusi || "", bidang_keahlian: user.bidang_keahlian || "" });
    setForm(f);
    setErrors({});
    setShowPassword(false);
    setShowNewPassword(false);
    setDialog({ open: true, mode: "edit", role: tabKey, data: user });
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
      confirmButtonColor: "#0D59F2",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Simpan",
      cancelButtonText: "Tidak",
    });

    if (!result.isConfirmed) { setDialog({ ...cur, open: true }); setForm(curForm); return; }

    try {
      setSubmitting(true);
      let res;

      if (cur.mode === "create") {
        if (curTabKey === "mahasiswa") res = await createMahasiswa(curForm);
        else if (curTabKey === "dosen") res = await createDosen(curForm);
        else if (curTabKey === "reviewer") res = await createReviewer(curForm);
        else res = await createJuri(curForm);
      } else {
        if (curTabKey === "mahasiswa") res = await updateMahasiswa(cur.data.id_user, curForm);
        else if (curTabKey === "dosen") res = await updateDosen(cur.data.id_user, curForm);
        else if (curTabKey === "reviewer") res = await updateReviewer(cur.data.id_user, curForm);
        else res = await updateJuri(cur.data.id_user, curForm);

        if (res.success && curForm.new_password) {
          await resetPassword(cur.data.id_user, { password: curForm.new_password });
        }
      }

      if (res.success) {
        await Swal.fire({ icon: "success", title: "Berhasil", text: res.message, timer: 2000, timerProgressBar: true, showConfirmButton: false });
        fetchData(curTabKey, filters);
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: res.message });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Terjadi kesalahan" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user) => {
    const newStatus = !user.is_active;
    const result = await Swal.fire({
      title: newStatus ? "Aktifkan Pengguna?" : "Nonaktifkan Pengguna?",
      html: `<b>${user.nama_lengkap || user.username}</b> akan ${newStatus ? "diaktifkan" : "dinonaktifkan"}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: newStatus ? "#2e7d32" : "#d33",
      cancelButtonColor: "#666",
      confirmButtonText: "Ya",
      cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    try {
      const res = await toggleUserActive(user.id_user, newStatus);
      if (res.success) {
        await Swal.fire({ icon: "success", title: "Berhasil", text: res.message, timer: 2000, timerProgressBar: true, showConfirmButton: false });
        fetchData(tabKey, filters);
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: res.message });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Terjadi kesalahan" });
    }
  };

  const renderFilters = () => (
    <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
      <TextField
        size="small" placeholder="Cari nama, email..."
        value={currentFilter.search}
        onChange={(e) => setFilter("search", e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: "#aaa" }} /></InputAdornment> }}
        sx={{ ...roundedField, minWidth: 220, flex: "1 1 220px" }}
      />
      <TextField
        select size="small" label="Status"
        value={currentFilter.is_active}
        onChange={(e) => setFilter("is_active", e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ ...roundedField, minWidth: 150 }}
      >
        <MenuItem value="">Semua Status</MenuItem>
        <MenuItem value="true">Aktif</MenuItem>
        <MenuItem value="false">Nonaktif</MenuItem>
      </TextField>

      {tabKey === "mahasiswa" && (
        <>
          <TextField
            select size="small" label="Program Studi"
            value={currentFilter.id_prodi}
            onChange={(e) => setFilter("id_prodi", e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ ...roundedField, minWidth: 200 }}
          >
            <MenuItem value="">Semua Prodi</MenuItem>
            {prodiList.map((p) => (
              <MenuItem key={p.id_prodi} value={p.id_prodi}>{p.jenjang} {p.nama_prodi}</MenuItem>
            ))}
          </TextField>
          <TextField
            select size="small" label="Jurusan"
            value={currentFilter.id_jurusan}
            onChange={(e) => setFilter("id_jurusan", e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ ...roundedField, minWidth: 180 }}
          >
            <MenuItem value="">Semua Jurusan</MenuItem>
            {jurusanList.map((j) => (
              <MenuItem key={j.id_jurusan} value={j.id_jurusan}>{j.nama_jurusan}</MenuItem>
            ))}
          </TextField>
        </>
      )}

      {tabKey === "dosen" && (
        <TextField
          select size="small" label="Program Studi"
          value={currentFilter.id_prodi}
          onChange={(e) => setFilter("id_prodi", e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ ...roundedField, minWidth: 200 }}
        >
          <MenuItem value="">Semua Prodi</MenuItem>
          {prodiList.map((p) => (
            <MenuItem key={p.id_prodi} value={p.id_prodi}>{p.jenjang} {p.nama_prodi}</MenuItem>
          ))}
        </TextField>
      )}

      <Box sx={{ flex: 1 }} />
      <Button
        variant="contained"
        startIcon={<Add sx={{ fontSize: 14 }} />}
        onClick={handleOpenCreate}
        sx={{ textTransform: "none", borderRadius: "50px", px: 3, py: 1.2, fontWeight: 600, backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" }, whiteSpace: "nowrap" }}
      >
        Tambah {TABS[activeTab].label}
      </Button>
    </Box>
  );

  const renderColumns = () => {
    if (tabKey === "mahasiswa") return ["Nama Lengkap", "NIM", "Email", "Prodi", "Tahun Masuk", "Status"];
    if (tabKey === "dosen") return ["Nama Lengkap", "NIP", "Email", "Prodi", "Bidang Keahlian", "Status"];
    return ["Nama Lengkap", "Email", "Institusi", "Bidang Keahlian", "Status"];
  };

  const renderRow = (user) => {
    const cells = [];
    cells.push(
      <TableCell key="nama">
        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{user.nama_lengkap || user.username}</Typography>
        <Typography sx={{ fontSize: 12, color: "#aaa" }}>@{user.username}</Typography>
      </TableCell>
    );
    if (tabKey === "mahasiswa") {
      cells.push(<TableCell key="nim"><Typography sx={{ fontSize: 13 }}>{user.nim}</Typography></TableCell>);
      cells.push(<TableCell key="email"><Typography sx={{ fontSize: 13 }}>{user.email}</Typography></TableCell>);
      cells.push(<TableCell key="prodi"><Typography sx={{ fontSize: 13 }}>{user.jenjang} {user.nama_prodi}</Typography></TableCell>);
      cells.push(<TableCell key="tahun"><Typography sx={{ fontSize: 13 }}>{user.tahun_masuk}</Typography></TableCell>);
    } else if (tabKey === "dosen") {
      cells.push(<TableCell key="nip"><Typography sx={{ fontSize: 13 }}>{user.nip}</Typography></TableCell>);
      cells.push(<TableCell key="email"><Typography sx={{ fontSize: 13 }}>{user.email}</Typography></TableCell>);
      cells.push(<TableCell key="prodi"><Typography sx={{ fontSize: 13 }}>{user.jenjang} {user.nama_prodi}</Typography></TableCell>);
      cells.push(<TableCell key="keahlian"><Typography sx={{ fontSize: 13 }}>{user.bidang_keahlian || "-"}</Typography></TableCell>);
    } else {
      cells.push(<TableCell key="email"><Typography sx={{ fontSize: 13 }}>{user.email}</Typography></TableCell>);
      cells.push(<TableCell key="institusi"><Typography sx={{ fontSize: 13 }}>{user.institusi || "-"}</Typography></TableCell>);
      cells.push(<TableCell key="keahlian"><Typography sx={{ fontSize: 13 }}>{user.bidang_keahlian || "-"}</Typography></TableCell>);
    }
    cells.push(<TableCell key="status"><StatusPill active={user.is_active} /></TableCell>);
    return cells;
  };

  const renderFormFields = (currentDialog, currentForm, currentTabKey) => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {currentDialog.mode === "create" && (
        <>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Username <span style={{ color: "#ef5350" }}>*</span></Typography>
            <TextField fullWidth placeholder="Username"
              value={currentForm.username || ""}
              onChange={(e) => { setForm({ ...currentForm, username: e.target.value }); setErrors((prev) => ({ ...prev, username: "" })); }}
              error={!!errors.username} helperText={errors.username} sx={roundedField} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Password <span style={{ color: "#ef5350" }}>*</span></Typography>
            <TextField fullWidth type={showPassword ? "text" : "password"} placeholder="Minimal 8 karakter"
              value={currentForm.password || ""}
              onChange={(e) => { setForm({ ...currentForm, password: e.target.value }); setErrors((prev) => ({ ...prev, password: "" })); }}
              error={!!errors.password} helperText={errors.password}
              InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword((s) => !s)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }}
              sx={roundedField} />
          </Box>
        </>
      )}

      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Nama Lengkap <span style={{ color: "#ef5350" }}>*</span></Typography>
        <TextField fullWidth placeholder="Nama lengkap"
          value={currentForm.nama_lengkap || ""}
          onChange={(e) => { setForm({ ...currentForm, nama_lengkap: e.target.value }); setErrors((prev) => ({ ...prev, nama_lengkap: "" })); }}
          error={!!errors.nama_lengkap} helperText={errors.nama_lengkap} sx={roundedField} />
      </Box>
      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Email <span style={{ color: "#ef5350" }}>*</span></Typography>
        <TextField fullWidth placeholder="email@example.com"
          value={currentForm.email || ""}
          onChange={(e) => { setForm({ ...currentForm, email: e.target.value }); setErrors((prev) => ({ ...prev, email: "" })); }}
          error={!!errors.email} helperText={errors.email} sx={roundedField} />
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>No. HP</Typography>
          <TextField fullWidth placeholder="08xx..."
            value={currentForm.no_hp || ""}
            onChange={(e) => setForm({ ...currentForm, no_hp: e.target.value })}
            sx={roundedField} />
        </Box>
        {currentTabKey === "mahasiswa" && (
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>NIM <span style={{ color: "#ef5350" }}>*</span></Typography>
            <TextField fullWidth placeholder="NIM mahasiswa"
              value={currentForm.nim || ""}
              onChange={(e) => { setForm({ ...currentForm, nim: e.target.value }); setErrors((prev) => ({ ...prev, nim: "" })); }}
              error={!!errors.nim} helperText={errors.nim} sx={roundedField} />
          </Box>
        )}
        {currentTabKey === "dosen" && (
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>NIP <span style={{ color: "#ef5350" }}>*</span></Typography>
            <TextField fullWidth placeholder="NIP dosen"
              value={currentForm.nip || ""}
              onChange={(e) => { setForm({ ...currentForm, nip: e.target.value }); setErrors((prev) => ({ ...prev, nip: "" })); }}
              error={!!errors.nip} helperText={errors.nip} sx={roundedField} />
          </Box>
        )}
      </Box>
      {(currentTabKey === "mahasiswa" || currentTabKey === "dosen") && (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Program Studi <span style={{ color: "#ef5350" }}>*</span></Typography>
            <TextField select fullWidth value={currentForm.id_prodi || ""}
              onChange={(e) => { setForm({ ...currentForm, id_prodi: e.target.value }); setErrors((prev) => ({ ...prev, id_prodi: "" })); }}
              error={!!errors.id_prodi} helperText={errors.id_prodi} sx={roundedField}>
              <MenuItem value="" disabled>Pilih prodi</MenuItem>
              {prodiList.map((p) => <MenuItem key={p.id_prodi} value={p.id_prodi}>{p.jenjang} {p.nama_prodi}</MenuItem>)}
            </TextField>
          </Box>
          {currentTabKey === "mahasiswa" ? (
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Tahun Masuk <span style={{ color: "#ef5350" }}>*</span></Typography>
              <TextField select fullWidth value={currentForm.tahun_masuk || ""}
                onChange={(e) => { setForm({ ...currentForm, tahun_masuk: e.target.value }); setErrors((prev) => ({ ...prev, tahun_masuk: "" })); }}
                error={!!errors.tahun_masuk} helperText={errors.tahun_masuk} sx={roundedField}>
                <MenuItem value="" disabled>Pilih tahun</MenuItem>
                {TAHUN_OPTIONS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </TextField>
            </Box>
          ) : (
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Bidang Keahlian</Typography>
              <TextField fullWidth placeholder="Bidang keahlian"
                value={currentForm.bidang_keahlian || ""}
                onChange={(e) => setForm({ ...currentForm, bidang_keahlian: e.target.value })}
                sx={roundedField} />
            </Box>
          )}
        </Box>
      )}
      {(currentTabKey === "reviewer" || currentTabKey === "juri") && (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Institusi</Typography>
            <TextField fullWidth placeholder="Institusi asal"
              value={currentForm.institusi || ""}
              onChange={(e) => setForm({ ...currentForm, institusi: e.target.value })}
              sx={roundedField} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Bidang Keahlian</Typography>
            <TextField fullWidth placeholder="Bidang keahlian"
              value={currentForm.bidang_keahlian || ""}
              onChange={(e) => setForm({ ...currentForm, bidang_keahlian: e.target.value })}
              sx={roundedField} />
          </Box>
        </Box>
      )}
      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Alamat</Typography>
        <TextField fullWidth multiline rows={2} placeholder="Alamat lengkap (opsional)"
          value={currentForm.alamat || ""}
          onChange={(e) => setForm({ ...currentForm, alamat: e.target.value })}
          sx={roundedField} />
      </Box>

      {currentDialog.mode === "edit" && (
        <>
          <Divider sx={{ my: 0.5 }} />
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.25 }}>Reset Password</Typography>
            <Typography sx={{ fontSize: 12, color: "#999", mb: 0.75 }}>Kosongkan jika tidak ingin mengubah password</Typography>
            <TextField fullWidth type={showNewPassword ? "text" : "password"} placeholder="Password baru (opsional, min. 8 karakter)"
              value={currentForm.new_password || ""}
              onChange={(e) => { setForm({ ...currentForm, new_password: e.target.value }); setErrors((prev) => ({ ...prev, new_password: "" })); }}
              error={!!errors.new_password} helperText={errors.new_password}
              InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowNewPassword((s) => !s)} edge="end">{showNewPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }}
              sx={roundedField} />
          </Box>
        </>
      )}
    </Box>
  );

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <Box>
        <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Kelola Pengguna</Typography>
        <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>Manajemen akun mahasiswa, dosen, reviewer, dan juri</Typography>

        {globalAlert && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setGlobalAlert("")}>
            {globalAlert}
          </Alert>
        )}

        <Paper sx={{ borderRadius: "16px", border: "1px solid #f0f0f0", overflow: "hidden" }}>
          <Box sx={{ borderBottom: "1px solid #f0f0f0" }}>
            <Tabs
              value={activeTab}
              onChange={(e, v) => { setActiveTab(v); setPage(1); }}
              sx={{
                px: 2,
                "& .MuiTab-root": {
                  textTransform: "none", fontSize: 14, fontWeight: 500,
                  color: "#888", minHeight: 52,
                  "&.Mui-selected": { fontWeight: 700, color: "#0D59F2" },
                },
                "& .MuiTabs-indicator": { backgroundColor: "#0D59F2", height: 3, borderRadius: "3px 3px 0 0" },
              }}
            >
              {TABS.map((t, i) => (
                <Tab key={i} label={t.label} />
              ))}
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            {renderFilters()}

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
            ) : paginatedList.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 10 }}>
                <Box sx={{ width: 100, height: 100, borderRadius: "50%", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
                  <PersonAdd sx={{ fontSize: 48, color: "#ccc" }} />
                </Box>
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#444", mb: 1 }}>Belum ada {TABS[activeTab].label}</Typography>
                <Typography sx={{ fontSize: 14, color: "#999" }}>Klik "Tambah {TABS[activeTab].label}" untuk menambahkan data</Typography>
              </Box>
            ) : (
              <>
                <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "auto", mb: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {renderColumns().map((h, i) => (
                          <TableCell key={i} sx={tableHeadCell}>{h}</TableCell>
                        ))}
                        <TableCell sx={stickyAksiHead}>Aksi</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedList.map((user) => (
                        <TableRow key={user.id_user} sx={tableBodyRow}>
                          {renderRow(user)}
                          <TableCell sx={stickyAksiCell}>
                            <Box sx={{ display: "flex", gap: 1, justifyContent: "center", flexWrap: "nowrap" }}>
                              <Tooltip title="Edit">
                                <Button size="small" variant="outlined" startIcon={<Edit fontSize="small" />} onClick={() => handleOpenEdit(user)}
                                  sx={{ textTransform: "none", color: "#0D59F2", borderColor: "#e3f2fd", borderRadius: "8px", "&:hover": { backgroundColor: "#f0f4ff", borderColor: "#0D59F2" } }}>
                                  Edit
                                </Button>
                              </Tooltip>
                              <Tooltip title={user.is_active ? "Nonaktifkan" : "Aktifkan"}>
                                <Button size="small" variant="outlined"
                                  startIcon={user.is_active ? <ToggleOff fontSize="small" /> : <ToggleOn fontSize="small" />}
                                  onClick={() => handleToggleActive(user)}
                                  sx={{ textTransform: "none", borderRadius: "8px", color: user.is_active ? "#c62828" : "#2e7d32", borderColor: user.is_active ? "#fce4ec" : "#e8f5e9", "&:hover": { backgroundColor: user.is_active ? "rgba(198,40,40,0.05)" : "rgba(46,125,50,0.05)" } }}>
                                  {user.is_active ? "Nonaktifkan" : "Aktifkan"}
                                </Button>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontSize: 13, color: "#777" }}>
                    Menampilkan {((page - 1) * rowsPerPage) + 1}–{Math.min(page * rowsPerPage, currentList.length)} dari {currentList.length} data
                  </Typography>
                  <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} color="primary" shape="rounded" showFirstButton showLastButton />
                </Box>
              </>
            )}
          </Box>
        </Paper>

        <Dialog open={dialog.open} onClose={handleCloseDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
          <DialogTitle sx={{ pb: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
              {dialog.mode === "create" ? `Tambah ${TABS[activeTab].label}` : `Edit ${TABS[activeTab].label}`}
            </Typography>
            <IconButton onClick={handleCloseDialog} sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ px: 3, py: 3 }}>
            {renderFormFields(dialog, form, tabKey)}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button onClick={handleCloseDialog} disabled={submitting}
              sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600, color: "#666", border: "1.5px solid #e0e0e0", "&:hover": { backgroundColor: "#f5f5f5" } }}>
              Batal
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={submitting}
              sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600, backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" } }}>
              {submitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </BodyLayout>
  );
}