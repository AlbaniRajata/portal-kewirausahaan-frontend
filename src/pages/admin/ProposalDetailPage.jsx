import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Paper,
} from "@mui/material";
import { AttachFile, ArrowBack } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import { getProposalDetailAdmin } from "../../api/admin";
import { downloadFile } from "../../utils/download";

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

const tableHeadCell = {
  fontWeight: 700,
  fontSize: { xs: 11, sm: 12 },
  color: "#374151",
  backgroundColor: "#F8FAFC",
  borderBottom: `2px solid ${COLORS.primaryMuted}`,
  py: 2,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const tableBodyRow = {
  "& td": { borderBottom: `1px solid ${COLORS.slateLight}`, py: 2 },
  "&:hover": { backgroundColor: "#F8FAFC" },
};

const statusMap = {
  0: { label: "Draft",                       backgroundColor: COLORS.slate },
  1: { label: "Diajukan",                    backgroundColor: COLORS.primary },
  2: { label: "Ditugaskan ke Reviewer",      backgroundColor: COLORS.secondary },
  3: { label: "Tidak Lolos Desk Evaluasi",   backgroundColor: COLORS.error },
  4: { label: "Lolos Desk Evaluasi",         backgroundColor: COLORS.success },
  5: { label: "Panel Wawancara",             backgroundColor: COLORS.warning },
  6: { label: "Tidak Lolos Wawancara",       backgroundColor: COLORS.error },
  7: { label: "Lolos Wawancara",             backgroundColor: COLORS.success },
  8: { label: "Pembimbing Diajukan",         backgroundColor: COLORS.primary },
  9: { label: "Pembimbing Disetujui",        backgroundColor: COLORS.success },
};

const StatusPill = ({ label, backgroundColor }) => (
  <Box sx={{
    display: "inline-flex", alignItems: "center",
    px: 1.5, py: 0.4, borderRadius: "50px",
    backgroundColor, color: "#fff", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
  }}>
    {label}
  </Box>
);

const formatRupiah = (value) => {
  if (!value) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const getDosenPembimbingName = (item) => {
  return (
    item?.nama_dosen ||
    item?.nama_pembimbing ||
    item?.dosen_pembimbing ||
    item?.pembimbing?.nama_dosen ||
    item?.pembimbing?.nama_lengkap ||
    item?.pengajuan_pembimbing?.nama_dosen ||
    "-"
  );
};

export default function ProposalDetailPage() {
  const navigate = useNavigate();
  const { id_proposal } = useParams();
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState(null);

  const fetchProposalDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getProposalDetailAdmin(id_proposal);
      setProposal(res.data);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat detail proposal", confirmButtonColor: "#0D59F2" });
    } finally {
      setLoading(false);
    }
  }, [id_proposal]);

  useEffect(() => { fetchProposalDetail(); }, [fetchProposalDetail]);

  if (loading) {
    return (
      <BodyLayout Sidebar={AdminSidebar}>
        <Box sx={{ position: "relative", minHeight: "60vh" }}>
          <LoadingScreen message="Memuat data..." overlay minHeight="60vh" />
        </Box>
      </BodyLayout>
    );
  }

  if (!proposal) {
    return (
      <BodyLayout Sidebar={AdminSidebar}>
        <Box sx={{ px: 1, py: 1 }}>
          <Box sx={{ p: 2, mb: 3, backgroundColor: "#FEF2F2", borderRadius: "12px", border: `1.5px solid ${COLORS.error}40` }}>
            <Typography sx={{ fontSize: 14, color: COLORS.error, fontWeight: 700 }}>Proposal tidak ditemukan</Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button variant="contained"
              onClick={() => navigate("/admin/proposal")}
              sx={{ textTransform: "none", borderRadius: "12px", px: 4, py: 1.2, fontWeight: 700, backgroundColor: COLORS.warning, "&:hover": { backgroundColor: COLORS.primaryDark } }}
            >
              Kembali
            </Button>
          </Box>
        </Box>
      </BodyLayout>
    );
  }

  const si = statusMap[proposal.status];

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box sx={{ px: 1, py: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 0.5, gap: 1 }}>
            <Button size="small"
              onClick={() => navigate("/admin/proposal")}
              startIcon={<ArrowBack />}
              sx={{ textTransform: "none", borderRadius: "50px", fontSize: 13, color: COLORS.slate, p: 0, minWidth: 0, "&:hover": { backgroundColor: "transparent", color: COLORS.primary } }}>
              Kembali ke Daftar Proposal
            </Button>
          </Box>
          <Typography sx={{ fontSize: { xs: 26, sm: 32, md: 36 }, fontWeight: 800, mb: 0.5, color: "#1F2937" }}>Detail Proposal</Typography>
          <Typography sx={{ fontSize: { xs: 14, sm: 16 }, color: "#6B7280", mb: 4 }}>Informasi lengkap proposal kewirausahaan</Typography>

          <Paper sx={{ p: { xs: 2.5, sm: 4 }, mb: 3, borderRadius: "20px", border: "1.5px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 3, color: "#1F2937" }}>Informasi Proposal</Typography>

            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Judul Proposal</Typography>
              <TextField fullWidth value={proposal.judul} disabled multiline rows={2} sx={roundedField} />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: 3 }}>
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Program</Typography>
                <TextField fullWidth value={proposal.keterangan} disabled sx={roundedField} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Kategori Usaha</Typography>
                <TextField fullWidth value={proposal.nama_kategori} disabled sx={roundedField} />
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: 3 }}>
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Modal Diajukan</Typography>
                <TextField fullWidth value={formatRupiah(proposal.modal_diajukan)} disabled sx={roundedField} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 2, fontSize: 14 }}>Status</Typography>
                <StatusPill label={si?.label || "Unknown"} backgroundColor={si?.backgroundColor || "#666"} />
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Dosen Pembimbing</Typography>
              <TextField fullWidth value={getDosenPembimbingName(proposal)} disabled sx={roundedField} />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Tanggal Submit</Typography>
              <TextField fullWidth value={formatDate(proposal.tanggal_submit)} disabled sx={roundedField} />
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>File Proposal</Typography>
              {proposal.file_proposal ? (
                <Box sx={{ border: `1.5px solid ${COLORS.slateLight}`, borderRadius: "12px", p: 2, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", backgroundColor: "#fafafa" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: "8px", backgroundColor: COLORS.primaryLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <AttachFile sx={{ color: COLORS.primary, fontSize: 18 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{proposal.file_proposal}</Typography>
                      <Typography sx={{ fontSize: 11, color: COLORS.success, fontWeight: 600 }}>File Proposal</Typography>
                    </Box>
                  </Box>
                  <Button
                    size="small"
                    onClick={() => downloadFile(proposal.file_proposal)}
                    sx={{ textTransform: "none", borderRadius: "12px", fontSize: 13, fontWeight: 700, color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, px: 2, "&:hover": { backgroundColor: COLORS.primaryLight } }}
                  >
                    Download
                  </Button>
                </Box>
              ) : (
                <TextField fullWidth value="-" disabled sx={roundedField} />
              )}
            </Box>
          </Paper>

          <Paper sx={{ p: { xs: 2.5, sm: 4 }, mb: 3, borderRadius: "20px", border: "1.5px solid #E5E7EB", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 3, color: "#1F2937" }}>Informasi Tim</Typography>

            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Nama Tim</Typography>
              <TextField fullWidth value={proposal.nama_tim} disabled sx={roundedField} />
            </Box>

            <Typography sx={{ fontWeight: 600, mb: 1.5, fontSize: 14 }}>Anggota Tim</Typography>
            <TableContainer sx={{ borderRadius: "12px", border: `1.5px solid ${COLORS.slateLight}`, overflow: "hidden" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    {["Nama", "NIM", "Email", "Prodi", "Peran"].map((h, i) => (
                      <TableCell key={i} sx={tableHeadCell}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {proposal.anggota_tim?.map((anggota, index) => (
                    <TableRow key={index} sx={tableBodyRow}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{anggota.nama_lengkap}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13 }}>{anggota.nim}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13 }}>{anggota.email || "-"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13 }}>{anggota.nama_prodi || "-"}</Typography>
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          label={anggota.peran === 1 ? "Ketua" : "Anggota"}
                          backgroundColor={anggota.peran === 1 ? COLORS.secondary : COLORS.slate}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button variant="contained"
              onClick={() => navigate("/admin/proposal")}
              sx={{ textTransform: "none", borderRadius: "12px", px: 4, py: 1.2, fontWeight: 700, backgroundColor: COLORS.warning, "&:hover": { backgroundColor: COLORS.primaryDark } }}
            >
              Kembali
            </Button>
          </Box>
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}