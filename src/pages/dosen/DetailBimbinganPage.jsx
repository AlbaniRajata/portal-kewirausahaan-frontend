import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Button,
  TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
} from "@mui/material";
import { AttachFile, ArrowBack, Groups, Description, Person, EventNote } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import DosenNavbar from "../../components/layouts/DosenNavbar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import { getDetailBimbinganDosen } from "../../api/dosen";
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

const STATUS_BIMBINGAN = {
  0: { label: "Menunggu Konfirmasi", backgroundColor: "#f57f17" },
  1: { label: "Disetujui",           backgroundColor: "#2e7d32" },
  2: { label: "Ditolak",             backgroundColor: "#c62828" },
};

const METODE_LABEL = {
  1: { label: "Online",  backgroundColor: "#1565c0" },
  2: { label: "Offline", backgroundColor: "#555" },
};

const SectionHeader = ({ icon: Icon, title, subtitle, gradient }) => (
  <Box sx={{
    display: "flex", alignItems: "center", gap: 2, mb: 3,
    p: 2.5, borderRadius: "14px", background: gradient,
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
    backgroundColor, color: "#fff", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
  }}>
    {label}
  </Box>
);

const formatDate = (dateString) => {
  if (!dateString) return "—";
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
    } finally { setLoading(false); }
  }, [id_bimbingan]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  if (loading) return (
    <BodyLayout Sidebar={DosenNavbar}>
      <Box sx={{ position: "relative", minHeight: "60vh" }}>
        <LoadingScreen message="Memuat detail bimbingan..." overlay minHeight="60vh" />
      </Box>
    </BodyLayout>
  );

  if (!detail) return (
    <BodyLayout Sidebar={DosenNavbar}>
      <Box sx={{ p: 2.5, borderRadius: "12px", backgroundColor: COLORS.errorLight, border: `1.5px solid #FCA5A5`, display: "flex", gap: 1.5 }}>
        <Box sx={{ width: 8, height: 8, mt: 0.6, borderRadius: "50%", background: COLORS.error, flexShrink: 0 }} />
        <Typography sx={{ fontSize: 13, color: COLORS.error }}>Data bimbingan tidak ditemukan</Typography>
      </Box>
    </BodyLayout>
  );

  const { bimbingan, proposal, tim } = detail;
  const si = STATUS_BIMBINGAN[bimbingan.status];
  const metode = METODE_LABEL[bimbingan.metode];

  return (
    <BodyLayout Sidebar={DosenNavbar}>
      <PageTransition>
        <Box>

          <Button
            onClick={() => navigate("/dosen/bimbingan")}
            startIcon={<ArrowBack />}
            sx={{
              borderRadius: "50px", textTransform: "none",
              color: "#777", fontSize: 13, fontWeight: 500,
              p: 0, mb: 2, minWidth: 0,
              "&:hover": { backgroundColor: "transparent", color: COLORS.primary },
            }}
          >
            Kembali ke Log Bimbingan
          </Button>

          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              Detail Pengajuan Bimbingan
            </Typography>
            <Typography sx={{ fontSize: 16, color: "#6B7280" }}>
              Diajukan pada {formatDate(bimbingan.created_at)}
            </Typography>
          </Box>

          {bimbingan.responded_at && (
            <Box sx={{
              mb: 3, p: 2.5, borderRadius: "12px",
              backgroundColor: COLORS.primaryLight, border: `1.5px solid ${COLORS.primaryMuted}`,
              display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap",
            }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.primary, flexShrink: 0 }} />
              <Typography sx={{ fontSize: 13, color: COLORS.primaryDark, flex: 1 }}>
                Direspon pada: <strong>{formatDate(bimbingan.responded_at)}</strong>
              </Typography>
              <StatusPill label={si?.label || "—"} backgroundColor={si?.backgroundColor || "#9e9e9e"} />
            </Box>
          )}

          <Paper elevation={0} sx={{ mb: 3, borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <SectionHeader
                icon={EventNote}
                title="Informasi Bimbingan"
                subtitle="Detail topik dan jadwal bimbingan"
                gradient={`linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`}
              />

              <Box sx={{ mb: 3 }}>
                <FieldLabel>Topik</FieldLabel>
                <TextField fullWidth value={bimbingan.topik} disabled sx={roundedField} />
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: bimbingan.deskripsi ? 3 : 0 }}>
                <Box>
                  <FieldLabel>Tanggal Bimbingan</FieldLabel>
                  <ReadonlyField value={formatDate(bimbingan.tanggal_bimbingan)} />
                </Box>
                <Box>
                  <FieldLabel>Metode</FieldLabel>
                  <Box sx={{ mt: 0.5 }}>
                    <StatusPill label={metode?.label || "—"} backgroundColor={metode?.backgroundColor || "#555"} />
                  </Box>
                </Box>
              </Box>

              {bimbingan.deskripsi && (
                <Box>
                  <FieldLabel>Deskripsi / Catatan Mahasiswa</FieldLabel>
                  <TextField fullWidth value={bimbingan.deskripsi} disabled multiline rows={3} sx={roundedField} />
                </Box>
              )}
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ mb: 3, borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.secondary}, ${COLORS.accent})` }} />
            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <SectionHeader
                icon={Groups}
                title="Informasi Tim"
                subtitle="Data tim dan anggota pengusul"
                gradient={`linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.accent} 100%)`}
              />

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: tim?.anggota?.length > 0 ? 3 : 0 }}>
                <Box>
                  <FieldLabel>Nama Tim</FieldLabel>
                  <ReadonlyField value={tim?.nama_tim} />
                </Box>
                <Box>
                  <FieldLabel>Diajukan Oleh</FieldLabel>
                  <ReadonlyField value={bimbingan.mahasiswa_pengaju} />
                </Box>
              </Box>

              {tim?.anggota && tim.anggota.length > 0 && (
                <Box>
                  <FieldLabel>Anggota Tim</FieldLabel>
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
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ mb: 3, borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg, #059669, #34D399)` }} />
            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <SectionHeader
                icon={Description}
                title="Informasi Proposal"
                subtitle="Detail proposal yang diajukan tim"
                gradient={`linear-gradient(135deg, #059669 0%, #34D399 100%)`}
              />

              {proposal ? (
                <>
                  <Box sx={{ mb: 3 }}>
                    <FieldLabel>Judul Proposal</FieldLabel>
                    <TextField fullWidth value={proposal.judul} disabled multiline rows={2} sx={roundedField} />
                  </Box>

                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mb: 3 }}>
                    <Box>
                      <FieldLabel>Modal Diajukan</FieldLabel>
                      <ReadonlyField value={formatRupiah(proposal.modal_diajukan)} />
                    </Box>
                    <Box>
                      <FieldLabel>Tanggal Submit</FieldLabel>
                      <ReadonlyField value={formatDate(proposal.tanggal_submit)} />
                    </Box>
                  </Box>

                  <Box>
                    <FieldLabel>File Proposal</FieldLabel>
                    {proposal.file_proposal ? (
                      <Box sx={{
                        border: "1.5px solid #E5E7EB", borderRadius: "12px", p: 2,
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
                            <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{proposal.file_proposal}</Typography>
                            <Typography sx={{ fontSize: 11, color: COLORS.success, fontWeight: 600 }}>File Proposal</Typography>
                          </Box>
                        </Box>
                        <Button
                          onClick={() => downloadFile(proposal.file_proposal)}
                          size="small"
                          sx={{
                            textTransform: "none", borderRadius: "10px", fontSize: 13,
                            fontWeight: 600, color: COLORS.primary,
                            border: `1.5px solid ${COLORS.primary}`, px: 2,
                            "&:hover": { backgroundColor: COLORS.primaryLight },
                          }}
                        >
                          Download
                        </Button>
                      </Box>
                    ) : (
                      <ReadonlyField value="—" />
                    )}
                  </Box>
                </>
              ) : (
                <Box sx={{
                  p: 2.5, borderRadius: "12px",
                  backgroundColor: COLORS.slateLight, border: "1.5px dashed #CBD5E1",
                  display: "flex", gap: 1.5,
                }}>
                  <Box sx={{ width: 8, height: 8, mt: 0.6, borderRadius: "50%", background: COLORS.slate, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 13, color: COLORS.slate }}>Proposal tidak tersedia</Typography>
                </Box>
              )}
            </Box>
          </Paper>

          {bimbingan.status === 2 && bimbingan.catatan_dosen && (
            <Paper elevation={0} sx={{ mb: 3, borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
              <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.error}, #EF4444)` }} />
              <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
                <SectionHeader
                  icon={Person}
                  title="Catatan Penolakan"
                  subtitle="Alasan penolakan bimbingan"
                  gradient={`linear-gradient(135deg, ${COLORS.error} 0%, #EF4444 100%)`}
                />
                <Box sx={{
                  p: 2.5, backgroundColor: COLORS.errorLight,
                  borderRadius: "12px", border: `1.5px solid #FCA5A5`,
                  display: "flex", gap: 1.5, alignItems: "flex-start",
                }}>
                  <Box sx={{ width: 8, height: 8, mt: 0.6, borderRadius: "50%", background: COLORS.error, flexShrink: 0 }} />
                  <Box>
                    <Typography sx={{ fontSize: 12, color: COLORS.error, fontWeight: 700, mb: 0.5 }}>
                      Catatan Penolakan
                    </Typography>
                    <Typography sx={{ fontSize: 13.5, color: "#991B1B", lineHeight: 1.7 }}>
                      {bimbingan.catatan_dosen}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              onClick={() => navigate("/dosen/bimbingan")}
              sx={{
                px: 4, py: 1.3, textTransform: "none", fontWeight: 700,
                borderRadius: "12px", fontSize: 14,
                background: COLORS.warning,
                color: "#fff",
                boxShadow: "0 4px 15px rgba(217,119,6,0.3)",
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