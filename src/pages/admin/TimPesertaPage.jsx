import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, CircularProgress,
  Alert, IconButton, Pagination, InputAdornment, Divider, Chip,
} from "@mui/material";
import { Visibility, Close, PersonAdd, Search, Groups } from "@mui/icons-material";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import {
  getTimList,
  getTimDetail,
  getPesertaList,
  getPesertaDetail,
} from "../../api/admin";
import { getAllProgram } from "../../api/public";

const roundedField = { "& .MuiOutlinedInput-root": { borderRadius: "15px" } };
const tableHeadCell = {
  fontWeight: 700, fontSize: 13, color: "#000",
  backgroundColor: "#fafafa", borderBottom: "2px solid #f0f0f0", py: 2,
};
const tableBodyRow = { "& td": { borderBottom: "1px solid #f5f5f5", py: 2 } };

const TIM_STATUS = {
  0: { label: "Draft",   bg: "#757575", color: "#f5f5f5" },
  1: { label: "Aktif",   bg: "#2e7d32", color: "#e8f5e9" },
  2: { label: "Selesai", bg: "#0D59F2", color: "#e3f0ff" },
};

const ANGGOTA_STATUS = {
  0: { label: "Menunggu",  bg: "#f57f17", color: "#fff8e1" },
  1: { label: "Disetujui", bg: "#2e7d32", color: "#e8f5e9" },
  2: { label: "Ditolak",   bg: "#c62828", color: "#fce4ec" },
};

const LOLOS_STATUS = {
  0: { label: "Belum Dinilai", bg: "#757575", color: "#f5f5f5" },
  1: { label: "Lolos",         bg: "#2e7d32", color: "#e8f5e9" },
  2: { label: "Tidak Lolos",   bg: "#c62828", color: "#fce4ec" },
};

const PROPOSAL_STATUS = {
  0: { label: "Draft",                       bg: "#757575", color: "#f5f5f5" },
  1: { label: "Diajukan",                    bg: "#0D59F2", color: "#e3f0ff" },
  2: { label: "Ditugaskan Reviewer Tahap 1", bg: "#6a1b9a", color: "#f3e5f5" },
  3: { label: "Tidak Lolos Desk Evaluasi",   bg: "#c62828", color: "#fce4ec" },
  4: { label: "Lolos Desk Evaluasi",         bg: "#2e7d32", color: "#e8f5e9" },
  5: { label: "Panel Wawancara",             bg: "#e65100", color: "#fff3e0" },
  6: { label: "Tidak Lolos Wawancara",       bg: "#c62828", color: "#fce4ec" },
  7: { label: "Lolos Wawancara",             bg: "#2e7d32", color: "#e8f5e9" },
  8: { label: "Pembimbing Diajukan",         bg: "#00695c", color: "#e0f2f1" },
  9: { label: "Pembimbing Disetujui",        bg: "#1b5e20", color: "#e8f5e9" },
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

const DetailRow = ({ label, value }) => (
  <Box>
    <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>{label}</Typography>
    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{value || "-"}</Typography>
  </Box>
);

const formatDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};

const formatCurrency = (v) => {
  if (!v) return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(v);
};

export default function TimPesertaPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timList, setTimList] = useState([]);
  const [pesertaList, setPesertaList] = useState([]);
  const [programList, setProgramList] = useState([]);
  const [alert, setAlert] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const [filters, setFilters] = useState({ search: "", id_program: "" });

  const [openDetail, setOpenDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchProgram = async () => {
  try {
    const res = await getAllProgram();
    if (res.success) setProgramList(res.data || []);
  } catch (err) {
    console.error("Gagal memuat program:", err);
  }
};
  const fetchTim = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.id_program) params.id_program = filters.id_program;
      if (filters.search) params.search = filters.search;
      const res = await getTimList(params);
      if (res.success) setTimList(res.data || []);
      else setAlert(res.message);
    } catch (err) {
      console.error("Gagal memuat tim:", err);
      setAlert("Gagal memuat data tim");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchPeserta = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.id_program) params.id_program = filters.id_program;
      if (filters.search) params.search = filters.search;
      const res = await getPesertaList(params);
      if (res.success) setPesertaList(res.data || []);
      else setAlert(res.message);
    } catch (err) {
      console.error("Gagal memuat peserta:", err);
      setAlert("Gagal memuat data peserta");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchProgram(); }, []);

  useEffect(() => {
    setPage(1);
    if (activeTab === 0) fetchTim();
    else fetchPeserta();
  }, [activeTab, filters, fetchTim, fetchPeserta]);

  const handleViewTimDetail = async (item) => {
    setSelectedItem(item);
    setDetailData(null);
    setOpenDetail(true);
    setLoadingDetail(true);
    try {
      const res = await getTimDetail(item.id_tim);
      if (res.success) setDetailData(res.data);
      else setAlert(res.message);
    } catch (err) {
      console.error("Gagal memuat detail tim:", err);
      setAlert("Gagal memuat detail");
      setOpenDetail(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleViewPesertaDetail = async (item) => {
    setSelectedItem(item);
    setDetailData(null);
    setOpenDetail(true);
    setLoadingDetail(true);
    try {
      const res = await getPesertaDetail(item.id_user, item.id_program);
      if (res.success) setDetailData(res.data);
      else setAlert(res.message);
    } catch (err) {
      console.error("Gagal memuat detail peserta:", err);
      setAlert("Gagal memuat detail");
      setOpenDetail(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const currentList = activeTab === 0 ? timList : pesertaList;
  const totalPages = Math.ceil(currentList.length / rowsPerPage);
  const paginatedList = currentList.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const renderTimDetail = () => {
    if (!detailData) return null;
    const ts = TIM_STATUS[detailData.status] || TIM_STATUS[0];
    const ps = detailData.proposal ? (PROPOSAL_STATUS[detailData.proposal.status] || PROPOSAL_STATUS[0]) : null;
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
          <DetailRow label="Nama Tim" value={detailData.nama_tim} />
          <DetailRow label="Program" value={detailData.nama_program} />
          <Box>
            <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Status Tim</Typography>
            <StatusPill label={ts.label} bg={ts.bg} color={ts.color} />
          </Box>
          <DetailRow label="Tanggal Dibuat" value={formatDate(detailData.created_at)} />
        </Box>

        <Divider />
        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Anggota Tim</Typography>
        {detailData.anggota && detailData.anggota.length > 0 ? (
          <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Nama", "NIM", "Peran", "Prodi", "Status"].map((h, i) => (
                    <TableCell key={i} sx={{ ...tableHeadCell, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {detailData.anggota.map((a) => {
                  const as = ANGGOTA_STATUS[a.status] || ANGGOTA_STATUS[0];
                  return (
                    <TableRow key={a.id_user} sx={tableBodyRow}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{a.nama_lengkap || a.username}</Typography>
                        <Typography sx={{ fontSize: 11, color: "#aaa" }}>{a.email}</Typography>
                      </TableCell>
                      <TableCell><Typography sx={{ fontSize: 12 }}>{a.nim}</Typography></TableCell>
                      <TableCell>
                        <Chip
                          label={a.peran === 1 ? "Ketua" : "Anggota"}
                          size="small"
                          sx={{ fontSize: 11, fontWeight: 700, backgroundColor: a.peran === 1 ? "#e3f0ff" : "#f5f5f5", color: a.peran === 1 ? "#0D59F2" : "#555" }}
                        />
                      </TableCell>
                      <TableCell><Typography sx={{ fontSize: 12 }}>{a.jenjang} {a.nama_prodi}</Typography></TableCell>
                      <TableCell><StatusPill label={as.label} bg={as.bg} color={as.color} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography sx={{ fontSize: 13, color: "#999" }}>Belum ada anggota</Typography>
        )}

        <Divider />
        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Proposal</Typography>
        {detailData.proposal ? (
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
            <Box sx={{ gridColumn: "1 / -1" }}>
              <DetailRow label="Judul Proposal" value={detailData.proposal.judul} />
            </Box>
            <DetailRow label="Kategori" value={detailData.proposal.nama_kategori} />
            <DetailRow label="Modal Diajukan" value={formatCurrency(detailData.proposal.modal_diajukan)} />
            <DetailRow label="Tanggal Submit" value={formatDate(detailData.proposal.tanggal_submit)} />
            <DetailRow label="Jadwal Wawancara" value={formatDate(detailData.proposal.wawancara_at)} />
            <Box>
              <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Status Proposal</Typography>
              {ps && <StatusPill label={ps.label} bg={ps.bg} color={ps.color} />}
            </Box>
            {detailData.proposal.file_proposal && (
              <Box>
                <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>File Proposal</Typography>
                <Button
                  size="small" variant="outlined"
                  href={`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/proposal/${detailData.proposal.file_proposal}`}
                  target="_blank"
                  sx={{ textTransform: "none", borderRadius: "8px", fontSize: 12, borderColor: "#0D59F2", color: "#0D59F2" }}
                >
                  Lihat File
                </Button>
              </Box>
            )}
          </Box>
        ) : (
          <Typography sx={{ fontSize: 13, color: "#999" }}>Belum ada proposal</Typography>
        )}
      </Box>
    );
  };

  const renderPesertaDetail = () => {
    if (!detailData) return null;
    const ls = LOLOS_STATUS[detailData.status_lolos] || LOLOS_STATUS[0];
    const as = detailData.status_anggota !== undefined ? (ANGGOTA_STATUS[detailData.status_anggota] || ANGGOTA_STATUS[0]) : null;
    const ps = detailData.proposal ? (PROPOSAL_STATUS[detailData.proposal.status] || PROPOSAL_STATUS[0]) : null;
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
          <DetailRow label="Nama Lengkap" value={detailData.nama_lengkap} />
          <DetailRow label="Username" value={detailData.username} />
          <DetailRow label="Email" value={detailData.email} />
          <DetailRow label="NIM" value={detailData.nim} />
          <DetailRow label="No. HP" value={detailData.no_hp} />
          <DetailRow label="Tahun Masuk" value={detailData.tahun_masuk} />
          <DetailRow label="Program Studi" value={`${detailData.jenjang} ${detailData.nama_prodi}`} />
          <DetailRow label="Jurusan" value={detailData.nama_jurusan} />
          <DetailRow label="Kampus" value={detailData.nama_kampus} />
          <DetailRow label="Program" value={detailData.nama_program} />
          <DetailRow label="Tahun Daftar" value={detailData.tahun} />
          <Box>
            <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Status Lolos</Typography>
            <StatusPill label={ls.label} bg={ls.bg} color={ls.color} />
          </Box>
        </Box>

        <Divider />
        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Informasi Tim</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
          <DetailRow label="Nama Tim" value={detailData.nama_tim} />
          <Box>
            <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Peran di Tim</Typography>
            {detailData.peran !== undefined && detailData.peran !== null ? (
              <Chip
                label={detailData.peran === 1 ? "Ketua" : "Anggota"}
                size="small"
                sx={{ fontSize: 12, fontWeight: 700, backgroundColor: detailData.peran === 1 ? "#e3f0ff" : "#f5f5f5", color: detailData.peran === 1 ? "#0D59F2" : "#555" }}
              />
            ) : <Typography sx={{ fontSize: 14, fontWeight: 600 }}>-</Typography>}
          </Box>
          {as && (
            <Box>
              <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Status Keanggotaan</Typography>
              <StatusPill label={as.label} bg={as.bg} color={as.color} />
            </Box>
          )}
          {detailData.catatan_anggota && (
            <Box sx={{ gridColumn: "1 / -1", p: 2, backgroundColor: "#fce4ec", borderRadius: "12px", border: "1px solid #ef9a9a" }}>
              <Typography sx={{ fontSize: 12, color: "#c62828", fontWeight: 700, mb: 0.5 }}>Catatan</Typography>
              <Typography sx={{ fontSize: 13 }}>{detailData.catatan_anggota}</Typography>
            </Box>
          )}
        </Box>

        <Divider />
        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Proposal Tim</Typography>
        {detailData.proposal ? (
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
            <Box sx={{ gridColumn: "1 / -1" }}>
              <DetailRow label="Judul Proposal" value={detailData.proposal.judul} />
            </Box>
            <DetailRow label="Kategori" value={detailData.proposal.nama_kategori} />
            <DetailRow label="Modal Diajukan" value={formatCurrency(detailData.proposal.modal_diajukan)} />
            <DetailRow label="Tanggal Submit" value={formatDate(detailData.proposal.tanggal_submit)} />
            <DetailRow label="Jadwal Wawancara" value={formatDate(detailData.proposal.wawancara_at)} />
            <Box>
              <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>Status Proposal</Typography>
              {ps && <StatusPill label={ps.label} bg={ps.bg} color={ps.color} />}
            </Box>
            {detailData.proposal.file_proposal && (
              <Box>
                <Typography sx={{ fontSize: 12, color: "#888", mb: 0.5 }}>File Proposal</Typography>
                <Button
                  size="small" variant="outlined"
                  href={`${import.meta.env.VITE_API_URL.replace("/api", "")}/uploads/proposal/${detailData.proposal.file_proposal}`}
                  target="_blank"
                  sx={{ textTransform: "none", borderRadius: "8px", fontSize: 12, borderColor: "#0D59F2", color: "#0D59F2" }}
                >
                  Lihat File
                </Button>
              </Box>
            )}
          </Box>
        ) : (
          <Typography sx={{ fontSize: 13, color: "#999" }}>Belum ada proposal</Typography>
        )}
      </Box>
    );
  };

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <Box>
        <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Tim & Peserta</Typography>
        <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>Data tim dan peserta program</Typography>

        {alert && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setAlert("")}>
            {alert}
          </Alert>
        )}

        <Paper sx={{ borderRadius: "16px", border: "1px solid #f0f0f0", overflow: "hidden" }}>
          <Box sx={{ borderBottom: "1px solid #f0f0f0" }}>
            <Tabs
              value={activeTab}
              onChange={(e, v) => { setActiveTab(v); setPage(1); }}
              sx={{
                px: 2,
                "& .MuiTab-root": { textTransform: "none", fontSize: 14, fontWeight: 500, color: "#888", minHeight: 52, "&.Mui-selected": { fontWeight: 700, color: "#0D59F2" } },
                "& .MuiTabs-indicator": { backgroundColor: "#0D59F2", height: 3, borderRadius: "3px 3px 0 0" },
              }}
            >
              <Tab label="Tim" />
              <Tab label="Peserta Program" />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
              <TextField
                size="small"
                placeholder={activeTab === 0 ? "Cari nama tim, ketua..." : "Cari nama, email, NIM..."}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: "#aaa" }} /></InputAdornment> }}
                sx={{ ...roundedField, minWidth: 240, flex: "1 1 240px" }}
              />
              <TextField
                select size="small" label="Program"
                value={filters.id_program}
                onChange={(e) => setFilters({ ...filters, id_program: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ ...roundedField, minWidth: 220 }}
              >
                <MenuItem value="">Semua Program</MenuItem>
                {programList.map((p) => (
                  <MenuItem key={p.id_program} value={p.id_program}>{p.keterangan}</MenuItem>
                ))}
              </TextField>
            </Box>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
            ) : paginatedList.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 10 }}>
                <Box sx={{ width: 100, height: 100, borderRadius: "50%", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
                  {activeTab === 0
                    ? <Groups sx={{ fontSize: 48, color: "#ccc" }} />
                    : <PersonAdd sx={{ fontSize: 48, color: "#ccc" }} />
                  }
                </Box>
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#444", mb: 1 }}>
                  Tidak ada data {activeTab === 0 ? "tim" : "peserta"}
                </Typography>
                <Typography sx={{ fontSize: 14, color: "#999" }}>Data akan muncul di sini</Typography>
              </Box>
            ) : (
              <>
                <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "auto", mb: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {activeTab === 0
                          ? ["Nama Tim", "Program", "Ketua", "Anggota", "Proposal", "Status", "Aksi"].map((h, i) => (
                              <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 6 && { textAlign: "center" }) }}>{h}</TableCell>
                            ))
                          : ["Nama Peserta", "NIM", "Program", "Tim", "Peran", "Status Lolos", "Aksi"].map((h, i) => (
                              <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 6 && { textAlign: "center" }) }}>{h}</TableCell>
                            ))
                        }
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeTab === 0
                        ? paginatedList.map((item) => {
                            const ts = TIM_STATUS[item.status] || TIM_STATUS[0];
                            const proposalStatus = item.id_proposal ? (PROPOSAL_STATUS[item.status_proposal] || PROPOSAL_STATUS[0]) : null;
                            return (
                              <TableRow key={item.id_tim} sx={tableBodyRow}>
                                <TableCell>
                                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{item.nama_tim}</Typography>
                                </TableCell>
                                <TableCell><Typography sx={{ fontSize: 13 }}>{item.nama_program}</Typography></TableCell>
                                <TableCell>
                                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.nama_ketua || "-"}</Typography>
                                  {item.nim_ketua && <Typography sx={{ fontSize: 11, color: "#aaa" }}>{item.nim_ketua}</Typography>}
                                </TableCell>
                                <TableCell><Typography sx={{ fontSize: 13 }}>{item.jumlah_anggota} orang</Typography></TableCell>
                                <TableCell>
                                  {proposalStatus
                                    ? <StatusPill label={proposalStatus.label} bg={proposalStatus.bg} color={proposalStatus.color} />
                                    : <Typography sx={{ fontSize: 12, color: "#aaa" }}>Belum ada</Typography>
                                  }
                                </TableCell>
                                <TableCell><StatusPill label={ts.label} bg={ts.bg} color={ts.color} /></TableCell>
                                <TableCell align="center">
                                  <Button
                                    size="small" variant="outlined"
                                    startIcon={<Visibility sx={{ fontSize: 14 }} />}
                                    onClick={() => handleViewTimDetail(item)}
                                    sx={{ textTransform: "none", borderRadius: "50px", fontSize: 12, fontWeight: 600, px: 2, borderColor: "#0D59F2", color: "#0D59F2", "&:hover": { backgroundColor: "#f0f4ff" } }}
                                  >
                                    Detail
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        : paginatedList.map((item) => {
                            const ls = LOLOS_STATUS[item.status_lolos] || LOLOS_STATUS[0];
                            return (
                              <TableRow key={`${item.id_user}-${item.id_program}`} sx={tableBodyRow}>
                                <TableCell>
                                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{item.nama_lengkap || item.username}</Typography>
                                  <Typography sx={{ fontSize: 11, color: "#aaa" }}>@{item.username}</Typography>
                                </TableCell>
                                <TableCell><Typography sx={{ fontSize: 13 }}>{item.nim}</Typography></TableCell>
                                <TableCell><Typography sx={{ fontSize: 13 }}>{item.nama_program}</Typography></TableCell>
                                <TableCell><Typography sx={{ fontSize: 13 }}>{item.nama_tim || "-"}</Typography></TableCell>
                                <TableCell>
                                  {item.peran !== undefined && item.peran !== null
                                    ? <Chip label={item.peran === 1 ? "Ketua" : "Anggota"} size="small"
                                        sx={{ fontSize: 11, fontWeight: 700, backgroundColor: item.peran === 1 ? "#e3f0ff" : "#f5f5f5", color: item.peran === 1 ? "#0D59F2" : "#555" }} />
                                    : <Typography sx={{ fontSize: 12, color: "#aaa" }}>-</Typography>
                                  }
                                </TableCell>
                                <TableCell><StatusPill label={ls.label} bg={ls.bg} color={ls.color} /></TableCell>
                                <TableCell align="center">
                                  <Button
                                    size="small" variant="outlined"
                                    startIcon={<Visibility sx={{ fontSize: 14 }} />}
                                    onClick={() => handleViewPesertaDetail(item)}
                                    sx={{ textTransform: "none", borderRadius: "50px", fontSize: 12, fontWeight: 600, px: 2, borderColor: "#0D59F2", color: "#0D59F2", "&:hover": { backgroundColor: "#f0f4ff" } }}
                                  >
                                    Detail
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                      }
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontSize: 13, color: "#777" }}>
                    Menampilkan {((page - 1) * rowsPerPage) + 1}–{Math.min(page * rowsPerPage, currentList.length)} dari {currentList.length} data
                  </Typography>
                  <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} color="primary" shape="rounded" showFirstButton showLastButton />
                </Box>
              </>
            )}
          </Box>
        </Paper>

        <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth
          PaperProps={{ sx: { borderRadius: "16px" } }}>
          <DialogTitle sx={{ pb: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
              {activeTab === 0
                ? `Detail Tim — ${selectedItem?.nama_tim || ""}`
                : `Detail Peserta — ${selectedItem?.nama_lengkap || selectedItem?.username || ""}`
              }
            </Typography>
            <IconButton onClick={() => setOpenDetail(false)} sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ px: 3, py: 3 }}>
            {loadingDetail
              ? <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress /></Box>
              : activeTab === 0 ? renderTimDetail() : renderPesertaDetail()
            }
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenDetail(false)}
              sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600, color: "#666", border: "1.5px solid #e0e0e0", "&:hover": { backgroundColor: "#f5f5f5" } }}>
              Tutup
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </BodyLayout>
  );
}