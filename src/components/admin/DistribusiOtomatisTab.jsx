import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, CircularProgress, Collapse, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Card, CardContent, Paper,
} from "@mui/material";
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
      : `Anda akan mendistribusikan sisa distribusi untuk <b>${preview.total_proposal}</b> proposal ke:<br/>- Reviewer: <b>${preview.distribusi_sisa_reviewer ?? preview.distribusi_reviewer}</b> sisa<br/>- Juri: <b>${preview.distribusi_sisa_juri ?? preview.distribusi_juri}</b> sisa<br/><br/>Total sisa: <b>${preview.distribusi_sisa_total ?? preview.distribusi_total}</b> distribusi<br/><br/>Lanjutkan?`;

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
        <Button variant="outlined" onClick={fetchPreview} sx={{ textTransform: "none", borderRadius: "50px" }}>Refresh Preview</Button>
      </Box>
    );
  }

  if (!preview) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Typography sx={{ fontSize: 14, color: "#999", mb: 3 }}>Tidak ada data preview</Typography>
        <Button variant="outlined" onClick={fetchPreview} sx={{ textTransform: "none", borderRadius: "50px" }}>Refresh Preview</Button>
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
            <StatCard label="Sisa Distribusi" value={preview.distribusi_sisa_total ?? preview.distribusi_total} color="#4CAF50" bg="#E8F5E9" />
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
                  sx={{ textTransform: "none", borderRadius: "50px", mt: 1 }}
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
          <Typography sx={{ fontSize: 14, color: "#444" }}>
            • <b>{preview.total_reviewer}</b> Reviewer → target {preview.distribusi_reviewer} | sudah {preview.distribusi_existing_reviewer ?? 0} | sisa {preview.distribusi_sisa_reviewer ?? preview.distribusi_reviewer}
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#444" }}>
            • <b>{preview.total_juri}</b> Juri → target {preview.distribusi_juri} | sudah {preview.distribusi_existing_juri ?? 0} | sisa {preview.distribusi_sisa_juri ?? preview.distribusi_juri}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#8b0000", mt: 0.75 }}>
            Ditolak: reviewer {preview.distribusi_rejected_reviewer ?? 0} • juri {preview.distribusi_rejected_juri ?? 0}
          </Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 700, mt: 1.5, color: "#0D59F2" }}>
            Total: target {preview.distribusi_total} | sudah {preview.distribusi_existing_total ?? 0} | sisa {preview.distribusi_sisa_total ?? preview.distribusi_total}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "#667085", mt: 1.25 }}>
            Catatan: penugasan yang ditolak dihitung sebagai sisa dan akan di-reassign ulang saat eksekusi otomatis.
          </Typography>
        </Box>
      )}

      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 3 }}>
        <Button variant="outlined" onClick={fetchPreview} disabled={executing} sx={{ textTransform: "none", borderRadius: "50px" }}>
          Refresh Preview
        </Button>
        <Button
          variant="contained"
          onClick={handleExecute}
          disabled={executing || (tahap === 2 && (preview.distribusi_sisa_total ?? 0) === 0)}
          sx={{ textTransform: "none", borderRadius: "50px", backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" } }}
        >
          {executing ? "Memproses..." : tahap === 2 && (preview.distribusi_sisa_total ?? 0) === 0 ? "Sudah Merata" : "Eksekusi Distribusi Otomatis"}
        </Button>
      </Box>
    </Box>
  );
}