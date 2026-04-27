import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box, Typography, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Divider,
} from "@mui/material";
import { Info, CheckCircle } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getFormPenilaian, simpanNilai, submitPenilaian } from "../../api/juri";
import LoadingScreen from "../common/LoadingScreen";

const COLORS = {
  primary:      "#0D59F2",
  primaryLight: "#E0F2FE",
  primaryDark:  "#0369A1",
  primaryMuted: "#93C5FD",
  accent:       "#3B82F6",
  slate:        "#64748B",
  slateLight:   "#F1F5F9",
  success:      "#059669",
  successLight: "#ECFDF5",
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

const tableHeadCell = {
  fontWeight: 700, fontSize: 13, color: "#000",
  backgroundColor: "#fafafa", borderBottom: "2px solid #f0f0f0", py: 2,
};

const tableBodyRow = {
  "&:hover": { backgroundColor: "#f8f9ff" },
  "& td": { borderBottom: "1px solid #f5f5f5", py: 1.5 },
};

export default function FormPenilaianTab({ id_distribusi, onActionsChange }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [fetchError, setFetchError] = useState("");

  const fetchFormPenilaian = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError("");
      const response = await getFormPenilaian(id_distribusi);
      if (response.success) {
        setData(response.data);
        const initialForm = {};
        response.data.nilai.forEach((item) => {
          initialForm[item.id_kriteria] = {
            skor: item.skor || "",
            catatan: item.catatan || "",
          };
        });
        setFormData(initialForm);
      } else {
        setFetchError(response.message || "Gagal memuat form penilaian");
      }
    } catch (err) {
      setFetchError(err.response?.data?.message || "Gagal memuat form penilaian");
    } finally {
      setLoading(false);
    }
  }, [id_distribusi]);

  useEffect(() => { fetchFormPenilaian(); }, [fetchFormPenilaian]);

  const simpanDraftRef = useRef(null);
  const submitRef = useRef(null);

  useEffect(() => {
    if (!onActionsChange) return;
    if (!data) { onActionsChange(null); return; }
    const isSubmitted = data.penilaian.status === 1;
    const canSubmit = (data.nilai || []).some((item) => item.skor !== null && item.skor !== undefined);
    onActionsChange({
      handleSimpanDraft: (...args) => simpanDraftRef.current?.(...args),
      handleSubmit: (...args) => submitRef.current?.(...args),
      saving, submitting, isSubmitted, canSubmit,
    });
  }, [data, saving, submitting, onActionsChange]);

  const handleSkorChange = (id_kriteria, value) => {
    setFormData({ ...formData, [id_kriteria]: { ...formData[id_kriteria], skor: value } });
    if (value !== "" && !data.skala_skor.includes(Number(value))) {
      setErrors({ ...errors, [id_kriteria]: `Skor harus salah satu dari: ${data.skala_skor.join(", ")}` });
    } else {
      const newErrors = { ...errors };
      delete newErrors[id_kriteria];
      setErrors(newErrors);
    }
  };

  const handleCatatanChange = (id_kriteria, value) => {
    setFormData({ ...formData, [id_kriteria]: { ...formData[id_kriteria], catatan: value } });
  };

  const getNilaiTerbobot = (id_kriteria) => {
    const kriteria = data.kriteria.find((k) => k.id_kriteria === id_kriteria);
    const skor = formData[id_kriteria]?.skor;
    if (!kriteria || !skor || skor === "") return 0;
    return Number(kriteria.bobot) * Number(skor);
  };

  const getTotalNilai = () =>
    data.kriteria.reduce((total, k) => total + getNilaiTerbobot(k.id_kriteria), 0);

  const handleSimpanDraft = async () => {
    const payload = Object.keys(formData)
      .filter((id) => formData[id].skor !== "" && formData[id].skor !== null)
      .map((id) => ({
        id_kriteria: Number(id),
        skor: Number(formData[id].skor),
        catatan: formData[id].catatan || "",
      }));
    if (payload.length === 0) {
      Swal.fire({ icon: "warning", title: "Peringatan", text: "Belum ada nilai yang diisi", confirmButtonText: "OK" });
      return;
    }
    for (const item of payload) {
      if (!data.skala_skor.includes(item.skor)) {
        Swal.fire({ icon: "error", title: "Validasi Gagal", text: `Skor tidak valid untuk kriteria ID ${item.id_kriteria}`, confirmButtonText: "OK" });
        return;
      }
    }
    try {
      setSaving(true);
      const response = await simpanNilai(id_distribusi, payload);
      if (response.success) {
        Swal.fire({ icon: "success", title: "Berhasil", text: response.message, timer: 2000, timerProgressBar: true, showConfirmButton: false });
        fetchFormPenilaian();
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: response.message, confirmButtonText: "OK" });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Terjadi kesalahan saat menyimpan", confirmButtonText: "OK" });
    } finally {
      setSaving(false);
    }
  };
  simpanDraftRef.current = handleSimpanDraft;

  const handleSubmit = async () => {
    const allFilled = data.kriteria.every((k) => {
      const item = formData[k.id_kriteria];
      return item && item.skor !== "" && item.skor !== null;
    });
    if (!allFilled) {
      Swal.fire({ icon: "error", title: "Validasi Gagal", text: "Semua kriteria harus diisi sebelum submit", confirmButtonText: "OK" });
      return;
    }
    for (const k of data.kriteria) {
      const item = formData[k.id_kriteria];
      if (!data.skala_skor.includes(Number(item.skor))) {
        Swal.fire({ icon: "error", title: "Validasi Gagal", text: `Skor tidak valid untuk kriteria: ${k.nama_kriteria}`, confirmButtonText: "OK" });
        return;
      }
    }
    const result = await Swal.fire({
      title: "Konfirmasi Submit",
      html: "Setelah submit, penilaian <b>tidak dapat diubah lagi</b>.<br/><br/>Yakin ingin melanjutkan?",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: COLORS.primary, cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Submit", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    try {
      setSubmitting(true);
      const payload = data.kriteria.map((k) => ({
        id_kriteria: k.id_kriteria,
        skor: Number(formData[k.id_kriteria].skor),
        catatan: formData[k.id_kriteria].catatan || "",
      }));
      const simpanResponse = await simpanNilai(id_distribusi, payload);
      if (!simpanResponse.success) {
        Swal.fire({ icon: "error", title: "Gagal Menyimpan", text: simpanResponse.message, confirmButtonText: "OK" });
        return;
      }
      const response = await submitPenilaian(id_distribusi);
      if (response.success) {
        Swal.fire({ icon: "success", title: "Berhasil", text: response.message || "Penilaian berhasil disubmit", timer: 2000, timerProgressBar: true, showConfirmButton: false });
        setTimeout(() => navigate("/juri/penugasan"), 2000);
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: response.message, confirmButtonText: "OK" });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Terjadi kesalahan saat submit", confirmButtonText: "OK" });
    } finally {
      setSubmitting(false);
    }
  };
  submitRef.current = handleSubmit;

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Box sx={{ position: "relative", minHeight: 320 }}>
        <LoadingScreen message="Memuat form penilaian..." overlay minHeight="320px" />
      </Box>
    );
  }

  if (fetchError) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Box sx={{
          width: 100, height: 100, borderRadius: "50%",
          background: COLORS.slateLight,
          display: "flex", alignItems: "center", justifyContent: "center",
          mx: "auto", mb: 3,
        }}>
          <Info sx={{ fontSize: 48, color: "#CBD5E1" }} />
        </Box>
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#374151", mb: 1 }}>
          Tidak dapat mengakses form penilaian
        </Typography>
        <Typography sx={{ fontSize: 14, color: COLORS.slate }}>{fetchError}</Typography>
      </Box>
    );
  }

  if (!data) return null;

  const isSubmitted = data.penilaian.status === 1;
  const getTahapLabel = () => {
    if (data.tahap === 1) return "Tahap 1 - Desk Evaluasi";
    if (data.tahap === 2) return "Tahap 2 - Wawancara";
    return `Tahap ${data.tahap}`;
  };

  return (
    <Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{
          p: 2.5, borderRadius: "14px",
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
          display: "flex", alignItems: "center", gap: 2,
        }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: "12px",
            background: "rgba(255,255,255,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(4px)", flexShrink: 0,
          }}>
            <CheckCircle sx={{ color: "#fff", fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
              Form Penilaian {getTahapLabel()}
            </Typography>
            <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.8)", mt: 0.3 }}>
              {data.proposal.judul}
            </Typography>
          </Box>
        </Box>
      </Box>

      {isSubmitted && (
        <Box sx={{
          p: 2.5, mb: 3,
          backgroundColor: COLORS.successLight, borderRadius: "12px",
          border: `1.5px solid #6EE7B7`,
          display: "flex", alignItems: "center", gap: 1.5,
        }}>
          <CheckCircle sx={{ color: COLORS.success, fontSize: 22 }} />
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORS.success }}>Penilaian Sudah Disubmit</Typography>
            <Typography sx={{ fontSize: 13, color: "#065F46" }}>{formatDate(data.penilaian.submitted_at)}</Typography>
          </Box>
        </Box>
      )}

      <Box sx={{
        p: 2.5, mb: 3,
        backgroundColor: COLORS.primaryLight, borderRadius: "12px",
        border: `1.5px solid ${COLORS.primaryDark}20`,
        display: "flex", gap: 1.5, alignItems: "flex-start",
      }}>
        <Box sx={{ width: 8, height: 8, mt: 0.5, borderRadius: "50%", background: COLORS.primary, flexShrink: 0 }} />
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORS.primaryDark, mb: 0.3 }}>Skala Skor yang Valid</Typography>
          <Typography sx={{ fontSize: 14, color: COLORS.primary, fontWeight: 600 }}>{data.skala_skor.join(", ")}</Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1F2937", mb: 2 }}>Kriteria Penilaian</Typography>

      {data.kriteria.map((kriteria, index) => {
        const nilaiTerbobot = getNilaiTerbobot(kriteria.id_kriteria);
        const current = formData[kriteria.id_kriteria] || { skor: "", catatan: "" };
        return (
          <Box
            key={kriteria.id_kriteria}
            sx={{
              mb: 3, p: 3,
              border: "1.5px solid #E5E7EB", borderRadius: "16px",
              backgroundColor: "#fafafa",
              "&:hover": { borderColor: COLORS.primaryMuted, boxShadow: `0 0 0 3px ${COLORS.primaryLight}` },
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
              <Box sx={{
                width: 28, height: 28, borderRadius: "50%",
                background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{index + 1}</Typography>
              </Box>
              <Typography sx={{ fontSize: 15, fontWeight: 700, flex: 1, color: "#1F2937" }}>{kriteria.nama_kriteria}</Typography>
              <Box sx={{
                px: 1.5, py: 0.3, borderRadius: "50px",
                backgroundColor: COLORS.primaryLight, border: `1px solid ${COLORS.primaryMuted}`,
              }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: COLORS.primary }}>Bobot: {kriteria.bobot}</Typography>
              </Box>
            </Box>

            {kriteria.deskripsi && (
              <Typography sx={{ fontSize: 13, color: COLORS.slate, mb: 2, ml: 5 }}>{kriteria.deskripsi}</Typography>
            )}

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: 13, color: "#374151", mb: 0.75 }}>Skor</Typography>
                <TextField
                  fullWidth value={current.skor}
                  onChange={(e) => handleSkorChange(kriteria.id_kriteria, e.target.value)}
                  error={!!errors[kriteria.id_kriteria]}
                  helperText={errors[kriteria.id_kriteria] || `Valid: ${data.skala_skor.join(", ")}`}
                  disabled={isSubmitted}
                  placeholder="Masukkan skor"
                  sx={roundedField}
                />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: 13, color: "#374151", mb: 0.75 }}>Nilai Terbobot</Typography>
                <Box sx={{
                  height: 56, px: 2.5,
                  backgroundColor: COLORS.primaryLight, borderRadius: "12px",
                  border: `1.5px solid ${COLORS.primaryMuted}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <Typography sx={{ fontSize: 26, fontWeight: 800, color: COLORS.primary }}>{nilaiTerbobot}</Typography>
                  {current.skor && (
                    <Typography sx={{ fontSize: 12, color: COLORS.slate }}>{current.skor} × {kriteria.bobot}</Typography>
                  )}
                </Box>
              </Box>
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: 13, color: "#374151", mb: 0.75 }}>
                Catatan <span style={{ color: COLORS.slate, fontWeight: 400 }}>(Opsional)</span>
              </Typography>
              <TextField
                fullWidth multiline rows={2}
                placeholder="Masukkan catatan penilaian..."
                value={current.catatan}
                onChange={(e) => handleCatatanChange(kriteria.id_kriteria, e.target.value)}
                disabled={isSubmitted}
                sx={roundedField}
              />
            </Box>
          </Box>
        );
      })}

      <Divider sx={{ my: 3 }} />

      <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1F2937", mb: 2 }}>Ringkasan Nilai</Typography>

      <TableContainer sx={{ borderRadius: "16px", border: "1.5px solid #E5E7EB", overflow: "hidden", mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {["Kriteria", "Bobot", "Skor", "Nilai Terbobot"].map((h, i) => (
                <TableCell key={i} sx={{ ...tableHeadCell, ...(i > 0 && { textAlign: "center" }), ...(i === 3 && { textAlign: "right" }) }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.kriteria.map((k) => {
              const current = formData[k.id_kriteria] || { skor: "" };
              const nt = getNilaiTerbobot(k.id_kriteria);
              return (
                <TableRow key={k.id_kriteria} sx={tableBodyRow}>
                  <TableCell><Typography sx={{ fontWeight: 600, fontSize: 13 }}>{k.nama_kriteria}</Typography></TableCell>
                  <TableCell sx={{ textAlign: "center" }}><Typography sx={{ fontSize: 13 }}>{k.bobot}</Typography></TableCell>
                  <TableCell sx={{ textAlign: "center" }}><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{current.skor || "-"}</Typography></TableCell>
                  <TableCell sx={{ textAlign: "right" }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: nt > 0 ? COLORS.primary : "#CBD5E1" }}>
                      {nt || "-"}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow sx={{ backgroundColor: COLORS.primaryLight, "& td": { borderTop: `2px solid ${COLORS.primaryMuted}` } }}>
              <TableCell colSpan={3} sx={{ fontWeight: 700, fontSize: 14, textAlign: "right", color: COLORS.primaryDark, py: 2 }}>
                TOTAL NILAI
              </TableCell>
              <TableCell sx={{ textAlign: "right", py: 2 }}>
                <Typography sx={{ fontSize: 24, fontWeight: 800, color: COLORS.primary }}>{getTotalNilai()}</Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

    </Box>
  );
}