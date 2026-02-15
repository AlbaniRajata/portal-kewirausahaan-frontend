import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
} from "@mui/material";
import { Visibility } from "@mui/icons-material";
import Swal from "sweetalert2";
import {
  getListProposalRekapTahap2,
  finalisasiWawancaraBatch,
} from "../../api/admin";
import DetailRekapDialog from "./DetailRekapDialog";

const getStatusInfo = (status, totalPanel, totalSubmit) => {
  if (status === 6) return { text: "Tidak Lolos Wawancara", color: "error" };
  if (status === 7) return { text: "Lolos Wawancara", color: "success" };
  if (status === 8) return { text: "Lolos (Selesai)", color: "success" };
  if (status === 5) {
    if (totalSubmit === totalPanel && totalPanel > 0) {
      return { text: "Menunggu Finalisasi", color: "warning" };
    }
    return { text: "Sedang Dinilai", color: "info" };
  }
  return { text: "Unknown", color: "default" };
};

export default function RekapTahap2Tab({ id_program }) {
  const [loading, setLoading] = useState(true);
  const [proposalList, setProposalList] = useState([]);
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getListProposalRekapTahap2(id_program);
      if (res.success) {
        setProposalList(res.data || []);
      } else {
        setAlert(res.message);
      }
    } catch (err) {
      console.error("Error fetching proposals:", err);
      setAlert("Gagal memuat data proposal");
    } finally {
      setLoading(false);
    }
  }, [id_program]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const finalisableProposals = proposalList.filter(
    (p) => p.status === 5 && p.total_submit === p.total_panel && p.total_panel > 0
  );

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(finalisableProposals.map((p) => p.id_proposal));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (id_proposal) => {
    setSelected((prev) =>
      prev.includes(id_proposal)
        ? prev.filter((id) => id !== id_proposal)
        : [...prev, id_proposal],
    );
  };

  const handleFinalisasi = async (isLolos) => {
    if (selected.length === 0) return;

    const label = isLolos ? "Lolos Wawancara" : "Tidak Lolos Wawancara";
    const confirmColor = isLolos ? "#0D59F2" : "#d33";

    const result = await Swal.fire({
      title: "Konfirmasi Finalisasi",
      html: `<b>${selected.length} proposal</b> akan difinalisasi sebagai <b>${label}</b>.<br/><br/>Tindakan ini tidak dapat dibatalkan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: confirmColor,
      cancelButtonColor: "#666",
      confirmButtonText: "Ya, Finalisasi",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      setSubmitting(true);
      const payload = isLolos
        ? { lolos: selected, tidak_lolos: [] }
        : { lolos: [], tidak_lolos: selected };

      const res = await finalisasiWawancaraBatch(id_program, payload);

      if (res.success) {
        await Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: res.message || "Finalisasi berhasil",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        setSelected([]);
        fetchProposals();
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: res.message });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Gagal melakukan finalisasi";
      Swal.fire({ icon: "error", title: "Gagal", text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDetail = (proposal) => {
    setSelectedProposal(proposal);
    setDialogOpen(true);
  };

  const isAllSelected =
    finalisableProposals.length > 0 &&
    finalisableProposals.every((p) => selected.includes(p.id_proposal));

  const isIndeterminate = selected.length > 0 && !isAllSelected;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography sx={{ fontSize: 16, color: "#555" }}>
          {selected.length > 0
            ? `${selected.length} proposal terpilih`
            : `Total ${proposalList.length} proposal`}
        </Typography>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            color="error"
            onClick={() => handleFinalisasi(false)}
            disabled={selected.length === 0 || submitting}
            sx={{ textTransform: "none" }}
          >
            Finalisasi Tidak Lolos
          </Button>
          <Button
            variant="contained"
            onClick={() => handleFinalisasi(true)}
            disabled={selected.length === 0 || submitting}
            sx={{
              textTransform: "none",
              backgroundColor: "#0D59F2",
              "&:hover": { backgroundColor: "#0a47c4" },
            }}
          >
            Finalisasi Lolos
          </Button>
        </Box>
      </Box>

      {alert && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setAlert("")}>
          {alert}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress />
        </Box>
      ) : proposalList.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography sx={{ color: "#666" }}>
            Belum ada proposal untuk tahap wawancara
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Judul Proposal</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tim</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Kategori</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Panel Submit</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>
                  Aksi
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {proposalList.map((p) => {
                const statusInfo = getStatusInfo(p.status, p.total_panel, p.total_submit);
                const isFinalisable = p.status === 5 && p.total_submit === p.total_panel && p.total_panel > 0;
                const isSelected = selected.includes(p.id_proposal);

                return (
                  <TableRow key={p.id_proposal} hover selected={isSelected}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        disabled={!isFinalisable}
                        onChange={() => handleSelectOne(p.id_proposal)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 500, maxWidth: 300 }}>
                        {p.judul}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14 }}>
                        {p.nama_tim}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14 }}>
                        {p.nama_kategori}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${p.total_submit} / ${p.total_panel}`}
                        size="small"
                        color={p.total_submit === p.total_panel ? "success" : "default"}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusInfo.text}
                        color={statusInfo.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Detail Rekap">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Visibility />}
                          onClick={() => handleOpenDetail(p)}
                          disabled={p.total_submit === 0}
                          sx={{ textTransform: "none" }}
                        >
                          Detail
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <DetailRekapDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        id_program={id_program}
        id_proposal={selectedProposal?.id_proposal}
        judul={selectedProposal?.judul}
        tahap={2}
      />
    </Box>
  );
}