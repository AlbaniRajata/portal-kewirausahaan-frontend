import { useState, useEffect } from "react";
import {
  Box, Paper, Typography, Button,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField,
} from "@mui/material";
import { Description, Groups } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import MahasiswaNavbar from "../../components/layouts/MahasiswaNavbar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import { getProposalStatus } from "../../api/mahasiswa";
import { getAllProgram } from "../../api/public";

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

const FieldLabel = ({ children }) => (
  <Typography sx={{ fontWeight: 600, mb: 0.8, fontSize: 13, color: "#374151" }}>
    {children}
  </Typography>
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

const InfoBox = ({ children, type = "info" }) => {
  const styles = {
    info: {
      bg: COLORS.primaryLight, border: COLORS.primaryMuted, dot: COLORS.primary, text: COLORS.primaryDark,
    },
    warning: {
      bg: COLORS.warningLight, border: "#FDE68A", dot: COLORS.warning, text: "#92400E",
    },
    error: {
      bg: COLORS.errorLight, border: "#FCA5A5", dot: COLORS.error, text: "#7F1D1D",
    },
    success: {
      bg: COLORS.successLight, border: "#6EE7B7", dot: COLORS.success, text: "#065F46",
    },
  };
  const s = styles[type] || styles.info;
  return (
    <Box sx={{
      mb: 3, p: 2.5, borderRadius: "14px",
      background: s.bg,
      border: `1.5px solid ${s.border}`,
      display: "flex", gap: 1.5, alignItems: "flex-start",
    }}>
      <Box sx={{ width: 8, height: 8, mt: 0.8, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      <Typography sx={{ fontSize: 13.5, color: s.text, fontWeight: 600, lineHeight: 1.6 }}>
        {children}
      </Typography>
    </Box>
  );
};

const tableHeadCell = {
  fontWeight: 700, fontSize: 13, color: "#1F2937",
  backgroundColor: COLORS.slateLight, borderBottom: `2px solid #E5E7EB`, py: 2,
};

const tableBodyRow = {
  "&:hover": { backgroundColor: "#F8FAFF" },
  "& td": { borderBottom: "1px solid #F3F4F6", py: 2 },
};

const getProgramStatus = (item) => {
  if (!item.pendaftaran_mulai || !item.pendaftaran_selesai)
    return { label: "Belum Diatur", color: "#6d4c41", bgColor: "#efebe9", borderColor: "#bcaaa4" };
  const now = new Date();
  const mulai = new Date(item.pendaftaran_mulai);
  const selesai = new Date(item.pendaftaran_selesai);
  if (now < mulai)   return { label: "Belum Dibuka",   color: "#1565c0", bgColor: "#e3f2fd", borderColor: "#90caf9" };
  if (now <= selesai) return { label: "Sedang Dibuka",  color: "#2e7d32", bgColor: "#e8f5e9", borderColor: "#a5d6a7" };
  return               { label: "Sudah Ditutup",  color: "#c62828", bgColor: "#ffebee", borderColor: "#ef9a9a" };
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
  });
};

const formatRupiah = (value) => {
  if (!value) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
};

const formatDateInline = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
  });
};

const getStatusInfo = (statusCode) => {
  const map = {
    0: { label: "Draft",                  backgroundColor: "#666" },
    1: { label: "Diajukan",               backgroundColor: COLORS.primary },
    2: { label: "Review Tahap 1",         backgroundColor: COLORS.secondary },
    3: { label: "Tidak Lolos Desk",       backgroundColor: COLORS.error },
    4: { label: "Lolos Desk",             backgroundColor: COLORS.success },
    5: { label: "Wawancara",        backgroundColor: COLORS.warning },
    6: { label: "Tidak Lolos Wawancara",  backgroundColor: COLORS.error },
    7: { label: "Lolos Wawancara",        backgroundColor: COLORS.success },
    8: { label: "Pembimbing Diajukan",    backgroundColor: COLORS.primary },
    9: { label: "Pembimbing Disetujui",   backgroundColor: COLORS.success },
    10: { label: "Nonaktif / Mengundurkan Diri", backgroundColor: COLORS.error },
  };
  return map[statusCode] || { label: "Unknown", backgroundColor: "#666" };
};

export default function DaftarProposalPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [programs, setPrograms] = useState([]);

  useEffect(() => { fetchStatus(); fetchPrograms(); }, []);

  const fetchPrograms = async () => {
    try {
      const res = await getAllProgram();
      if (res.success) setPrograms(res.data || []);
    } catch { /* biarkan kosong */ }
  };

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await getProposalStatus();
      setStatus(response.data);
    } catch {
      await Swal.fire({
        icon: "error", title: "Gagal Memuat",
        text: "Gagal memuat data proposal. Silahkan refresh halaman.",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <BodyLayout Sidebar={MahasiswaNavbar}>
        <Box sx={{ position: "relative", minHeight: "60vh" }}>
          <LoadingScreen message="Memuat proposal..." overlay minHeight="60vh" />
        </Box>
      </BodyLayout>
    );
  }

  const proposal = status?.data?.proposal;
  const statusInfo = proposal ? getStatusInfo(proposal.status) : null;
  const pembimbingDisetujui = status?.data?.pembimbing?.status === 1;
  const pembimbingDitolak = status?.data?.pembimbing?.status === 2;
  const canCreateProposal = status?.isKetua && status?.data?.anggota?.all_accepted && pembimbingDisetujui && !status?.data?.proposal;
  const canEditProposal = !!proposal && proposal.status === 0 && pembimbingDisetujui && status?.data?.anggota?.all_accepted;
  const anyProgramOpen = programs.some((p) => {
    if (!p.pendaftaran_mulai || !p.pendaftaran_selesai) return false;
    const now = new Date();
    return now >= new Date(p.pendaftaran_mulai) && now <= new Date(p.pendaftaran_selesai);
  });

  return (
    <BodyLayout Sidebar={MahasiswaNavbar}>
      <PageTransition>
        <Box>

          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              Daftar Proposal
            </Typography>
            <Typography sx={{ fontSize: 16, color: "#6B7280" }}>
              Kelola proposal kewirausahaan Anda
            </Typography>
          </Box>

          {canCreateProposal && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
<Button
                variant="contained"
                onClick={() => navigate("/mahasiswa/proposal/form")}
                sx={{
                  textTransform: "none", borderRadius: "10px",
                  backgroundColor: COLORS.primary,
                  px: 4, py: 1.3, fontSize: 15, fontWeight: 700,
                  "&:hover": { backgroundColor: COLORS.primaryDark },
                }}
              >
                + Tambah Proposal
              </Button>
            </Box>
          )}

          {!status?.hasTim && (
            <InfoBox type="warning">
              Anda belum terdaftar dalam tim. Silahkan ajukan anggota tim terlebih dahulu.
            </InfoBox>
          )}

          {!anyProgramOpen && programs.map((prog) => {
            const ps = getProgramStatus(prog);
            return (
              <Box key={prog.id_program} sx={{ mb: 2, p: 2.5, borderRadius: "14px", background: ps.bgColor, border: `1.5px solid ${ps.borderColor}` }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: ps.color }}>{prog.keterangan}</Typography>
                  <Box sx={{ px: 1.5, py: 0.4, borderRadius: "50px", backgroundColor: ps.color + "18", border: `1px solid ${ps.borderColor}` }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: ps.color }}>{ps.label}</Typography>
                  </Box>
                </Box>
                <Typography sx={{ fontSize: 13, color: ps.color }}>
                  Pendaftaran: {formatDate(prog.pendaftaran_mulai)} — {formatDate(prog.pendaftaran_selesai)}
                </Typography>
              </Box>
            );
          })}
          {status?.hasTim && !status?.isKetua && (
            <InfoBox type="info">
              Hanya ketua tim yang dapat mengajukan proposal.
            </InfoBox>
          )}
          {status?.hasTim && status?.isKetua && !status?.data?.anggota?.all_accepted && (
            <InfoBox type="warning">
              Belum semua anggota menyetujui undangan. Pengajuan proposal hanya bisa dilakukan setelah semua anggota menyetujui undangan.
            </InfoBox>
          )}
          {status?.hasTim && status?.isKetua && status?.data?.anggota?.all_accepted && !pembimbingDisetujui && (
            <InfoBox type="warning">
              Tim sudah lengkap. Proposal baru bisa dibuat setelah dosen pembimbing menyetujui pengajuan.
              {pembimbingDitolak && (
                <Typography sx={{ fontSize: 13, color: "#b26a00", mt: 0.75 }}>
                  Pengajuan pembimbing sebelumnya ditolak. Silahkan ajukan dosen pembimbing lain.
                </Typography>
              )}
            </InfoBox>
          )}

          <Paper elevation={0} sx={{
            mb: 3, borderRadius: "20px",
            border: "1.5px solid #E5E7EB",
            overflow: "hidden",
          }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <SectionHeader
                icon={Description}
                title="Proposal Kewirausahaan"
                subtitle="Detail proposal yang telah diajukan"
                gradient={`linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`}
              />

              {proposal ? (
                <TableContainer sx={{ borderRadius: "14px", border: "1.5px solid #E5E7EB", overflow: "hidden", overflowX: "auto" }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {["Judul Proposal", "Program", "Kategori", "Modal Diajukan", "Tanggal Submit", "Status", "Aksi"].map((head, i) => (
                          <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 6 && { textAlign: "center" }) }}>
                            {head}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow sx={tableBodyRow}>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, maxWidth: 280, fontSize: 14, lineHeight: 1.4 }}>
                            {proposal.judul}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, color: COLORS.slate }}>{status.data.tim.keterangan}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, color: COLORS.slate }}>{proposal.nama_kategori || "-"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 14, fontWeight: 700, color: COLORS.primary }}>
                            {formatRupiah(proposal.modal_diajukan)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, color: COLORS.slate }}>{formatDateInline(proposal.tanggal_submit)}</Typography>
                        </TableCell>
                        <TableCell>
                          <StatusPill label={statusInfo.label} backgroundColor={statusInfo.backgroundColor} />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", justifyContent: "center" }}>
                            <Button
                              size="small"
                              variant={canEditProposal ? "contained" : "outlined"}
                              onClick={() => navigate("/mahasiswa/proposal/form")}
                              sx={{
                                textTransform: "none", borderRadius: "10px",
                                fontSize: 13, fontWeight: 600, px: 2,
                                ...(canEditProposal
                                  ? {
                                      backgroundColor: COLORS.warning,
                                      "&:hover": { backgroundColor: "#B45309" },
                                      border: "none",
                                    }
                                  : {
                                      borderColor: COLORS.primary, color: COLORS.primary,
                                      "&:hover": { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
                                    }),
                              }}
                            >
                              {canEditProposal ? "Edit" : "Lihat"}
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <Box sx={{
                    width: 100, height: 100, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${COLORS.slateLight}, #E2E8F0)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    mx: "auto", mb: 3,
                    border: `3px solid ${COLORS.primaryMuted}`,
                  }}>
                    <Description sx={{ fontSize: 48, color: COLORS.slate }} />
                  </Box>
                  <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#1F2937", mb: 1 }}>
                    Belum Ada Proposal
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: COLORS.slate, mb: 4, maxWidth: 420, mx: "auto", lineHeight: 1.7 }}>
                    {status?.isKetua && status?.data?.anggota?.all_accepted && pembimbingDisetujui
                      ? "Tambahkan proposal kewirausahaan Anda dengan klik tombol di kanan atas."
                      : status?.isKetua && status?.data?.anggota?.all_accepted
                        ? "Tunggu persetujuan dosen pembimbing terlebih dahulu sebelum membuat proposal."
                      : "Proposal akan muncul di sini setelah dibuat oleh ketua tim"}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>

          {status?.data?.tim && (
            <Paper elevation={0} sx={{
              borderRadius: "20px",
              border: "1.5px solid #E5E7EB",
              overflow: "hidden",
            }}>
              <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.secondary}, ${COLORS.success})` }} />
              <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
                <SectionHeader
                  icon={Groups}
                  title="Informasi Tim"
                  subtitle="Data tim dan anggota"
                  gradient={`linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.success} 100%)`}
                />

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: 4 }}>
                  <Box>
                    <FieldLabel>Nama Tim</FieldLabel>
                    <TextField fullWidth value={status.data.tim.nama_tim || ""} disabled sx={roundedField} />
                  </Box>
                  <Box>
                    <FieldLabel>Program</FieldLabel>
                    <TextField fullWidth value={status.data.tim.keterangan || ""} disabled sx={roundedField} />
                  </Box>
                  <Box>
                    <FieldLabel>Jumlah Anggota</FieldLabel>
                    <TextField fullWidth value={`${status.data.anggota?.total || 0} orang`} disabled sx={roundedField} />
                  </Box>
                  <Box>
                    <FieldLabel>Status Tim</FieldLabel>
                    <Box sx={{ pt: 1 }}>
                      <StatusPill
                        label={status.data.anggota?.all_accepted ? "Lengkap" : "Menunggu Persetujuan"}
                        backgroundColor={status.data.anggota?.all_accepted ? COLORS.success : COLORS.warning}
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Paper>
          )}
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}