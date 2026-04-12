import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  LinearProgress,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  AssignmentTurnedIn,
  Visibility,
  Close,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  RadioButtonUnchecked,
  AttachFile,
  Link as LinkIcon,
} from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import DosenSidebar from "../../components/layouts/DosenSidebar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import { getMonevTimBimbingan, getMonevDetailTim } from "../../api/dosen";

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

const STATUS_MAP = {
  0: {
    label: "Belum Dikerjakan",
    bg: "#757575",
    icon: <RadioButtonUnchecked sx={{ fontSize: 16 }} />,
  },
  1: {
    label: "Submitted",
    bg: "#f57f17",
    icon: <HourglassEmpty sx={{ fontSize: 16 }} />,
  },
  2: {
    label: "Disetujui",
    bg: "#2e7d32",
    icon: <CheckCircle sx={{ fontSize: 16 }} />,
  },
  3: {
    label: "Ditolak",
    bg: "#c62828",
    icon: <Cancel sx={{ fontSize: 16 }} />,
  },
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};

const StatusPill = ({ status }) => {
  const s = STATUS_MAP[status ?? 0];
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1.5,
        py: 0.4,
        borderRadius: "50px",
        backgroundColor: s.bg,
        color: "#fff",
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {s.icon}
      {s.label}
    </Box>
  );
};

export default function MonevDosenPage() {
  const [loading, setLoading] = useState(true);
  const [timList, setTimList] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [openDetail, setOpenDetail] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const fetchTimList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMonevTimBimbingan();
      if (res.success) {
        setTimList(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Gagal memuat data monitoring tim bimbingan",
        confirmButtonText: "OK",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimList();
  }, [fetchTimList]);

  const handleOpenDetail = async (tim) => {
    setOpenDetail(true);
    setLoadingDetail(true);
    setDetailData(null);
    try {
      const res = await getMonevDetailTim(tim.id_tim);
      if (res.success) {
        setDetailData(res.data || null);
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Gagal memuat detail luaran tim",
        confirmButtonText: "OK",
      });
      setOpenDetail(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredTim = useMemo(() => {
    return timList.filter((tim) => {
      const statusKategori =
        Number(tim.total_luaran || 0) > 0 &&
        Number(tim.total_disetujui || 0) === Number(tim.total_luaran || 0)
          ? "selesai"
          : "proses";

      const matchSearch =
        (tim.nama_tim || "").toLowerCase().includes(search.toLowerCase()) ||
        (tim.keterangan || "").toLowerCase().includes(search.toLowerCase()) ||
        (tim.ketua?.nama_lengkap || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (tim.judul_proposal || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchStatus = statusFilter === "" || statusFilter === statusKategori;

      return matchSearch && matchStatus;
    });
  }, [timList, search, statusFilter]);

  if (loading) {
    return (
      <BodyLayout Sidebar={DosenSidebar}>
        <Box sx={{ position: "relative", minHeight: "60vh" }}>
          <LoadingScreen message="Memuat data monev..." overlay minHeight="60vh" />
        </Box>
      </BodyLayout>
    );
  }

  return (
    <BodyLayout Sidebar={DosenSidebar}>
      <PageTransition>
        <Box>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
              Monitoring dan Evaluasi
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#777" }}>
              Pantau progres luaran dari tim bimbingan Anda
            </Typography>
          </Box>

          <Paper sx={{ p: 3, mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>Filter Tim</Typography>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Box sx={{ minWidth: 220, flex: "1 1 auto" }}>
                <TextField
                  select
                  fullWidth
                  label="Status Progres"
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
                  fullWidth
                  label="Cari"
                  placeholder="Cari tim, program, ketua, judul proposal..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ fontSize: 18, color: "#999" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={roundedField}
                />
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ borderRadius: "16px", border: "1px solid #f0f0f0", overflow: "hidden" }}>
            {filteredTim.length === 0 ? (
              <Box sx={{ py: 10, textAlign: "center" }}>
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    backgroundColor: "#f5f5f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 3,
                  }}
                >
                  <AssignmentTurnedIn sx={{ fontSize: 48, color: "#ccc" }} />
                </Box>
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#444", mb: 1 }}>
                  Belum Ada Data Monev
                </Typography>
                <Typography sx={{ fontSize: 14, color: "#999" }}>
                  {search || statusFilter ? "Tidak ada tim yang sesuai filter" : "Data tim monev akan tampil di sini"}
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {["Tim", "Ketua", "Program", "Progress", "Proposal", "Aksi"].map((h, i) => (
                        <TableCell
                          key={i}
                          sx={{ ...tableHeadCell, ...(i === 5 && { textAlign: "center" }) }}
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredTim.map((tim) => {
                      const total = Number(tim.total_luaran || 0);
                      const disetujui = Number(tim.total_disetujui || 0);
                      const percent = total > 0 ? Math.round((disetujui / total) * 100) : 0;

                      return (
                        <TableRow key={tim.id_tim} sx={tableBodyRow}>
                          <TableCell>
                            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{tim.nama_tim}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                              {tim.ketua?.nama_lengkap || "-"}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: "#888" }}>
                              {tim.ketua?.nim || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13 }}>{tim.keterangan || "-"}</Typography>
                          </TableCell>
                          <TableCell sx={{ minWidth: 210 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.8 }}>
                              <LinearProgress
                                variant="determinate"
                                value={percent}
                                sx={{
                                  flex: 1,
                                  height: 8,
                                  borderRadius: 5,
                                  backgroundColor: "#f0f0f0",
                                  "& .MuiLinearProgress-bar": {
                                    backgroundColor: percent === 100 && total > 0 ? "#2e7d32" : "#0D59F2",
                                    borderRadius: 5,
                                  },
                                }}
                              />
                              <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#666", minWidth: 36 }}>
                                {percent}%
                              </Typography>
                            </Box>
                            <Typography sx={{ fontSize: 12, color: "#888" }}>
                              {disetujui}/{total} disetujui · {Number(tim.total_submitted || 0)} submitted · {Number(tim.total_ditolak || 0)} ditolak
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, maxWidth: 220, lineHeight: 1.4 }}>
                              {tim.judul_proposal || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleOpenDetail(tim)}
                              sx={{
                                textTransform: "none",
                                borderRadius: "50px",
                                fontSize: 12,
                                fontWeight: 600,
                                px: 2,
                                borderColor: "#0D59F2",
                                color: "#0D59F2",
                                "&:hover": { backgroundColor: "#f0f4ff" },
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
          </Paper>

          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontSize: 13, color: "#999" }}>
              Total: {filteredTim.length} tim
            </Typography>
          </Box>
        </Box>
      </PageTransition>

      <Dialog
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ pb: 1.5, pr: 6 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 18 }}>Detail Luaran Tim</Typography>
          <IconButton
            onClick={() => setOpenDetail(false)}
            sx={{ position: "absolute", right: 12, top: 10, color: "#888" }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ px: 3, py: 2.5 }}>
          {loadingDetail ? (
            <Box sx={{ minHeight: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CircularProgress size={32} sx={{ color: "#0D59F2" }} />
            </Box>
          ) : !detailData ? (
            <Typography sx={{ fontSize: 14, color: "#777", py: 2 }}>
              Detail tidak tersedia
            </Typography>
          ) : (
            <>
              <Paper sx={{ p: 2.5, mb: 2.5, borderRadius: "12px", border: "1px solid #f0f0f0" }}>
                <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 1.5 }}>
                  {detailData.tim?.nama_tim || "-"}
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#666", mb: 0.5 }}>
                  Program: {detailData.tim?.keterangan || "-"}
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#666", mb: 0.5 }}>
                  Proposal: {detailData.tim?.judul_proposal || "-"}
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#666" }}>
                  Ketua: {detailData.tim?.ketua?.nama_lengkap || "-"} ({detailData.tim?.ketua?.nim || "-"})
                </Typography>
              </Paper>

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2.5 }}>
                <Box sx={{ px: 1.5, py: 0.75, borderRadius: "50px", backgroundColor: "#424242", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                  Total: {detailData.progress?.total || 0}
                </Box>
                <Box sx={{ px: 1.5, py: 0.75, borderRadius: "50px", backgroundColor: "#2e7d32", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                  Disetujui: {detailData.progress?.disetujui || 0}
                </Box>
                <Box sx={{ px: 1.5, py: 0.75, borderRadius: "50px", backgroundColor: "#f57f17", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                  Submitted: {detailData.progress?.submitted || 0}
                </Box>
                <Box sx={{ px: 1.5, py: 0.75, borderRadius: "50px", backgroundColor: "#c62828", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                  Ditolak: {detailData.progress?.ditolak || 0}
                </Box>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {(detailData.luaran || []).map((luaran) => {
                  const links = parseLinks(luaran.link_luaran);
                  return (
                    <Paper key={luaran.id_luaran} sx={{ p: 2, borderRadius: "12px", border: "1px solid #f0f0f0" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap", mb: 1.5 }}>
                        <Box>
                          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{luaran.nama_luaran}</Typography>
                          <Typography sx={{ fontSize: 12, color: "#888" }}>
                            Deadline: {formatDateTime(luaran.deadline)}
                          </Typography>
                        </Box>
                        <StatusPill status={luaran.id_luaran_tim ? luaran.status : 0} />
                      </Box>

                      <Typography sx={{ fontSize: 13, color: "#666", mb: 1.25 }}>
                        {luaran.keterangan || "-"}
                      </Typography>

                      {luaran.file_luaran && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: links.length ? 1 : 0 }}>
                          <AttachFile sx={{ fontSize: 16, color: "#1565c0" }} />
                          <Button
                            component="a"
                            href={`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/luaran/${luaran.file_luaran}`}
                            target="_blank"
                            rel="noreferrer"
                            size="small"
                            sx={{ textTransform: "none", p: 0, minWidth: 0, fontSize: 12, color: "#0D59F2" }}
                          >
                            {luaran.file_luaran}
                          </Button>
                        </Box>
                      )}

                      {links.map((url, idx) => (
                        <Box key={`${luaran.id_luaran}-link-${idx}`} sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.75 }}>
                          <LinkIcon sx={{ fontSize: 15, color: "#6a1b9a" }} />
                          <Button
                            component="a"
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            size="small"
                            sx={{ textTransform: "none", p: 0, minWidth: 0, fontSize: 12, color: "#0D59F2" }}
                          >
                            {url}
                          </Button>
                        </Box>
                      ))}

                      {luaran.catatan_admin && (
                        <Box sx={{ mt: 1.5, p: 1.25, borderRadius: "10px", backgroundColor: "#f9fafb", border: "1px solid #eceff1" }}>
                          <Typography sx={{ fontSize: 12, color: "#666" }}>
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
      </Dialog>
    </BodyLayout>
  );
}
