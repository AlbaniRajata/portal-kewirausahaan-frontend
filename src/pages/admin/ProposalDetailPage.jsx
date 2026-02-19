import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Paper,
} from "@mui/material";
import { Download, AttachFile, ArrowBack } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import { getProposalDetailAdmin } from "../../api/admin";

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

const formatRupiah = (value) => {
  if (!value) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const statusMap = {
  0: { label: "Draft", color: "#f5f5f5", bg: "#666" },
  1: { label: "Diajukan", color: "#e3f2fd", bg: "#1565c0" },
  2: { label: "Ditugaskan ke Reviewer", color: "#e8eaf6", bg: "#3949ab" },
  3: { label: "Tidak Lolos Desk Evaluasi", color: "#fce4ec", bg: "#c62828" },
  4: { label: "Lolos Desk Evaluasi", color: "#e8f5e9", bg: "#2e7d32" },
  5: { label: "Panel Wawancara", color: "#e8eaf6", bg: "#3949ab" },
  6: { label: "Tidak Lolos Wawancara", color: "#fce4ec", bg: "#c62828" },
  7: { label: "Lolos Wawancara", color: "#e8f5e9", bg: "#2e7d32" },
  8: { label: "Pembimbing Diajukan", color: "#e3f2fd", bg: "#1565c0" },
  9: { label: "Pembimbing Disetujui", color: "#e8f5e9", bg: "#2e7d32" },
};

export default function ProposalDetailPage() {
  const navigate = useNavigate();
  const { id_proposal } = useParams();
  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState(null);
  const [alert, setAlert] = useState("");

  const fetchProposalDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getProposalDetailAdmin(id_proposal);
      setProposal(response.data);
    } catch (err) {
      console.error("Error fetching proposal detail:", err);
      setAlert("Gagal memuat detail proposal");
    } finally {
      setLoading(false);
    }
  }, [id_proposal]);

  useEffect(() => { fetchProposalDetail(); }, [fetchProposalDetail]);

  if (loading) {
    return (
      <BodyLayout Sidebar={AdminSidebar}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress />
        </Box>
      </BodyLayout>
    );
  }

  if (!proposal) {
    return (
      <BodyLayout Sidebar={AdminSidebar}>
        <Box>
          <Alert severity="error" sx={{ borderRadius: "12px", mb: 3 }}>
            {alert || "Proposal tidak ditemukan"}
          </Alert>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              startIcon={<ArrowBack sx={{ fontSize: 14 }} />}
              onClick={() => navigate("/admin/proposal")}
              sx={{
                textTransform: "none", borderRadius: "50px",
                px: 4, py: 1.2, fontWeight: 600,
                backgroundColor: "#FDB022", "&:hover": { backgroundColor: "#e09a1a" },
              }}
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
      <Box>
        <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Detail Proposal</Typography>
        <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>Informasi lengkap proposal kewirausahaan</Typography>

        {alert && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setAlert("")}>
            {alert}
          </Alert>
        )}

        <Paper sx={{ p: 4, mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 3 }}>Informasi Proposal</Typography>

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Judul Proposal</Typography>
            <TextField fullWidth value={proposal.judul} disabled multiline rows={2} sx={roundedField} />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Program</Typography>
              <TextField fullWidth value={proposal.keterangan} disabled sx={roundedField} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Kategori Usaha</Typography>
              <TextField fullWidth value={proposal.nama_kategori} disabled sx={roundedField} />
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Modal Diajukan</Typography>
              <TextField
                fullWidth value={formatRupiah(proposal.modal_diajukan)} disabled sx={roundedField}
                InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: "#555" }}>Rp</Typography> }}
              />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 2, fontSize: 14 }}>Status</Typography>
                <StatusPill label={si?.label || "Unknown"} bg={si?.bg || "#f5f5f5"} color={si?.color || "#666"} />
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Tanggal Submit</Typography>
              <TextField fullWidth value={formatDate(proposal.tanggal_submit)} disabled sx={roundedField} />
            </Box>
            <Box>
            </Box>
          </Box>

          <Box>
            <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>File Proposal</Typography>
            {proposal.file_proposal ? (
              <Box sx={{ border: "1.5px solid #f0f0f0", borderRadius: "12px", p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fafafa" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: "8px", backgroundColor: "#e3f2fd", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <AttachFile sx={{ color: "#1565c0", fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{proposal.file_proposal}</Typography>
                    <Typography sx={{ fontSize: 11, color: "#2e7d32", fontWeight: 600 }}>File Proposal</Typography>
                  </Box>
                </Box>
                <Button
                  startIcon={<Download sx={{ fontSize: 16 }} />}
                  component="a"
                  href={`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/proposal/${proposal.file_proposal}`}
                  target="_blank"
                  size="small"
                  sx={{
                    textTransform: "none", borderRadius: "50px",
                    fontSize: 13, fontWeight: 600,
                    color: "#0D59F2", border: "1.5px solid #0D59F2", px: 2,
                    "&:hover": { backgroundColor: "#f0f4ff" },
                  }}
                >
                  Download
                </Button>
              </Box>
            ) : (
              <TextField fullWidth value="-" disabled sx={roundedField} />
            )}
          </Box>
        </Paper>

        <Paper sx={{ p: 4, mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
          <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 3 }}>Informasi Tim</Typography>

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Nama Tim</Typography>
            <TextField fullWidth value={proposal.nama_tim} disabled sx={roundedField} />
          </Box>

          <Typography sx={{ fontWeight: 600, mb: 1.5, fontSize: 14 }}>Anggota Tim</Typography>
          <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "hidden" }}>
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
                        color={anggota.peran === 1 ? "#e8eaf6" : "#f5f5f5"}
                        bg={anggota.peran === 1 ? "#3949ab" : "#555"}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            startIcon={<ArrowBack sx={{ fontSize: 14 }} />}
            onClick={() => navigate("/admin/proposal")}
            sx={{
              textTransform: "none", borderRadius: "50px",
              px: 4, py: 1.2, fontWeight: 600,
              backgroundColor: "#FDB022", "&:hover": { backgroundColor: "#e09a1a" },
            }}
          >
            Kembali
          </Button>
        </Box>
      </Box>
    </BodyLayout>
  );
}