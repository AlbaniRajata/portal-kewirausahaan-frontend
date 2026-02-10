import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Collapse,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  Alert,
} from "@mui/material";
import { Refresh, PlayArrow, ExpandMore, ExpandLess, Info } from "@mui/icons-material";
import Swal from "sweetalert2";
import { 
  getPreviewDistribusi, 
  executeAutoDistribusi,
  getPreviewDistribusiTahap2,
  executeAutoDistribusiTahap2,
} from "../../api/admin";

export default function DistribusiOtomatisTab({
  id_program,
  tahap,
  onSuccess,
  onError,
}) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [expandedReviewer, setExpandedReviewer] = useState({});
  const [errorMsg, setErrorMsg] = useState("");
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const fetchPreview = async () => {
      if (!id_program) return;

      try {
        setLoading(true);
        setErrorMsg("");
        
        const response = tahap === 1 
          ? await getPreviewDistribusi(id_program, tahap)
          : await getPreviewDistribusiTahap2(id_program);

        if (response.success) {
          setPreview(response.data);
        } else {
          setErrorMsg(response.message);
          setPreview(null);
        }
      } catch (err) {
        console.error("Error fetching preview:", err);
        setErrorMsg("Gagal memuat preview distribusi");
        setPreview(null);
      } finally {
        setLoading(false);
        hasLoadedRef.current = true;
      }
    };

    if (!hasLoadedRef.current) {
      fetchPreview();
    }
  }, [id_program, tahap]);

  useEffect(() => {
    hasLoadedRef.current = false;
  }, [id_program, tahap]);

  const handleRefresh = async () => {
    if (!id_program) return;

    try {
      setLoading(true);
      setErrorMsg("");
      
      const response = tahap === 1 
        ? await getPreviewDistribusi(id_program, tahap)
        : await getPreviewDistribusiTahap2(id_program);

      if (response.success) {
        setPreview(response.data);
      } else {
        setErrorMsg(response.message);
        setPreview(null);
      }
    } catch (err) {
      console.error("Error fetching preview:", err);
      setErrorMsg("Gagal memuat preview distribusi");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id_reviewer) => {
    setExpandedReviewer((prev) => ({
      ...prev,
      [id_reviewer]: !prev[id_reviewer],
    }));
  };

  const handleExecute = async () => {
    const confirmText = tahap === 1
      ? `Anda akan mendistribusikan <b>${preview.total_proposal}</b> proposal ke <b>${preview.total_reviewer}</b> reviewer secara otomatis.<br/><br/>Lanjutkan?`
      : `Anda akan mendistribusikan <b>${preview.total_proposal}</b> proposal ke:<br/>- <b>${preview.total_reviewer}</b> Reviewer<br/>- <b>${preview.total_juri}</b> Juri<br/><br/>Total: <b>${preview.distribusi_total}</b> distribusi<br/><br/>Lanjutkan?`;

    const result = await Swal.fire({
      title: "Konfirmasi Distribusi",
      html: confirmText,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0D59F2",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Distribusikan",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        setExecuting(true);
        const response = tahap === 1
          ? await executeAutoDistribusi(id_program, tahap)
          : await executeAutoDistribusiTahap2(id_program);

        if (response.success) {
          Swal.fire({
            title: "Berhasil!",
            text: response.message,
            icon: "success",
            confirmButtonColor: "#0D59F2",
          });
          if (onSuccess) onSuccess(response.message);
          handleRefresh();
        } else {
          Swal.fire({
            title: "Gagal!",
            text: response.message,
            icon: "error",
            confirmButtonColor: "#d33",
          });
          if (onError) onError(response.message);
        }
      } catch (err) {
        console.error("Error executing auto distribusi:", err);
        Swal.fire({
          title: "Error!",
          text: "Terjadi kesalahan saat distribusi",
          icon: "error",
          confirmButtonColor: "#d33",
        });
        if (onError) onError("Terjadi kesalahan saat distribusi");
      } finally {
        setExecuting(false);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (errorMsg) {
    return (
      <Box sx={{ textAlign: "center", py: 5 }}>
          <Info sx={{ fontSize: 80, color: "#ddd", mb: 2 }} />
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#666", mb: 1 }}>
            Tidak ada proposal siap distribusi
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#999", mb: 3 }}>
            {errorMsg}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            sx={{ textTransform: "none" }}
          >
            Refresh Preview
          </Button>
      </Box>
    );
  }

  if (!preview) {
    return (
      <Box sx={{ textAlign: "center", py: 5 }}>
        <Typography sx={{ fontSize: 16, color: "#666", mb: 2 }}>
          Tidak ada data preview
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          sx={{ textTransform: "none" }}
        >
          Refresh Preview
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: tahap === 1 ? "repeat(3, 1fr)" : "repeat(4, 1fr)",
          gap: 2,
          mb: 3,
        }}
      >
        {tahap === 1 ? (
          <>
            <Paper sx={{ p: 2, backgroundColor: "#E3F2FD" }}>
              <Typography sx={{ fontSize: 14, color: "#666", mb: 0.5 }}>
                Total Proposal
              </Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: "#0D59F2" }}>
                {preview.total_proposal}
              </Typography>
            </Paper>

            <Paper sx={{ p: 2, backgroundColor: "#F3E5F5" }}>
              <Typography sx={{ fontSize: 14, color: "#666", mb: 0.5 }}>
                Total Reviewer
              </Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: "#9C27B0" }}>
                {preview.total_reviewer}
              </Typography>
            </Paper>

            <Paper sx={{ p: 2, backgroundColor: "#E8F5E9" }}>
              <Typography sx={{ fontSize: 14, color: "#666", mb: 0.5 }}>
                Rata-rata per Reviewer
              </Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: "#4CAF50" }}>
                {Math.ceil(preview.total_proposal / preview.total_reviewer)}
              </Typography>
            </Paper>
          </>
        ) : (
          <>
            <Paper sx={{ p: 2, backgroundColor: "#E3F2FD" }}>
              <Typography sx={{ fontSize: 14, color: "#666", mb: 0.5 }}>
                Total Proposal
              </Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: "#0D59F2" }}>
                {preview.total_proposal}
              </Typography>
            </Paper>

            <Paper sx={{ p: 2, backgroundColor: "#F3E5F5" }}>
              <Typography sx={{ fontSize: 14, color: "#666", mb: 0.5 }}>
                Reviewer
              </Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: "#9C27B0" }}>
                {preview.total_reviewer}
              </Typography>
            </Paper>

            <Paper sx={{ p: 2, backgroundColor: "#FFF3E0" }}>
              <Typography sx={{ fontSize: 14, color: "#666", mb: 0.5 }}>
                Juri
              </Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: "#FF9800" }}>
                {preview.total_juri}
              </Typography>
            </Paper>

            <Paper sx={{ p: 2, backgroundColor: "#E8F5E9" }}>
              <Typography sx={{ fontSize: 14, color: "#666", mb: 0.5 }}>
                Total Distribusi
              </Typography>
              <Typography sx={{ fontSize: 28, fontWeight: 700, color: "#4CAF50" }}>
                {preview.distribusi_total}
              </Typography>
            </Paper>
          </>
        )}
      </Box>

      <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 2 }}>
        {tahap === 1 ? "Rekomendasi Distribusi" : "Preview Distribusi"}
      </Typography>

      {tahap === 1 ? (
        preview.rekomendasi && preview.rekomendasi.length > 0 ? (
          preview.rekomendasi.map((reviewer) => (
            <Card key={reviewer.id_reviewer} sx={{ mb: 2 }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1,
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: 18, fontWeight: 600, mb: 0.5 }}>
                      {reviewer.nama_reviewer}
                    </Typography>
                    <Typography sx={{ fontSize: 14, color: "#666", mb: 0.5 }}>
                      {reviewer.institusi || "-"}
                    </Typography>
                    {reviewer.bidang_keahlian && (
                      <Typography sx={{ fontSize: 13, color: "#999" }}>
                        Bidang: {reviewer.bidang_keahlian}
                      </Typography>
                    )}
                  </Box>

                  <Chip
                    label={`${reviewer.proposals.length} Proposal`}
                    color="primary"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>

                <Button
                  size="small"
                  onClick={() => toggleExpand(reviewer.id_reviewer)}
                  endIcon={
                    expandedReviewer[reviewer.id_reviewer] ? (
                      <ExpandLess />
                    ) : (
                      <ExpandMore />
                    )
                  }
                  sx={{ textTransform: "none", mt: 1 }}
                >
                  {expandedReviewer[reviewer.id_reviewer]
                    ? "Sembunyikan Detail"
                    : "Lihat Detail"}
                </Button>

                <Collapse in={expandedReviewer[reviewer.id_reviewer]}>
                  <TableContainer sx={{ mt: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                          <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Judul Proposal</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Tim</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Modal</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reviewer.proposals.map((proposal) => (
                          <TableRow key={proposal.id_proposal} hover>
                            <TableCell>{proposal.id_proposal}</TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 14, maxWidth: 300 }}>
                                {proposal.judul}
                              </Typography>
                            </TableCell>
                            <TableCell>{proposal.nama_tim}</TableCell>
                            <TableCell>
                              {new Intl.NumberFormat("id-ID", {
                                style: "currency",
                                currency: "IDR",
                                minimumFractionDigits: 0,
                              }).format(proposal.modal_diajukan)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Collapse>
              </CardContent>
            </Card>
          ))
        ) : (
          <Alert severity="info">Tidak ada rekomendasi distribusi</Alert>
        )
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 600, mb: 1 }}>
            Distribusi All-to-All (Semua ke Semua)
          </Typography>
          <Typography sx={{ fontSize: 14, mb: 2 }}>
            Sistem akan mendistribusikan <b>{preview.total_proposal}</b> proposal ke:
          </Typography>
          <ul style={{ marginLeft: 20, fontSize: 14 }}>
            <li><b>{preview.total_reviewer}</b> Reviewer → Total: {preview.distribusi_reviewer} distribusi</li>
            <li><b>{preview.total_juri}</b> Juri → Total: {preview.distribusi_juri} distribusi</li>
          </ul>
          <Typography sx={{ fontSize: 14, mt: 2, fontWeight: 600 }}>
            Total Distribusi: {preview.distribusi_total}
          </Typography>
        </Alert>
      )}

      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 3 }}>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={executing}
          sx={{ textTransform: "none" }}
        >
          Refresh Preview
        </Button>

        <Button
          variant="contained"
          startIcon={executing ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
          onClick={handleExecute}
          disabled={executing}
          sx={{
            textTransform: "none",
            backgroundColor: "#0D59F2",
            "&:hover": { backgroundColor: "#0a47c4" },
          }}
        >
          {executing ? "Memproses..." : "Eksekusi Distribusi Otomatis"}
        </Button>
      </Box>
    </Box>
  );
}