import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Divider,
} from "@mui/material";
import { Save, Send, ArrowBack, CheckCircle } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getFormPenilaian, simpanNilai, submitPenilaian } from "../../api/reviewer";

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
          initialForm[item.id_kriteria] = {
            skor: item.skor || "",
            catatan: item.catatan || "",
          };
        });
        setFormData(initialForm);
      } else {
        setAlert(response.message);
      }
    } catch (err) {
      console.error("Error fetching form:", err);
      setAlert("Gagal memuat form penilaian");
    } finally {
      setLoading(false);
    }
  }, [id_distribusi]);

  useEffect(() => {
    fetchFormPenilaian();
  }, [fetchFormPenilaian]);

  const handleSkorChange = (id_kriteria, value) => {
    const newFormData = {
      ...formData,
      [id_kriteria]: {
        ...formData[id_kriteria],
        skor: value,
      },
    };
    setFormData(newFormData);

    if (value !== "" && !data.skala_skor.includes(Number(value))) {
      setErrors({
        ...errors,
        [id_kriteria]: `Skor harus salah satu dari: ${data.skala_skor.join(", ")}`,
      });
    } else {
      const newErrors = { ...errors };
      delete newErrors[id_kriteria];
      setErrors(newErrors);
    }
  };

  const handleCatatanChange = (id_kriteria, value) => {
    setFormData({
      ...formData,
      [id_kriteria]: {
        ...formData[id_kriteria],
        catatan: value,
      },
    });
  };

  const getNilaiTerbobot = (id_kriteria) => {
    const kriteria = data.kriteria.find((k) => k.id_kriteria === id_kriteria);
    const skor = formData[id_kriteria]?.skor;

    if (!kriteria || !skor || skor === "") return 0;

    return Number(kriteria.bobot) * Number(skor);
  };

  const getTotalNilai = () => {
    return data.kriteria.reduce((total, kriteria) => {
      return total + getNilaiTerbobot(kriteria.id_kriteria);
    }, 0);
  };

  const handleSimpanDraft = async () => {
    const payload = [];
    Object.keys(formData).forEach((id_kriteria) => {
      const item = formData[id_kriteria];
      if (item.skor !== "" && item.skor !== null) {
        payload.push({
          id_kriteria: Number(id_kriteria),
          skor: Number(item.skor),
          catatan: item.catatan || "",
        });
      }
    });

    if (payload.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Peringatan",
        text: "Belum ada nilai yang diisi",
        confirmButtonText: "OK",
      });
      return;
    }

    for (const item of payload) {
      if (!data.skala_skor.includes(item.skor)) {
        Swal.fire({
          icon: "error",
          title: "Validasi Gagal",
          text: `Skor tidak valid untuk kriteria ID ${item.id_kriteria}`,
          confirmButtonText: "OK",
        });
        return;
      }
    }

    try {
      setSaving(true);
      const response = await simpanNilai(id_distribusi, payload);

      if (response.success) {
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: response.message,
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        fetchFormPenilaian();
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: response.message,
          confirmButtonText: "OK",
        });
      }
    } catch (err) {
      console.error("Error saving:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Terjadi kesalahan saat menyimpan",
        confirmButtonText: "OK",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    const allFilled = data.kriteria.every((kriteria) => {
      const item = formData[kriteria.id_kriteria];
      return item && item.skor !== "" && item.skor !== null;
    });

    if (!allFilled) {
      Swal.fire({
        icon: "error",
        title: "Validasi Gagal",
        text: "Semua kriteria harus diisi sebelum submit",
        confirmButtonText: "OK",
      });
      return;
    }

    for (const kriteria of data.kriteria) {
      const item = formData[kriteria.id_kriteria];
      if (!data.skala_skor.includes(Number(item.skor))) {
        Swal.fire({
          icon: "error",
          title: "Validasi Gagal",
          text: `Skor tidak valid untuk kriteria: ${kriteria.nama_kriteria}`,
          confirmButtonText: "OK",
        });
        return;
      }
    }

    const result = await Swal.fire({
      title: "Konfirmasi Submit",
      html: "Setelah submit, penilaian <b>tidak dapat diubah lagi</b>.<br/><br/>Yakin ingin melanjutkan?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#0D59F2",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Submit",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      setSubmitting(true);
      const response = await submitPenilaian(id_distribusi);

      if (response.success) {
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Penilaian berhasil disubmit",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        setTimeout(() => {
          navigate("/reviewer/penugasan");
        }, 2000);
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: response.message,
          confirmButtonText: "OK",
        });
      }
    } catch (err) {
      console.error("Error submitting:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Terjadi kesalahan saat submit",
        confirmButtonText: "OK",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (alert) {
    return <Alert severity="error">{alert}</Alert>;
  }

  if (!data) {
    return <Alert severity="error">Data tidak ditemukan</Alert>;
  }

  const isSubmitted = data.penilaian.status === 1;

  return (
    <Box>
      <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 3 }}>
        Form Penilaian
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3}}>

        {isSubmitted && (
          <Box>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>
              Status
            </Typography>
            <Box sx={{ pt: 1 }}>
              <Chip
                icon={<CheckCircle />}
                label={`Sudah Disubmit - ${formatDate(data.penilaian.submitted_at)}`}
                color="success"
              />
            </Box>
          </Box>
        )}
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.5 }}>
          Skala Skor yang Valid
        </Typography>
        <Typography sx={{ fontSize: 14 }}>
          {data.skala_skor.join(", ")}
        </Typography>
      </Alert>

      <Divider sx={{ mb: 3 }} />

      <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 2 }}>
        Kriteria Penilaian
      </Typography>

      {data.kriteria.map((kriteria, index) => {
        const nilaiTerbobot = getNilaiTerbobot(kriteria.id_kriteria);
        const currentData = formData[kriteria.id_kriteria] || { skor: "", catatan: "" };

        return (
          <Box
            key={kriteria.id_kriteria}
            sx={{
              mb: 3,
              p: 3,
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              backgroundColor: "#fafafa",
            }}
          >
            <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
                {index + 1}. {kriteria.nama_kriteria}
              </Typography>
              <Chip
                label={`Bobot: ${kriteria.bobot}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>

            <Typography sx={{ fontSize: 13, color: "#666", mb: 2 }}>
              {kriteria.deskripsi}
            </Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: 13, mb: 1 }}>
                  Skor
                </Typography>
                <TextField
                  fullWidth
                  value={currentData.skor}
                  onChange={(e) => handleSkorChange(kriteria.id_kriteria, e.target.value)}
                  error={!!errors[kriteria.id_kriteria]}
                  helperText={errors[kriteria.id_kriteria] || `Valid: ${data.skala_skor.join(", ")}`}
                  disabled={isSubmitted}
                  InputProps={{
                    inputProps: { min: 1, max: 7 },
                  }}
                />
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: 13, mb: 1 }}>
                  Nilai Terbobot
                </Typography>
                <Box
                  sx={{
                    p: 1.5,
                    backgroundColor: "#e3f2fd",
                    borderRadius: 1,
                    border: "1px solid #90caf9",
                    textAlign: "center",
                    height: 56,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#0D59F2" }}>
                    {nilaiTerbobot}
                  </Typography>
                  {currentData.skor && (
                    <Typography sx={{ fontSize: 11, color: "#666", mt: 0.5 }}>
                      {currentData.skor} × {kriteria.bobot}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: 13, mb: 1 }}>
                Catatan (Opsional)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Masukkan catatan penilaian..."
                value={currentData.catatan}
                onChange={(e) => handleCatatanChange(kriteria.id_kriteria, e.target.value)}
                disabled={isSubmitted}
              />
            </Box>
          </Box>
        );
      })}

      <Divider sx={{ my: 3 }} />

      <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 2 }}>
        Ringkasan Nilai
      </Typography>

      <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 1, mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: 700 }}>Kriteria</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: "center", width: 100 }}>
                Bobot
              </TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: "center", width: 100 }}>
                Skor
              </TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: "right", width: 150 }}>
                Nilai Terbobot
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.kriteria.map((kriteria) => {
              const currentData = formData[kriteria.id_kriteria] || { skor: "" };
              const nilaiTerbobot = getNilaiTerbobot(kriteria.id_kriteria);

              return (
                <TableRow key={kriteria.id_kriteria} hover>
                  <TableCell>{kriteria.nama_kriteria}</TableCell>
                  <TableCell sx={{ textAlign: "center" }}>{kriteria.bobot}</TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    {currentData.skor || "-"}
                  </TableCell>
                  <TableCell sx={{ textAlign: "right", fontWeight: 600 }}>
                    {nilaiTerbobot}
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow sx={{ backgroundColor: "#e3f2fd" }}>
              <TableCell colSpan={3} sx={{ fontWeight: 700, textAlign: "right", fontSize: 15 }}>
                TOTAL NILAI
              </TableCell>
              <TableCell
                sx={{
                  fontWeight: 700,
                  fontSize: 20,
                  textAlign: "right",
                  color: "#0D59F2",
                }}
              >
                {getTotalNilai()}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Divider sx={{ mb: 3 }} />

      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
        {!isSubmitted ? (
          <>
            <Button
              variant="outlined"
              startIcon={<Save />}
              onClick={handleSimpanDraft}
              disabled={saving || submitting}
              sx={{ textTransform: "none", px: 3 }}
            >
              {saving ? "Menyimpan..." : "Simpan Draft"}
            </Button>
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={handleSubmit}
              disabled={saving || submitting}
              sx={{ textTransform: "none", px: 3 }}
            >
              {submitting ? "Memproses..." : "Submit Penilaian"}
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => navigate("/reviewer/penugasan")}
            sx={{
              backgroundColor: "#FDB022",
              "&:hover": { backgroundColor: "#E09A1A" },
              textTransform: "none",
              px: 3,
            }}
          >
            Kembali
          </Button>
        )}
      </Box>
    </Box>
  );
}