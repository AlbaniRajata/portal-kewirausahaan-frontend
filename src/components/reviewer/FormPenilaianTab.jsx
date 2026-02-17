import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Divider,
} from "@mui/material";
import { Save, Send, Info, CheckCircle } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getFormPenilaian, simpanNilai, submitPenilaian } from "../../api/reviewer";

const roundedField = {
  "& .MuiOutlinedInput-root": { borderRadius: "15px" },
};

const tableHeadCell = {
  fontWeight: 700,
  fontSize: 13,
  color: "#000",
  backgroundColor: "#fafafa",
  borderBottom: "2px solid #f0f0f0",
  py: 2,
};

const tableBodyRow = {
  "& td": { borderBottom: "1px solid #f5f5f5", py: 1.5 },
};

export default function FormPenilaianTab({ id_distribusi }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState("");

  const fetchFormPenilaian = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getFormPenilaian(id_distribusi);
      if (response.success) {
        setData(response.data);
        const initialForm = {};
        response.data.nilai.forEach((item) => {
          initialForm[item.id_kriteria] = { skor: item.skor || "", catatan: item.catatan || "" };
        });
        setFormData(initialForm);
      } else {
        setAlert(response.message);
      }
    } catch (err) {
      console.error("Error fetching form penilaian:", err);
      setAlert("Gagal memuat form penilaian");
    } finally {
      setLoading(false);
    }
  }, [id_distribusi]);

  useEffect(() => { fetchFormPenilaian(); }, [fetchFormPenilaian]);

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
      .map((id) => ({ id_kriteria: Number(id), skor: Number(formData[id].skor), catatan: formData[id].catatan || "" }));

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
      console.error("Error saving draft:", err);
      Swal.fire({ icon: "error", title: "Error", text: "Terjadi kesalahan saat menyimpan", confirmButtonText: "OK" });
    } finally {
      setSaving(false);
    }
  };

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
      confirmButtonColor: "#0D59F2", cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Submit", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    try {
      setSubmitting(true);
      const response = await submitPenilaian(id_distribusi);
      if (response.success) {
        Swal.fire({ icon: "success", title: "Berhasil", text: "Penilaian berhasil disubmit", timer: 2000, timerProgressBar: true, showConfirmButton: false });
        setTimeout(() => navigate("/reviewer/penugasan"), 2000);
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: response.message, confirmButtonText: "OK" });
      }
    } catch (err) {
      console.error("Error submitting penilaian:", err);
      Swal.fire({ icon: "error", title: "Error", text: "Terjadi kesalahan saat submit", confirmButtonText: "OK" });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (alert) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Box sx={{ width: 100, height: 100, borderRadius: "50%", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
          <Info sx={{ fontSize: 48, color: "#ccc" }} />
        </Box>
        <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#444", mb: 1 }}>Tidak dapat mengakses form penilaian</Typography>
        <Typography sx={{ fontSize: 14, color: "#999" }}>{alert}</Typography>
      </Box>
    );
  }

  if (!data) return <Alert severity="error" sx={{ borderRadius: "12px" }}>Data tidak ditemukan</Alert>;

  const isSubmitted = data.penilaian.status === 1;
  const getTahapLabel = () => {
    if (data.tahap === 1) return "Tahap 1 - Desk Evaluasi";
    if (data.tahap === 2) return "Tahap 2 - Wawancara";
    return `Tahap ${data.tahap}`;
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 0.5 }}>Form Penilaian {getTahapLabel()}</Typography>
        <Typography sx={{ fontSize: 14, color: "#777" }}>{data.proposal.judul}</Typography>
      </Box>

      {isSubmitted && (
        <Box sx={{ p: 2.5, mb: 3, backgroundColor: "#e8f5e9", borderRadius: "12px", border: "1px solid #a5d6a7", display: "flex", alignItems: "center", gap: 1.5 }}>
          <CheckCircle sx={{ color: "#2e7d32", fontSize: 22 }} />
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#2e7d32" }}>Penilaian Sudah Disubmit</Typography>
            <Typography sx={{ fontSize: 13, color: "#555" }}>{formatDate(data.penilaian.submitted_at)}</Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ p: 2.5, mb: 3, backgroundColor: "#e3f2fd", borderRadius: "12px", border: "1px solid #90caf9" }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#1565c0", mb: 0.5 }}>Skala Skor yang Valid</Typography>
        <Typography sx={{ fontSize: 14, color: "#1565c0" }}>{data.skala_skor.join(", ")}</Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 2 }}>Kriteria Penilaian</Typography>

      {data.kriteria.map((kriteria, index) => {
        const nilaiTerbobot = getNilaiTerbobot(kriteria.id_kriteria);
        const current = formData[kriteria.id_kriteria] || { skor: "", catatan: "" };

        return (
          <Box key={kriteria.id_kriteria} sx={{ mb: 3, p: 3, border: "1.5px solid #f0f0f0", borderRadius: "14px", backgroundColor: "#fafafa" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "#0D59F2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{index + 1}</Typography>
              </Box>
              <Typography sx={{ fontSize: 15, fontWeight: 700, flex: 1 }}>{kriteria.nama_kriteria}</Typography>
              <Box sx={{ px: 1.5, py: 0.3, borderRadius: "50px", backgroundColor: "#e8eaf6", border: "1px solid #c5cae9" }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#3949ab" }}>Bobot: {kriteria.bobot}</Typography>
              </Box>
            </Box>

            {kriteria.deskripsi && (
              <Typography sx={{ fontSize: 13, color: "#777", mb: 2, ml: 5 }}>{kriteria.deskripsi}</Typography>
            )}

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: 13, mb: 0.75 }}>Skor</Typography>
                <TextField
                  fullWidth
                  value={current.skor}
                  onChange={(e) => handleSkorChange(kriteria.id_kriteria, e.target.value)}
                  error={!!errors[kriteria.id_kriteria]}
                  helperText={errors[kriteria.id_kriteria] || `Valid: ${data.skala_skor.join(", ")}`}
                  disabled={isSubmitted}
                  placeholder="Masukkan skor"
                  sx={roundedField}
                  InputProps={{ inputProps: { min: 1, max: 7 } }}
                />
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: 13, mb: 0.75 }}>Nilai Terbobot</Typography>
                <Box sx={{
                  height: 56, px: 2.5,
                  backgroundColor: "#e3f2fd",
                  borderRadius: "12px",
                  border: "1px solid #90caf9",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <Typography sx={{ fontSize: 26, fontWeight: 800, color: "#0D59F2" }}>{nilaiTerbobot}</Typography>
                  {current.skor && (
                    <Typography sx={{ fontSize: 12, color: "#888" }}>{current.skor} × {kriteria.bobot}</Typography>
                  )}
                </Box>
              </Box>
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: 13, mb: 0.75 }}>Catatan <span style={{ color: "#999", fontWeight: 400 }}>(Opsional)</span></Typography>
              <TextField
                fullWidth multiline rows={2}
                placeholder="Masukkan catatan penilaian..."
                value={current.catatan}
                onChange={(e) => handleCatatanChange(kriteria.id_kriteria, e.target.value)}
                disabled={isSubmitted}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
              />
            </Box>
          </Box>
        );
      })}

      <Divider sx={{ my: 3 }} />

      <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 2 }}>Ringkasan Nilai</Typography>

      <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "hidden", mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {["Kriteria", "Bobot", "Skor", "Nilai Terbobot"].map((h, i) => (
                <TableCell key={i} sx={{ ...tableHeadCell, ...(i > 0 && { textAlign: "center" }), ...(i === 3 && { textAlign: "right" }) }}>{h}</TableCell>
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
                  <TableCell sx={{ textAlign: "center" }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{current.skor || "-"}</Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: "right" }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: nt > 0 ? "#0D59F2" : "#aaa" }}>{nt || "-"}</Typography>
                  </TableCell>
                </TableRow>
              );
            })}

            <TableRow sx={{ backgroundColor: "#e3f2fd", "& td": { borderTop: "2px solid #90caf9" } }}>
              <TableCell colSpan={3} sx={{ fontWeight: 700, fontSize: 14, textAlign: "right", color: "#1565c0", py: 2 }}>
                TOTAL NILAI
              </TableCell>
              <TableCell sx={{ textAlign: "right", py: 2 }}>
                <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#0D59F2" }}>{getTotalNilai()}</Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {!isSubmitted && (
        <>
          <Divider sx={{ mb: 3 }} />
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              startIcon={<Save sx={{ fontSize: 14 }} />}
              onClick={handleSimpanDraft}
              disabled={saving || submitting}
              sx={{
                textTransform: "none", borderRadius: "50px",
                px: 3, py: 1.2, fontWeight: 600,
                borderColor: "#0D59F2", color: "#0D59F2",
                "&:hover": { backgroundColor: "#f0f4ff" },
              }}
            >
              {saving ? "Menyimpan..." : "Simpan Draft"}
            </Button>
            <Button
              variant="contained"
              startIcon={<Send sx={{ fontSize: 14 }} />}
              onClick={handleSubmit}
              disabled={saving || submitting}
              sx={{
                textTransform: "none", borderRadius: "50px",
                px: 3, py: 1.2, fontWeight: 600,
                backgroundColor: "#2e7d32", "&:hover": { backgroundColor: "#1b5e20" },
              }}
            >
              {submitting ? "Memproses..." : "Submit Penilaian"}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}