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
  IconButton,
} from "@mui/material";
import {
  CloudUpload,
  Send,
  Save,
  Download,
  Close,
  AttachFile,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import SidebarMahasiswa from "../../components/layouts/MahasiswaSidebar";
import {
  getProposalStatus,
  createProposal,
  updateProposal,
  submitProposal,
} from "../../api/mahasiswa";
import { getAllKategori } from "../../api/public";

const roundedField = {
  "& .MuiOutlinedInput-root": { borderRadius: "12px" },
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
  "&:hover": { backgroundColor: "#f8f9ff" },
  "& td": { borderBottom: "1px solid #f5f5f5", py: 2 },
};

const StatusPill = ({ label, bg, color }) => (
  <Box sx={{
    display: "inline-flex", alignItems: "center",
    px: 1.5, py: 0.4, borderRadius: "50px",
    backgroundColor: bg, color, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
  }}>
    {label}
  </Box>
);

const getStatusInfo = (statusCode) => {
  const map = {
    0:  { label: "Draft",                    color: "#f5f5f5", bg: "#666" },
    1:  { label: "Diajukan",                 color: "#e3f2fd", bg: "#1565c0" },
    2:  { label: "Ditugaskan ke Reviewer",   color: "#e8eaf6", bg: "#3949ab" },
    3:  { label: "Tidak Lolos Desk",         color: "#fce4ec", bg: "#c62828" },
    4:  { label: "Lolos Desk",               color: "#e8f5e9", bg: "#2e7d32" },
    5:  { label: "Wawancara Dijadwalkan",    color: "#fff8e1", bg: "#f57f17" },
    6:  { label: "Panel Wawancara",          color: "#e8eaf6", bg: "#3949ab" },
    7:  { label: "Tidak Lolos Wawancara",    color: "#fce4ec", bg: "#c62828" },
    8:  { label: "Lolos Wawancara",          color: "#e8f5e9", bg: "#2e7d32" },
    9:  { label: "Pembimbing Diajukan",      color: "#e3f2fd", bg: "#1565c0" },
    10: { label: "Pembimbing Disetujui",     color: "#e8f5e9", bg: "#2e7d32" },
  };
  return map[statusCode] || { label: "Unknown", color: "#f5f5f5", bg: "#666" };
};

const PeranPill = ({ peran }) => (
  <StatusPill
    label={peran === 1 ? "Ketua" : "Anggota"}
    color={peran === 1 ? "#e8eaf6" : "#f5f5f5"}
    bg={peran === 1 ? "#3949ab" : "#555"}
  />
);

const MemberTable = ({ members, showStatus = false }) => (
  <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "hidden" }}>
    <Table>
      <TableHead>
        <TableRow>
          {["Nama", "NIM", "Email", "Prodi", "Peran", ...(showStatus ? ["Status"] : [])].map((h, i) => (
            <TableCell key={i} sx={tableHeadCell}>{h}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {members?.map((member, index) => (
          <TableRow key={index} sx={tableBodyRow}>
            <TableCell><Typography sx={{ fontWeight: 600, fontSize: 14 }}>{member.nama_lengkap}</Typography></TableCell>
            <TableCell><Typography sx={{ fontSize: 13, color: "#000" }}>{member.nim}</Typography></TableCell>
            <TableCell><Typography sx={{ fontSize: 13, color: "#000" }}>{member.email}</Typography></TableCell>
            <TableCell><Typography sx={{ fontSize: 13, color: "#000" }}>{member.nama_prodi}</Typography></TableCell>
            <TableCell><PeranPill peran={member.peran} /></TableCell>
            {showStatus && (
              <TableCell>
                <StatusPill
                  label={member.status === 1 ? "Disetujui" : "Menunggu"}
                  color={member.status === 1 ? "#e8f5e9" : "#fff8e1"}
                  bg={member.status === 1 ? "#2e7d32" : "#f57f17"}
                />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

export default function ProposalFormPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [kategoriOptions, setKategoriOptions] = useState([]);
  const [alert, setAlert] = useState("");
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const [form, setForm] = useState({ judul: "", id_kategori: "", modal_diajukan: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => { fetchStatus(); fetchKategori(); }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await getProposalStatus();
      setStatus(response.data);
      if (response.data.data?.proposal) {
        const p = response.data.data.proposal;
        setForm({ judul: p.judul || "", id_kategori: p.id_kategori || "", modal_diajukan: p.modal_diajukan || "" });
        if (p.file_proposal) setFilePreview({ name: p.file_proposal, isExisting: true });
      }
    } catch (err) {
      console.error("Error fetching proposal status:", err);
      setAlert("Gagal memuat status proposal");
    } finally {
      setLoading(false);
    }
  };

  const fetchKategori = async () => {
    try {
      const response = await getAllKategori();
      if (response.success) setKategoriOptions(response.data);
    } catch (err) { console.error(err); }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf") { setAlert("File harus berformat PDF"); e.target.value = ""; return; }
    if (selectedFile.size > 10 * 1024 * 1024) { setAlert("Ukuran file maksimal 10 MB"); e.target.value = ""; return; }
    setFile(selectedFile);
    setFilePreview({ name: selectedFile.name, isExisting: false });
    setAlert("");
    setErrors({ ...errors, file: "" });
  };

  const handleRemoveFile = () => {
    setFile(null); setFilePreview(null);
    const el = document.getElementById("file-upload");
    if (el) el.value = "";
  };

  const validate = () => {
    const newErrors = {};
    if (!form.judul?.trim()) newErrors.judul = "Judul proposal wajib diisi";
    else if (form.judul.length > 200) newErrors.judul = "Judul maksimal 200 karakter";
    if (!form.id_kategori) newErrors.id_kategori = "Kategori usaha wajib dipilih";
    if (!form.modal_diajukan || form.modal_diajukan <= 0) newErrors.modal_diajukan = "Anggaran dana wajib diisi";
    if (!status?.data?.proposal && !file) newErrors.file = "File proposal wajib diunggah";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { setAlert("Mohon lengkapi semua field yang wajib diisi"); return; }
    setSubmitting(true); setAlert("");
    try {
      const formData = new FormData();
      formData.append("id_program", status.data.tim.id_program);
      formData.append("judul", form.judul.trim());
      formData.append("id_kategori", form.id_kategori);
      formData.append("modal_diajukan", form.modal_diajukan);
      if (file) formData.append("file_proposal", file);
      const response = status.data.proposal
        ? await updateProposal(status.data.proposal.id_proposal, formData)
        : await createProposal(formData);
      await Swal.fire({ icon: "success", title: "Berhasil", text: response.message || "Draft proposal berhasil disimpan", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchStatus();
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal menyimpan proposal";
      setAlert(msg);
      await Swal.fire({ icon: "error", title: "Gagal", text: msg, confirmButtonText: "OK" });
    } finally { setSubmitting(false); }
  };

  const handleSubmit = async () => {
    if (!status?.data?.proposal) { setAlert("Simpan proposal terlebih dahulu sebelum submit"); return; }
    const result = await Swal.fire({ title: "Konfirmasi Submit", text: "Setelah submit, proposal tidak bisa diedit lagi. Lanjutkan?", icon: "warning", showCancelButton: true, confirmButtonColor: "#0D59F2", cancelButtonColor: "#d33", confirmButtonText: "Ya, Submit", cancelButtonText: "Batal" });
    if (!result.isConfirmed) return;
    setSubmitting(true);
    try {
      const response = await submitProposal(status.data.proposal.id_proposal);
      await Swal.fire({ icon: "success", title: "Berhasil", text: response.message || "Proposal berhasil diajukan", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchStatus();
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal submit proposal";
      await Swal.fire({ icon: "error", title: "Gagal", text: msg, confirmButtonText: "OK" });
    } finally { setSubmitting(false); }
  };

  const formatRupiah = (value) => value ? new Intl.NumberFormat("id-ID").format(value) : "";

  const handleModalChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setForm({ ...form, modal_diajukan: value });
    setErrors({ ...errors, modal_diajukan: "" });
    setAlert("");
  };

  const FileBox = ({ fileName, isExisting = false, showDownload = false, canRemove = false }) => (
    <Box sx={{ border: "1.5px solid #f0f0f0", borderRadius: "12px", p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fafafa" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: "8px", backgroundColor: "#e3f2fd", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AttachFile sx={{ color: "#1565c0", fontSize: 18 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{fileName}</Typography>
          {isExisting && <Typography sx={{ fontSize: 11, color: "#2e7d32", fontWeight: 600 }}>File Tersimpan</Typography>}
        </Box>
      </Box>
      <Box sx={{ display: "flex", gap: 1 }}>
        {showDownload && (
          <Button
            startIcon={<Download sx={{ fontSize: 16 }} />}
            component="a"
            href={`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/proposal/${fileName}`}
            target="_blank"
            size="small"
            sx={{ textTransform: "none", borderRadius: "50px", fontSize: 13, fontWeight: 600, color: "#0D59F2", border: "1.5px solid #0D59F2", px: 2, "&:hover": { backgroundColor: "#f0f4ff" } }}
          >
            Download
          </Button>
        )}
        {canRemove && (
          <IconButton size="small" onClick={handleRemoveFile} sx={{ color: "#e53935", backgroundColor: "rgba(229,57,53,0.06)", borderRadius: "8px", "&:hover": { backgroundColor: "rgba(229,57,53,0.12)" } }}>
            <Close fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Box>
  );

  if (loading) {
    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}><CircularProgress /></Box>
      </BodyLayout>
    );
  }

  if (!status?.hasTim) {
    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <Box>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Form Proposal</Typography>
          <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>Lengkapi form di bawah ini untuk mendaftarkan proposal Anda</Typography>
          <Alert severity="warning" sx={{ borderRadius: "12px" }}>Anda belum terdaftar dalam tim. Silakan ajukan anggota tim terlebih dahulu.</Alert>
        </Box>
      </BodyLayout>
    );
  }

  if (!status?.isKetua) {
    if (status?.data?.proposal) {
      const proposal = status.data.proposal;
      const si = getStatusInfo(proposal.status);
      return (
        <BodyLayout Sidebar={SidebarMahasiswa}>
          <Box>
            <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Form Proposal</Typography>
            <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>Detail proposal tim Anda</Typography>
            <Alert severity="info" sx={{ mb: 3, borderRadius: "12px" }}>Anda adalah anggota tim. Proposal hanya dapat diedit oleh ketua tim.</Alert>

            <Paper sx={{ p: 4, mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
              <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>Detail Proposal</Typography>

              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>Judul Proposal</Typography>
                <TextField fullWidth value={proposal.judul || ""} disabled multiline rows={2} sx={roundedField} />
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
                <Box>
                  <Typography sx={{ fontWeight: 600, mb: 1 }}>Program</Typography>
                  <TextField fullWidth value={status?.data?.tim?.keterangan || ""} disabled sx={roundedField} />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 600, mb: 1 }}>Kategori Usaha</Typography>
                  <TextField fullWidth value={proposal.nama_kategori || ""} disabled sx={roundedField} />
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>Anggaran Dana</Typography>
                <TextField fullWidth value={formatRupiah(proposal.modal_diajukan)} disabled sx={roundedField} InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: "#555" }}>Rp</Typography> }} />
              </Box>

              {proposal.file_proposal && (
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontWeight: 600, mb: 1 }}>File Proposal</Typography>
                  <FileBox fileName={proposal.file_proposal} isExisting showDownload />
                </Box>
              )}

              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Status Proposal</Typography>
                <StatusPill label={si.label} bg={si.bg} color={si.color} />
              </Box>
            </Paper>

            <Paper sx={{ p: 4, mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
              <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>Anggota Tim</Typography>
              <MemberTable members={status.data.anggota.members} />
            </Paper>

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={() => (window.location.href = "/mahasiswa/proposal")} sx={{ textTransform: "none", borderRadius: "50px", px: 4, py: 1.2, fontWeight: 600, backgroundColor: "#FDB022", color: "#fff", "&:hover": { backgroundColor: "#e09a1a" } }}>
                Kembali
              </Button>
            </Box>
          </Box>
        </BodyLayout>
      );
    }

    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <Box>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Form Proposal</Typography>
          <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>Lengkapi form di bawah ini untuk mendaftarkan proposal Anda</Typography>
          <Alert severity="info" sx={{ borderRadius: "12px" }}>Hanya ketua tim yang dapat mengajukan proposal. Proposal akan muncul di sini setelah dibuat oleh ketua.</Alert>
        </Box>
      </BodyLayout>
    );
  }

  if (!status?.data?.anggota?.all_accepted) {
    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <Box>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Form Proposal</Typography>
          <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>Lengkapi form di bawah ini untuk mendaftarkan proposal Anda</Typography>
          <Alert severity="warning" sx={{ mb: 3, borderRadius: "12px" }}>Belum semua anggota menyetujui undangan. Pengajuan proposal hanya bisa dilakukan setelah semua anggota menyetujui undangan.</Alert>

          <Paper sx={{ p: 4, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 3 }}>Status Anggota Tim</Typography>
            <MemberTable members={status.data.anggota.members} showStatus />
          </Paper>
        </Box>
      </BodyLayout>
    );
  }

  const isDraft = status?.data?.proposal?.status === 0;
  const isReadOnly = status?.data?.proposal && !isDraft;
  const canEdit = !isReadOnly && status?.timelineOpen;
  const si = status?.data?.proposal ? getStatusInfo(status.data.proposal.status) : null;

  return (
    <BodyLayout Sidebar={SidebarMahasiswa}>
      <Box>
        <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Form Proposal</Typography>
        <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>Lengkapi form di bawah ini untuk mendaftarkan proposal Anda</Typography>

        {alert && <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setAlert("")}>{alert}</Alert>}
        {!status?.timelineOpen && <Alert severity="warning" sx={{ mb: 3, borderRadius: "12px" }}>Pendaftaran proposal untuk program ini sudah ditutup.</Alert>}
        {isReadOnly && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: "12px" }}>
            Proposal sudah diajukan dan tidak bisa diedit. Status: <strong>{getStatusInfo(status.data.proposal.status).label}</strong>
          </Alert>
        )}

        <Paper sx={{ p: 4, mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>Detail Proposal</Typography>

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>Judul Proposal {canEdit && <span style={{ color: "red" }}>*</span>}</Typography>
            <TextField
              fullWidth multiline rows={2}
              placeholder="Masukkan judul proposal Anda"
              value={form.judul}
              onChange={(e) => { setForm({ ...form, judul: e.target.value }); setErrors({ ...errors, judul: "" }); setAlert(""); }}
              error={!!errors.judul} helperText={errors.judul}
              disabled={!canEdit || submitting}
              inputProps={{ maxLength: 200 }}
              sx={roundedField}
            />
            <Typography sx={{ fontSize: 12, color: "#999", mt: 0.5 }}>{form.judul.length}/200 karakter</Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>Program</Typography>
              <TextField fullWidth value={status?.data?.tim?.keterangan || ""} disabled sx={roundedField} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>Kategori Usaha {canEdit && <span style={{ color: "red" }}>*</span>}</Typography>
              <TextField
                select fullWidth
                value={form.id_kategori}
                onChange={(e) => { setForm({ ...form, id_kategori: e.target.value }); setErrors({ ...errors, id_kategori: "" }); setAlert(""); }}
                error={!!errors.id_kategori} helperText={errors.id_kategori}
                disabled={!canEdit || submitting}
                sx={roundedField}
              >
                <MenuItem value="">Pilih kategori usaha</MenuItem>
                {kategoriOptions.map((kat) => (
                  <MenuItem key={kat.id_kategori} value={kat.id_kategori}>{kat.nama_kategori}</MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>Anggaran Dana {canEdit && <span style={{ color: "red" }}>*</span>}</Typography>
            <TextField
              fullWidth
              placeholder="Masukkan anggaran dana"
              value={formatRupiah(form.modal_diajukan)}
              onChange={handleModalChange}
              error={!!errors.modal_diajukan} helperText={errors.modal_diajukan}
              disabled={!canEdit || submitting}
              sx={roundedField}
              InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: "#555" }}>Rp</Typography> }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>Upload Proposal {canEdit && <span style={{ color: "red" }}>*</span>}</Typography>

            {isReadOnly && status.data.proposal.file_proposal ? (
              <FileBox fileName={status.data.proposal.file_proposal} isExisting showDownload />
            ) : filePreview ? (
              <>
                <FileBox fileName={filePreview.name} isExisting={filePreview.isExisting} canRemove={canEdit && !submitting} />
                {errors.file && <Typography sx={{ color: "error.main", fontSize: 12, mt: 1 }}>{errors.file}</Typography>}
              </>
            ) : (
              <>
                <Box
                  component="label" htmlFor="file-upload"
                  sx={{
                    border: "2px dashed", borderColor: errors.file ? "#d32f2f" : "#e0e0e0",
                    borderRadius: "14px", p: 5, textAlign: "center",
                    backgroundColor: "#fafafa",
                    cursor: canEdit && !submitting ? "pointer" : "not-allowed",
                    transition: "all 0.2s",
                    "&:hover": canEdit && !submitting ? { backgroundColor: "#f0f4ff", borderColor: "#0D59F2" } : {},
                    display: "block",
                  }}
                >
                  <input type="file" accept="application/pdf" onChange={handleFileChange} style={{ display: "none" }} id="file-upload" disabled={!canEdit || submitting} />
                  <Box sx={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "#e3f2fd", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 1.5 }}>
                    <CloudUpload sx={{ fontSize: 28, color: "#1565c0" }} />
                  </Box>
                  <Typography sx={{ color: "#444", fontWeight: 600, mb: 0.5 }}>Klik atau seret file PDF ke sini</Typography>
                  <Typography sx={{ fontSize: 12, color: "#999" }}>Maksimal 10 MB</Typography>
                </Box>
                {errors.file && <Typography sx={{ color: "error.main", fontSize: 12, mt: 1 }}>{errors.file}</Typography>}
              </>
            )}
          </Box>

          {si && (
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1.5 }}>Status Proposal</Typography>
              <StatusPill label={si.label} bg={si.bg} color={si.color} />
            </Box>
          )}
        </Paper>

        <Paper sx={{ p: 4, mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>Anggota Tim</Typography>
          <MemberTable members={status.data.anggota.members} />
        </Paper>

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button
            onClick={() => (window.location.href = "/mahasiswa/proposal")}
            disabled={submitting}
            sx={{ textTransform: "none", borderRadius: "50px", px: 4, py: 1.2, fontWeight: 600, backgroundColor: "#FDB022", color: "#fff", "&:hover": { backgroundColor: "#e09a1a" } }}
          >
            Kembali
          </Button>

          {canEdit && (
            <>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={submitting}
                sx={{ textTransform: "none", borderRadius: "50px", px: 4, py: 1.2, fontWeight: 600, backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0846c7" } }}
              >
                {submitting ? "Menyimpan..." : "Simpan"}
              </Button>

              {isDraft && status?.data?.proposal && (
                <Button
                  variant="contained"
                  startIcon={<Send />}
                  onClick={handleSubmit}
                  disabled={submitting}
                  sx={{ textTransform: "none", borderRadius: "50px", px: 4, py: 1.2, fontWeight: 600, backgroundColor: "#2e7d32", "&:hover": { backgroundColor: "#1b5e20" } }}
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