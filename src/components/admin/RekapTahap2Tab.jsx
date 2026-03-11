import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Checkbox, Button, Chip, CircularProgress, Tooltip, Pagination,
} from "@mui/material";
import { Visibility } from "@mui/icons-material";
import Swal from "sweetalert2";
import { getListProposalRekapTahap2, finalisasiWawancaraBatch } from "../../api/admin";
import DetailRekapDialog from "./DetailRekapDialog";

const tableHeadCell = {
  fontWeight: 700, fontSize: 13, color: "#000",
  backgroundColor: "#fafafa", borderBottom: "2px solid #f0f0f0", py: 2,
};

const tableBodyRow = { "& td": { borderBottom: "1px solid #f5f5f5", py: 2 } };

const ROWS_PER_PAGE = 10;

const getStatusInfo = (status, totalPanel, totalSubmit) => {
  if (status === 6) return { text: "Tidak Lolos Wawancara", color: "error" };
  if (status === 7) return { text: "Lolos Wawancara", color: "success" };
  if (status === 8) return { text: "Lolos (Selesai)", color: "success" };
  if (status === 5) {
    if (totalSubmit === totalPanel && totalPanel > 0) return { text: "Menunggu Finalisasi", color: "warning" };
    return { text: "Sedang Dinilai", color: "info" };
  }
  return { text: "Unknown", color: "default" };
};

export default function RekapTahap2Tab({ id_program }) {
  const [loading, setLoading] = useState(true);
  const [proposalList, setProposalList] = useState([]);
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getListProposalRekapTahap2(id_program);
      setProposalList(res.data || []);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat data proposal", confirmButtonColor: "#0D59F2" });
    } finally {
      setLoading(false);
    }
  }, [id_program]);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  const finalisableProposals = proposalList.filter(
    (p) => p.status === 5 && p.total_submit === p.total_panel && p.total_panel > 0
  );

  const isAllSelected = finalisableProposals.length > 0 && finalisableProposals.every((p) => selected.includes(p.id_proposal));
  const isIndeterminate = selected.length > 0 && !isAllSelected;

  const handleSelectAll = (e) => {
    setSelected(e.target.checked ? finalisableProposals.map((p) => p.id_proposal) : []);
  };

  const handleSelectOne = (id_proposal) => {
    setSelected((prev) => prev.includes(id_proposal) ? prev.filter((id) => id !== id_proposal) : [...prev, id_proposal]);
  };

  const handleFinalisasi = async (isLolos) => {
    if (selected.length === 0) return;
    const label = isLolos ? "Lolos Wawancara" : "Tidak Lolos Wawancara";
    const result = await Swal.fire({
      title: "Konfirmasi Finalisasi",
      html: `<b>${selected.length} proposal</b> akan difinalisasi sebagai <b>${label}</b>.<br/><br/>Tindakan ini tidak dapat dibatalkan.`,
      icon: "warning", showCancelButton: true,
      confirmButtonColor: isLolos ? "#0D59F2" : "#d33", cancelButtonColor: "#666",
      confirmButtonText: "Ya, Finalisasi", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    try {
      setSubmitting(true);
      const payload = isLolos ? { lolos: selected, tidak_lolos: [] } : { lolos: [], tidak_lolos: selected };
      await finalisasiWawancaraBatch(id_program, payload);
      await Swal.fire({ icon: "success", title: "Berhasil", text: "Finalisasi berhasil", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      setSelected([]);
      fetchProposals();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal melakukan finalisasi", confirmButtonColor: "#0D59F2" });
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(proposalList.length / ROWS_PER_PAGE);
  const paginated = proposalList.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography sx={{ fontSize: 14, color: "#555" }}>
          {selected.length > 0 ? `${selected.length} proposal terpilih` : `Total ${proposalList.length} proposal`}
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button variant="outlined" color="error" onClick={() => handleFinalisasi(false)}
            disabled={selected.length === 0 || submitting}
            sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600 }}>
            Finalisasi Tidak Lolos
          </Button>
          <Button variant="contained" onClick={() => handleFinalisasi(true)}
            disabled={selected.length === 0 || submitting}
            sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600, backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" } }}>
            Finalisasi Lolos
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : proposalList.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography sx={{ fontSize: 14, color: "#999" }}>Belum ada proposal untuk tahap wawancara</Typography>
        </Box>
      ) : (
        <>
          <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "auto" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ ...tableHeadCell }}>
                    <Checkbox checked={isAllSelected} indeterminate={isIndeterminate} onChange={handleSelectAll} />
                  </TableCell>
                  <TableCell sx={tableHeadCell}>Judul Proposal</TableCell>
                  <TableCell sx={tableHeadCell}>Tim</TableCell>
                  <TableCell sx={tableHeadCell}>Kategori</TableCell>
                  <TableCell sx={tableHeadCell}>Panel Submit</TableCell>
                  <TableCell sx={tableHeadCell}>Status</TableCell>
                  <TableCell sx={{ ...tableHeadCell, textAlign: "center" }}>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((p) => {
                  const statusInfo = getStatusInfo(p.status, p.total_panel, p.total_submit);
                  const isFinalisable = p.status === 5 && p.total_submit === p.total_panel && p.total_panel > 0;
                  const isSelected = selected.includes(p.id_proposal);
                  return (
                    <TableRow key={p.id_proposal} sx={tableBodyRow} hover selected={isSelected}>
                      <TableCell padding="checkbox">
                        <Checkbox checked={isSelected} disabled={!isFinalisable} onChange={() => handleSelectOne(p.id_proposal)} />
                      </TableCell>
                      <TableCell><Typography sx={{ fontWeight: 600, fontSize: 13, maxWidth: 280 }}>{p.judul}</Typography></TableCell>
                      <TableCell><Typography sx={{ fontSize: 13 }}>{p.nama_tim}</Typography></TableCell>
                      <TableCell><Typography sx={{ fontSize: 13 }}>{p.nama_kategori || "-"}</Typography></TableCell>
                      <TableCell>
                        <Chip label={`${p.total_submit} / ${p.total_panel}`} size="small"
                          color={p.total_submit === p.total_panel ? "success" : "default"} />
                      </TableCell>
                      <TableCell><Chip label={statusInfo.text} color={statusInfo.color} size="small" /></TableCell>
                      <TableCell sx={{ textAlign: "center" }}>
                        <Tooltip title="Detail Rekap">
                          <span>
                            <Button size="small" variant="outlined" startIcon={<Visibility fontSize="small" />}
                              onClick={() => { setSelectedProposal(p); setDialogOpen(true); }}
                              disabled={p.total_submit === 0}
                              sx={{ textTransform: "none", borderRadius: "8px" }}>Detail</Button>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
            <Typography sx={{ fontSize: 13, color: "#777" }}>
              Menampilkan {Math.min((page - 1) * ROWS_PER_PAGE + 1, proposalList.length)}–{Math.min(page * ROWS_PER_PAGE, proposalList.length)} dari {proposalList.length} data
            </Typography>
            <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" showFirstButton showLastButton />
          </Box>
        </>
      )}

      <DetailRekapDialog open={dialogOpen} onClose={() => setDialogOpen(false)}
        id_program={id_program} id_proposal={selectedProposal?.id_proposal}
        judul={selectedProposal?.judul} tahap={2} />
    </Box>
  );
}