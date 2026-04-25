import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Paper, Typography, TextField, MenuItem,
  InputAdornment, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, LinearProgress, CircularProgress,
} from "@mui/material";
import {
  Search, AssignmentTurnedIn, Close,
  CheckCircle, Cancel, HourglassEmpty,
  RadioButtonUnchecked, AttachFile, Link as LinkIcon,
  FilterList,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import DosenNavbar from "../../components/layouts/DosenNavbar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import { getMonevTimBimbingan, getMonevDetailTim } from "../../api/dosen";
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

const STATUS_MAP = {
  0: { label: "Belum Dikerjakan", bg: "#757575", icon: <RadioButtonUnchecked sx={{ fontSize: 16 }} /> },
  1: { label: "Submitted",        bg: "#f57f17", icon: <HourglassEmpty     sx={{ fontSize: 16 }} /> },
  2: { label: "Disetujui",        bg: "#2e7d32", icon: <CheckCircle        sx={{ fontSize: 16 }} /> },
  3: { label: "Ditolak",          bg: "#c62828", icon: <Cancel             sx={{ fontSize: 16 }} /> },
};

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const parseLinks = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return trimmed.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
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

const StatusPill = ({ status }) => {
  const s = STATUS_MAP[status ?? 0];
  return (
    <Box sx={{
      display: "inline-flex", alignItems: "center", gap: 0.5,
      px: 1.5, py: 0.4, borderRadius: "50px",
      backgroundColor: s.bg, color: "#fff",
      fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
    }}>
      {s.icon}
      {s.label}
    </Box>
  );
};

const InfoRow = ({ label, value }) => (
  <Box sx={{ mb: 0.75 }}>
    <Typography sx={{ fontSize: 12, color: COLORS.slate }}>{label}</Typography>
    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{value || "—"}</Typography>
  </Box>
);

export default function MonevDosenPage() {
  const [loading, setLoading]           = useState(true);
  const [timList, setTimList]           = useState([]);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openDetail, setOpenDetail]     = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailData, setDetailData]     = useState(null);

  const fetchTimList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMonevTimBimbingan();
      if (res.success) setTimList(Array.isArray(res.data) ? res.data : []);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat data monitoring tim bimbingan", confirmButtonText: "OK" });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTimList(); }, [fetchTimList]);

  const handleOpenDetail = async (tim) => {
    setOpenDetail(true);
    setLoadingDetail(true);
    setDetailData(null);
    try {
      const res = await getMonevDetailTim(tim.id_tim);
      if (res.success) setDetailData(res.data || null);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat detail luaran tim", confirmButtonText: "OK" });
      setOpenDetail(false);
    } finally { setLoadingDetail(false); }
  };

  const filteredTim = useMemo(() => timList.filter((tim) => {
    const statusKategori =
      Number(tim.total_luaran || 0) > 0 &&
      Number(tim.total_disetujui || 0) === Number(tim.total_luaran || 0)
        ? "selesai" : "proses";

    const matchSearch =
      (tim.nama_tim          || "").toLowerCase().includes(search.toLowerCase()) ||
      (tim.keterangan        || "").toLowerCase().includes(search.toLowerCase()) ||
      (tim.ketua?.nama_lengkap || "").toLowerCase().includes(search.toLowerCase()) ||
      (tim.judul_proposal    || "").toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === "" || statusFilter === statusKategori;
    return matchSearch && matchStatus;
  }), [timList, search, statusFilter]);

  if (loading) return (
    <BodyLayout Sidebar={DosenNavbar}>
      <Box sx={{ position: "relative", minHeight: "60vh" }}>
        <LoadingScreen message="Memuat data monev..." overlay minHeight="60vh" />
      </Box>
    </BodyLayout>
  );

  return (
    <BodyLayout Sidebar={DosenNavbar}>
      <PageTransition>
        <Box>

          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 36, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              Monitoring dan Evaluasi
            </Typography>
            <Typography sx={{ fontSize: 16, color: "#6B7280" }}>
              Pantau progres luaran dari tim bimbingan Anda
            </Typography>
          </Box>

          <Paper elevation={0} sx={{ mb: 3, borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <SectionHeader
                icon={FilterList}
                title="Filter Tim"
                subtitle="Saring berdasarkan status progres atau kata kunci"
                gradient={`linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%)`}
              />
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ minWidth: 200, flex: "1 1 auto" }}>
                  <TextField
                    select fullWidth label="Status Progres"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={roundedField}
                  >
                    <MenuItem value="">Semua</MenuItem>
                    <MenuItem value="proses">Dalam Proses</MenuItem>
                    <MenuItem value="selesai">Selesai</MenuItem>
                  </TextField>
                </Box>
                <Box sx={{ minWidth: 280, flex: "2 1 auto" }}>
                  <TextField
                    fullWidth label="Cari"
                    placeholder="Cari tim, program, ketua, judul proposal..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ fontSize: 18, color: COLORS.slate }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={roundedField}
                  />
                </Box>
              </Box>
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ borderRadius: "20px", border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
            <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.secondary}, ${COLORS.success})` }} />
            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <SectionHeader
                icon={AssignmentTurnedIn}
                title="Daftar Tim Bimbingan"
                subtitle={`${filteredTim.length} tim ditemukan`}
                gradient={`linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.success} 100%)`}
              />

              {filteredTim.length === 0 ? (
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <Box sx={{
                    width: 90, height: 90, borderRadius: "50%",
                    backgroundColor: COLORS.slateLight,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    mx: "auto", mb: 2.5,
                  }}>
                    <AssignmentTurnedIn sx={{ fontSize: 44, color: "#CBD5E1" }} />
                  </Box>
                  <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#374151", mb: 0.5 }}>
                    Belum Ada Data Monev
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: COLORS.slate }}>
                    {search || statusFilter ? "Tidak ada tim yang sesuai filter" : "Data tim monev akan tampil di sini"}
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "hidden", overflowX: "auto" }}>
                  <Table sx={{ minWidth: 700 }}>
                    <TableHead>
                      <TableRow>
                        {["Tim", "Ketua", "Program", "Progress", "Proposal", "Aksi"].map((h, i) => (
                          <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 5 && { textAlign: "center" }) }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredTim.map((tim) => {
                        const total     = Number(tim.total_luaran    || 0);
                        const disetujui = Number(tim.total_disetujui || 0);
                        const percent   = total > 0 ? Math.round((disetujui / total) * 100) : 0;
                        return (
                          <TableRow key={tim.id_tim} sx={tableBodyRow}>
                            <TableCell>
                              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{tim.nama_tim}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{tim.ketua?.nama_lengkap || "—"}</Typography>
                              <Typography sx={{ fontSize: 12, color: COLORS.slate }}>{tim.ketua?.nim || "—"}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13 }}>{tim.keterangan || "—"}</Typography>
                            </TableCell>
                            <TableCell sx={{ minWidth: 210 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.8 }}>
                                <LinearProgress
                                  variant="determinate" value={percent}
                                  sx={{
                                    flex: 1, height: 8, borderRadius: 5,
                                    backgroundColor: COLORS.slateLight,
                                    "& .MuiLinearProgress-bar": {
                                      backgroundColor: percent === 100 && total > 0 ? COLORS.success : COLORS.primary,
                                      borderRadius: 5,
                                    },
                                  }}
                                />
                                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#374151", minWidth: 36 }}>
                                  {percent}%
                                </Typography>
                              </Box>
                              <Typography sx={{ fontSize: 12, color: COLORS.slate }}>
                                {disetujui}/{total} disetujui · {Number(tim.total_submitted || 0)} submitted · {Number(tim.total_ditolak || 0)} ditolak
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13, maxWidth: 220, lineHeight: 1.4 }}>
                                {tim.judul_proposal || "—"}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                size="small" variant="outlined"
                                onClick={() => handleOpenDetail(tim)}
                                sx={{
                                    textTransform: "none", borderRadius: "10px",
                                    fontSize: 12, fontWeight: 600, px: 2,
                                    borderColor: COLORS.primary, color: COLORS.primary,
                                    "&:hover": { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
                                  }}
                              >
                                Detail
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Paper>

        </Box>
      </PageTransition>

      <Dialog
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: "20px", overflow: "hidden" } }}
      >
        <Box sx={{ height: 5, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />

        <DialogTitle sx={{ pb: 1.5, pr: 6, pt: 2.5, px: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: "10px",
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <AssignmentTurnedIn sx={{ color: "#fff", fontSize: 18 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Detail Luaran Tim</Typography>
          </Box>
          <IconButton
            onClick={() => setOpenDetail(false)}
            sx={{
              position: "absolute", right: 12, top: 14,
              color: COLORS.slate, borderRadius: "10px",
              "&:hover": { backgroundColor: COLORS.slateLight },
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ px: 3, py: 2.5 }}>
          {loadingDetail ? (
            <Box sx={{ minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CircularProgress size={32} sx={{ color: COLORS.primary }} />
            </Box>
          ) : !detailData ? (
            <Typography sx={{ fontSize: 14, color: COLORS.slate, py: 2 }}>Detail tidak tersedia</Typography>
          ) : (
            <>
              <Box sx={{
                mb: 3, p: 3, borderRadius: "16px",
                background: `linear-gradient(135deg, ${COLORS.primaryLight} 0%, ${COLORS.primary}08 100%)`,
                border: `1.5px solid ${COLORS.primaryMuted}`,
              }}>
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#1F2937", mb: 1.5 }}>
                  {detailData.tim?.nama_tim || "—"}
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
                  <InfoRow label="Program"  value={detailData.tim?.keterangan} />
                  <InfoRow label="Ketua"    value={`${detailData.tim?.ketua?.nama_lengkap || "—"} (${detailData.tim?.ketua?.nim || "—"})`} />
                  <InfoRow label="Proposal" value={detailData.tim?.judul_proposal} />
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
                {[
                  { label: "Total",     value: detailData.progress?.total     || 0, bg: "#424242" },
                  { label: "Disetujui", value: detailData.progress?.disetujui || 0, bg: "#2e7d32" },
                  { label: "Submitted", value: detailData.progress?.submitted || 0, bg: "#f57f17" },
                  { label: "Ditolak",   value: detailData.progress?.ditolak   || 0, bg: "#c62828" },
                ].map((item) => (
                  <Box key={item.label} sx={{ px: 1.5, py: 0.75, borderRadius: "50px", backgroundColor: item.bg, color: "#fff", fontSize: 12, fontWeight: 700 }}>
                    {item.label}: {item.value}
                  </Box>
                ))}
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {(detailData.luaran || []).map((luaran) => {
                  const links = parseLinks(luaran.link_luaran);
                  return (
                    <Paper key={luaran.id_luaran} elevation={0} sx={{ p: 2.5, borderRadius: "14px", border: "1.5px solid #E5E7EB" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap", mb: 1.5 }}>
                        <Box>
                          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{luaran.nama_luaran}</Typography>
                          <Typography sx={{ fontSize: 12, color: COLORS.slate }}>
                            Deadline: {formatDateTime(luaran.deadline)}
                          </Typography>
                        </Box>
                        <StatusPill status={luaran.id_luaran_tim ? luaran.status : 0} />
                      </Box>

                      <Typography sx={{ fontSize: 13, color: COLORS.slate, mb: 1.25, lineHeight: 1.6 }}>
                        {luaran.keterangan || "—"}
                      </Typography>

                      {luaran.file_luaran && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: links.length ? 1 : 0 }}>
                          <AttachFile sx={{ fontSize: 16, color: COLORS.primary }} />
                          <Button
                            onClick={() => downloadFile(luaran.file_luaran, "luaran")}
                            size="small"
                            sx={{ textTransform: "none", p: 0, minWidth: 0, fontSize: 12, color: COLORS.primary }}
                          >
                            {luaran.file_luaran}
                          </Button>
                        </Box>
                      )}

                      {links.map((url, idx) => (
                        <Box key={`${luaran.id_luaran}-link-${idx}`} sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.75 }}>
                          <LinkIcon sx={{ fontSize: 15, color: "#6a1b9a" }} />
                          <Button
                            component="a" href={url} target="_blank" rel="noopener noreferrer"
                            size="small"
                            sx={{ textTransform: "none", p: 0, minWidth: 0, fontSize: 12, color: COLORS.primary }}
                          >
                            {url}
                          </Button>
                        </Box>
                      ))}

                      {luaran.catatan_admin && (
                        <Box sx={{
                          mt: 1.5, p: 1.5, borderRadius: "10px",
                          backgroundColor: COLORS.warningLight,
                          border: `1.5px solid #FDE68A`,
                          display: "flex", gap: 1, alignItems: "flex-start",
                        }}>
                          <Box sx={{ width: 7, height: 7, mt: 0.5, borderRadius: "50%", background: COLORS.warning, flexShrink: 0 }} />
                          <Typography sx={{ fontSize: 12, color: "#92400E" }}>
                            Catatan admin: {luaran.catatan_admin}
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                  );
                })}
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setOpenDetail(false)}
            sx={{
              backgroundColor: COLORS.error,
              textTransform: "none", borderRadius: "12px", px: 3, py: 1,
              fontWeight: 700, fontSize: 14, color: COLORS.slateLight,
            }}
          >
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </BodyLayout>
  );
}