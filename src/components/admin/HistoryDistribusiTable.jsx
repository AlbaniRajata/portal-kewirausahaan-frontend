import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Chip,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
} from "@mui/material";
import { SwapHoriz } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  getDistribusiHistory,
  getReviewerList,
  reassignReviewer,
  getDistribusiReviewerHistoryTahap2,
  getDistribusiJuriHistoryTahap2,
} from "../../api/admin";

export default function HistoryDistribusiTable({
  id_program,
  tahap,
  refresh,
  onError,
  onSuccess,
}) {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [historyReviewer, setHistoryReviewer] = useState([]);
  const [historyJuri, setHistoryJuri] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [pageReviewer, setPageReviewer] = useState(0);
  const [rowsPerPageReviewer, setRowsPerPageReviewer] = useState(10);

  const [pageJuri, setPageJuri] = useState(0);
  const [rowsPerPageJuri, setRowsPerPageJuri] = useState(10);

  const [reassignDialog, setReassignDialog] = useState({
    open: false,
    distribusi: null,
  });
  const [reviewers, setReviewers] = useState([]);
  const [selectedNewReviewer, setSelectedNewReviewer] = useState("");
  const [reassigning, setReassigning] = useState(false);

  const statusConfig = {
    0: { label: "Menunggu Response", color: "warning" },
    1: { label: "Disetujui", color: "success" },
    2: { label: "Ditolak", color: "error" },
    3: { label: "Draft Penilaian", color: "info" },
    4: { label: "Selesai Dinilai", color: "secondary" },
  };

  const fetchHistory = useCallback(async () => {
    if (!id_program) return;

    try {
      setLoading(true);

      if (tahap === 1) {
        const response = await getDistribusiHistory(id_program, tahap);
        if (response.success) {
          setHistory(response.data || []);
          setFilteredHistory(response.data || []);
        }
      } else {
        const [reviewerRes, juriRes] = await Promise.all([
          getDistribusiReviewerHistoryTahap2(id_program),
          getDistribusiJuriHistoryTahap2(id_program),
        ]);

        if (reviewerRes.success && juriRes.success) {
          setHistoryReviewer(reviewerRes.data || []);
          setHistoryJuri(juriRes.data || []);
        }
      }
    } catch (err) {
      console.error("Error fetching history:", err);
      onError("Gagal memuat history distribusi");
    } finally {
      setLoading(false);
    }
  }, [id_program, tahap, onError]);

  const fetchReviewers = useCallback(async () => {
    try {
      const response = await getReviewerList();
      if (response.success) {
        setReviewers(response.data || []);
      }
    } catch (err) {
      console.error("Error fetching reviewers:", err);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    if (tahap === 1) {
      fetchReviewers();
    }
  }, [fetchHistory, fetchReviewers, refresh, tahap]);

  useEffect(() => {
    if (tahap === 1) {
      if (statusFilter === "") {
        setFilteredHistory(history);
      } else {
        setFilteredHistory(
          history.filter((item) => item.status === Number(statusFilter)),
        );
      }
      setPage(0);
    }
  }, [statusFilter, history, tahap]);

  const handleOpenReassign = (distribusi) => {
    setReassignDialog({
      open: true,
      distribusi,
    });
    setSelectedNewReviewer("");
  };

  const handleCloseReassign = () => {
    setReassignDialog({
      open: false,
      distribusi: null,
    });
    setSelectedNewReviewer("");
  };

  const handleReassignSubmit = async () => {
    if (!selectedNewReviewer) {
      Swal.fire({
        title: "Perhatian!",
        text: "Silakan pilih reviewer baru",
        icon: "warning",
        confirmButtonColor: "#0D59F2",
      });
      return;
    }

    const { distribusi } = reassignDialog;
    const newReviewer = reviewers.find(
      (r) => r.id_user === selectedNewReviewer,
    );

    const result = await Swal.fire({
      title: "Konfirmasi Reassign",
      html: `Ganti reviewer untuk proposal:<br/><br/><b>${distribusi.judul}</b><br/><br/>Dari: <b>${distribusi.nama_reviewer}</b><br/>Ke: <b>${newReviewer?.nama_lengkap}</b><br/><br/>Lanjutkan?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0D59F2",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Ganti",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        setReassigning(true);
        const response = await reassignReviewer(
          id_program,
          tahap,
          distribusi.id_distribusi,
          selectedNewReviewer,
        );

        if (response.success) {
          Swal.fire({
            title: "Berhasil!",
            text: response.message,
            icon: "success",
            confirmButtonColor: "#0D59F2",
          });
          onSuccess(response.message);
          handleCloseReassign();
          fetchHistory();
        } else {
          Swal.fire({
            title: "Gagal!",
            text: response.message,
            icon: "error",
            confirmButtonColor: "#d33",
          });
          onError(response.message);
        }
      } catch (err) {
        console.error("Error reassigning:", err);
        Swal.fire({
          title: "Error!",
          text: "Terjadi kesalahan saat reassign",
          icon: "error",
          confirmButtonColor: "#d33",
        });
        onError("Terjadi kesalahan saat reassign");
      } finally {
        setReassigning(false);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleChangePageReviewer = (event, newPage) => {
    setPageReviewer(newPage);
  };

  const handleChangeRowsPerPageReviewer = (event) => {
    setRowsPerPageReviewer(parseInt(event.target.value, 10));
    setPageReviewer(0);
  };

  const handleChangePageJuri = (event, newPage) => {
    setPageJuri(newPage);
  };

  const handleChangeRowsPerPageJuri = (event) => {
    setRowsPerPageJuri(parseInt(event.target.value, 10));
    setPageJuri(0);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (tahap === 1) {
    const paginatedHistory = filteredHistory.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );

    return (
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <TextField
            select
            label="Filter Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Semua Status</MenuItem>
            {Object.entries(statusConfig).map(([key, config]) => (
              <MenuItem key={key} value={key}>
                {config.label}
              </MenuItem>
            ))}
          </TextField>

          <Typography sx={{ fontSize: 14, color: "#666", alignSelf: "center" }}>
            Total: {filteredHistory.length} distribusi
          </Typography>
        </Box>

        {filteredHistory.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 5 }}>
            <Typography sx={{ fontSize: 16, color: "#666" }}>
              Belum ada history distribusi
            </Typography>
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
                    <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>
                      Aksi
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedHistory.map((item) => {
                    const statusInfo = statusConfig[item.status] || { label: `Status ${item.status}`, color: "default" };
                    return (
                      <TableRow key={item.id_distribusi} hover>
                        <TableCell>
                          <Typography sx={{ fontSize: 14, maxWidth: 250 }}>
                            {item.judul}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 14 }}>
                            {item.nama_tim}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                              {item.nama_reviewer}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: "#666" }}>
                              {item.institusi || "-"}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13 }}>
                            {formatDate(item.assigned_at)}
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: "#999" }}>
                            oleh {item.admin_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusInfo.label}
                            color={statusInfo.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              justifyContent: "center",
                            }}
                          >
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() =>
                                navigate(
                                  `/admin/program/${id_program}/distribusi/reviewer/tahap/${tahap}/${item.id_distribusi}`,
                                )
                              }
                              sx={{ textTransform: "none" }}
                            >
                              Detail
                            </Button>

                            {item.status === 2 && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="warning"
                                startIcon={<SwapHoriz />}
                                onClick={() => handleOpenReassign(item)}
                                sx={{ textTransform: "none" }}
                              >
                                Reassign
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredHistory.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Baris per halaman:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} dari ${count}`
              }
            />
          </>
        )}

        <Dialog
          open={reassignDialog.open}
          onClose={handleCloseReassign}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Reassign Reviewer</DialogTitle>
          <DialogContent>
            {reassignDialog.distribusi && (
              <Box sx={{ pt: 2 }}>
                <Typography sx={{ fontSize: 14, mb: 2, color: "#666" }}>
                  Proposal: <b>{reassignDialog.distribusi.judul}</b>
                </Typography>

                <Typography sx={{ fontSize: 14, mb: 2, color: "#666" }}>
                  Reviewer Lama:{" "}
                  <b>{reassignDialog.distribusi.nama_reviewer}</b>
                </Typography>

                <TextField
                  select
                  fullWidth
                  label="Reviewer Baru"
                  value={selectedNewReviewer}
                  onChange={(e) => setSelectedNewReviewer(e.target.value)}
                >
                  <MenuItem value="">Pilih Reviewer Baru</MenuItem>
                  {reviewers
                    .filter(
                      (r) =>
                        r.id_user !== reassignDialog.distribusi.id_reviewer,
                    )
                    .map((reviewer) => (
                      <MenuItem key={reviewer.id_user} value={reviewer.id_user}>
                        <Box>
                          <Typography sx={{ fontWeight: 500 }}>
                            {reviewer.nama_lengkap}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: "#666" }}>
                            {reviewer.institusi || "-"}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                </TextField>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleCloseReassign}
              disabled={reassigning}
              sx={{ textTransform: "none" }}
            >
              Batal
            </Button>
            <Button
              onClick={handleReassignSubmit}
              variant="contained"
              disabled={reassigning}
              sx={{
                textTransform: "none",
                backgroundColor: "#0D59F2",
                "&:hover": { backgroundColor: "#0a47c4" },
              }}
            >
              {reassigning ? "Memproses..." : "Reassign"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  const paginatedHistoryReviewer = historyReviewer.slice(
    pageReviewer * rowsPerPageReviewer,
    pageReviewer * rowsPerPageReviewer + rowsPerPageReviewer,
  );

  const paginatedHistoryJuri = historyJuri.slice(
    pageJuri * rowsPerPageJuri,
    pageJuri * rowsPerPageJuri + rowsPerPageJuri,
  );

  return (
    <Box>
      <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 2 }}>
        Distribusi Reviewer
      </Typography>
        {historyReviewer.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 5 }}>
            <Typography sx={{ fontSize: 16, color: "#666" }}>
              Belum ada distribusi reviewer
            </Typography>
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
                    <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>
                      Aksi
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedHistoryReviewer.map((item) => {
                    const statusInfo = statusConfig[item.status] || { label: `Status ${item.status}`, color: "default" };
                    return (
                      <TableRow key={item.id_distribusi} hover>
                        <TableCell>
                          <Typography sx={{ fontSize: 14, maxWidth: 250 }}>
                            {item.judul}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 14 }}>
                            {item.nama_tim}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                              {item.nama_reviewer}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: "#666" }}>
                              {item.institusi || "-"}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13 }}>
                            {formatDate(item.assigned_at)}
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: "#999" }}>
                            oleh {item.admin_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusInfo.label}
                            color={statusInfo.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              navigate(
                                `/admin/program/${id_program}/distribusi/reviewer/tahap/${tahap}/${item.id_distribusi}`,
                              )
                            }
                            sx={{ textTransform: "none" }}
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

            <TablePagination
              component="div"
              count={historyReviewer.length}
              page={pageReviewer}
              onPageChange={handleChangePageReviewer}
              rowsPerPage={rowsPerPageReviewer}
              onRowsPerPageChange={handleChangeRowsPerPageReviewer}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Baris per halaman:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} dari ${count}`
              }
            />
          </>
        )}

      <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 2 }}>
        Distribusi Juri
      </Typography>
        {historyJuri.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 5 }}>
            <Typography sx={{ fontSize: 16, color: "#666" }}>
              Belum ada distribusi juri
            </Typography>
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
                    <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>
                      Aksi
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedHistoryJuri.map((item) => {
                    const statusInfo = statusConfig[item.status] || { label: `Status ${item.status}`, color: "default" };
                    return (
                      <TableRow key={item.id_distribusi} hover>
                        <TableCell>
                          <Typography sx={{ fontSize: 14, maxWidth: 250 }}>
                            {item.judul}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 14 }}>
                            {item.nama_tim}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                            {item.nama_juri}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13 }}>
                            {formatDate(item.assigned_at)}
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: "#999" }}>
                            oleh {item.admin_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusInfo.label}
                            color={statusInfo.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              navigate(
                                `/admin/program/${id_program}/distribusi/juri/tahap/${tahap}/${item.id_distribusi}`,
                              )
                            }
                            sx={{ textTransform: "none" }}
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

            <TablePagination
              component="div"
              count={historyJuri.length}
              page={pageJuri}
              onPageChange={handleChangePageJuri}
              rowsPerPage={rowsPerPageJuri}
              onRowsPerPageChange={handleChangeRowsPerPageJuri}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Baris per halaman:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} dari ${count}`
              }
            />
          </>
        )}
    </Box>
  );
}
