import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, CircularProgress, TextField, MenuItem,
  Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, Pagination, Autocomplete,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  getDistribusiHistory,
  getReviewerList,
  getJuriList,
  reassignReviewer,
  getPanelTahap2History,
  reassignReviewerTahap2,
  reassignJuriTahap2,
} from "../../api/admin";
import Swal from "sweetalert2";
import LoadingScreen from "../common/LoadingScreen";
const COLORS = {
  primary: "#0D59F2",
  primaryLight: "#E0F2FE",
  primaryMuted: "#93C5FD",
  slate: "#64748B",
  slateLight: "#F1F5F9",
  success: "#059669",
  successLight: "#ECFDF5",
  warning: "#D97706",
  warningLight: "#FFFBEB",
  error: "#DC2626",
  errorLight: "#ff7070",
};

const roundedField = { "& .MuiOutlinedInput-root": { borderRadius: "15px" } };

const tableHeadCell = {
  fontWeight: 700, fontSize: 13, color: "#374151",
  backgroundColor: "#F8FAFC", borderBottom: `2px solid ${COLORS.primaryMuted}`, py: 2,
};
const tableBodyRow = { "& td": { borderBottom: `1px solid ${COLORS.slateLight}`, py: 2 } };

const STATUS_CONFIG = {
  0: { label: "Menunggu", backgroundColor: "#f57f17" },
  1: { label: "Disetujui", backgroundColor: "#2e7d32" },
  2: { label: "Ditolak", backgroundColor: "#c62828" },
  3: { label: "Draft", backgroundColor: "#1565c0" },
  4: { label: "Selesai", backgroundColor: "#6a1b9a" },
  5: { label: "Diganti", backgroundColor: "#757575" },
};

const STATUS_PROPOSAL_CONFIG = {
  4: { label: "Desk", backgroundColor: "#1565c0" },
  5: { label: "Panel", backgroundColor: "#6a1b9a" },
};

const StatusPill = ({ status, configMap = STATUS_CONFIG }) => {
  const cfg = configMap[status] || { label: `Status ${status}`, backgroundColor: "#666" };
  return (
    <Box sx={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      px: 1,
      py: 0.25,
      borderRadius: "999px",
      backgroundColor: cfg.backgroundColor,
      color: "#fff",
      fontSize: 10.5,
      fontWeight: 700,
      whiteSpace: "nowrap",
      lineHeight: 1.2,
      minWidth: 72,
      maxWidth: 110,
      overflow: "hidden",
      textOverflow: "ellipsis",
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

export default function HistoryDistribusiTable({ id_program, tahap, refresh, onError, onSuccess }) {
  const navigate = useNavigate();


  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);

  const [historyPanel, setHistoryPanel] = useState([]);

  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [tahunFilter, setTahunFilter] = useState("");
  const [reviewers, setReviewers] = useState([]);
  const [juries, setJuries] = useState([]);
  const [selectedNewReviewer, setSelectedNewReviewer] = useState(null);
  const [selectedNewJuri, setSelectedNewJuri] = useState(null);
  const [selectedReassignReviewerId, setSelectedReassignReviewerId] = useState("");
  const [reassignMode, setReassignMode] = useState("reviewer");
  const [reassigning, setReassigning] = useState(false);
  const [reassignDialog, setReassignDialog] = useState({ open: false, item: null });

  const [pageMain, setPageMain] = useState(1);
  const [pagePanel, setPagePanel] = useState(1);

  const tahunOptions = Array.from(new Set(
    (tahap === 1 ? history : historyPanel)
      .map((item) => {
        const dateValue = tahap === 1 ? item.assigned_at : (item.assigned_at_reviewer || item.assigned_at_juri);
        return dateValue ? new Date(dateValue).getFullYear() : null;
      })
      .filter(Boolean)
  )).sort((a, b) => b - a);

  const filteredHistoryByYear = filteredHistory.filter((item) => {
    if (tahunFilter === "") return true;
    return item.assigned_at && new Date(item.assigned_at).getFullYear() === Number(tahunFilter);
  });

  const filteredHistoryPanel = historyPanel.filter((item) => {
    if (tahunFilter === "") return true;
    const dateValue = item.assigned_at_reviewer || item.assigned_at_juri;
    return dateValue && new Date(dateValue).getFullYear() === Number(tahunFilter);
  });

  // When tahap 1, group distribusi rows by proposal so we can show two reviewers per proposal
  let historyForPagination = filteredHistoryByYear;
  if (tahap === 1) {
    const map = new Map();
    for (const item of filteredHistoryByYear) {
      const key = item.id_proposal || item.id_proposal;
      if (!map.has(key)) {
        map.set(key, {
          id_proposal: item.id_proposal,
          judul: item.judul,
          nama_tim: item.nama_tim,
          reviewers: [],
        });
      }
      const entry = map.get(key);
      entry.reviewers.push({
        id_distribusi: item.id_distribusi,
        id_reviewer: item.id_reviewer,
        nama_reviewer: item.nama_reviewer,
        institusi: item.institusi,
        status: item.status,
        assigned_at: item.assigned_at,
        admin_name: item.admin_name,
      });
    }
    historyForPagination = Array.from(map.values()).map((g) => ({
      ...g,
      reviewer1: g.reviewers[0] || null,
      reviewer2: g.reviewers[1] || null,
    }));
  }

  const paginasi = usePagination(historyForPagination, pageMain, setPageMain);
  const paginasiPanel = usePagination(filteredHistoryPanel, pagePanel, setPagePanel);

  const fetchHistory = useCallback(async () => {
    if (!id_program) return;
    try {
      setLoading(true);
      if (tahap === 1) {
        const res = await getDistribusiHistory(id_program, tahap);
        setHistory(res.data || []);
        setFilteredHistory(res.data || []);
      } else {
        const res = await getPanelTahap2History(id_program);
        setHistoryPanel(res.data || []);
      }
    } catch {
      onError("Gagal memuat history distribusi");
    } finally {
      setLoading(false);
    }
  }, [id_program, tahap, onError]);

  const fetchReviewers = useCallback(async () => {
    getReviewerList().then((res) => setReviewers(res.data || [])).catch(() => {});
  }, []);

  const fetchJuries = useCallback(async () => {
    if (tahap !== 2) return;
    getJuriList().then((res) => setJuries(res.data || [])).catch(() => {});
  }, [tahap]);

  useEffect(() => {
    fetchHistory();
    fetchReviewers();
    fetchJuries();
  }, [fetchHistory, fetchReviewers, fetchJuries, refresh]);

  useEffect(() => {
    if (tahap !== 1) return;
    setFilteredHistory(
      statusFilter === "" ? history : history.filter((item) => item.status === Number(statusFilter)),
    );
    setPageMain(1);
  }, [statusFilter, history, tahap]);

  useEffect(() => {
    setPageMain(1);
    setPagePanel(1);
  }, [tahunFilter, tahap]);

  const handleOpenReassign = (item, mode) => {
    setReassignMode(mode);
    setReassignDialog({ open: true, item });
    setSelectedNewReviewer(null);
    setSelectedNewJuri(null);
    setSelectedReassignReviewerId("");
  };

  const handleCloseReassign = () => {
    setReassignDialog({ open: false, item: null });
    setSelectedNewReviewer(null);
    setSelectedNewJuri(null);
    setSelectedReassignReviewerId("");
  };

  const handleReassignSubmit = async () => {
    const { item } = reassignDialog;
    const isReviewer = reassignMode === "reviewer";
    const selected = isReviewer ? selectedNewReviewer : selectedNewJuri;
    const selectedReviewerSlot = tahap === 1
      ? item?.reviewers?.find((r) => String(r.id_reviewer) === String(selectedReassignReviewerId))
      : null;

    if (!selected) {
      Swal.fire({
        icon: "warning", title: "Perhatian",
        text: `Silahkan pilih ${isReviewer ? "reviewer" : "juri"} baru`,
        confirmButtonColor: "#0D59F2",
        didOpen: () => { const el = document.querySelector(".swal2-container"); if (el) el.style.zIndex = "9999"; },
      });
      return;
    }

    if (tahap === 1 && !selectedReviewerSlot) {
      Swal.fire({
        icon: "warning", title: "Perhatian",
        text: "Silahkan pilih reviewer yang akan diganti",
        confirmButtonColor: "#0D59F2",
        didOpen: () => { const el = document.querySelector(".swal2-container"); if (el) el.style.zIndex = "9999"; },
      });
      return;
    }

    const namaLama = tahap === 1
      ? selectedReviewerSlot?.nama_reviewer
      : isReviewer ? item.nama_reviewer : item.nama_juri;

    const idDistribusi = tahap === 1
      ? selectedReviewerSlot?.id_distribusi
      : isReviewer ? item.id_distribusi_reviewer : item.id_distribusi_juri;

    const result = await Swal.fire({
      title: "Konfirmasi Reassign",
      html: `Ganti <b>${isReviewer ? "reviewer" : "juri"}</b> untuk:<br/><br/>
             <b>${item.judul}</b><br/><br/>
             Dari: <b>${namaLama}</b><br/>
             Ke: <b>${selected.nama_lengkap}</b><br/><br/>Lanjutkan?`,
      icon: "question", showCancelButton: true,
      confirmButtonColor: "#0D59F2", cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Ganti", cancelButtonText: "Batal",
      didOpen: () => { const el = document.querySelector(".swal2-container"); if (el) el.style.zIndex = "9999"; },
    });
    if (!result.isConfirmed) return;

    try {
      setReassigning(true);
      let res;
      if (tahap === 1) {
        res = await reassignReviewer(id_program, tahap, idDistribusi, selected.id_user);
      } else if (isReviewer) {
        res = await reassignReviewerTahap2(id_program, idDistribusi, selected.id_user);
      } else {
        res = await reassignJuriTahap2(id_program, idDistribusi, selected.id_user);
      }

      handleCloseReassign();
      fetchHistory();
      await Swal.fire({
        icon: "success", title: "Berhasil", text: res.message,
        timer: 2000, timerProgressBar: true, showConfirmButton: false,
        didOpen: () => { const el = document.querySelector(".swal2-container"); if (el) el.style.zIndex = "9999"; },
      });
      onSuccess(res.message);
    } catch (err) {
      Swal.fire({
        icon: "error", title: "Gagal",
        text: err.response?.data?.message || "Terjadi kesalahan saat reassign",
        confirmButtonColor: "#0D59F2",
        didOpen: () => { const el = document.querySelector(".swal2-container"); if (el) el.style.zIndex = "9999"; },
      });
    } finally {
      setReassigning(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ position: "relative", minHeight: 280 }}>
        <LoadingScreen message="Memuat history distribusi..." overlay minHeight="280px" />
      </Box>
    );
  }

  if (tahap === 1) {
    const columns = [
      {
        key: "proposal",
        label: "PROPOSAL",
        render: (item) => <Typography sx={{ fontSize: 13, maxWidth: 250 }}>{item.judul}</Typography>,
      },
      {
        key: "reviewer1",
        label: "REVIEWER 1",
        render: (item) => (
          item.reviewer1 ? (
            <>
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.reviewer1.nama_reviewer}</Typography>
              <Typography sx={{ fontSize: 12, color: "#888" }}>{item.reviewer1.institusi || "-"}</Typography>
            </>
          ) : (
            <Typography sx={{ fontSize: 12, color: "#bbb" }}>Belum ditentukan</Typography>
          )
        ),
      },
      {
        key: "reviewer2",
        label: "REVIEWER 2",
        render: (item) => (
          item.reviewer2 ? (
            <>
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.reviewer2.nama_reviewer}</Typography>
              <Typography sx={{ fontSize: 12, color: "#888" }}>{item.reviewer2.institusi || "-"}</Typography>
            </>
          ) : (
            <Typography sx={{ fontSize: 12, color: "#bbb" }}>Belum ditentukan</Typography>
          )
        ),
      },
      {
        key: "assigned_at",
        label: "ASSIGNED AT",
        render: (item) => (
          <>
            <Typography sx={{ fontSize: 13 }}>{formatDate(item.reviewer1?.assigned_at)}</Typography>
            <Typography sx={{ fontSize: 11, color: "#aaa" }}>oleh {item.reviewer1?.admin_name || "-"}</Typography>
          </>
        ),
      },
      {
        key: "status",
        label: "STATUS",
        render: (item) => (
          <Box sx={{ display: "flex", gap: 0.75, flexDirection: "column", alignItems: "flex-start" }}>
            {item.reviewer1 ? <StatusPill status={item.reviewer1.status} /> : null}
            {item.reviewer2 ? <StatusPill status={item.reviewer2.status} /> : null}
          </Box>
        ),
      },
      {
        key: "aksi",
        label: "AKSI",
        headerSx: { textAlign: "center" },
        cellSx: { textAlign: "center" },
        render: (item) => (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "center", alignItems: "center" }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => navigate(`/admin/program/${id_program}/distribusi/reviewer/tahap/${tahap}/${item.reviewer1?.id_distribusi || item.reviewer2?.id_distribusi}`)}
              sx={{ textTransform: "none", borderRadius: "50px", fontSize: 12 }}
            >
              Detail
            </Button>
            {(item.reviewer1 || item.reviewer2) && (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={() => handleOpenReassign(item, "reviewer")}
                sx={{ textTransform: "none", borderRadius: "50px", fontSize: 12 }}
              >
                Reassign
              </Button>
            )}
          </Box>
        ),
      },
    ];

    return (
      <Box>
        <Box sx={{ mb: 3 }}>

          <Box sx={{
            display: "flex",
            gap: { xs: 1.25, sm: 2 },
            flexDirection: { xs: "column", lg: "row" },
            alignItems: { xs: "stretch", lg: "center" },
          }}>
            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPageMain(1); }}
              sx={{
                ...roundedField,
                flex: 1,
              }}
            >
              <MenuItem value="">Semua Status</MenuItem>
              {Object.entries(STATUS_CONFIG).filter(([key]) => key !== "5").map(([key, cfg]) => (
                <MenuItem key={key} value={key}>{cfg.label}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Tahun"
              value={tahunFilter}
              onChange={(e) => setTahunFilter(e.target.value)}
              sx={{
                ...roundedField,
                flex: 1,
              }}
            >
              <MenuItem value="">Semua Tahun</MenuItem>
              {tahunOptions.map((tahun) => (
                <MenuItem key={tahun} value={String(tahun)}>{tahun}</MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>

        <Box sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 1,
          mb: 2,
          flexDirection: { xs: "column", sm: "row" },
        }}>
          <Typography sx={{ fontSize: 13, color: "#777", alignSelf: { xs: "flex-start", sm: "auto" } }}>
            Total: {historyForPagination.length} proposal
          </Typography>
        </Box>

        <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.key} sx={{ ...tableHeadCell, ...(col.headerSx || {}) }}>{col.label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginasi.paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} sx={{ textAlign: "center", py: 6 }}>
                    <Typography sx={{ fontSize: 14, color: "#999" }}>Belum ada history distribusi</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginasi.paginated.map((item, i) => (
                  <TableRow key={i} sx={tableBodyRow}>
                    {columns.map((col) => (
                      <TableCell key={col.key} sx={col.cellSx || {}}>{col.render(item)}</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <PaginationBar {...paginasi} />

        <ReassignDialog
          open={reassignDialog.open}
          item={reassignDialog.item}
          mode={reassignMode}
          reviewers={reviewers}
          juries={juries}
          selectedNewReviewer={selectedNewReviewer}
          setSelectedNewReviewer={setSelectedNewReviewer}
          selectedNewJuri={selectedNewJuri}
          setSelectedNewJuri={setSelectedNewJuri}
          reassigning={reassigning}
          onClose={handleCloseReassign}
          onSubmit={handleReassignSubmit}
          tahap={tahap}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#374151", mb: 1.5 }}>
          Filter Tahun
        </Typography>

        <Box sx={{
          display: "flex",
          gap: { xs: 1.25, sm: 2 },
          flexDirection: { xs: "column", lg: "row" },
          alignItems: { xs: "stretch", lg: "center" },
        }}>
          <TextField
            select
            size="small"
            label="Tahun"
            value={tahunFilter}
            onChange={(e) => setTahunFilter(e.target.value)}
            sx={{
              ...roundedField,
              flex: 1,
            }}
          >
            <MenuItem value="">Semua Tahun</MenuItem>
            {tahunOptions.map((tahun) => (
              <MenuItem key={tahun} value={String(tahun)}>{tahun}</MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

      <Box sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "center" },
        gap: 1,
        mb: 2,
        flexDirection: { xs: "column", sm: "row" },
      }}>
        <Typography sx={{ fontSize: 13, color: "#777", alignSelf: { xs: "flex-start", sm: "auto" } }}>
          Total: {filteredHistoryPanel.length} proposal
        </Typography>
      </Box>

      <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={tableHeadCell}>PROPOSAL</TableCell>
              <TableCell sx={tableHeadCell}>TIM</TableCell>
              <TableCell sx={tableHeadCell}>REVIEWER</TableCell>
              <TableCell sx={tableHeadCell}>JURI</TableCell>
              <TableCell sx={{ ...tableHeadCell, textAlign: "center" }}>AKSI</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginasiPanel.paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: "center", py: 6 }}>
                  <Typography sx={{ fontSize: 14, color: "#999" }}>Belum ada history wawancara</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginasiPanel.paginated.map((item, i) => (
                <TableRow key={i} sx={tableBodyRow}>
                  <TableCell>
                    <Typography sx={{ fontSize: 13, maxWidth: 220, fontWeight: 500 }}>{item.judul}</Typography>
                    <StatusPill status={item.status_proposal} configMap={STATUS_PROPOSAL_CONFIG} />
                  </TableCell>

                  <TableCell>
                    <Typography sx={{ fontSize: 13 }}>{item.nama_tim}</Typography>
                  </TableCell>

                  <TableCell>
                    {item.nama_reviewer ? (
                      <>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.nama_reviewer}</Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <StatusPill status={item.status_reviewer} />
                        </Box>
                        <Typography sx={{ fontSize: 11, color: "#aaa", mt: 0.5 }}>
                          {formatDate(item.assigned_at_reviewer)}
                        </Typography>
                      </>
                    ) : (
                      <Typography sx={{ fontSize: 12, color: "#bbb" }}>Belum ditentukan</Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    {item.nama_juri ? (
                      <>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.nama_juri}</Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <StatusPill status={item.status_juri} />
                        </Box>
                        <Typography sx={{ fontSize: 11, color: "#aaa", mt: 0.5 }}>
                          {formatDate(item.assigned_at_juri)}
                        </Typography>
                      </>
                    ) : (
                      <Typography sx={{ fontSize: 12, color: "#bbb" }}>Belum ditentukan</Typography>
                    )}
                  </TableCell>

                  <TableCell sx={{ textAlign: "center" }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, alignItems: "center" }}>
                      {item.id_distribusi_reviewer && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.slate, minWidth: 25 }}>REV</Typography>
                          <Button size="small" variant="text"
                            onClick={() => navigate(`/admin/program/${id_program}/distribusi/reviewer/tahap/${tahap}/${item.id_distribusi_reviewer}`)}
                            sx={{ textTransform: "none", py: 0, minWidth: 0, fontWeight: 700, fontSize: 11 }}>
                            Detail
                          </Button>
                          {item.status_reviewer < 4 && (
                            <Button size="small" variant="text" color="warning"
                              onClick={() => handleOpenReassign(item, "reviewer")}
                              sx={{ textTransform: "none", py: 0, minWidth: 0, fontWeight: 700, fontSize: 11 }}>
                              Ganti
                            </Button>
                          )}
                        </Box>
                      )}
                      {item.id_distribusi_juri && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, color: COLORS.slate, minWidth: 25 }}>JURI</Typography>
                          <Button size="small" variant="text"
                            onClick={() => navigate(`/admin/program/${id_program}/distribusi/reviewer/tahap/${tahap}/${item.id_distribusi_juri}`)}
                            sx={{ textTransform: "none", py: 0, minWidth: 0, fontWeight: 700, fontSize: 11 }}>
                            Detail
                          </Button>
                          {item.status_juri < 4 && (
                            <Button size="small" variant="text" color="warning"
                              onClick={() => handleOpenReassign(item, "juri")}
                              sx={{ textTransform: "none", py: 0, minWidth: 0, fontWeight: 700, fontSize: 11 }}>
                              Ganti
                            </Button>
                          )}
                        </Box>
                      )}
                      {!item.id_distribusi_reviewer && !item.id_distribusi_juri && (
                        <Typography sx={{ fontSize: 12, color: "#ccc" }}>—</Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <PaginationBar {...paginasiPanel} />

      <ReassignDialog
        open={reassignDialog.open}
        item={reassignDialog.item}
        mode={reassignMode}
        reviewers={reviewers}
        juries={juries}
        selectedNewReviewer={selectedNewReviewer}
        setSelectedNewReviewer={setSelectedNewReviewer}
        selectedNewJuri={selectedNewJuri}
        setSelectedNewJuri={setSelectedNewJuri}
        selectedReassignReviewerId={selectedReassignReviewerId}
        setSelectedReassignReviewerId={setSelectedReassignReviewerId}
        reassigning={reassigning}
        onClose={handleCloseReassign}
        onSubmit={handleReassignSubmit}
        tahap={tahap}
      />
    </Box>
  );
}

function ReassignDialog({
  open, item, mode, reviewers, juries,
  selectedNewReviewer, setSelectedNewReviewer,
  selectedNewJuri, setSelectedNewJuri,
  selectedReassignReviewerId, setSelectedReassignReviewerId,
  reassigning, onClose, onSubmit, tahap,
}) {
  const isReviewer = mode === "reviewer";

  const currentReviewerId = item?.id_reviewer;
  const currentJuriId = item?.id_juri;

  const namaLama = isReviewer ? item?.nama_reviewer : item?.nama_juri;
  const currentTahap1Reviewer = item?.reviewers?.find((r) => String(r.id_reviewer) === String(selectedReassignReviewerId));
  const currentReviewerTahap1Id = currentTahap1Reviewer?.id_reviewer;

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => { if (reason !== "backdropClick") onClose(); }}
      maxWidth="sm" fullWidth
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>
        Ganti {isReviewer ? "Reviewer" : "Juri"}
      </DialogTitle>
      <DialogContent>
        {item && (
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography sx={{ fontSize: 13, color: "#666" }}>
              Proposal: <b>{item.judul}</b>
            </Typography>
            {tahap === 1 ? (
              <TextField
                select
                size="small"
                label="Reviewer yang diganti"
                value={selectedReassignReviewerId}
                onChange={(e) => {
                  setSelectedReassignReviewerId(e.target.value);
                  setSelectedNewReviewer(null);
                }}
                sx={roundedField}
              >
                <MenuItem value="">Pilih reviewer</MenuItem>
                {(item.reviewers || []).map((rev) => (
                  <MenuItem key={rev.id_distribusi} value={String(rev.id_reviewer)}>
                    {rev.nama_reviewer}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <Typography sx={{ fontSize: 13, color: "#666" }}>
                {isReviewer ? "Reviewer" : "Juri"} Lama: <b>{namaLama}</b>
              </Typography>
            )}

            {isReviewer ? (
              <Autocomplete
                sx={roundedField}
                options={reviewers.filter((r) =>
                  tahap === 1
                    ? String(r.id_user) !== String(currentReviewerTahap1Id)
                    : r.id_user !== currentReviewerId
                )}
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
            ) : (
              <Autocomplete
                sx={roundedField}
                options={juries.filter((j) => j.id_user !== currentJuriId)}
                value={selectedNewJuri}
                onChange={(_, v) => setSelectedNewJuri(v)}
                getOptionLabel={(o) => o.nama_lengkap || ""}
                isOptionEqualToValue={(o, v) => o.id_user === v.id_user}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id_user}>
                    <Box>
                      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{option.nama_lengkap}</Typography>
                      <Typography sx={{ fontSize: 12, color: "#888" }}>{option.email || "-"}</Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Juri Baru" placeholder="Cari atau pilih juri" />
                )}
              />
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} disabled={reassigning}
          sx={{ textTransform: "none", borderRadius: "50px", px: 2.5 }}>
          Batal
        </Button>
        <Button onClick={onSubmit} variant="contained" disabled={reassigning}
          sx={{ textTransform: "none", borderRadius: "50px", px: 2.5, backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" } }}>
          {reassigning ? "Memproses..." : "Ganti"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}