import { useState, useEffect } from "react";
import {
  Box, Paper, Typography, TextField, Button, Avatar,
  InputAdornment, IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff, PhotoCamera, Person, Lock } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import ReviewerNavbar from "../../components/layouts/ReviewerNavbar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import { getProfile, updateProfile, updatePassword } from "../../api/reviewer";
import { validateFormSecurity, hasSuspiciousInput, hasSqlInjection } from "../../utils/inputSecurity";
import { getUploadUrl } from "../../utils/fileUrl";

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

const FieldLabel = ({ children }) => (
  <Typography sx={{ fontWeight: 600, mb: 0.8, fontSize: 13, color: "#374151" }}>
    {children}
  </Typography>
);

const ReadonlyField = ({ value }) => (
  <TextField
    fullWidth
    value={value || ""}
    disabled
    sx={roundedField}
  />
);

export default function BiodataReviewerPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const [formBiodata, setFormBiodata] = useState({
    nama_lengkap: "",
    email: "",
    username: "",
    no_hp: "",
    institusi: "",
    bidang_keahlian: "",
    alamat: "",
    foto: null,
  });

  const [formPassword, setFormPassword] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await getProfile();
      setFormBiodata({
        nama_lengkap: response.data.nama_lengkap || "",
        email: response.data.email || "",
        username: response.data.username || "",
        no_hp: response.data.no_hp || "",
        institusi: response.data.institusi || "",
        bidang_keahlian: response.data.bidang_keahlian || "",
        alamat: response.data.alamat || "",
        foto: null,
      });
      if (response.data.foto) {
        setImagePreview(getUploadUrl("profil", response.data.foto));
      }
    } catch {
      await Swal.fire({ icon: "error", title: "Gagal Memuat", text: "Gagal memuat profil. Silahkan refresh halaman.", confirmButtonText: "OK" });
    } finally {
      setLoading(false);
    }
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
    const allowedFormats = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedFormats.includes(file.type)) {
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
    const newErrors = {};
    if (!formBiodata.nama_lengkap) newErrors.nama_lengkap = "Nama lengkap wajib diisi";
    if (!formBiodata.no_hp) newErrors.no_hp = "Nomor WhatsApp wajib diisi";
    else if (!/^08[0-9]{8,11}$/.test(formBiodata.no_hp)) newErrors.no_hp = "Format nomor tidak valid (08xxxxxxxxxx)";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!formPassword.current_password) newErrors.current_password = "Password lama wajib diisi";
    if (!formPassword.new_password) newErrors.new_password = "Password baru wajib diisi";
    else if (formPassword.new_password.length < 8) newErrors.new_password = "Password minimal 8 karakter";
    if (!formPassword.confirm_password) newErrors.confirm_password = "Konfirmasi password wajib diisi";
    else if (formPassword.new_password !== formPassword.confirm_password) newErrors.confirm_password = "Password tidak cocok";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitBiodata = async () => {
    if (!validateBiodata()) return;

    const securityCheck = validateFormSecurity({
      nama_lengkap: formBiodata.nama_lengkap,
      no_hp: formBiodata.no_hp,
      alamat: formBiodata.alamat,
      institusi: formBiodata.institusi,
      bidang_keahlian: formBiodata.bidang_keahlian,
    });
    if (!securityCheck.isValid) {
      setErrors((prev) => ({ ...prev, [securityCheck.field]: securityCheck.message }));
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("nama_lengkap", formBiodata.nama_lengkap);
      formData.append("no_hp", formBiodata.no_hp);
      formData.append("alamat", formBiodata.alamat);
      formData.append("institusi", formBiodata.institusi);
      formData.append("bidang_keahlian", formBiodata.bidang_keahlian);
      if (formBiodata.foto) formData.append("foto", formBiodata.foto);
      const response = await updateProfile(formData);
      await Swal.fire({ icon: "success", title: "Berhasil", text: response.message || "Biodata berhasil diperbarui", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchProfile();
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal memperbarui biodata", confirmButtonText: "OK" });
    } finally {
      setSubmitting(false);
    }
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
    } finally {
      setSubmittingPassword(false);
    }
  };

  if (loading) {
    return (
      <BodyLayout Sidebar={ReviewerNavbar}>
        <Box sx={{ position: "relative", minHeight: "60vh" }}>
          <LoadingScreen message="Memuat biodata reviewer..." overlay minHeight="60vh" />
        </Box>
      </BodyLayout>
    );
  }

  return (
    <BodyLayout Sidebar={ReviewerNavbar}>
      <PageTransition>
        <Box>

          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              Biodata Anda
            </Typography>
            <Typography sx={{ fontSize: 16, color: "#6B7280" }}>
              Lengkapi form biodata di bawah ini
            </Typography>
          </Box>

          <Paper elevation={0} sx={{ mb: 3, borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <SectionHeader
                icon={Person}
                title="Informasi Pribadi"
                subtitle="Data diri dan kontak reviewer"
                gradient={`linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`}
              />

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
                  <input type="file" hidden id="foto-upload" accept="image/jpeg,image/jpg,image/png" onChange={handleFileChange} />
                  <Button
                    component="label" htmlFor="foto-upload" variant="contained" size="small"
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
                  <FieldLabel>Nama Lengkap</FieldLabel>
                  <TextField
                    fullWidth placeholder="Masukkan nama lengkap Anda"
                    value={formBiodata.nama_lengkap}
                    onChange={(e) => handleChangeBiodata("nama_lengkap", e.target.value)}
                    error={!!errors.nama_lengkap} helperText={errors.nama_lengkap}
                    disabled={submitting} sx={roundedField}
                  />
                </Box>
                <Box>
                  <FieldLabel>Username</FieldLabel>
                  <ReadonlyField value={formBiodata.username} />
                </Box>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: 3 }}>
                <Box>
                  <FieldLabel>Email</FieldLabel>
                  <ReadonlyField value={formBiodata.email} />
                </Box>
                <Box>
                  <FieldLabel>Nomor WhatsApp</FieldLabel>
                  <TextField
                    fullWidth placeholder="Masukkan nomor WhatsApp Anda"
                    value={formBiodata.no_hp}
                    onChange={(e) => handleChangeBiodata("no_hp", e.target.value)}
                    error={!!errors.no_hp} helperText={errors.no_hp}
                    disabled={submitting} sx={roundedField}
                  />
                </Box>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: 3 }}>
                <Box>
                  <FieldLabel>Institusi</FieldLabel>
                  <TextField
                    fullWidth placeholder="Masukkan nama institusi Anda"
                    value={formBiodata.institusi}
                    onChange={(e) => handleChangeBiodata("institusi", e.target.value)}
                    disabled={submitting} sx={roundedField}
                  />
                </Box>
                <Box>
                  <FieldLabel>Bidang Keahlian</FieldLabel>
                  <TextField
                    fullWidth multiline rows={2}
                    placeholder="Masukkan bidang keahlian Anda..."
                    value={formBiodata.bidang_keahlian}
                    onChange={(e) => handleChangeBiodata("bidang_keahlian", e.target.value)}
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
                  disabled={submitting} sx={roundedField}
                />
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  onClick={handleSubmitBiodata}
                  disabled={submitting}
                  sx={{
                    px: 4, py: 1.3, textTransform: "none", fontWeight: 700,
                    borderRadius: "12px", fontSize: 14,
                    background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
                    color: "#fff",
                    boxShadow: "0 4px 15px rgba(13,89,242,0.3)",
                    "&:hover": { boxShadow: "0 6px 20px rgba(13,89,242,0.4)" },
                    "&:disabled": { opacity: 0.7, color: "#fff" },
                  }}
                >
                  {submitting ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </Box>
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ mb: 3, borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.secondary}, ${COLORS.success})` }} />
            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <SectionHeader
                icon={Lock}
                title="Ganti Password"
                subtitle="Perbarui password akun Anda secara berkala"
                gradient={`linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.success} 100%)`}
              />

              <Box sx={{ mb: 3 }}>
                <FieldLabel>Password Lama</FieldLabel>
                <TextField
                  fullWidth type={showPassword.current ? "text" : "password"}
                  placeholder="Masukkan password lama Anda"
                  value={formPassword.current_password}
                  onChange={(e) => handleChangePassword("current_password", e.target.value)}
                  error={!!errors.current_password} helperText={errors.current_password}
                  disabled={submittingPassword} sx={roundedField}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword((prev) => ({ ...prev, current: !prev.current }))} edge="end">
                          {showPassword.current ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: 4 }}>
                <Box>
                  <FieldLabel>Password Baru</FieldLabel>
                  <TextField
                    fullWidth type={showPassword.new ? "text" : "password"}
                    placeholder="Masukkan password baru Anda"
                    value={formPassword.new_password}
                    onChange={(e) => handleChangePassword("new_password", e.target.value)}
                    error={!!errors.new_password} helperText={errors.new_password}
                    disabled={submittingPassword} sx={roundedField}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword((prev) => ({ ...prev, new: !prev.new }))} edge="end">
                            {showPassword.new ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <Box>
                  <FieldLabel>Konfirmasi Password Baru</FieldLabel>
                  <TextField
                    fullWidth type={showPassword.confirm ? "text" : "password"}
                    placeholder="Konfirmasi password baru Anda"
                    value={formPassword.confirm_password}
                    onChange={(e) => handleChangePassword("confirm_password", e.target.value)}
                    error={!!errors.confirm_password} helperText={errors.confirm_password}
                    disabled={submittingPassword} sx={roundedField}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))} edge="end">
                            {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  onClick={handleSubmitPassword}
                  disabled={submittingPassword}
                  sx={{
                    px: 4, py: 1.3, textTransform: "none", fontWeight: 700,
                    borderRadius: "12px", fontSize: 14,
                    background: `linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.accent} 100%)`,
                    color: "#fff",
                    boxShadow: "0 4px 15px rgba(37,99,235,0.3)",
                    "&:hover": { boxShadow: "0 6px 20px rgba(37,99,235,0.4)" },
                    "&:disabled": { opacity: 0.7, color: "#fff" },
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