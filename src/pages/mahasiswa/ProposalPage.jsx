import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { CloudUpload, Send, Save, Download } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import SidebarMahasiswa from "../../components/layouts/MahasiswaSidebar";
import {
  getProposalStatus,
  createProposal,
  updateProposal,
  submitProposal,
} from "../../api/proposal";
import { getAllKategori } from "../../api/public";

export default function ProposalPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [kategoriOptions, setKategoriOptions] = useState([]);
  const [alert, setAlert] = useState("");
  const [file, setFile] = useState(null);

  const [form, setForm] = useState({
    judul: "",
    id_kategori: "",
    modal_diajukan: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchStatus();
    fetchKategori();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await getProposalStatus();
      setStatus(response.data);

      if (response.data.data?.proposal) {
        const p = response.data.data.proposal;
        setForm({
          judul: p.judul || "",
          id_kategori: p.id_kategori || "",
          modal_diajukan: p.modal_diajukan || "",
        });
      }
    } catch (err) {
      console.error("Error fetching status:", err);
      setAlert("Gagal memuat status proposal");
    } finally {
      setLoading(false);
    }
  };

  const fetchKategori = async () => {
    try {
      const response = await getAllKategori();
      if (response.success) {
        setKategoriOptions(response.data);
      }
    } catch (err) {
      console.error("Error fetching kategori:", err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      setAlert("File harus berformat PDF");
      e.target.value = "";
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setAlert("Ukuran file maksimal 10 MB");
      e.target.value = "";
      return;
    }

    setFile(selectedFile);
    setAlert("");
  };

  const validate = () => {
    const newErrors = {};

    if (!form.judul || form.judul.trim() === "") {
      newErrors.judul = "Judul proposal wajib diisi";
    } else if (form.judul.length > 200) {
      newErrors.judul = "Judul maksimal 200 karakter";
    }

    if (!form.id_kategori) {
      newErrors.id_kategori = "Kategori usaha wajib dipilih";
    }

    if (!form.modal_diajukan || form.modal_diajukan <= 0) {
      newErrors.modal_diajukan = "Anggaran dana wajib diisi";
    }

    if (!status?.data?.proposal && !file) {
      newErrors.file = "File proposal wajib diunggah";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      setAlert("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    setSubmitting(true);
    setAlert("");

    try {
      const formData = new FormData();
      formData.append("id_program", status.data.tim.id_program);
      formData.append("judul", form.judul.trim());
      formData.append("id_kategori", form.id_kategori);
      formData.append("modal_diajukan", form.modal_diajukan);

      if (file) {
        formData.append("file_proposal", file);
      }

      let response;
      if (status.data.proposal) {
        response = await updateProposal(status.data.proposal.id_proposal, formData);
      } else {
        response = await createProposal(formData);
      }

      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: response.message || "Draft proposal berhasil disimpan",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      fetchStatus();
    } catch (err) {
      console.error("Error saving proposal:", err);
      const errorMessage = err.response?.data?.message || "Gagal menyimpan proposal";
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

  const handleSubmit = async () => {
    if (!status?.data?.proposal) {
      setAlert("Simpan proposal terlebih dahulu sebelum submit");
      return;
    }

    const result = await Swal.fire({
      title: "Konfirmasi Submit",
      text: "Setelah submit, proposal tidak bisa diedit lagi. Lanjutkan?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#0D59F2",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Submit",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    setSubmitting(true);

    try {
      const response = await submitProposal(status.data.proposal.id_proposal);

      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: response.message || "Proposal berhasil diajukan",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      fetchStatus();
    } catch (err) {
      console.error("Error submitting proposal:", err);
      const errorMessage = err.response?.data?.message || "Gagal submit proposal";

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

  const formatRupiah = (value) => {
    if (!value) return "";
    return new Intl.NumberFormat("id-ID").format(value);
  };

  const handleModalChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setForm({ ...form, modal_diajukan: value });
    setErrors({ ...errors, modal_diajukan: "" });
    setAlert("");
  };

  const getStatusLabel = (statusCode) => {
    const labels = {
      0: { text: "Draft", color: "default" },
      1: { text: "Diajukan", color: "info" },
      2: { text: "Ditugaskan ke Reviewer", color: "primary" },
      3: { text: "Tidak Lolos Desk", color: "error" },
      4: { text: "Lolos Desk", color: "success" },
      5: { text: "Wawancara Dijadwalkan", color: "warning" },
      6: { text: "Panel Wawancara", color: "primary" },
      7: { text: "Tidak Lolos Wawancara", color: "error" },
      8: { text: "Lolos Wawancara", color: "success" },
      9: { text: "Pembimbing Diajukan", color: "info" },
      10: { text: "Pembimbing Disetujui", color: "success" },
    };
    return labels[statusCode] || { text: "Unknown", color: "default" };
  };

  if (loading) {
    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress />
        </Box>
      </BodyLayout>
    );
  }

  if (!status?.hasTim) {
    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <Box>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
            Pendaftaran Proposal
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>
            Lengkapi form di bawah ini untuk mendaftarkan proposal Anda
          </Typography>

          <Alert severity="warning">
            Anda belum terdaftar dalam tim. Silakan ajukan anggota tim terlebih dahulu.
          </Alert>
        </Box>
      </BodyLayout>
    );
  }

  if (!status?.isKetua) {
    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <Box>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
            Pendaftaran Proposal
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>
            Lengkapi form di bawah ini untuk mendaftarkan proposal Anda
          </Typography>

          <Alert severity="info">
            Hanya ketua tim yang dapat mengajukan proposal.
          </Alert>
        </Box>
      </BodyLayout>
    );
  }

  if (!status?.data?.anggota?.all_accepted) {
    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <Box>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
            Pendaftaran Proposal
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>
            Lengkapi form di bawah ini untuk mendaftarkan proposal Anda
          </Typography>

          <Alert severity="warning" sx={{ mb: 3 }}>
            Belum semua anggota menyetujui undangan. Pengajuan proposal hanya bisa dilakukan setelah semua anggota menyetujui undangan.
          </Alert>

          <Paper sx={{ p: 3 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 2 }}>
              Status Anggota Tim
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nama</TableCell>
                    <TableCell>NIM</TableCell>
                    <TableCell>Peran</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {status.data.anggota.members.map((member, index) => (
                    <TableRow key={index}>
                      <TableCell>{member.nama_lengkap}</TableCell>
                      <TableCell>{member.nim}</TableCell>
                      <TableCell>
                        <Chip
                          label={member.peran === 1 ? "Ketua" : "Anggota"}
                          color={member.peran === 1 ? "primary" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={member.status === 1 ? "Disetujui" : "Menunggu"}
                          color={member.status === 1 ? "success" : "warning"}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </BodyLayout>
    );
  }

  const isDraft = status?.data?.proposal?.status === 0;
  const isReadOnly = status?.data?.proposal && !isDraft;
  const canEdit = !isReadOnly && status?.timelineOpen;

  return (
    <BodyLayout Sidebar={SidebarMahasiswa}>
      <Box>
        <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
          Pendaftaran Proposal
        </Typography>
        <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>
          Lengkapi form di bawah ini untuk mendaftarkan proposal Anda
        </Typography>

        {alert && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setAlert("")}>
            {alert}
          </Alert>
        )}

        {!status?.timelineOpen && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Pendaftaran proposal untuk program ini sudah ditutup.
          </Alert>
        )}

        {isReadOnly && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Proposal sudah diajukan dan tidak bisa diedit. Status:{" "}
            <strong>{getStatusLabel(status.data.proposal.status).text}</strong>
          </Alert>
        )}

        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>
            Detail Proposal
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>
              Judul Proposal <span style={{ color: "red" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              placeholder="Masukkan judul proposal Anda"
              value={form.judul}
              onChange={(e) => {
                setForm({ ...form, judul: e.target.value });
                setErrors({ ...errors, judul: "" });
                setAlert("");
              }}
              error={!!errors.judul}
              helperText={errors.judul}
              disabled={!canEdit || submitting}
              inputProps={{ maxLength: 200 }}
            />
            <Typography sx={{ fontSize: 12, color: "#666", mt: 0.5 }}>
              {form.judul.length}/200 karakter
            </Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Skema Program
              </Typography>
              <TextField
                fullWidth
                value={status?.data?.tim?.nama_program || ""}
                disabled
              />
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Kategori Usaha <span style={{ color: "red" }}>*</span>
              </Typography>
              <TextField
                select
                fullWidth
                value={form.id_kategori}
                onChange={(e) => {
                  setForm({ ...form, id_kategori: e.target.value });
                  setErrors({ ...errors, id_kategori: "" });
                  setAlert("");
                }}
                error={!!errors.id_kategori}
                helperText={errors.id_kategori}
                disabled={!canEdit || submitting}
                placeholder="Pilih kategori usaha"
              >
                <MenuItem value="">Pilih kategori usaha</MenuItem>
                {kategoriOptions.map((kat) => (
                  <MenuItem key={kat.id_kategori} value={kat.id_kategori}>
                    {kat.nama_kategori}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>
              Anggaran Dana <span style={{ color: "red" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              placeholder="Masukkan anggaran dana"
              value={formatRupiah(form.modal_diajukan)}
              onChange={handleModalChange}
              error={!!errors.modal_diajukan}
              helperText={errors.modal_diajukan}
              disabled={!canEdit || submitting}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>Rp</Typography>,
              }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>
              Upload Proposal <span style={{ color: "red" }}>*</span>
            </Typography>

            {isReadOnly && status.data.proposal.file_proposal ? (
              <Box
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: 2,
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography>{status.data.proposal.file_proposal}</Typography>
                <Button
                  startIcon={<Download />}
                  component="a"
                  href={`${import.meta.env.VITE_API_URL.replace('/api', '')}/uploads/proposal/${status.data.proposal.file_proposal}`}
                  target="_blank"
                  sx={{ textTransform: "none" }}
                >
                  Download
                </Button>
              </Box>
            ) : (
              <Box
                sx={{
                  border: "2px dashed #e0e0e0",
                  borderRadius: 2,
                  p: 4,
                  textAlign: "center",
                  backgroundColor: "#fafafa",
                }}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  id="file-upload"
                  disabled={!canEdit || submitting}
                />
                <label htmlFor="file-upload">
                  <Button
                    component="span"
                    startIcon={<CloudUpload />}
                    disabled={!canEdit || submitting}
                    sx={{ textTransform: "none" }}
                  >
                    {file ? file.name : "Klik untuk upload atau seret file pdf (Max 10 MB)"}
                  </Button>
                </label>
                {errors.file && (
                  <Typography sx={{ color: "error.main", fontSize: 12, mt: 1 }}>
                    {errors.file}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {status?.data?.proposal && (
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Status Proposal
              </Typography>
              <Chip
                label={getStatusLabel(status.data.proposal.status).text}
                color={getStatusLabel(status.data.proposal.status).color}
              />
            </Box>
          )}
        </Paper>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>
            Anggota Tim
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nama</TableCell>
                  <TableCell>NIM</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {status.data.anggota.members.map((member, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {member.nama_lengkap}
                        {member.peran === 1 && (
                          <Chip label="Ketua" color="primary" size="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{member.nim}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          {canEdit && (
            <>
              <Button
                variant="outlined"
                onClick={() => window.location.href = "/mahasiswa/anggota-tim"}
                disabled={submitting}
                sx={{ textTransform: "none", px: 4 }}
              >
                Kembali
              </Button>

              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={submitting}
                sx={{
                  textTransform: "none",
                  px: 4,
                  backgroundColor: "#FDB022",
                  "&:hover": { backgroundColor: "#e09a1a" },
                }}
              >
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>

              {isDraft && status?.data?.proposal && (
                <Button
                  variant="contained"
                  startIcon={<Send />}
                  onClick={handleSubmit}
                  disabled={submitting}
                  sx={{
                    textTransform: "none",
                    px: 4,
                    backgroundColor: "#0D59F2",
                    "&:hover": { backgroundColor: "#0846c7" },
                  }}
                >
                  {submitting ? "Mengajukan..." : "Simpan & Ajukan"}
                </Button>
              )}
            </>
          )}
        </Box>
      </Box>
    </BodyLayout>
  );
}