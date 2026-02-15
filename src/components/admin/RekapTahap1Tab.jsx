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
  getProposalList,
  getRekapDesk,
  finalisasiDeskBatch,
} from "../../api/admin";
import DetailRekapDialog from "./DetailRekapDialog";

const getStatusInfo = (status, hasRekap) => {
  if (status === 3) return { text: "Tidak Lolos", color: "error" };
  if (status === 4) return { text: "Lolos", color: "success" };
  if (status >= 5) return { text: "Selesai", color: "info" };
  if (status === 2) {
    if (hasRekap) return { text: "Menunggu Finalisasi", color: "warning" };
    return { text: "Menunggu Penilaian", color: "default" };
  }
  return { text: "Unknown", color: "default" };
};

export default function RekapTahap1Tab({ id_program }) {
  const [loading, setLoading] = useState(true);
  const [proposalList, setProposalList] = useState([]);
  const [rekapMap, setRekapMap] = useState({});
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getProposalList(id_program);
      if (res.success) {
        const filtered = (res.data || []).filter((p) =>
          [2, 3, 4].includes(p.status),
        );
        setProposalList(filtered);

        const map = {};
        await Promise.all(
          filtered.map(async (p) => {
            try {
              const rekap = await getRekapDesk(id_program, p.id_proposal);
              map[p.id_proposal] = rekap.data || null;
            } catch {
              map[p.id_proposal] = null;
            }
          }),
        );
        setRekapMap(map);
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

  const hasRekapSubmit = (id_proposal) => {
    const rekap = rekapMap[id_proposal];
    return rekap && rekap.reviewer && rekap.reviewer.length > 0;
  };

  const getTotalNilai = (id_proposal) => {
    const rekap = rekapMap[id_proposal];
    if (!rekap || !rekap.reviewer || rekap.reviewer.length === 0) return "-";
    return rekap.reviewer[0].total_nilai;
  };

  const finalisableProposals = proposalList.filter((p) => p.status === 2);

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

    const label = isLolos ? "Lolos Desk" : "Tidak Lolos Desk";
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

      const res = await finalisasiDeskBatch(id_program, payload);

      if (res.success || res.message) {
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
            Belum ada proposal untuk tahap desk evaluasi
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
                <TableCell sx={{ fontWeight: 700 }}>Total Nilai</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>
                  Aksi
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {proposalList.map((p) => {
                const statusInfo = getStatusInfo(p.status, hasRekapSubmit(p.id_proposal));
                const isFinalisable = p.status === 2;
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
                      <Typography sx={{ fontWeight: 500, maxWidth: 250 }}>
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
                        {p.nama_kategori || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                        {getTotalNilai(p.id_proposal)}
                      </Typography>
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
        tahap={1}
      />
    </Box>
  );
}