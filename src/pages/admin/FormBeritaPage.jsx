import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box, Paper, Typography, Button, TextField, MenuItem,
  CircularProgress, Divider, ToggleButtonGroup, ToggleButton,
} from "@mui/material";
import { ArrowBack, Upload, Link as LinkIcon, AttachFile } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import {
  getBeritaDetailAdmin, createBerita, updateBerita,
} from "../../api/admin";

const BASE_URL = import.meta.env.VITE_API_URL.replace("/api", "");

const roundedField = { "& .MuiOutlinedInput-root": { borderRadius: "15px" } };


export default function FormBeritaPage() {
  const navigate = useNavigate();
  const { id_berita } = useParams();
  const isEdit = !!id_berita;
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState(null);

  const [form, setForm] = useState({
    judul: "",
    isi: "",
    status: "0",
  });
  const [errors, setErrors] = useState({});

  const [gambarMode, setGambarMode] = useState("upload");
  const [gambarFile, setGambarFile] = useState(null);
  const [gambarUrl, setGambarUrl] = useState("");
  const [gambarPreview, setGambarPreview] = useState("");

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getBeritaDetailAdmin(id_berita);
      const d = res.data;
      setExisting(d);
      setForm({ judul: d.judul || "", isi: d.isi || "", status: String(d.status) });
      if (d.file_gambar) {
        setGambarPreview(`${BASE_URL}/uploads/berita/${d.file_gambar}`);
      }
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat data berita", confirmButtonColor: "#0D59F2" });
      navigate("/admin/berita");
    } finally {
      setLoading(false);
    }
  }, [id_berita, navigate]);

  useEffect(() => {
    if (isEdit) fetchDetail();
  }, [isEdit, fetchDetail]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setGambarFile(file);
    setGambarPreview(URL.createObjectURL(file));
  };

  const handleUrlChange = (val) => {
    setGambarUrl(val);
    setGambarPreview(val);
  };

  const validate = () => {
    const e = {};
    if (!form.judul.trim()) e.judul = "Judul wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const result = await Swal.fire({
      title: "Konfirmasi",
      text: isEdit ? "Simpan perubahan berita?" : "Publikasikan berita ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0D59F2", cancelButtonColor: "#666",
      confirmButtonText: "Ya, Simpan", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("judul", form.judul.trim());
      formData.append("isi", form.isi || "");
      formData.append("status", form.status);

      if (gambarMode === "upload" && gambarFile) {
        formData.append("file_gambar", gambarFile);
      } else if (gambarMode === "url" && gambarUrl.trim()) {
        formData.append("gambar_url", gambarUrl.trim());
      }

      if (isEdit) {
        await updateBerita(id_berita, formData);
      } else {
        await createBerita(formData);
      }

      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: isEdit ? "Berita berhasil diperbarui" : "Berita berhasil dibuat",
        timer: 2000, timerProgressBar: true, showConfirmButton: false,
      });
      navigate("/admin/berita");
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Terjadi kesalahan", confirmButtonColor: "#0D59F2" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <BodyLayout Sidebar={AdminSidebar}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress />
        </Box>
      </BodyLayout>
    );
  }

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box>
          <Button size="small" startIcon={<ArrowBack sx={{ fontSize: 14 }} />}
            onClick={() => navigate("/admin/berita")}
            sx={{ textTransform: "none", fontSize: 13, color: "#888", p: 0, mb: 0.5, minWidth: 0, "&:hover": { backgroundColor: "transparent", color: "#0D59F2" } }}
          >
            Kembali ke Daftar Berita
          </Button>

          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
            {isEdit ? "Edit Berita" : "Tambah Berita"}
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>
            {isEdit ? `Mengedit: ${existing?.judul || ""}` : "Buat berita baru untuk halaman publik"}
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 340px" }, gap: 3, alignItems: "start" }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Paper sx={{ p: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
                <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2.5 }}>Konten Berita</Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Judul <span style={{ color: "#ef5350" }}>*</span></Typography>
                  <TextField fullWidth placeholder="Judul berita..."
                    value={form.judul}
                    onChange={(e) => { setForm({ ...form, judul: e.target.value }); setErrors({ ...errors, judul: "" }); }}
                    error={!!errors.judul} helperText={errors.judul}
                    sx={roundedField}
                  />
                </Box>

                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Isi Berita</Typography>
                  <TextField
                    fullWidth multiline rows={14}
                    placeholder="Tulis isi berita di sini..."
                    value={form.isi}
                    onChange={(e) => setForm({ ...form, isi: e.target.value })}
                    sx={{ ...roundedField, "& .MuiOutlinedInput-root": { borderRadius: "12px", alignItems: "flex-start" } }}
                  />
                </Box>
              </Paper>

              <Paper sx={{ p: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
                <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2.5 }}>Gambar Berita</Typography>

                <Box sx={{ mb: 2 }}>
                  <ToggleButtonGroup
                    value={gambarMode}
                    exclusive
                    onChange={(e, val) => { if (val) setGambarMode(val); }}
                    size="small"
                    sx={{ mb: 2, "& .MuiToggleButton-root": { textTransform: "none", fontSize: 13, px: 2, borderRadius: "8px !important", "&.Mui-selected": { backgroundColor: "#e3f2fd", color: "#0D59F2", fontWeight: 700 } } }}
                  >
                    <ToggleButton value="upload"><Upload sx={{ fontSize: 16, mr: 0.5 }} />Upload File</ToggleButton>
                    <ToggleButton value="url"><LinkIcon sx={{ fontSize: 16, mr: 0.5 }} />URL Gambar</ToggleButton>
                  </ToggleButtonGroup>

                  {gambarMode === "upload" ? (
                    <Box>
                      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
                      <Box
                        onClick={() => fileInputRef.current?.click()}
                        sx={{
                          border: "2px dashed #e0e0e0", borderRadius: "12px", p: 3,
                          textAlign: "center", cursor: "pointer", transition: "all 0.2s",
                          "&:hover": { borderColor: "#0D59F2", backgroundColor: "#f7faff" },
                        }}
                      >
                        <AttachFile sx={{ fontSize: 32, color: "#bbb", mb: 1 }} />
                        <Typography sx={{ fontSize: 13, color: "#888" }}>
                          {gambarFile ? gambarFile.name : "Klik untuk pilih gambar (JPG, PNG, WEBP)"}
                        </Typography>
                        {!gambarFile && (
                          <Typography sx={{ fontSize: 12, color: "#bbb", mt: 0.5 }}>Maks. 5MB</Typography>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <TextField fullWidth size="small" placeholder="https://example.com/gambar.jpg"
                      value={gambarUrl}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      InputProps={{ startAdornment: <LinkIcon sx={{ mr: 1, fontSize: 18, color: "#aaa" }} /> }}
                      sx={roundedField}
                    />
                  )}
                </Box>

                {gambarPreview && (
                  <Box sx={{ mt: 2 }}>
                    <Typography sx={{ fontSize: 12, color: "#888", mb: 1 }}>Preview</Typography>
                    <Box
                      component="img"
                      src={gambarPreview}
                      alt="Preview"
                      onError={() => setGambarPreview("")}
                      sx={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: "12px", border: "1px solid #f0f0f0" }}
                    />
                    <Button size="small"
                      onClick={() => { setGambarPreview(""); setGambarFile(null); setGambarUrl(""); }}
                      sx={{ textTransform: "none", fontSize: 12, color: "#c62828", mt: 1, p: 0 }}
                    >
                      Hapus gambar
                    </Button>
                  </Box>
                )}
              </Paper>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, position: { lg: "sticky" }, top: { lg: 24 } }}>
              <Paper sx={{ p: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
                <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2.5 }}>Pengaturan</Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.75 }}>Status Publikasi</Typography>
                  <TextField select fullWidth size="small"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    sx={roundedField}
                  >
                    <MenuItem value="0">Draft — belum tampil di publik</MenuItem>
                    <MenuItem value="1">Published — tampil di halaman publik</MenuItem>
                  </TextField>
                </Box>

                {isEdit && existing && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                      <Box>
                        <Typography sx={{ fontSize: 12, color: "#888" }}>Penulis</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{existing.nama_author || "-"}</Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 12, color: "#888" }}>Dibuat</Typography>
                        <Typography sx={{ fontSize: 13 }}>
                          {new Date(existing.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 12, color: "#888" }}>Slug</Typography>
                        <Typography sx={{ fontSize: 12, color: "#0D59F2", wordBreak: "break-all" }}>/{existing.slug}</Typography>
                      </Box>
                    </Box>
                  </>
                )}

                <Divider sx={{ my: 2.5 }} />

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Button fullWidth variant="contained" onClick={handleSave} disabled={submitting}
                    sx={{ textTransform: "none", borderRadius: "50px", py: 1.2, fontWeight: 600, backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" } }}
                  >
                    {submitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Publikasikan"}
                  </Button>
                  <Button fullWidth variant="outlined" onClick={() => navigate("/admin/berita")} disabled={submitting}
                    sx={{ textTransform: "none", borderRadius: "50px", py: 1.2, fontWeight: 600, color: "#666", borderColor: "#e0e0e0", "&:hover": { backgroundColor: "#f5f5f5" } }}
                  >
                    Batal
                  </Button>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}