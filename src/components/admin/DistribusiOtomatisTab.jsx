import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, CircularProgress, Collapse, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Card, CardContent, Paper,
} from "@mui/material";
import { Refresh, PlayArrow, ExpandMore, ExpandLess } from "@mui/icons-material";
import Swal from "sweetalert2";
import {
  getPreviewDistribusi,
  executeAutoDistribusi,
  getPreviewDistribusiTahap2,
  executeAutoDistribusiTahap2,
} from "../../api/admin";

const formatRupiah = (value) => {
  if (!value) return "Rp 0";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
};

const StatCard = ({ label, value, color, bg }) => (
  <Paper sx={{ p: 2.5, backgroundColor: bg, borderRadius: 2 }}>
    <Typography sx={{ fontSize: 13, color: "#666", mb: 0.5 }}>{label}</Typography>
    <Typography sx={{ fontSize: 30, fontWeight: 800, color }}>{value}</Typography>
  </Paper>
);

export default function DistribusiOtomatisTab({ id_program, tahap, onSuccess, onError }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [expandedReviewer, setExpandedReviewer] = useState({});
  const [errorMsg, setErrorMsg] = useState("");

  const fetchPreview = useCallback(async () => {
    if (!id_program) return;
    try {
      setLoading(true);
      setErrorMsg("");
      const res = tahap === 1
        ? await getPreviewDistribusi(id_program, tahap)
        : await getPreviewDistribusiTahap2(id_program);
      setPreview(res.data || null);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Gagal memuat preview distribusi");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, [id_program, tahap]);

  useEffect(() => { fetchPreview(); }, [fetchPreview]);

  const toggleExpand = (id) => setExpandedReviewer((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleExecute = async () => {
    const confirmText = tahap === 1
      ? `Anda akan mendistribusikan <b>${preview.total_proposal}</b> proposal ke <b>${preview.total_reviewer}</b> reviewer secara otomatis.<br/><br/>Lanjutkan?`
      : `Anda akan mendistribusikan <b>${preview.total_proposal}</b> proposal ke:<br/>- <b>${preview.total_reviewer}</b> Reviewer<br/>- <b>${preview.total_juri}</b> Juri<br/><br/>Total: <b>${preview.distribusi_total}</b> distribusi<br/><br/>Lanjutkan?`;

    const result = await Swal.fire({
      title: "Konfirmasi Distribusi", html: confirmText, icon: "question",
      showCancelButton: true, confirmButtonColor: "#0D59F2", cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Distribusikan", cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      setExecuting(true);
      await (tahap === 1 ? executeAutoDistribusi(id_program, tahap) : executeAutoDistribusiTahap2(id_program));
      await Swal.fire({ icon: "success", title: "Berhasil", text: "Distribusi berhasil dieksekusi", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      if (onSuccess) onSuccess("Distribusi berhasil dieksekusi");
      fetchPreview();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Terjadi kesalahan saat distribusi", confirmButtonColor: "#0D59F2" });
      if (onError) onError(err.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>;
  }

  if (errorMsg) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#666", mb: 1 }}>Tidak ada proposal siap distribusi</Typography>
        <Typography sx={{ fontSize: 13, color: "#999", mb: 3 }}>{errorMsg}</Typography>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchPreview} sx={{ textTransform: "none" }}>Refresh Preview</Button>
      </Box>
    );
  }

  if (!preview) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Typography sx={{ fontSize: 14, color: "#999", mb: 3 }}>Tidak ada data preview</Typography>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchPreview} sx={{ textTransform: "none" }}>Refresh Preview</Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "grid", gridTemplateColumns: tahap === 1 ? "repeat(3, 1fr)" : "repeat(4, 1fr)", gap: 2, mb: 3 }}>
        {tahap === 1 ? (
          <>
            <StatCard label="Total Proposal" value={preview.total_proposal} color="#0D59F2" bg="#E3F2FD" />
            <StatCard label="Total Reviewer" value={preview.total_reviewer} color="#9C27B0" bg="#F3E5F5" />
            <StatCard label="Rata-rata per Reviewer" value={Math.ceil(preview.total_proposal / preview.total_reviewer)} color="#4CAF50" bg="#E8F5E9" />
          </>
        ) : (
          <>
            <StatCard label="Total Proposal" value={preview.total_proposal} color="#0D59F2" bg="#E3F2FD" />
            <StatCard label="Reviewer" value={preview.total_reviewer} color="#9C27B0" bg="#F3E5F5" />
            <StatCard label="Juri" value={preview.total_juri} color="#FF9800" bg="#FFF3E0" />
            <StatCard label="Total Distribusi" value={preview.distribusi_total} color="#4CAF50" bg="#E8F5E9" />
          </>
        )}
      </Box>

      <Typography sx={{ fontSize: 15, fontWeight: 600, mb: 2 }}>
        {tahap === 1 ? "Rekomendasi Distribusi" : "Preview Distribusi"}
      </Typography>

      {tahap === 1 ? (
        preview.rekomendasi && preview.rekomendasi.length > 0 ? (
          preview.rekomendasi.map((reviewer) => (
            <Card key={reviewer.id_reviewer} sx={{ mb: 2, borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                  <Box>
                    <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 0.5 }}>{reviewer.nama_reviewer}</Typography>
                    <Typography sx={{ fontSize: 13, color: "#666" }}>{reviewer.institusi || "-"}</Typography>
                    {reviewer.bidang_keahlian && (
                      <Typography sx={{ fontSize: 12, color: "#999" }}>Bidang: {reviewer.bidang_keahlian}</Typography>
                    )}
                  </Box>
                  <Chip label={`${reviewer.proposals.length} Proposal`} color="primary" sx={{ fontWeight: 700 }} />
                </Box>

                <Button
                  size="small"
                  onClick={() => toggleExpand(reviewer.id_reviewer)}
                  endIcon={expandedReviewer[reviewer.id_reviewer] ? <ExpandLess /> : <ExpandMore />}
                  sx={{ textTransform: "none", mt: 1 }}
                >
                  {expandedReviewer[reviewer.id_reviewer] ? "Sembunyikan Detail" : "Lihat Detail"}
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
                        {reviewer.proposals.map((p) => (
                          <TableRow key={p.id_proposal} hover>
                            <TableCell>{p.id_proposal}</TableCell>
                            <TableCell><Typography sx={{ fontSize: 13, maxWidth: 300 }}>{p.judul}</Typography></TableCell>
                            <TableCell>{p.nama_tim}</TableCell>
                            <TableCell>{formatRupiah(p.modal_diajukan)}</TableCell>
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
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography sx={{ fontSize: 14, color: "#999" }}>Tidak ada rekomendasi distribusi</Typography>
          </Box>
        )
      ) : (
        <Box sx={{ p: 3, borderRadius: 2, background: "#f0f4ff", border: "1px solid #c7d7fc" }}>
          <Typography sx={{ fontWeight: 700, mb: 1, color: "#0D59F2" }}>Distribusi All-to-All</Typography>
          <Typography sx={{ fontSize: 14, color: "#444", mb: 1 }}>
            Sistem akan mendistribusikan <b>{preview.total_proposal}</b> proposal ke:
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#444" }}>• <b>{preview.total_reviewer}</b> Reviewer → {preview.distribusi_reviewer} distribusi</Typography>
          <Typography sx={{ fontSize: 14, color: "#444" }}>• <b>{preview.total_juri}</b> Juri → {preview.distribusi_juri} distribusi</Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 700, mt: 1.5, color: "#0D59F2" }}>Total: {preview.distribusi_total} distribusi</Typography>
        </Box>
      )}

      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 3 }}>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchPreview} disabled={executing} sx={{ textTransform: "none" }}>
          Refresh Preview
        </Button>
        <Button
          variant="contained"
          startIcon={executing ? <CircularProgress size={18} color="inherit" /> : <PlayArrow />}
          onClick={handleExecute}
          disabled={executing}
          sx={{ textTransform: "none", backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" } }}
        >
          {executing ? "Memproses..." : "Eksekusi Distribusi Otomatis"}
        </Button>
      </Box>
    </Box>
  );
}