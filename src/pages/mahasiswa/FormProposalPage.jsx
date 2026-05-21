import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Paper, Typography, Button, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, CircularProgress,
} from "@mui/material";
import { CloudUpload, Send, Save, Close, AttachFile, ArrowBack, Description, Group } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import MahasiswaNavbar from "../../components/layouts/MahasiswaNavbar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import {
  getProposalStatus, createProposal, updateProposal, submitProposal,
} from "../../api/mahasiswa";
import { getAllKategori } from "../../api/public";
import { downloadFile } from "../../utils/download";
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
  "& td": { borderBottom: "1px solid #f5f5f5", py: 2 },
};


const validateProposalFilename = (filename) => {
  const nameWithoutExt = filename.replace(/\.pdf$/i, "");
  const parts = nameWithoutExt.split("_");
  if (parts.length !== 3) {
    return {
      valid: false,
      message: 'Format nama file tidak valid. Gunakan format: "Program_Nama Tim_Judul Proposal.pdf" (dipisahkan dengan underscore). Contoh: "PMW_Tim Inovasi_Alat Pembersih Otomatis.pdf"',
    };
  }
  const labels = ["Program", "Nama Tim", "Judul Proposal"];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].trim() === "") {
      return {
        valid: false,
        message: `Bagian "${labels[i]}" pada nama file tidak boleh kosong. Format: "Program_Nama Tim_Judul Proposal.pdf"`,
      };
    }
  }
  return { valid: true };
};

const getStatusInfo = (statusCode) => {
  const map = {
    0:  { label: "Draft",                   backgroundColor: "#666" },
    1:  { label: "Diajukan",                backgroundColor: "#1565c0" },
    2:  { label: "Ditugaskan ke Reviewer",  backgroundColor: "#3949ab" },
    3:  { label: "Tidak Lolos Desk",        backgroundColor: "#c62828" },
    4:  { label: "Lolos Desk",              backgroundColor: "#2e7d32" },
    5:  { label: "Wawancara Dijadwalkan",   backgroundColor: "#f57f17" },
    6:  { label: "Wawancara",         backgroundColor: "#3949ab" },
    7:  { label: "Tidak Lolos Wawancara",   backgroundColor: "#c62828" },
    8:  { label: "Lolos Wawancara",         backgroundColor: "#2e7d32" },
    9:  { label: "Pembimbing Disetujui",    backgroundColor: "#2e7d32" },
    10: { label: "Nonaktif / Mengundurkan Diri", backgroundColor: "#c62828" },
  };
  return map[statusCode] || { label: "Unknown", backgroundColor: "#666" };
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

const StatusPill = ({ label, backgroundColor }) => (
  <Box sx={{
    display: "inline-flex", alignItems: "center",
    px: 1.5, py: 0.4, borderRadius: "50px",
    backgroundColor, color: "#fff",
    fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
  }}>
    {label}
  </Box>
);

const FileBox = ({ fileName, isExisting = false, showDownload = false, canRemove = false, onRemove }) => (
  <Box sx={{
    border: "1.5px solid #f0f0f0", borderRadius: "12px", p: 2,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#fafafa",
  }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box sx={{
        width: 36, height: 36, borderRadius: "8px",
        backgroundColor: COLORS.primaryLight,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <AttachFile sx={{ color: COLORS.primary, fontSize: 18 }} />
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{fileName}</Typography>
        {isExisting && (
          <Typography sx={{ fontSize: 11, color: COLORS.success, fontWeight: 600 }}>File Tersimpan</Typography>
        )}
      </Box>
    </Box>
    <Box sx={{ display: "flex", gap: 1 }}>
      {showDownload && (
        <Button
          onClick={() => downloadFile(fileName)}
          size="small"
          sx={{
            textTransform: "none", borderRadius: "50px", fontSize: 13,
            fontWeight: 600, color: COLORS.primary,
            border: `1.5px solid ${COLORS.primary}`, px: 2,
            "&:hover": { backgroundColor: COLORS.primaryLight },
          }}
        >
          Download
        </Button>
      )}
      {canRemove && (
        <IconButton
          size="small"
          onClick={onRemove}
          sx={{
            color: COLORS.error,
            backgroundColor: `${COLORS.errorLight}`,
            borderRadius: "8px",
            "&:hover": { backgroundColor: "#FCA5A5" },
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      )}
    </Box>
  </Box>
);

const MemberTable = ({ members, showStatus = false }) => (
  <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "hidden", overflowX: "auto" }}>
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
            <TableCell><Typography sx={{ fontSize: 13 }}>{member.nim}</Typography></TableCell>
            <TableCell><Typography sx={{ fontSize: 13 }}>{member.email}</Typography></TableCell>
            <TableCell><Typography sx={{ fontSize: 13 }}>{member.nama_prodi}</Typography></TableCell>
            <TableCell>
              <StatusPill
                label={member.peran === 1 ? "Ketua" : "Anggota"}
                backgroundColor={member.peran === 1 ? "#3949ab" : "#555"}
              />
            </TableCell>
            {showStatus && (
              <TableCell>
                <StatusPill
                  label={member.status === 1 ? "Disetujui" : "Menunggu"}
                  backgroundColor={member.status === 1 ? "#2e7d32" : "#f57f17"}
                />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

const BackButton = ({ navigate }) => (
  <Button
    onClick={() => navigate("/mahasiswa/proposal")}
    startIcon={<ArrowBack />}
    sx={{
      borderRadius: "50px", textTransform: "none",
      color: COLORS.primary, fontSize: 13, fontWeight: 500,
      p: 0, mb: 2, minWidth: 0,
      "&:hover": { backgroundColor: "transparent" },
    }}
  >
    Kembali ke Daftar Proposal
  </Button>
);


export default function ProposalFormPage() {
  const navigate = useNavigate();
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [status, setStatus]             = useState(null);
  const [kategoriOptions, setKategoriOptions] = useState([]);
  const [file, setFile]                 = useState(null);
  const [filePreview, setFilePreview]   = useState(null);
  const [fileNameError, setFileNameError] = useState("");
  const [form, setForm]                 = useState({ judul: "", id_kategori: "", modal_diajukan: "" });
  const [errors, setErrors]             = useState({});
  const [isDragging, setIsDragging]     = useState(false);

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
    } catch {
      await Swal.fire({
        icon: "error", title: "Gagal Memuat",
        text: "Gagal memuat status proposal. Silahkan refresh halaman.",
        confirmButtonText: "OK",
      });
    } finally { setLoading(false); }
  };

  const fetchKategori = async () => {
    try {
      const response = await getAllKategori();
      if (response.success) setKategoriOptions(response.data);
    } catch {}
  };

  const processFile = (selectedFile) => {
    const el = document.getElementById("file-upload");
    if (hasSuspiciousInput(selectedFile.name) || hasSqlInjection(selectedFile.name)) {
      Swal.fire({ icon: "warning", title: "Nama File Tidak Valid", text: "Nama file mengandung karakter terlarang", confirmButtonText: "OK" });
      if (el) el.value = "";
      return;
    }
    if (selectedFile.type !== "application/pdf") {
      Swal.fire({ icon: "warning", title: "Format Salah", text: "File harus berformat PDF", confirmButtonText: "OK" });
      if (el) el.value = "";
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      Swal.fire({ icon: "warning", title: "File Terlalu Besar", text: "Ukuran file maksimal 10 MB", confirmButtonText: "OK" });
      if (el) el.value = "";
      return;
    }
    const nameValidation = validateProposalFilename(selectedFile.name);
    setFileNameError(nameValidation.valid ? "" : nameValidation.message);
    setFile(selectedFile);
    setFilePreview({ name: selectedFile.name, isExisting: false });
    setErrors((p) => ({ ...p, file: "" }));
    if (el) el.value = "";
  };

  const handleFileChange  = (e) => { const f = e.target.files[0]; if (f) processFile(f); };
  const handleDragOver    = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDragEnter   = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave   = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop        = (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (!canEdit || submitting) return;
    const files = e.dataTransfer.files;
    if (files?.length > 0) { document.getElementById("file-upload").value = ""; processFile(files[0]); }
  };
  const handleRemoveFile  = () => {
    setFile(null); setFilePreview(null); setFileNameError("");
    const el = document.getElementById("file-upload");
    if (el) el.value = "";
  };

  const validate = () => {
    const e = {};
    if (!form.judul?.trim())                     e.judul = "Judul proposal wajib diisi";
    else if (form.judul.length > 200)            e.judul = "Judul maksimal 200 karakter";
    if (!form.id_kategori)                       e.id_kategori = "Kategori usaha wajib dipilih";
    if (!form.modal_diajukan || form.modal_diajukan <= 0) e.modal_diajukan = "Anggaran dana wajib diisi";
    if (!status?.data?.proposal && !file)        e.file = "File proposal wajib diunggah";
    if (file && fileNameError)                   e.file = "Perbaiki nama file sebelum menyimpan";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const securityCheck = validateFormSecurity({
      judul: form.judul,
      id_kategori: form.id_kategori,
      modal_diajukan: form.modal_diajukan,
    });
    if (!securityCheck.isValid) {
      setErrors((prev) => ({ ...prev, [securityCheck.field]: securityCheck.message }));
      return;
    }

    setSubmitting(true);
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
      await Swal.fire({
        icon: "success", title: "Berhasil",
        text: response.message || "Draft proposal berhasil disimpan",
        timer: 2000, timerProgressBar: true, showConfirmButton: false,
      });
      fetchStatus();
    } catch (err) {
      await Swal.fire({
        icon: "error", title: "Gagal",
        text: err.response?.data?.message || "Gagal menyimpan proposal",
        confirmButtonText: "OK",
      });
    } finally { setSubmitting(false); }
  };

  const handleSubmit = async () => {
    if (!status?.data?.proposal) return;

    const result = await Swal.fire({
      title: "Konfirmasi Submit",
      text: "Setelah submit, proposal tidak bisa diedit lagi. Lanjutkan?",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: COLORS.primary, cancelButtonColor: COLORS.error,
      confirmButtonText: "Ya, Submit", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;

    setSubmitting(true);
    try {
      // If there are unsaved changes (edited form or new file), save first
      if (status.data.proposal && (file || form.judul !== status.data.proposal.judul || Number(form.id_kategori) !== Number(status.data.proposal.id_kategori) || String(form.modal_diajukan) !== String(status.data.proposal.modal_diajukan))) {
        const formData = new FormData();
        formData.append("id_program", status.data.tim.id_program);
        formData.append("judul", form.judul.trim());
        formData.append("id_kategori", form.id_kategori);
        formData.append("modal_diajukan", form.modal_diajukan);
        if (file) formData.append("file_proposal", file);
        await updateProposal(status.data.proposal.id_proposal, formData);
      }

      const response = await submitProposal(status.data.proposal.id_proposal);
      await Swal.fire({
        icon: "success", title: "Berhasil",
        text: response.message || "Proposal berhasil diajukan",
        timer: 2000, timerProgressBar: true, showConfirmButton: false,
      });
      fetchStatus();
    } catch (err) {
      await Swal.fire({
        icon: "error", title: "Gagal",
        text: err.response?.data?.message || "Gagal submit proposal",
        confirmButtonText: "OK",
      });
    } finally { setSubmitting(false); }
  };

  const formatRupiah      = (value) => value ? new Intl.NumberFormat("id-ID").format(value) : "";
  const handleModalChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setForm((p) => ({ ...p, modal_diajukan: value }));
    setErrors((p) => ({ ...p, modal_diajukan: "" }));
  };

  const anggotaAccepted    = status?.data?.anggota?.all_accepted === true;
  const pembimbingStatus   = status?.data?.pembimbing?.status;
  const pembimbingDisetujui = pembimbingStatus === 1;
  const pembimbingDitolak  = pembimbingStatus === 2;
  const proposalReady      = anggotaAccepted && pembimbingDisetujui && status?.timelineOpen;
  const isDraft            = status?.data?.proposal?.status === 0;
  const isReadOnly         = status?.data?.proposal && !isDraft;
  const canEdit            = !isReadOnly && proposalReady;
  const si                 = status?.data?.proposal ? getStatusInfo(status.data.proposal.status) : null;

  if (loading) return (
    <BodyLayout Sidebar={MahasiswaNavbar}>
      <Box sx={{ position: "relative", minHeight: "60vh" }}>
        <LoadingScreen message="Memuat form proposal..." overlay minHeight="60vh" />
      </Box>
    </BodyLayout>
  );

  if (!status?.hasTim) return (
    <BodyLayout Sidebar={MahasiswaNavbar}>
      <PageTransition>
        <Box>
          <BackButton navigate={navigate} />
          <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>Form Proposal</Typography>
          <Typography sx={{ fontSize: 16, color: "#6B7280", mb: 4 }}>
            Lengkapi form di bawah ini untuk mendaftarkan proposal Anda
          </Typography>
          <Box sx={{ p: 2.5, borderRadius: "12px", backgroundColor: COLORS.warningLight, border: `1.5px solid #FDE68A`, display: "flex", gap: 1.5 }}>
            <Box sx={{ width: 8, height: 8, mt: 0.6, borderRadius: "50%", background: COLORS.warning, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 13, color: "#92400E" }}>
              Anda belum terdaftar dalam tim. Silahkan ajukan anggota tim terlebih dahulu.
            </Typography>
          </Box>
        </Box>
      </PageTransition>
    </BodyLayout>
  );

  if (!status?.isKetua) {
    if (status?.data?.proposal) {
      const proposal = status.data.proposal;
      const siAnggota = getStatusInfo(proposal.status);
      return (
        <BodyLayout Sidebar={MahasiswaNavbar}>
          <PageTransition>
            <Box>
              <BackButton navigate={navigate} />
              <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>Form Proposal</Typography>
              <Typography sx={{ fontSize: 16, color: "#6B7280", mb: 4 }}>Detail proposal tim Anda</Typography>

              <Box sx={{ mb: 3, p: 2.5, borderRadius: "12px", backgroundColor: COLORS.primaryLight, border: `1.5px solid ${COLORS.primaryMuted}`, display: "flex", gap: 1.5 }}>
                <Box sx={{ width: 8, height: 8, mt: 0.6, borderRadius: "50%", background: COLORS.primary, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 13, color: COLORS.primaryDark }}>
                  Anda adalah anggota tim. Proposal hanya dapat diedit oleh ketua tim.
                </Typography>
              </Box>

              <Paper elevation={0} sx={{ mb: 3, borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
                <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
                <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
                  <SectionHeader
                    icon={Description}
                    title="Detail Proposal"
                    subtitle="Informasi dan berkas proposal tim"
                    gradient={`linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`}
                  />
                  <Box sx={{ mb: 3 }}>
                    <FieldLabel>Judul Proposal</FieldLabel>
                    <TextField fullWidth value={proposal.judul || ""} disabled multiline rows={2} sx={roundedField} />
                  </Box>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: 3 }}>
                    <Box>
                      <FieldLabel>Program</FieldLabel>
                      <ReadonlyField value={status?.data?.tim?.keterangan} />
                    </Box>
                    <Box>
                      <FieldLabel>Kategori Usaha</FieldLabel>
                      <ReadonlyField value={proposal.nama_kategori} />
                    </Box>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <FieldLabel>Anggaran Dana</FieldLabel>
                    <TextField
                      fullWidth value={formatRupiah(proposal.modal_diajukan)} disabled sx={roundedField}
                      InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: COLORS.slate }}>Rp</Typography> }}
                    />
                  </Box>
                  {proposal.file_proposal && (
                    <Box sx={{ mb: 3 }}>
                      <FieldLabel>File Proposal</FieldLabel>
                      <FileBox fileName={proposal.file_proposal} isExisting showDownload />
                    </Box>
                  )}
                  <Box>
                    <FieldLabel>Status Proposal</FieldLabel>
                    <StatusPill label={siAnggota.label} backgroundColor={siAnggota.backgroundColor} />
                  </Box>
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ mb: 3, borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
                <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.secondary}, ${COLORS.accent})` }} />
                <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
                  <SectionHeader
                    icon={Group}
                    title="Anggota Tim"
                    subtitle="Daftar anggota tim pengusul"
                    gradient={`linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.accent} 100%)`}
                  />
                  <MemberTable members={status.data.anggota.members} />
                </Box>
              </Paper>

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  onClick={() => navigate("/mahasiswa/proposal")}
                  sx={{
                    textTransform: "none", borderRadius: "10px", px: 4, py: 1.3,
                    fontWeight: 700, fontSize: 14,
                    backgroundColor: COLORS.warning, color: "#fff",
                    "&:hover": { backgroundColor: "#B45309" },
                  }}
                >
                  Kembali
                </Button>
              </Box>
            </Box>
          </PageTransition>
        </BodyLayout>
      );
    }

    return (
      <BodyLayout Sidebar={MahasiswaNavbar}>
        <PageTransition>
          <Box>
            <BackButton navigate={navigate} />
            <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>Form Proposal</Typography>
            <Typography sx={{ fontSize: 16, color: "#6B7280", mb: 4 }}>
              Lengkapi form di bawah ini untuk mendaftarkan proposal Anda
            </Typography>
            <Box sx={{ p: 2.5, borderRadius: "12px", backgroundColor: COLORS.primaryLight, border: `1.5px solid ${COLORS.primaryMuted}`, display: "flex", gap: 1.5 }}>
              <Box sx={{ width: 8, height: 8, mt: 0.6, borderRadius: "50%", background: COLORS.primary, flexShrink: 0 }} />
              <Typography sx={{ fontSize: 13, color: COLORS.primaryDark }}>
                Hanya ketua tim yang dapat mengajukan proposal. Proposal akan muncul di sini setelah dibuat oleh ketua.
              </Typography>
            </Box>
          </Box>
        </PageTransition>
      </BodyLayout>
    );
  }

  return (
    <BodyLayout Sidebar={MahasiswaNavbar}>
      <PageTransition>
        <Box>
          <BackButton navigate={navigate} />

          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              Form Proposal
            </Typography>
            <Typography sx={{ fontSize: 16, color: "#6B7280" }}>
              Lengkapi form di bawah ini untuk mendaftarkan proposal Anda
            </Typography>
          </Box>

          {!status?.timelineOpen && (
            <Box sx={{ mb: 3, p: 2.5, borderRadius: "12px", backgroundColor: COLORS.warningLight, border: `1.5px solid #FDE68A`, display: "flex", gap: 1.5 }}>
              <Box sx={{ width: 8, height: 8, mt: 0.6, borderRadius: "50%", background: COLORS.warning, flexShrink: 0 }} />
              <Typography sx={{ fontSize: 13, color: "#92400E" }}>
                Pendaftaran proposal untuk program ini sudah ditutup.
              </Typography>
            </Box>
          )}

          {!proposalReady && !isReadOnly && (
            <Box sx={{ mb: 3, p: 2.5, borderRadius: "12px", backgroundColor: COLORS.warningLight, border: `1.5px solid #FDE68A` }}>
              <Box sx={{ display: "flex", gap: 1.5, mb: 1 }}>
                <Box sx={{ width: 8, height: 8, mt: 0.6, borderRadius: "50%", background: COLORS.warning, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#92400E" }}>
                  Proposal belum bisa dibuat atau diunggah
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 12.5, color: "#8d6e00", mb: 1.5, pl: 2.5, lineHeight: 1.6 }}>
                Proposal baru dapat di-upload setelah semua anggota tim menyetujui undangan dan dosen pembimbing menyetujui pengajuan.
              </Typography>
              <Box sx={{ display: "grid", gap: 0.8, pl: 2.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography sx={{ fontSize: 13, color: "#6d4c41" }}>Status anggota tim</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: anggotaAccepted ? COLORS.success : COLORS.error }}>
                    {anggotaAccepted ? "Semua disetujui" : "Masih menunggu"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography sx={{ fontSize: 13, color: "#6d4c41" }}>Status pembimbing</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: pembimbingDisetujui ? COLORS.success : pembimbingDitolak ? COLORS.error : COLORS.warning }}>
                    {pembimbingDisetujui ? "Disetujui" : pembimbingDitolak ? "Ditolak" : status?.data?.pembimbing ? "Menunggu respon" : "Belum diajukan"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {isReadOnly && (
            <Box sx={{ mb: 3, p: 2.5, borderRadius: "12px", backgroundColor: COLORS.primaryLight, border: `1.5px solid ${COLORS.primaryMuted}`, display: "flex", gap: 1.5 }}>
              <Box sx={{ width: 8, height: 8, mt: 0.6, borderRadius: "50%", background: COLORS.primary, flexShrink: 0 }} />
              <Typography sx={{ fontSize: 13, color: COLORS.primaryDark }}>
                Proposal sudah diajukan dan tidak bisa diedit. Status:{" "}
                <strong>{getStatusInfo(status.data.proposal.status).label}</strong>
              </Typography>
            </Box>
          )}

          <Paper elevation={0} sx={{ mb: 3, borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <SectionHeader
                icon={Description}
                title="Detail Proposal"
                subtitle="Informasi dan berkas proposal tim"
                gradient={`linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`}
              />

              <Box sx={{ mb: 3 }}>
                <FieldLabel required={canEdit}>Judul Proposal</FieldLabel>
                <TextField
                  fullWidth multiline rows={2}
                  placeholder="Masukkan judul proposal Anda"
                  value={form.judul}
                  onChange={(e) => { setForm((p) => ({ ...p, judul: e.target.value })); setErrors((p) => ({ ...p, judul: "" })); }}
                  error={!!errors.judul} helperText={errors.judul}
                  disabled={!canEdit || submitting}
                  inputProps={{ maxLength: 200 }}
                  sx={roundedField}
                />
                <Typography sx={{ fontSize: 12, color: COLORS.slate, mt: 0.5 }}>
                  {form.judul.length}/200 karakter
                </Typography>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: 3 }}>
                <Box>
                  <FieldLabel>Program</FieldLabel>
                  <ReadonlyField value={status?.data?.tim?.keterangan} />
                </Box>
                <Box>
                  <FieldLabel required={canEdit}>Kategori Usaha</FieldLabel>
                  <TextField
                    select fullWidth value={form.id_kategori}
                    onChange={(e) => { setForm((p) => ({ ...p, id_kategori: e.target.value })); setErrors((p) => ({ ...p, id_kategori: "" })); }}
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

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: 3 }}>
                <Box>
                  <FieldLabel>Dosen Pembimbing</FieldLabel>
                  <ReadonlyField value={status?.data?.pembimbing?.nama_dosen} />
                </Box>
                <Box>
                  <FieldLabel required={canEdit}>Anggaran Dana</FieldLabel>
                  <TextField
                    fullWidth
                    placeholder="Masukkan anggaran dana"
                    value={formatRupiah(form.modal_diajukan)}
                    onChange={handleModalChange}
                    error={!!errors.modal_diajukan} helperText={errors.modal_diajukan}
                    disabled={!canEdit || submitting}
                    sx={roundedField}
                    InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: COLORS.slate }}>Rp</Typography> }}
                  />
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <FieldLabel required={canEdit}>Upload Proposal</FieldLabel>
                {isReadOnly && status.data.proposal.file_proposal ? (
                  <FileBox fileName={status.data.proposal.file_proposal} isExisting showDownload />
                ) : filePreview ? (
                  <>
                    <FileBox
                      fileName={filePreview.name}
                      isExisting={filePreview.isExisting}
                      canRemove={canEdit && !submitting}
                      onRemove={handleRemoveFile}
                    />
                    {fileNameError && !filePreview.isExisting && (
                      <Box sx={{ mt: 1.5, p: 1.5, borderRadius: "10px", backgroundColor: COLORS.errorLight, border: `1.5px solid #FCA5A5` }}>
                        <Typography sx={{ fontSize: 12, color: COLORS.error, fontWeight: 700, mb: 0.5 }}>
                          Format Nama File Tidak Valid
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: COLORS.error }}>{fileNameError}</Typography>
                      </Box>
                    )}
                    {errors.file && <Typography sx={{ color: "error.main", fontSize: 12, mt: 1 }}>{errors.file}</Typography>}
                  </>
                ) : (
                  <>
                    <Box
                      component="label" htmlFor="file-upload"
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      sx={{
                        border: "2px dashed",
                        borderColor: isDragging ? COLORS.primary : errors.file ? COLORS.error : "#e0e0e0",
                        borderRadius: "14px", p: 5, textAlign: "center",
                        backgroundColor: isDragging ? COLORS.primaryLight : "#fafafa",
                        cursor: canEdit && !submitting ? "pointer" : "not-allowed",
                        transition: "all 0.2s",
                        "&:hover": canEdit && !submitting
                          ? { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary }
                          : {},
                        display: "block",
                      }}
                    >
                      <input
                        type="file" accept="application/pdf"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                        id="file-upload"
                        disabled={!canEdit || submitting}
                      />
                      <Box sx={{
                        width: 56, height: 56, borderRadius: "50%",
                        backgroundColor: COLORS.primaryLight,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        mx: "auto", mb: 1.5,
                      }}>
                        <CloudUpload sx={{ fontSize: 28, color: COLORS.primary }} />
                      </Box>
                      <Typography sx={{ color: "#444", fontWeight: 600, mb: 0.5 }}>
                        Klik atau seret file PDF ke sini
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: COLORS.slate }}>Maksimal 10 MB · Format PDF</Typography>
                      <Typography sx={{ fontSize: 11, color: "#aaa", mt: 0.5 }}>
                        Nama file: <strong>Program_Nama Tim_Judul Proposal.pdf</strong>
                      </Typography>
                    </Box>
                    {errors.file && (
                      <Typography sx={{ color: "error.main", fontSize: 12, mt: 1 }}>{errors.file}</Typography>
                    )}
                  </>
                )}
              </Box>

              {si && (
                <Box>
                  <FieldLabel>Status Proposal</FieldLabel>
                  <StatusPill label={si.label} backgroundColor={si.backgroundColor} />
                </Box>
              )}
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ mb: 3, borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.secondary}, ${COLORS.accent})` }} />
            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <SectionHeader
                icon={Group}
                title="Anggota Tim"
                subtitle="Daftar anggota tim pengusul"
                gradient={`linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.accent} 100%)`}
              />
              <MemberTable members={status.data.anggota.members} />
            </Box>
          </Paper>

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, flexWrap: "wrap" }}>
            <Button
              onClick={() => navigate("/mahasiswa/proposal")}
              disabled={submitting}
              sx={{
                px: 4, py: 1.3, textTransform: "none", fontWeight: 700,
                borderRadius: "10px", fontSize: 14,
                backgroundColor: COLORS.warning, color: "#fff",
                "&:hover": { backgroundColor: "#B45309" },
                "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" },
              }}
            >
              Kembali
            </Button>

            {canEdit && (
              <>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={submitting}
                  sx={{
                    px: 4, py: 1.3, textTransform: "none", fontWeight: 700,
                    borderRadius: "10px", fontSize: 14,
                    backgroundColor: COLORS.primary,
                    "&:hover": { backgroundColor: COLORS.primaryDark },
                    "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" },
                  }}
                >
                  {submitting ? "Menyimpan..." : "Simpan"}
                </Button>

                {isDraft && status?.data?.proposal && (
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={submitting}
                    sx={{
                      px: 4, py: 1.3, textTransform: "none", fontWeight: 700,
                      borderRadius: "10px", fontSize: 14,
                      backgroundColor: COLORS.success,
                      "&:hover": { backgroundColor: "#047857" },
                      "&:disabled": { backgroundColor: "#E5E7EB", color: "#9CA3AF" },
                    }}
                  >
                    {submitting ? "Mengajukan..." : "Simpan & Ajukan"}
                  </Button>
                )}
              </>
            )}
          </Box>
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}