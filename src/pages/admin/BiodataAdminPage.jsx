import { useState, useEffect } from "react";
import {
  Box, Paper, Typography, TextField, Button, Avatar,
  InputAdornment, IconButton, CircularProgress, Alert,
} from "@mui/material";
import { Visibility, VisibilityOff, PhotoCamera, Person, Key } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import { getProfile, updateProfile, updatePassword } from "../../api/admin";
import { useAuthStore } from "../../store/authStore";
import { validateFormSecurity, hasSuspiciousInput, hasSqlInjection } from "../../utils/inputSecurity";

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
  errorLight:    "#ff7070",
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

const ReadonlyField = ({ value }) => (
  <Box sx={{
    px: 2, py: 1.5, borderRadius: "12px",
    background: COLORS.slateLight,
    border: "1.5px dashed #CBD5E1",
    fontSize: 14, color: COLORS.slate, fontWeight: 500,
    minHeight: "44px", display: "flex", alignItems: "center",
  }}>
    {value || "—"}
  </Box>
);

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

export default function BiodataAdminPage() {
  const { updateUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const [formBiodata, setFormBiodata] = useState({
    nama_lengkap: "", email: "", username: "", no_hp: "",
    alamat: "", foto: null,
  });

  const [formPassword, setFormPassword] = useState({
    current_password: "", new_password: "", confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await getProfile();
      setFormBiodata({
        nama_lengkap: response.data.nama_lengkap || "",
        username: response.data.username || "",
        email: response.data.email || "",
        no_hp: response.data.no_hp || "",
        alamat: response.data.alamat || "",
        foto: null,
      });
      if (response.data.foto) setImagePreview(`/uploads/profil/${response.data.foto}`);
    } catch {
      await Swal.fire({ icon: "error", title: "Gagal Memuat", text: "Gagal memuat profil admin. Silakan refresh halaman.", confirmButtonText: "OK" });
    } finally { setLoading(false); }
  };

  const handleChangeBiodata = (field, value) => {
    setFormBiodata((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleChangePassword = (field, value) => {
    setFormPassword((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (hasSuspiciousInput(file.name) || hasSqlInjection(file.name)) {
      setErrors((prev) => ({ ...prev, foto: "Nama file mengandung karakter terlarang" }));
      return;
    }
    if (!["image/jpeg","image/jpg","image/png"].includes(file.type)) {
      setErrors((prev) => ({ ...prev, foto: "Format file harus JPG, JPEG, atau PNG" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, foto: "Ukuran file maksimal 5MB" }));
      return;
    }
    handleChangeBiodata("foto", file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const validateBiodata = () => {
    const e = {};
    if (!formBiodata.nama_lengkap.trim()) e.nama_lengkap = "Nama lengkap wajib diisi";
    if (!formBiodata.username.trim()) e.username = "Username wajib diisi";
    else if (formBiodata.username.trim().length < 3 || formBiodata.username.trim().length > 50) {
      e.username = "Username harus 3-50 karakter";
    }
    if (!formBiodata.no_hp.trim()) e.no_hp = "Nomor WhatsApp wajib diisi";
    else if (!/^08[0-9]{8,11}$/.test(formBiodata.no_hp.trim())) e.no_hp = "Format nomor tidak valid (08xxxxxxxxxx)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePassword = () => {
    const e = {};
    if (!formPassword.current_password) e.current_password = "Password lama wajib diisi";
    if (!formPassword.new_password) e.new_password = "Password baru wajib diisi";
    else if (formPassword.new_password.length < 8) e.new_password = "Password minimal 8 karakter";
    if (!formPassword.confirm_password) e.confirm_password = "Konfirmasi password wajib diisi";
    else if (formPassword.new_password !== formPassword.confirm_password) e.confirm_password = "Password tidak cocok";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmitBiodata = async () => {
    if (!validateBiodata()) return;

    const securityCheck = validateFormSecurity({
      nama_lengkap: formBiodata.nama_lengkap,
      username: formBiodata.username,
      no_hp: formBiodata.no_hp,
      alamat: formBiodata.alamat,
    });
    if (!securityCheck.isValid) {
      setErrors((prev) => ({ ...prev, [securityCheck.field]: securityCheck.message }));
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("nama_lengkap", formBiodata.nama_lengkap.trim());
      formData.append("username", formBiodata.username.trim());
      formData.append("no_hp", formBiodata.no_hp.trim());
      formData.append("alamat", formBiodata.alamat);
      if (formBiodata.foto) formData.append("foto", formBiodata.foto);

      const response = await updateProfile(formData);
      const res = await getProfile();
      if (res.success) updateUser({ nama_lengkap: res.data.nama_lengkap, foto: res.data.foto });
      await Swal.fire({ icon: "success", title: "Berhasil", text: response.message || "Biodata berhasil diperbarui", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchProfile();
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal memperbarui biodata", confirmButtonText: "OK" });
    } finally { setSubmitting(false); }
  };

  const handleSubmitPassword = async () => {
    if (!validatePassword()) return;

    const securityCheck = validateFormSecurity({
      current_password: formPassword.current_password,
      new_password: formPassword.new_password,
      confirm_password: formPassword.confirm_password,
    });
    if (!securityCheck.isValid) {
      setErrors((prev) => ({ ...prev, [securityCheck.field]: securityCheck.message }));
      return;
    }

    setSubmittingPassword(true);
    try {
      const response = await updatePassword({
        current_password: formPassword.current_password,
        new_password: formPassword.new_password,
        confirm_password: formPassword.confirm_password,
      });
      await Swal.fire({ icon: "success", title: "Berhasil", text: response.message || "Password berhasil diubah", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      setFormPassword({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal mengubah password", confirmButtonText: "OK" });
    } finally { setSubmittingPassword(false); }
  };

  if (loading) {
    return (
      <BodyLayout Sidebar={AdminSidebar}>
        <Box sx={{ position: "relative", minHeight: "60vh" }}>
          <LoadingScreen message="Memuat biodata admin..." overlay minHeight="60vh" />
        </Box>
      </BodyLayout>
    );
  }

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              Biodata Anda
            </Typography>
            <Typography sx={{ fontSize: 16, color: "#6B7280" }}>
              Lengkapi informasi profil dan keamanan akun Anda
            </Typography>
          </Box>

          <Paper elevation={0} sx={{
            mb: 3, borderRadius: "20px",
            border: "1.5px solid #E5E7EB",
            overflow: "hidden",
          }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />

            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <Box sx={{
                mb: 4, p: 3, borderRadius: "16px",
                background: `linear-gradient(135deg, ${COLORS.primaryLight} 0%, ${COLORS.primary}08 100%)`,
                border: `1.5px solid ${COLORS.primaryMuted}`,
                display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap",
              }}>
                <Box sx={{ position: "relative" }}>
                  <Avatar
                    src={imagePreview || ""}
                    sx={{ width: 100, height: 100, border: `3px solid ${COLORS.primary}`, boxShadow: `0 0 0 4px ${COLORS.primaryLight}` }}
                  >
                    {!imagePreview && <PhotoCamera sx={{ fontSize: 36, color: COLORS.primary }} />}
                  </Avatar>
                  <Box sx={{
                    position: "absolute", bottom: 4, right: 4,
                    width: 18, height: 18, borderRadius: "50%",
                    background: COLORS.success, border: "2.5px solid #fff",
                  }} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 14, color: COLORS.primaryDark, mb: 0.5 }}>Foto Profil</Typography>
                  <Typography sx={{ fontSize: 12, color: COLORS.slate, mb: 1.5 }}>PNG atau JPG, maksimal 5MB</Typography>
                  <input type="file" hidden id="foto-upload-admin" accept="image/jpeg,image/jpg,image/png" onChange={handleFileChange} />
                  <Button
                    component="label" htmlFor="foto-upload-admin" variant="contained" size="small"
                    disabled={submitting}
                    sx={{
                      textTransform: "none", borderRadius: "10px", fontWeight: 600, fontSize: 12,
                      background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
                      boxShadow: "none",
                      "&:hover": { background: `linear-gradient(135deg, ${COLORS.primaryDark}, ${COLORS.secondary})`, boxShadow: "none" },
                    }}
                  >
                    Ganti Foto
                  </Button>
                  {errors.foto && <Typography sx={{ fontSize: 12, color: COLORS.error, mt: 0.5 }}>{errors.foto}</Typography>}
                </Box>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: 3 }}>
                <Box>
                  <FieldLabel required>Nama Lengkap</FieldLabel>
                  <TextField
                    fullWidth placeholder="Masukkan nama lengkap Anda"
                    value={formBiodata.nama_lengkap}
                    onChange={(e) => handleChangeBiodata("nama_lengkap", e.target.value)}
                    error={!!errors.nama_lengkap} helperText={errors.nama_lengkap}
                    disabled={submitting} sx={roundedField}
                  />
                </Box>
                <Box>
                  <FieldLabel>Email</FieldLabel>
                  <ReadonlyField value={formBiodata.email} />
                </Box>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: 3 }}>
                <Box>
                  <FieldLabel required>Username</FieldLabel>
                  <TextField
                    fullWidth placeholder="Masukkan username Anda"
                    value={formBiodata.username}
                    onChange={(e) => handleChangeBiodata("username", e.target.value)}
                    error={!!errors.username} helperText={errors.username}
                    disabled={submitting} sx={roundedField}
                  />
                </Box>
                <Box>
                  <FieldLabel required>Nomor WhatsApp</FieldLabel>
                  <TextField
                    fullWidth placeholder="08xxxxxxxxxx"
                    value={formBiodata.no_hp}
                    onChange={(e) => handleChangeBiodata("no_hp", e.target.value)}
                    error={!!errors.no_hp} helperText={errors.no_hp}
                    disabled={submitting} sx={roundedField}
                  />
                </Box>
              </Box>

              <Box sx={{ mb: 4 }}>
                <FieldLabel>Alamat</FieldLabel>
                <TextField
                  fullWidth multiline rows={3}
                  placeholder="Masukkan alamat Anda..."
                  value={formBiodata.alamat}
                  onChange={(e) => handleChangeBiodata("alamat", e.target.value)}
                  disabled={submitting}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", backgroundColor: "#fff" } }}
                />
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained" onClick={handleSubmitBiodata} disabled={submitting}
                  sx={{
                    px: 4, py: 1.3, textTransform: "none", fontWeight: 700, borderRadius: "10px", fontSize: 14,
                    backgroundColor: COLORS.primary,
                    "&:hover": { backgroundColor: COLORS.primaryDark },
                    "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" },
                  }}
                >
                  {submitting ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </Box>
            </Box>
          </Paper>

          <Paper elevation={0} sx={{
            borderRadius: "20px",
            border: "1.5px solid #E5E7EB",
            overflow: "hidden",
          }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.secondary}, ${COLORS.success})` }} />

            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <Box sx={{
                mb: 3, p: 2, borderRadius: "12px",
                background: COLORS.warningLight,
                border: `1.5px solid #FDE68A`,
                display: "flex", gap: 1.5, alignItems: "flex-start",
              }}>
                <Box sx={{ width: 8, height: 8, mt: 0.6, borderRadius: "50%", background: COLORS.warning, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 12.5, color: "#92400E", lineHeight: 1.6 }}>
                  Password baru minimal <b>8 karakter</b>. Gunakan kombinasi huruf, angka, dan simbol untuk keamanan lebih baik.
                </Typography>
              </Box>

              {[
                { field: "current_password", label: "Password Lama", key: "current", placeholder: "Masukkan password lama" },
                { field: "new_password", label: "Password Baru", key: "new", placeholder: "Minimal 8 karakter" },
                { field: "confirm_password", label: "Konfirmasi Password Baru", key: "confirm", placeholder: "Ulangi password baru" },
              ].map(({ field, label, key, placeholder }) => (
                <Box key={field} sx={{ mb: 2.5 }}>
                  <FieldLabel required>{label}</FieldLabel>
                  <TextField
                    fullWidth type={showPassword[key] ? "text" : "password"}
                    placeholder={placeholder}
                    value={formPassword[field]}
                    onChange={(e) => handleChangePassword(field, e.target.value)}
                    error={!!errors[field]} helperText={errors[field]}
                    disabled={submittingPassword}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px", backgroundColor: "#fff",
                        "&:hover fieldset": { borderColor: COLORS.secondary },
                        "&.Mui-focused fieldset": { borderColor: COLORS.secondary },
                        "&.Mui-focused": { boxShadow: `0 0 0 3px ${COLORS.primaryLight}` },
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }))} edge="end" size="small">
                            {showPassword[key]
                              ? <VisibilityOff sx={{ fontSize: 18, color: COLORS.slate }} />
                              : <Visibility sx={{ fontSize: 18, color: COLORS.slate }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              ))}

              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                <Button
                  variant="contained" onClick={handleSubmitPassword} disabled={submittingPassword}
                  sx={{
                    px: 4, py: 1.3, textTransform: "none", fontWeight: 700, borderRadius: "10px", fontSize: 14,
                    backgroundColor: COLORS.secondary,
                    "&:hover": { backgroundColor: COLORS.primary },
                    "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" },
                  }}
                >
                  {submittingPassword ? "Mengubah..." : "Ubah Password"}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}
