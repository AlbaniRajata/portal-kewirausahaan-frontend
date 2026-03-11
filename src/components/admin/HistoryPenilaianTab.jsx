import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, CircularProgress, Tooltip,
  Pagination, TextField, MenuItem,
} from "@mui/material";
import { Visibility } from "@mui/icons-material";
import Swal from "sweetalert2";
import {
  getHistoryPenilaianTahap1,
  getHistoryPenilaianTahap2,
} from "../../api/admin";
import DetailRekapDialog from "./DetailRekapDialog";


const tableHeadCell = {
  fontWeight: 700, fontSize: 13, color: "#000",
  backgroundColor: "#fafafa", borderBottom: "2px solid #f0f0f0", py: 2,
};

const tableBodyRow = { "& td": { borderBottom: "1px solid #f5f5f5", py: 2 } };

const ROWS_PER_PAGE = 10;

const STATUS_MAP = {
  2: { label: "Review Tahap 1",        backgroundColor: "#3949ab" },
  3: { label: "Tidak Lolos Desk",      backgroundColor: "#c62828" },
  4: { label: "Lolos Desk",            backgroundColor: "#2e7d32" },
  5: { label: "Panel Wawancara",       backgroundColor: "#f57f17" },
  6: { label: "Tidak Lolos Wawancara", backgroundColor: "#c62828" },
  7: { label: "Lolos Wawancara",       backgroundColor: "#2e7d32" },
  8: { label: "Pembimbing Diajukan",   backgroundColor: "#1565c0" },
  9: { label: "Pembimbing Disetujui",  backgroundColor: "#0891b2" },
};

const StatusPill = ({ status }) => {
  const cfg = STATUS_MAP[status] || { label: `Status ${status}`, backgroundColor: "#666" };
  return (
    <Box sx={{
      display: "inline-flex", alignItems: "center",
      px: 1.5, py: 0.4, borderRadius: "50px",
      backgroundColor: cfg.backgroundColor,
      color: "#fff", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
    }}>
      {cfg.label}
    </Box>
  );
};

const formatDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

const TAHAP_OPTIONS = [
  { value: 1, label: "Tahap 1 — Desk Evaluasi" },
  { value: 2, label: "Tahap 2 — Wawancara" },
];

export default function HistoryPenilaianTab({ id_program }) {
  const [tahap, setTahap] = useState(1);
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = tahap === 1
        ? await getHistoryPenilaianTahap1(id_program)
        : await getHistoryPenilaianTahap2(id_program);
      setList(res.data || []);
      setPage(1);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat history penilaian", confirmButtonColor: "#0D59F2" });
    } finally {
      setLoading(false);
    }
  }, [id_program, tahap]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(list.length / ROWS_PER_PAGE);
  const paginated = list.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const handleOpenDetail = (proposal) => {
    setSelectedProposal(proposal);
    setDialogOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <TextField
          select size="small" label="Filter Tahap"
          value={tahap} onChange={(e) => setTahap(Number(e.target.value))}
          sx={{ minWidth: 240, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
        >
          {TAHAP_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </TextField>
        <Typography sx={{ fontSize: 13, color: "#777" }}>
          Total {list.length} data
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : list.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography sx={{ fontSize: 14, color: "#999" }}>
            Belum ada history penilaian untuk tahap ini
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "auto" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={tableHeadCell}>Judul Proposal</TableCell>
                  <TableCell sx={tableHeadCell}>Tim</TableCell>
                  <TableCell sx={tableHeadCell}>Kategori</TableCell>
                  {tahap === 1 ? (
                    <>
                      <TableCell sx={tableHeadCell}>Reviewer</TableCell>
                      <TableCell sx={tableHeadCell}>Rata-rata Nilai</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell sx={tableHeadCell}>Rata-rata Reviewer</TableCell>
                      <TableCell sx={tableHeadCell}>Rata-rata Juri</TableCell>
                      <TableCell sx={tableHeadCell}>Total Gabungan</TableCell>
                    </>
                  )}
                  <TableCell sx={tableHeadCell}>Tanggal Finalisasi</TableCell>
                  <TableCell sx={tableHeadCell}>Status</TableCell>
                  <TableCell sx={{ ...tableHeadCell, textAlign: "center" }}>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((p) => (
                  <TableRow key={p.id_proposal} sx={tableBodyRow} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontSize: 13, maxWidth: 260 }}>{p.judul}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13 }}>{p.nama_tim}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 13 }}>{p.nama_kategori || "-"}</Typography>
                    </TableCell>

                    {tahap === 1 ? (
                      <>
                        <TableCell>
                          <Typography sx={{ fontSize: 13 }}>
                            {p.total_submit} / {p.total_reviewer}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0D59F2" }}>
                            {p.rata_rata_nilai ?? "-"}
                          </Typography>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#1565c0" }}>
                            {p.rata_rata_reviewer ?? "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#2e7d32" }}>
                            {p.rata_rata_juri ?? "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#e65100" }}>
                            {p.rata_rata_gabungan ?? "-"}
                          </Typography>
                        </TableCell>
                      </>
                    )}

                    <TableCell>
                      <Typography sx={{ fontSize: 13 }}>{formatDate(p.tanggal_finalisasi)}</Typography>
                    </TableCell>
                    <TableCell>
                      <StatusPill status={p.status_proposal} />
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      <Tooltip title="Lihat Detail Penilaian">
                        <Button
                          size="small" variant="outlined"
                          startIcon={<Visibility fontSize="small" />}
                          onClick={() => handleOpenDetail(p)}
                          sx={{ textTransform: "none", borderRadius: "50px" }}
                        >
                          Detail
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
            <Typography sx={{ fontSize: 13, color: "#777" }}>
              Menampilkan {Math.min((page - 1) * ROWS_PER_PAGE + 1, list.length)}–{Math.min(page * ROWS_PER_PAGE, list.length)} dari {list.length} data
            </Typography>
            <Pagination
              count={totalPages} page={page}
              onChange={(_, v) => setPage(v)}
              color="primary" shape="rounded" showFirstButton showLastButton
            />
          </Box>
        </>
      )}

      <DetailRekapDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        id_program={id_program}
        id_proposal={selectedProposal?.id_proposal}
        judul={selectedProposal?.judul}
        tahap={tahap}
        isHistory
      />
    </Box>
  );
}