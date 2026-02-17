import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Autocomplete,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
} from "@mui/material";
import { Visibility, VisibilityOff, PhotoCamera } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import DosenSidebar from "../../components/layouts/DosenSidebar";
import { getProfile, updateProfile, updatePassword } from "../../api/dosen";
import { getAllJurusan } from "../../api/jurusan";
import { getAllProdi } from "../../api/public";

export default function BiodataDosenPage() {
  const [loading, setLoading] = useState(true);
  const [loadingJurusan, setLoadingJurusan] = useState(true);
  const [loadingProdi, setLoadingProdi] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const [jurusanOptions, setJurusanOptions] = useState([]);
  const [prodiOptions, setProdiOptions] = useState([]);

  const [formBiodata, setFormBiodata] = useState({
    nama_lengkap: "",
    email: "",
    nip: "",
    no_hp: "",
    id_jurusan: null,
    id_prodi: null,
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
  const [alert, setAlert] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchJurusan();
    fetchProdi();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await getProfile();

      const jurusanData = { label: response.data.nama_jurusan, id: response.data.id_jurusan };
      const prodiData = {
        label: `${response.data.jenjang} ${response.data.nama_prodi}`,
        id: response.data.id_prodi,
      };

      setFormBiodata({
        nama_lengkap: response.data.nama_lengkap || "",
        email: response.data.email || "",
        nip: response.data.nip || "",
        no_hp: response.data.no_hp || "",
        id_jurusan: jurusanData,
        id_prodi: prodiData,
        bidang_keahlian: response.data.bidang_keahlian || "",
        alamat: response.data.alamat || "",
        foto: null,
      });

      if (response.data.foto) {
        const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
        setImagePreview(`${baseUrl}/uploads/profil/${response.data.foto}`);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setAlert("Gagal memuat profil. Silakan refresh halaman.");
    } finally {
      setLoading(false);
    }
  };

  const fetchJurusan = async () => {
    try {
      setLoadingJurusan(true);
      const response = await getAllJurusan();
      if (response.success) {
        const formatted = response.data.map((item) => ({
          label: item.nama_jurusan,
          id: item.id_jurusan,
        }));
        setJurusanOptions(formatted);
      }
    } catch (err) {
      console.error("Error fetching jurusan:", err);
    } finally {
      setLoadingJurusan(false);
    }
  };

  const fetchProdi = async () => {
    try {
      setLoadingProdi(true);
      const response = await getAllProdi();
      if (response.success) {
        const formatted = response.data.map((item) => ({
          label: `${item.jenjang} ${item.nama_prodi} - ${item.nama_jurusan} (${item.nama_kampus})`,
          id: item.id_prodi,
        }));
        setProdiOptions(formatted);
      }
    } catch (err) {
      console.error("Error fetching prodi:", err);
    } finally {
      setLoadingProdi(false);
    }
  };

  const handleChangeBiodata = (field, value) => {
    setFormBiodata((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setAlert("");
  };

  const handleChangePassword = (field, value) => {
    setFormPassword((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setAlert("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    const allowedFormats = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedFormats.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        foto: "Format file harus JPG, JPEG, atau PNG",
      }));
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        foto: "Ukuran file maksimal 10MB",
      }));
      return;
    }

    handleChangeBiodata("foto", file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const validateBiodata = () => {
    const newErrors = {};

    if (!formBiodata.nama_lengkap) {
      newErrors.nama_lengkap = "Nama lengkap wajib diisi";
    }

    if (!formBiodata.no_hp) {
      newErrors.no_hp = "Nomor WhatsApp wajib diisi";
    } else if (!/^08[0-9]{8,11}$/.test(formBiodata.no_hp)) {
      newErrors.no_hp = "Format nomor tidak valid (08xxxxxxxxxx)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};

    if (!formPassword.current_password) {
      newErrors.current_password = "Password lama wajib diisi";
    }

    if (!formPassword.new_password) {
      newErrors.new_password = "Password baru wajib diisi";
    } else if (formPassword.new_password.length < 8) {
      newErrors.new_password = "Password minimal 8 karakter";
    }

    if (!formPassword.confirm_password) {
      newErrors.confirm_password = "Konfirmasi password wajib diisi";
    } else if (formPassword.new_password !== formPassword.confirm_password) {
      newErrors.confirm_password = "Password tidak cocok";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitBiodata = async () => {
    if (!validateBiodata()) {
      setAlert("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    setSubmitting(true);
    setAlert("");

    try {
      const formData = new FormData();
      formData.append("nama_lengkap", formBiodata.nama_lengkap);
      formData.append("no_hp", formBiodata.no_hp);
      formData.append("alamat", formBiodata.alamat);
      formData.append("bidang_keahlian", formBiodata.bidang_keahlian);

      if (formBiodata.foto) {
        formData.append("foto", formBiodata.foto);
      }

      const response = await updateProfile(formData);

      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: response.message || "Biodata berhasil diperbarui",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      fetchProfile();
    } catch (err) {
      console.error("Error updating biodata:", err);
      const errorMessage = err.response?.data?.message || "Gagal memperbarui biodata";
      setAlert(errorMessage);

      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: errorMessage,
        confirmButtonText: "OK",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPassword = async () => {
    if (!validatePassword()) {
      setAlert("Mohon lengkapi form password dengan benar");
      return;
    }

    setSubmittingPassword(true);
    setAlert("");

    try {
      const response = await updatePassword({
        current_password: formPassword.current_password,
        new_password: formPassword.new_password,
        confirm_password: formPassword.confirm_password,
      });

      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: response.message || "Password berhasil diubah",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      setFormPassword({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      console.error("Error updating password:", err);
      const errorMessage = err.response?.data?.message || "Gagal mengubah password";
      setAlert(errorMessage);

      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: errorMessage,
        confirmButtonText: "OK",
      });
    } finally {
      setSubmittingPassword(false);
    }
  };

  if (loading) {
    return (
      <BodyLayout Sidebar={DosenSidebar}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress />
        </Box>
      </BodyLayout>
    );
  }

  return (
    <BodyLayout Sidebar={DosenSidebar}>
      <Box>
        <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
          Biodata Anda
        </Typography>
        <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>
          Lengkapi form biodata di bawah ini
        </Typography>

        {alert && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {alert}
          </Alert>
        )}

        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>
            Informasi Pribadi
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                Nama Lengkap
              </Typography>
              <TextField
                fullWidth
                placeholder="Masukkan nama lengkap Anda"
                value={formBiodata.nama_lengkap}
                onChange={(e) => handleChangeBiodata("nama_lengkap", e.target.value)}
                error={!!errors.nama_lengkap}
                helperText={errors.nama_lengkap}
                disabled={submitting}
              />
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                Email
              </Typography>
              <TextField
                fullWidth
                placeholder="Masukkan email Anda"
                value={formBiodata.email}
                disabled
              />
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                NIP
              </Typography>
              <TextField
                fullWidth
                placeholder="Masukkan NIP Anda"
                value={formBiodata.nip}
                disabled
              />
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                Nomor WhatsApp
              </Typography>
              <TextField
                fullWidth
                placeholder="Masukkan nomor WhatsApp Anda"
                value={formBiodata.no_hp}
                onChange={(e) => handleChangeBiodata("no_hp", e.target.value)}
                error={!!errors.no_hp}
                helperText={errors.no_hp}
                disabled={submitting}
              />
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                Jurusan
              </Typography>
              {loadingJurusan ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <Autocomplete
                  options={jurusanOptions}
                  value={formBiodata.id_jurusan}
                  onChange={(e, value) => handleChangeBiodata("id_jurusan", value)}
                  getOptionLabel={(option) => option.label || ""}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  disabled
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Pilih jurusan"
                      error={!!errors.id_jurusan}
                      helperText={errors.id_jurusan}
                    />
                  )}
                />
              )}
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                Program Studi
              </Typography>
              {loadingProdi ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <Autocomplete
                  options={prodiOptions}
                  value={formBiodata.id_prodi}
                  onChange={(e, value) => handleChangeBiodata("id_prodi", value)}
                  getOptionLabel={(option) => option.label || ""}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  disabled
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Pilih program studi"
                      error={!!errors.id_prodi}
                      helperText={errors.id_prodi}
                    />
                  )}
                />
              )}
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
              Bidang Keahlian
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Masukkan bidang keahlian Anda..."
              value={formBiodata.bidang_keahlian}
              onChange={(e) => handleChangeBiodata("bidang_keahlian", e.target.value)}
              disabled={submitting}
            />
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
              Alamat
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Masukkan alamat Anda..."
              value={formBiodata.alamat}
              onChange={(e) => handleChangeBiodata("alamat", e.target.value)}
              disabled={submitting}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 2, fontSize: 14 }}>
              Upload Foto Profil
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Box sx={{ position: "relative" }}>
                <Avatar
                  src={imagePreview || ""}
                  sx={{
                    width: 120,
                    height: 120,
                    backgroundColor: "#f5f5f5",
                    border: "2px solid #e0e0e0",
                  }}
                >
                  {!imagePreview && <PhotoCamera sx={{ fontSize: 40, color: "#999" }} />}
                </Avatar>
                <input
                  type="file"
                  hidden
                  id="foto-upload"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileChange}
                />
              </Box>
              <Box>
                <Button
                  component="label"
                  htmlFor="foto-upload"
                  variant="contained"
                  disabled={submitting}
                  sx={{
                    textTransform: "none",
                    backgroundColor: "#0D59F2",
                    "&:hover": { backgroundColor: "#0846c7" },
                  }}
                >
                  Choose File
                </Button>
                <Typography sx={{ fontSize: 12, color: "#666", mt: 1 }}>
                  PNG, JPG, up to 10MB.
                </Typography>
                {errors.foto && (
                  <Typography sx={{ fontSize: 12, color: "#d32f2f", mt: 0.5 }}>
                    {errors.foto}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={handleSubmitBiodata}
              disabled={submitting}
              sx={{
                px: 4,
                py: 1.2,
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: "#0D59F2",
                "&:hover": { backgroundColor: "#0846c7" },
              }}
            >
              {submitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </Box>
        </Paper>

        <Paper sx={{ p: 4 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>
            Ganti Password
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
              Password Lama
            </Typography>
            <TextField
              fullWidth
              type={showPassword.current ? "text" : "password"}
              placeholder="****************"
              value={formPassword.current_password}
              onChange={(e) => handleChangePassword("current_password", e.target.value)}
              error={!!errors.current_password}
              helperText={errors.current_password}
              disabled={submittingPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => ({ ...prev, current: !prev.current }))}
                      edge="end"
                    >
                      {showPassword.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
              Password Baru
            </Typography>
            <TextField
              fullWidth
              type={showPassword.new ? "text" : "password"}
              placeholder="Masukkan password baru Anda"
              value={formPassword.new_password}
              onChange={(e) => handleChangePassword("new_password", e.target.value)}
              error={!!errors.new_password}
              helperText={errors.new_password}
              disabled={submittingPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => ({ ...prev, new: !prev.new }))}
                      edge="end"
                    >
                      {showPassword.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
              Konfirmasi Password Baru
            </Typography>
            <TextField
              fullWidth
              type={showPassword.confirm ? "text" : "password"}
              placeholder="Konfirmasi password baru Anda"
              value={formPassword.confirm_password}
              onChange={(e) => handleChangePassword("confirm_password", e.target.value)}
              error={!!errors.confirm_password}
              helperText={errors.confirm_password}
              disabled={submittingPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
                      edge="end"
                    >
                      {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={handleSubmitPassword}
              disabled={submittingPassword}
              sx={{
                px: 4,
                py: 1.2,
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: "#0D59F2",
                "&:hover": { backgroundColor: "#0846c7" },
              }}
            >
              {submittingPassword ? "Mengubah..." : "Ubah Password"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </BodyLayout>
  );
}