import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Paper, Button, CircularProgress,
  TextField, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import { AttachFile } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import DosenSidebar from "../../components/layouts/DosenSidebar";
import PageTransition from "../../components/PageTransition";
import { getDetailBimbinganDosen } from "../../api/dosen";

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

const StatusPill = ({ label, backgroundColor }) => (
  <Box sx={{
    display: "inline-flex", alignItems: "center",
    px: 1.5, py: 0.4, borderRadius: "50px",
    backgroundColor, color: "#fff", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
  }}>
    {label}
  </Box>
);

const InfoBox = ({ children, color, borderColor, bgColor }) => (
  <Box sx={{ mb: 3, p: 2, borderRadius: "12px", backgroundColor: bgColor, border: `1px solid ${borderColor}` }}>
    <Typography sx={{ fontSize: 14, color, fontWeight: 500 }}>{children}</Typography>
  </Box>
);

const STATUS_BIMBINGAN = {
  0: { label: "Menunggu Konfirmasi", backgroundColor: "#f57f17" },
  1: { label: "Disetujui",           backgroundColor: "#2e7d32" },
  2: { label: "Ditolak",             backgroundColor: "#c62828" },
};

const METODE_LABEL = {
  1: { label: "Online",  backgroundColor: "#1565c0" },
  2: { label: "Offline", backgroundColor: "#555" },
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const formatRupiah = (value) => {
  if (!value) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(value);
};

export default function DetailBimbinganDosenPage() {
  const navigate = useNavigate();
  const { id_bimbingan } = useParams();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDetailBimbinganDosen(id_bimbingan);
      if (res.success) setDetail(res.data);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat detail bimbingan", confirmButtonText: "OK" });
    } finally {
      setLoading(false);
    }
  }, [id_bimbingan]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  if (loading) {
    return (
      <BodyLayout Sidebar={DosenSidebar}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress />
        </Box>
      </BodyLayout>
    );
  }

  if (!detail) {
    return (
      <BodyLayout Sidebar={DosenSidebar}>
        <InfoBox color="#c62828" borderColor="#ef9a9a" bgColor="#fce4ec">
          Data bimbingan tidak ditemukan
        </InfoBox>
      </BodyLayout>
    );
  }

  const { bimbingan, proposal, tim } = detail;
  const si = STATUS_BIMBINGAN[bimbingan.status];
  const metode = METODE_LABEL[bimbingan.metode];

  return (
    <BodyLayout Sidebar={DosenSidebar}>
      <PageTransition>
        <Box>
          <Button
            onClick={() => navigate("/dosen/bimbingan")}
            sx={{ textTransform: "none", borderRadius: "50px", color: "#777", fontSize: 13, fontWeight: 500, p: 0, mb: 2, minWidth: 0, "&:hover": { backgroundColor: "transparent", color: "#0D59F2" } }}
          >
            Kembali ke Log Bimbingan
          </Button>

          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Detail Pengajuan Bimbingan</Typography>
          <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>Diajukan pada {formatDate(bimbingan.created_at)}</Typography>

          <Paper sx={{ p: 4, mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
            <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>Informasi Bimbingan</Typography>

            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Topik</Typography>
              <TextField fullWidth value={bimbingan.topik} disabled sx={roundedField} />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: 3 }}>
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Tanggal Bimbingan</Typography>
                <TextField fullWidth value={formatDate(bimbingan.tanggal_bimbingan)} disabled sx={roundedField} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 2, fontSize: 14 }}>Metode</Typography>
                <StatusPill label={metode?.label || "-"} backgroundColor={metode?.backgroundColor || "#555"} />
              </Box>
            </Box>

            {bimbingan.deskripsi && (
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Deskripsi / Catatan Mahasiswa</Typography>
                <TextField fullWidth value={bimbingan.deskripsi} disabled multiline rows={3} sx={roundedField} />
              </Box>
            )}
          </Paper>

          <Paper sx={{ p: 4, mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
            <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>Informasi Tim</Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: tim?.anggota?.length > 0 ? 3 : 0 }}>
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Nama Tim</Typography>
                <TextField fullWidth value={tim?.nama_tim || "-"} disabled sx={roundedField} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Diajukan Oleh</Typography>
                <TextField fullWidth value={bimbingan.mahasiswa_pengaju || "-"} disabled sx={roundedField} />
              </Box>
            </Box>

            {tim?.anggota && tim.anggota.length > 0 && (
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1.5, fontSize: 14 }}>Anggota Tim</Typography>
                <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "hidden" }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {["Nama", "Peran"].map((h, i) => (
                          <TableCell key={i} sx={tableHeadCell}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tim.anggota.map((a) => (
                        <TableRow key={a.id_user} sx={tableBodyRow}>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{a.nama}</Typography>
                          </TableCell>
                          <TableCell>
                            <StatusPill
                              label={a.peran === 1 ? "Ketua" : "Anggota"}
                              backgroundColor={a.peran === 1 ? "#3949ab" : "#555"}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Paper>

          <Paper sx={{ p: 4, mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
            <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>Informasi Proposal</Typography>

            {proposal ? (
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Judul Proposal</Typography>
                  <TextField fullWidth value={proposal.judul} disabled multiline rows={2} sx={roundedField} />
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mb: proposal.file_proposal ? 3 : 0 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Modal Diajukan</Typography>
                    <TextField fullWidth value={formatRupiah(proposal.modal_diajukan)} disabled sx={roundedField} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Tanggal Submit</Typography>
                    <TextField fullWidth value={formatDate(proposal.tanggal_submit)} disabled sx={roundedField} />
                  </Box>
                </Box>

                {proposal.file_proposal && (
                  <Box>
                    <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>File Proposal</Typography>
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
                        component="a"
                        href={`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/proposal/${proposal.file_proposal}`}
                        target="_blank"
                        size="small"
                        sx={{ textTransform: "none", borderRadius: "50px", fontSize: 13, fontWeight: 600, color: "#0D59F2", border: "1.5px solid #0D59F2", px: 2, "&:hover": { backgroundColor: "#f0f4ff" } }}
                      >
                        Download
                      </Button>
                    </Box>
                  </Box>
                )}
              </>
            ) : (
              <InfoBox color="#555" borderColor="#b0bec5" bgColor="#eceff1">
                Proposal tidak tersedia
              </InfoBox>
            )}
          </Paper>

          {bimbingan.status === 2 && bimbingan.catatan_dosen && (
            <Paper sx={{ p: 4, mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
              <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>Catatan Penolakan</Typography>
              <Box sx={{ p: 2.5, backgroundColor: "#fce4ec", borderRadius: "12px", border: "1px solid #ef9a9a" }}>
                <Typography sx={{ fontSize: 12, color: "#c62828", fontWeight: 700, mb: 0.5 }}>Catatan Penolakan</Typography>
                <Typography sx={{ fontSize: 14, lineHeight: 1.7 }}>{bimbingan.catatan_dosen}</Typography>
              </Box>
            </Paper>
          )}

          {bimbingan.responded_at && (
            <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2, p: 2.5, borderRadius: "12px", backgroundColor: "#f5f5f5", border: "1px solid #e0e0e0" }}>
              <Typography sx={{ fontSize: 13, color: "#555" }}>
                Direspon pada: <strong>{formatDate(bimbingan.responded_at)}</strong>
              </Typography>
              <StatusPill label={si?.label || "-"} backgroundColor={si?.backgroundColor || "#9e9e9e"} />
            </Box>
          )}

          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={() => navigate("/dosen/bimbingan")}
              sx={{ textTransform: "none", borderRadius: "50px", px: 4, py: 1.2, fontWeight: 600, backgroundColor: "#FDB022", "&:hover": { backgroundColor: "#e09a1a" } }}
            >
              Kembali
            </Button>
          </Box>
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}