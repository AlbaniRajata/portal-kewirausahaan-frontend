import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, CircularProgress, Chip, TextField, MenuItem, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, Pagination,
  Autocomplete,
} from "@mui/material";
import { SwapHoriz } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  getDistribusiHistory, getReviewerList, reassignReviewer,
  getDistribusiReviewerHistoryTahap2, getDistribusiJuriHistoryTahap2,
} from "../../api/admin";

const roundedField = { "& .MuiOutlinedInput-root": { borderRadius: "15px" } };

const tableHeadCell = {
  fontWeight: 700, fontSize: 13, color: "#000",
  backgroundColor: "#fafafa", borderBottom: "2px solid #f0f0f0", py: 2,
};
const tableBodyRow = { "& td": { borderBottom: "1px solid #f5f5f5", py: 2 } };

const STATUS_CONFIG = {
  0: { label: "Menunggu Response", backgroundColor: "#f57f17" },
  1: { label: "Disetujui",         backgroundColor: "#2e7d32" },
  2: { label: "Ditolak",           backgroundColor: "#c62828" },
  3: { label: "Draft Penilaian",   backgroundColor: "#1565c0" },
  4: { label: "Selesai Dinilai",   backgroundColor: "#6a1b9a" },
};

const StatusPill = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: `Status ${status}`, backgroundColor: "#666" };
  return (
    <Box sx={{
      display: "inline-flex", px: 1.5, py: 0.35, borderRadius: "50px",
      backgroundColor: cfg.backgroundColor,
      color: "#fff", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
    }}>
      {cfg.label}
    </Box>
  );
};

const formatDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const ROWS_PER_PAGE = 10;

function usePagination(data, page, setPage) {
  const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);
  const from = data.length === 0 ? 0 : (page - 1) * ROWS_PER_PAGE + 1;
  const to = Math.min(page * ROWS_PER_PAGE, data.length);
  const paginated = data.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);
  return { page, setPage, totalPages, paginated, from, to, total: data.length };
}

function PaginationBar({ page, totalPages, setPage, from, to, total }) {
  if (total === 0) return null;
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
      <Typography sx={{ fontSize: 13, color: "#777" }}>
        Menampilkan {from}–{to} dari {total} data
      </Typography>
      <Pagination
        count={totalPages} page={page} onChange={(_, v) => setPage(v)}
        color="primary" shape="rounded" showFirstButton showLastButton
      />
    </Box>
  );
}

function DistribusiTable({ data, columns, emptyText }) {
  return (
    <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "auto" }}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.key} sx={{ ...tableHeadCell, ...(col.headerSx || {}) }}>
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} sx={{ textAlign: "center", py: 6 }}>
                <Typography sx={{ fontSize: 14, color: "#999" }}>{emptyText}</Typography>
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, i) => (
              <TableRow key={i} sx={tableBodyRow}>
                {columns.map((col) => (
                  <TableCell key={col.key} sx={col.cellSx || {}}>
                    {col.render(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
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
  const [selectedNewReviewer, setSelectedNewReviewer] = useState(null);
  const [reassigning, setReassigning] = useState(false);
  const [reassignDialog, setReassignDialog] = useState({ open: false, distribusi: null });

  const [pageMain, setPageMain] = useState(1);
  const [pageReviewer, setPageReviewer] = useState(1);
  const [pageJuri, setPageJuri] = useState(1);

  const paginasi = usePagination(filteredHistory, pageMain, setPageMain);
  const paginasiReviewer = usePagination(historyReviewer, pageReviewer, setPageReviewer);
  const paginasiJuri = usePagination(historyJuri, pageJuri, setPageJuri);

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
    setPageMain(1);
  }, [statusFilter, history, tahap]);

  const handleOpenReassign = (distribusi) => {
    setReassignDialog({ open: true, distribusi });
    setSelectedNewReviewer(null);
  };

  const handleCloseReassign = () => {
    setReassignDialog({ open: false, distribusi: null });
    setSelectedNewReviewer(null);
  };

  const handleReassignSubmit = async () => {
    if (!selectedNewReviewer) {
      Swal.fire({ icon: "warning", title: "Perhatian", text: "Silakan pilih reviewer baru", confirmButtonColor: "#0D59F2" });
      return;
    }
    const { distribusi } = reassignDialog;
    const result = await Swal.fire({
      title: "Konfirmasi Reassign",
      html: `Ganti reviewer untuk:<br/><br/><b>${distribusi.judul}</b><br/><br/>Dari: <b>${distribusi.nama_reviewer}</b><br/>Ke: <b>${selectedNewReviewer.nama_lengkap}</b><br/><br/>Lanjutkan?`,
      icon: "question", showCancelButton: true,
      confirmButtonColor: "#0D59F2", cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Ganti", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    try {
      setReassigning(true);
      const res = await reassignReviewer(id_program, tahap, distribusi.id_distribusi, selectedNewReviewer.id_user);
      await Swal.fire({ icon: "success", title: "Berhasil", text: res.message, timer: 2000, timerProgressBar: true, showConfirmButton: false });
      onSuccess(res.message);
      handleCloseReassign();
      fetchHistory();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Terjadi kesalahan saat reassign", confirmButtonColor: "#0D59F2" });
    } finally {
      setReassigning(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>;
  }

  const commonColumns = (nameKey, instKey) => [
    {
      key: "proposal", label: "Proposal",
      render: (item) => <Typography sx={{ fontSize: 13, maxWidth: 250 }}>{item.judul}</Typography>,
    },
    {
      key: "tim", label: "Tim",
      render: (item) => <Typography sx={{ fontSize: 13 }}>{item.nama_tim}</Typography>,
    },
    {
      key: "penilai", label: nameKey === "nama_reviewer" ? "Reviewer" : "Juri",
      render: (item) => (
        <>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item[nameKey]}</Typography>
          {instKey && <Typography sx={{ fontSize: 12, color: "#888" }}>{item[instKey] || "-"}</Typography>}
        </>
      ),
    },
    {
      key: "assigned_at", label: "Assigned At",
      render: (item) => (
        <>
          <Typography sx={{ fontSize: 13 }}>{formatDate(item.assigned_at)}</Typography>
          <Typography sx={{ fontSize: 11, color: "#aaa" }}>oleh {item.admin_name}</Typography>
        </>
      ),
    },
    {
      key: "status", label: "Status",
      render: (item) => <StatusPill status={item.status} />,
    },
  ];

  if (tahap === 1) {
    const columns = [
      ...commonColumns("nama_reviewer", "institusi"),
      {
        key: "aksi", label: "Aksi", headerSx: { textAlign: "center" }, cellSx: { textAlign: "center" },
        render: (item) => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
            <Button size="small" variant="outlined"
              onClick={() => navigate(`/admin/program/${id_program}/distribusi/reviewer/tahap/${tahap}/${item.id_distribusi}`)}
              sx={{ textTransform: "none", borderRadius: "50px", fontSize: 12 }}>
              Detail
            </Button>
            {item.status === 2 && (
              <Button size="small" variant="outlined" color="warning"
                startIcon={<SwapHoriz />} onClick={() => handleOpenReassign(item)}
                sx={{ textTransform: "none", borderRadius: "8px", fontSize: 12 }}>
                Reassign
              </Button>
            )}
          </Box>
        ),
      },
    ];

    return (
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <TextField select label="Filter Status" value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPageMain(1); }}
            size="small" sx={{ ...roundedField, minWidth: 220 }}>
            <MenuItem value="">Semua Status</MenuItem>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <MenuItem key={key} value={key}>{cfg.label}</MenuItem>
            ))}
          </TextField>
          <Typography sx={{ fontSize: 13, color: "#777" }}>
            Total: {filteredHistory.length} distribusi
          </Typography>
        </Box>

        <DistribusiTable data={paginasi.paginated} columns={columns} emptyText="Belum ada history distribusi" />
        <PaginationBar {...paginasi} />

        <Dialog open={reassignDialog.open} onClose={handleCloseReassign} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>Reassign Reviewer</DialogTitle>
          <DialogContent>
            {reassignDialog.distribusi && (
              <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography sx={{ fontSize: 13, color: "#666" }}>
                  Proposal: <b>{reassignDialog.distribusi.judul}</b>
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#666" }}>
                  Reviewer Lama: <b>{reassignDialog.distribusi.nama_reviewer}</b>
                </Typography>
                <Autocomplete
                  options={reviewers.filter((r) => r.id_user !== reassignDialog.distribusi.id_reviewer)}
                  value={selectedNewReviewer}
                  onChange={(_, v) => setSelectedNewReviewer(v)}
                  getOptionLabel={(o) => o.nama_lengkap || ""}
                  isOptionEqualToValue={(o, v) => o.id_user === v.id_user}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} key={option.id_user}>
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{option.nama_lengkap}</Typography>
                        <Typography sx={{ fontSize: 12, color: "#888" }}>
                          {option.institusi || "-"}{option.bidang_keahlian ? ` • ${option.bidang_keahlian}` : ""}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField {...params} label="Reviewer Baru" placeholder="Cari atau pilih reviewer" />
                  )}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button onClick={handleCloseReassign} disabled={reassigning}
              sx={{ textTransform: "none", borderRadius: "50px", px: 2.5 }}>
              Batal
            </Button>
            <Button onClick={handleReassignSubmit} variant="contained" disabled={reassigning}
              sx={{ textTransform: "none", borderRadius: "50px", px: 2.5, backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" } }}>
              {reassigning ? "Memproses..." : "Reassign"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  const reviewerColumns = [
    ...commonColumns("nama_reviewer", "institusi"),
    {
      key: "aksi", label: "Aksi", headerSx: { textAlign: "center" }, cellSx: { textAlign: "center" },
      render: (item) => (
        <Button size="small" variant="outlined"
          onClick={() => navigate(`/admin/program/${id_program}/distribusi/reviewer/tahap/${tahap}/${item.id_distribusi}`)}
          sx={{ textTransform: "none", borderRadius: "50px", fontSize: 12 }}>
          Detail
        </Button>
      ),
    },
  ];

  const juriColumns = [
    ...commonColumns("nama_juri", null),
    {
      key: "aksi", label: "Aksi", headerSx: { textAlign: "center" }, cellSx: { textAlign: "center" },
      render: (item) => (
        <Button size="small" variant="outlined"
          onClick={() => navigate(`/admin/program/${id_program}/distribusi/juri/tahap/${tahap}/${item.id_distribusi}`)}
          sx={{ textTransform: "none", borderRadius: "50px", fontSize: 12 }}>
          Detail
        </Button>
      ),
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", mb: 2 }}>
          Distribusi Reviewer
        </Typography>
        <DistribusiTable
          data={paginasiReviewer.paginated}
          columns={reviewerColumns}
          emptyText="Belum ada distribusi reviewer"
        />
        <PaginationBar {...paginasiReviewer} />
      </Box>

      <Box>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", mb: 2 }}>
          Distribusi Juri
        </Typography>
        <DistribusiTable
          data={paginasiJuri.paginated}
          columns={juriColumns}
          emptyText="Belum ada distribusi juri"
        />
        <PaginationBar {...paginasiJuri} />
      </Box>
    </Box>
  );
}