import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, CircularProgress, Chip, TextField, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, Pagination,
} from "@mui/material";
import { SwapHoriz } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  getDistribusiHistory, getReviewerList, reassignReviewer,
  getDistribusiReviewerHistoryTahap2, getDistribusiJuriHistoryTahap2,
} from "../../api/admin";

const STATUS_CONFIG = {
  0: { label: "Menunggu Response", color: "warning" },
  1: { label: "Disetujui", color: "success" },
  2: { label: "Ditolak", color: "error" },
  3: { label: "Draft Penilaian", color: "info" },
  4: { label: "Selesai Dinilai", color: "secondary" },
};

const formatDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const tableHeadCell = {
  fontWeight: 700, fontSize: 13, color: "#000",
  backgroundColor: "#fafafa", borderBottom: "2px solid #f0f0f0", py: 2,
};

const tableBodyRow = { "& td": { borderBottom: "1px solid #f5f5f5", py: 2 } };

const ROWS_PER_PAGE = 10;

function usePagination(data) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);
  const paginated = data.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);
  return { page, setPage, totalPages, paginated };
}

function PaginationBar({ page, totalPages, setPage, total }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
      <Typography sx={{ fontSize: 13, color: "#777" }}>
        Menampilkan {Math.min((page - 1) * ROWS_PER_PAGE + 1, total)}–{Math.min(page * ROWS_PER_PAGE, total)} dari {total} data
      </Typography>
      <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" showFirstButton showLastButton />
    </Box>
  );
}

export default function HistoryDistribusiTable({ id_program, tahap, refresh, onError, onSuccess }) {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [historyReviewer, setHistoryReviewer] = useState([]);
  const [historyJuri, setHistoryJuri] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [reviewers, setReviewers] = useState([]);
  const [selectedNewReviewer, setSelectedNewReviewer] = useState("");
  const [reassigning, setReassigning] = useState(false);
  const [reassignDialog, setReassignDialog] = useState({ open: false, distribusi: null });

  const paginasi = usePagination(filteredHistory);
  const paginasiReviewer = usePagination(historyReviewer);
  const paginasiJuri = usePagination(historyJuri);

  const fetchHistory = useCallback(async () => {
    if (!id_program) return;
    try {
      setLoading(true);
      if (tahap === 1) {
        const res = await getDistribusiHistory(id_program, tahap);
        setHistory(res.data || []);
        setFilteredHistory(res.data || []);
      } else {
        const [reviewerRes, juriRes] = await Promise.all([
          getDistribusiReviewerHistoryTahap2(id_program),
          getDistribusiJuriHistoryTahap2(id_program),
        ]);
        setHistoryReviewer(reviewerRes.data || []);
        setHistoryJuri(juriRes.data || []);
      }
    } catch {
      onError("Gagal memuat history distribusi");
    } finally {
      setLoading(false);
    }
  }, [id_program, tahap, onError]);

  const fetchReviewers = useCallback(async () => {
    if (tahap !== 1) return;
    getReviewerList().then((res) => setReviewers(res.data || [])).catch(() => {});
  }, [tahap]);

  useEffect(() => { fetchHistory(); fetchReviewers(); }, [fetchHistory, fetchReviewers, refresh]);

  useEffect(() => {
    if (tahap !== 1) return;
    setFilteredHistory(statusFilter === "" ? history : history.filter((item) => item.status === Number(statusFilter)));
    paginasi.setPage(1);
  }, [statusFilter, history, tahap]);

  const handleOpenReassign = (distribusi) => {
    setReassignDialog({ open: true, distribusi });
    setSelectedNewReviewer("");
  };

  const handleCloseReassign = () => {
    setReassignDialog({ open: false, distribusi: null });
    setSelectedNewReviewer("");
  };

  const handleReassignSubmit = async () => {
    if (!selectedNewReviewer) {
      Swal.fire({ icon: "warning", title: "Perhatian", text: "Silakan pilih reviewer baru", confirmButtonColor: "#0D59F2" });
      return;
    }

    const { distribusi } = reassignDialog;
    const newReviewer = reviewers.find((r) => r.id_user === selectedNewReviewer);
    const result = await Swal.fire({
      title: "Konfirmasi Reassign",
      html: `Ganti reviewer untuk:<br/><br/><b>${distribusi.judul}</b><br/><br/>Dari: <b>${distribusi.nama_reviewer}</b><br/>Ke: <b>${newReviewer?.nama_lengkap}</b><br/><br/>Lanjutkan?`,
      icon: "question", showCancelButton: true,
      confirmButtonColor: "#0D59F2", cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Ganti", cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      setReassigning(true);
      const res = await reassignReviewer(id_program, tahap, distribusi.id_distribusi, selectedNewReviewer);
      await Swal.fire({ icon: "success", title: "Berhasil", text: res.message, timer: 2000, timerProgressBar: true, showConfirmButton: false });
      onSuccess(res.message);
      handleCloseReassign();
      fetchHistory();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Terjadi kesalahan saat reassign", confirmButtonColor: "#0D59F2" });
      onError(err.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setReassigning(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>;
  }

  if (tahap === 1) {
    return (
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <TextField select label="Filter Status" value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)} size="small" sx={{ minWidth: 220 }}>
            <MenuItem value="">Semua Status</MenuItem>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <MenuItem key={key} value={key}>{cfg.label}</MenuItem>
            ))}
          </TextField>
          <Typography sx={{ fontSize: 13, color: "#777" }}>Total: {filteredHistory.length} distribusi</Typography>
        </Box>

        {filteredHistory.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography sx={{ fontSize: 14, color: "#999" }}>Belum ada history distribusi</Typography>
          </Box>
        ) : (
          <>
            <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={tableHeadCell}>Proposal</TableCell>
                    <TableCell sx={tableHeadCell}>Tim</TableCell>
                    <TableCell sx={tableHeadCell}>Reviewer</TableCell>
                    <TableCell sx={tableHeadCell}>Assigned At</TableCell>
                    <TableCell sx={tableHeadCell}>Status</TableCell>
                    <TableCell sx={{ ...tableHeadCell, textAlign: "center" }}>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginasi.paginated.map((item) => {
                    const statusInfo = STATUS_CONFIG[item.status] || { label: `Status ${item.status}`, color: "default" };
                    return (
                      <TableRow key={item.id_distribusi} sx={tableBodyRow} hover>
                        <TableCell><Typography sx={{ fontSize: 13, maxWidth: 250 }}>{item.judul}</Typography></TableCell>
                        <TableCell><Typography sx={{ fontSize: 13 }}>{item.nama_tim}</Typography></TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.nama_reviewer}</Typography>
                          <Typography sx={{ fontSize: 12, color: "#888" }}>{item.institusi || "-"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13 }}>{formatDate(item.assigned_at)}</Typography>
                          <Typography sx={{ fontSize: 11, color: "#aaa" }}>oleh {item.admin_name}</Typography>
                        </TableCell>
                        <TableCell><Chip label={statusInfo.label} color={statusInfo.color} size="small" /></TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                            <Button size="small" variant="outlined"
                              onClick={() => navigate(`/admin/program/${id_program}/distribusi/reviewer/tahap/${tahap}/${item.id_distribusi}`)}
                              sx={{ textTransform: "none", borderRadius: "8px" }}>Detail</Button>
                            {item.status === 2 && (
                              <Button size="small" variant="outlined" color="warning"
                                startIcon={<SwapHoriz />} onClick={() => handleOpenReassign(item)}
                                sx={{ textTransform: "none", borderRadius: "8px" }}>Reassign</Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <PaginationBar page={paginasi.page} totalPages={paginasi.totalPages} setPage={paginasi.setPage} total={filteredHistory.length} />
          </>
        )}

        <Dialog open={reassignDialog.open} onClose={handleCloseReassign} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Reassign Reviewer</DialogTitle>
          <DialogContent>
            {reassignDialog.distribusi && (
              <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography sx={{ fontSize: 13, color: "#666" }}>
                  Proposal: <b>{reassignDialog.distribusi.judul}</b>
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#666" }}>
                  Reviewer Lama: <b>{reassignDialog.distribusi.nama_reviewer}</b>
                </Typography>
                <TextField select fullWidth label="Reviewer Baru"
                  value={selectedNewReviewer} onChange={(e) => setSelectedNewReviewer(e.target.value)}>
                  <MenuItem value="">Pilih Reviewer Baru</MenuItem>
                  {reviewers.filter((r) => r.id_user !== reassignDialog.distribusi.id_reviewer).map((r) => (
                    <MenuItem key={r.id_user} value={r.id_user}>
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{r.nama_lengkap}</Typography>
                        <Typography sx={{ fontSize: 12, color: "#888" }}>{r.institusi || "-"}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseReassign} disabled={reassigning} sx={{ textTransform: "none" }}>Batal</Button>
            <Button onClick={handleReassignSubmit} variant="contained" disabled={reassigning}
              sx={{ textTransform: "none", backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" } }}>
              {reassigning ? "Memproses..." : "Reassign"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box>
        <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 2 }}>Distribusi Reviewer</Typography>
        {historyReviewer.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography sx={{ fontSize: 14, color: "#999" }}>Belum ada distribusi reviewer</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Proposal</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tim</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Reviewer</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Assigned At</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginasiReviewer.paginated.map((item) => {
                    const statusInfo = STATUS_CONFIG[item.status] || { label: `Status ${item.status}`, color: "default" };
                    return (
                      <TableRow key={item.id_distribusi} hover>
                        <TableCell><Typography sx={{ fontSize: 13, maxWidth: 250 }}>{item.judul}</Typography></TableCell>
                        <TableCell><Typography sx={{ fontSize: 13 }}>{item.nama_tim}</Typography></TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.nama_reviewer}</Typography>
                          <Typography sx={{ fontSize: 12, color: "#888" }}>{item.institusi || "-"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13 }}>{formatDate(item.assigned_at)}</Typography>
                          <Typography sx={{ fontSize: 11, color: "#aaa" }}>oleh {item.admin_name}</Typography>
                        </TableCell>
                        <TableCell><Chip label={statusInfo.label} color={statusInfo.color} size="small" /></TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          <Button size="small" variant="outlined"
                            onClick={() => navigate(`/admin/program/${id_program}/distribusi/reviewer/tahap/${tahap}/${item.id_distribusi}`)}
                            sx={{ textTransform: "none" }}>Detail</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <PaginationBar
              page={paginasiReviewer.page} totalPages={paginasiReviewer.totalPages}
              rowsPerPage={paginasiReviewer.rowsPerPage} setRowsPerPage={paginasiReviewer.setRowsPerPage}
              setPage={paginasiReviewer.setPage} total={historyReviewer.length}
            />
          </>
        )}
      </Box>

      <Box>
        <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 2 }}>Distribusi Juri</Typography>
        {historyJuri.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography sx={{ fontSize: 14, color: "#999" }}>Belum ada distribusi juri</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Proposal</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tim</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Juri</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Assigned At</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginasiJuri.paginated.map((item) => {
                    const statusInfo = STATUS_CONFIG[item.status] || { label: `Status ${item.status}`, color: "default" };
                    return (
                      <TableRow key={item.id_distribusi} hover>
                        <TableCell><Typography sx={{ fontSize: 13, maxWidth: 250 }}>{item.judul}</Typography></TableCell>
                        <TableCell><Typography sx={{ fontSize: 13 }}>{item.nama_tim}</Typography></TableCell>
                        <TableCell><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.nama_juri}</Typography></TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13 }}>{formatDate(item.assigned_at)}</Typography>
                          <Typography sx={{ fontSize: 11, color: "#aaa" }}>oleh {item.admin_name}</Typography>
                        </TableCell>
                        <TableCell><Chip label={statusInfo.label} color={statusInfo.color} size="small" /></TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          <Button size="small" variant="outlined"
                            onClick={() => navigate(`/admin/program/${id_program}/distribusi/juri/tahap/${tahap}/${item.id_distribusi}`)}
                            sx={{ textTransform: "none" }}>Detail</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <PaginationBar
              page={paginasiJuri.page} totalPages={paginasiJuri.totalPages}
              rowsPerPage={paginasiJuri.rowsPerPage} setRowsPerPage={paginasiJuri.setRowsPerPage}
              setPage={paginasiJuri.setPage} total={historyJuri.length}
            />
          </>
        )}
      </Box>
    </Box>
  );
}