import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box, Paper, Typography, Button, TextField, MenuItem,
  Divider,
} from "@mui/material";
import { Upload, ArrowBack, PictureAsPdf } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import { getUploadUrl } from "../../utils/fileUrl";
import {
  getBeritaDetailAdmin, createBerita, updateBerita,
} from "../../api/admin";
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
  warning:      "#D97706",
  warningLight: "#FFFBEB",
  error:        "#DC2626",
  success:      "#059669",
  successLight: "#ECFDF5",
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


export default function FormBeritaPage() {
  const navigate = useNavigate();
  const { id_berita } = useParams();
  const isEdit = !!id_berita;
  const gambarInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState(null);

  const [form, setForm] = useState({
    judul: "",
    isi: "",
    status: "0",
  });
  const [errors, setErrors] = useState({});

  const [gambarFile, setGambarFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [gambarPreview, setGambarPreview] = useState("");
  const [pdfPreview, setPdfPreview] = useState("");

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getBeritaDetailAdmin(id_berita);
      const d = res.data;
      setExisting(d);
      setForm({ judul: d.judul || "", isi: d.isi || "", status: String(d.status) });
      const existingImageUrl = d.file_gambar ? getUploadUrl("berita", d.file_gambar) : "";
      const existingPdfUrl = d.file_pdf ? getUploadUrl("berita", d.file_pdf) : "";
      setGambarPreview(existingImageUrl);
      setPdfPreview(existingPdfUrl);
      setGambarFile(null);
      setPdfFile(null);
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

  useEffect(() => {
    return () => {
      if (gambarPreview.startsWith("blob:")) URL.revokeObjectURL(gambarPreview);
      if (pdfPreview.startsWith("blob:")) URL.revokeObjectURL(pdfPreview);
    };
  }, [gambarPreview, pdfPreview]);

  const revokeBlobIfNeeded = (url) => {
    if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (hasSuspiciousInput(file.name) || hasSqlInjection(file.name)) {
      setErrors((prev) => ({ ...prev, gambar: "Nama file mengandung karakter terlarang" }));
      return;
    }
    const allowedFormats = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedFormats.includes(file.type)) {
      setErrors((prev) => ({ ...prev, gambar: "Format harus JPG, PNG, atau WebP" }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, gambar: "Ukuran file maksimal 10MB" }));
      return;
    }
    revokeBlobIfNeeded(gambarPreview);
    setGambarFile(file);
    setGambarPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, gambar: "" }));
    e.target.value = "";
  };

  const handlePdfChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (hasSuspiciousInput(file.name) || hasSqlInjection(file.name)) {
      setErrors((prev) => ({ ...prev, pdf: "Nama file mengandung karakter terlarang" }));
      return;
    }
    if (file.type !== "application/pdf") {
      setErrors((prev) => ({ ...prev, pdf: "Format harus PDF" }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, pdf: "Ukuran file maksimal 10MB" }));
      return;
    }
    revokeBlobIfNeeded(pdfPreview);
    setPdfFile(file);
    setPdfPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, pdf: "" }));
    e.target.value = "";
  };

  const clearImage = () => {
    revokeBlobIfNeeded(gambarPreview);
    setGambarFile(null);
    setGambarPreview("");
    if (gambarInputRef.current) gambarInputRef.current.value = "";
    setErrors((prev) => ({ ...prev, gambar: "" }));
  };

  const clearPdf = () => {
    revokeBlobIfNeeded(pdfPreview);
    setPdfFile(null);
    setPdfPreview("");
    if (pdfInputRef.current) pdfInputRef.current.value = "";
    setErrors((prev) => ({ ...prev, pdf: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.judul.trim()) e.judul = "Judul wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const securityCheck = validateFormSecurity({
      judul: form.judul,
      isi: form.isi,
    });
    if (!securityCheck.isValid) {
      setErrors((prev) => ({ ...prev, [securityCheck.field]: securityCheck.message }));
      return;
    }

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

      if (gambarFile) formData.append("file_gambar", gambarFile);
      if (pdfFile) formData.append("file_pdf", pdfFile);

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
        <Box sx={{ position: "relative", minHeight: "60vh" }}>
          <LoadingScreen message="Memuat data..." overlay minHeight="60vh" />
        </Box>
      </BodyLayout>
    );
  }

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box sx={{ px: 1, py: 1 }}>
          <Button size="small"
            onClick={() => navigate("/admin/berita")}
            startIcon={<ArrowBack />}
            sx={{ textTransform: "none", borderRadius: "50px", fontSize: 13, color: COLORS.slate, p: 0, mb: 1, minWidth: 0, "&:hover": { backgroundColor: "transparent", color: COLORS.primary } }}
          >
            Kembali ke Daftar Berita
          </Button>

          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: { xs: 26, sm: 32, md: 36 }, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              {isEdit ? "Edit Berita" : "Tambah Berita"}
            </Typography>
            <Typography sx={{ fontSize: { xs: 14, sm: 16 }, color: "#6B7280" }}>
              {isEdit ? `Mengedit: ${existing?.judul || ""}` : "Buat berita baru untuk halaman publik"}
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 340px" }, gap: 3, alignItems: "start" }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Paper sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: "20px", border: "1.5px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2.5 }}>Konten Berita</Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>Judul <span style={{ color: COLORS.error }}>*</span></Typography>
                  <TextField fullWidth placeholder="Judul berita..."
                    value={form.judul}
                    onChange={(e) => { setForm({ ...form, judul: e.target.value }); setErrors({ ...errors, judul: "" }); }}
                    error={!!errors.judul} helperText={errors.judul}
                    sx={roundedField}
                  />
                </Box>

                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>Isi Berita</Typography>
                  <TextField
                    fullWidth multiline rows={14}
                    placeholder="Tulis isi berita di sini..."
                    value={form.isi}
                    onChange={(e) => setForm({ ...form, isi: e.target.value })}
                    sx={{ ...roundedField, "& .MuiOutlinedInput-root": { borderRadius: "12px", alignItems: "flex-start" } }}
                  />
                </Box>
              </Paper>

              <Paper sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: "20px", border: "1.5px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2.5 }}>File Berita</Typography>

                <Box sx={{ display: "grid", gap: 2 }}>
                  <Box>
                    <input ref={gambarInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" style={{ display: "none" }} onChange={handleImageChange} />
                    <Box
                      onClick={() => gambarInputRef.current?.click()}
                      sx={{
                        border: `2px dashed ${COLORS.slateLight}`,
                        borderRadius: "12px",
                        p: 3,
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        "&:hover": { borderColor: COLORS.primary, backgroundColor: "#f7faff" },
                      }}
                    >
                      <Upload sx={{ fontSize: 32, color: "#9CA3AF", mb: 1 }} />
                      <Typography sx={{ fontSize: 13, color: "#6B7280" }}>Klik untuk upload file gambar</Typography>
                      <Typography sx={{ fontSize: 12, color: "#9CA3AF", mt: 0.5 }}>Format: JPG, PNG, WebP. Maks. 10MB</Typography>
                    </Box>
                    {errors.gambar && <Typography sx={{ fontSize: 12, color: COLORS.error, mt: 1 }}>{errors.gambar}</Typography>}
                  </Box>

                  {gambarPreview && (
                    <Box sx={{ p: 2.5, borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#FAFAFA" }}>
                      <Typography sx={{ fontSize: 12, color: "#888", mb: 1 }}>Preview Gambar</Typography>
                      <Box
                        component="img"
                        src={gambarPreview}
                        alt="Preview gambar berita"
                        sx={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: "12px", border: "1px solid #f0f0f0" }}
                      />
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, mt: 1 }}>
                        <Typography sx={{ fontSize: 12, color: "#6B7280", wordBreak: "break-all" }}>
                          {gambarFile?.name || existing?.file_gambar || "Gambar tersimpan"}
                        </Typography>
                        <Button size="small" onClick={clearImage} sx={{ textTransform: "none", fontSize: 12, color: COLORS.error, p: 0, minWidth: 0 }}>
                          Hapus gambar
                        </Button>
                      </Box>
                    </Box>
                  )}

                  <Box>
                    <input ref={pdfInputRef} type="file" accept="application/pdf" style={{ display: "none" }} onChange={handlePdfChange} />
                    <Box
                      onClick={() => pdfInputRef.current?.click()}
                      sx={{
                        border: `2px dashed ${COLORS.slateLight}`,
                        borderRadius: "12px",
                        p: 3,
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        "&:hover": { borderColor: COLORS.primary, backgroundColor: "#f7faff" },
                      }}
                    >
                      <PictureAsPdf sx={{ fontSize: 32, color: "#9CA3AF", mb: 1 }} />
                      <Typography sx={{ fontSize: 13, color: "#6B7280" }}>Klik untuk upload file PDF</Typography>
                      <Typography sx={{ fontSize: 12, color: "#9CA3AF", mt: 0.5 }}>Format: PDF. Maks. 10MB</Typography>
                    </Box>
                    {errors.pdf && <Typography sx={{ fontSize: 12, color: COLORS.error, mt: 1 }}>{errors.pdf}</Typography>}
                  </Box>

                  {pdfPreview && (
                    <Box sx={{ p: 2.5, borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#FAFAFA", display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                      <PictureAsPdf sx={{ fontSize: 40, color: COLORS.error, flexShrink: 0 }} />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1F2937", wordBreak: "break-word" }}>
                          {pdfFile?.name || existing?.file_pdf || "PDF tersimpan"}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: "#6B7280" }}>File PDF siap diunggah</Typography>
                      </Box>
                      <Button size="small" onClick={clearPdf} sx={{ textTransform: "none", fontSize: 12, color: COLORS.error, p: 0, minWidth: 0 }}>
                        Hapus PDF
                      </Button>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3, position: { lg: "sticky" }, top: { lg: 24 } }}>
                <Paper sx={{ p: { xs: 2.5, sm: 3.5 }, borderRadius: "20px", border: "1.5px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2.5 }}>Pengaturan</Typography>

                <Box sx={{ mb: 3 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: "#334155" }}>Status Publikasi</Typography>
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
                        <Typography sx={{ fontSize: 12, color: COLORS.primary, wordBreak: "break-all" }}>/{existing.slug}</Typography>
                      </Box>
                    </Box>
                  </>
                )}

                <Divider sx={{ my: 2.5 }} />

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Button fullWidth variant="contained" onClick={handleSave} disabled={submitting}
                    sx={{ textTransform: "none", borderRadius: "12px", py: 1.2, fontWeight: 700, backgroundColor: COLORS.primary, boxShadow: "0 4px 12px rgba(13,89,242,0.2)", "&:hover": { backgroundColor: COLORS.primaryDark, boxShadow: "0 6px 16px rgba(13,89,242,0.3)" } }}
                  >
                    {submitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Publikasikan"}
                  </Button>
                  <Button fullWidth variant="contained" onClick={() => navigate("/admin/berita")} disabled={submitting}
                    sx={{ textTransform: "none", borderRadius: "12px", py: 1.2, fontWeight: 700, backgroundColor: COLORS.error, color: "#fff", boxShadow: "0 4px 12px rgba(220,38,38,0.2)", "&:hover": { backgroundColor: "#B91C1C", boxShadow: "0 6px 16px rgba(220,38,38,0.3)" } }}
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