import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, CircularProgress, Collapse, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Card, CardContent, Paper,
} from "@mui/material";
import Swal from "sweetalert2";
import LoadingScreen from "../common/LoadingScreen";
import {
  getPreviewDistribusi,
  executeAutoDistribusi,
  getPreviewDistribusiTahap2,
  executeAutoDistribusiTahap2,
  executeManualDistribusiTahap2,
  getReviewerList,
  getJuriList,
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

const normalizeId = (value) => {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
};

const getReviewerIdFromItem = (item) => normalizeId(
  item?.reviewer?.id_user
  ?? item?.reviewer?.id_reviewer
  ?? item?.id_reviewer
  ?? item?.id_user_reviewer
);

const getJuriIdFromItem = (item) => normalizeId(
  item?.juri?.id_user
  ?? item?.juri?.id_juri
  ?? item?.id_juri
  ?? item?.id_user_juri
);

const toNumberId = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const sortByIdAsc = (list = []) => {
  return [...list].sort((a, b) => {
    const aNum = Number(a?.id_user);
    const bNum = Number(b?.id_user);

    const aValid = !Number.isNaN(aNum);
    const bValid = !Number.isNaN(bNum);

    if (aValid && bValid) return aNum - bNum;
    if (aValid) return -1;
    if (bValid) return 1;

    return String(a?.nama_lengkap || "").localeCompare(String(b?.nama_lengkap || ""));
  });
};

const applyRoundRobinRencana = (previewData, reviewers, juries) => {
  if (!previewData?.rencana_distribusi?.length) return previewData;
  if (!reviewers?.length || !juries?.length) return previewData;

  const usedReviewer = new Set((previewData.detail_sudah || []).map(getReviewerIdFromItem).filter(Boolean));
  const usedJuri = new Set((previewData.detail_sudah || []).map(getJuriIdFromItem).filter(Boolean));

  const availableReviewer = sortByIdAsc(reviewers.filter((r) => !usedReviewer.has(normalizeId(r.id_user))));
  const availableJuri = sortByIdAsc(juries.filter((j) => !usedJuri.has(normalizeId(j.id_user))));

  if (!availableReviewer.length || !availableJuri.length) return previewData;

  const rencanaBaru = previewData.rencana_distribusi.map((item, index) => {
    const reviewer = availableReviewer[index % availableReviewer.length];
    const juri = availableJuri[index % availableJuri.length];

    return {
      ...item,
      reviewer: {
        ...(item.reviewer || {}),
        id_user: reviewer.id_user,
        nama_lengkap: reviewer.nama_lengkap,
      },
      juri: {
        ...(item.juri || {}),
        id_user: juri.id_user,
        nama_lengkap: juri.nama_lengkap,
      },
    };
  });

  return { ...previewData, rencana_distribusi: rencanaBaru };
};

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
      if (tahap === 1) {
        const res = await getPreviewDistribusi(id_program, tahap);
        setPreview(res.data || null);
      } else {
        const [previewRes, reviewerRes, juriRes] = await Promise.all([
          getPreviewDistribusiTahap2(id_program),
          getReviewerList(),
          getJuriList(),
        ]);

        const previewData = previewRes.data || null;
        const reviewerData = reviewerRes.data || [];
        const juriData = juriRes.data || [];

        setPreview(applyRoundRobinRencana(previewData, reviewerData, juriData));
      }
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
    const reviewerText = preview.total_proposal === 1 ? "1 reviewer" : `${preview.total_reviewer} reviewer`;
    const confirmText = tahap === 1
      ? `Anda akan mendistribusikan <b>${preview.total_proposal}</b> proposal ke <b>${reviewerText}</b> secara otomatis.<br/><br/>Lanjutkan?`
      : `Anda akan mendistribusikan <b>${preview.belum_terdistribusi}</b> proposal yang belum memiliki pasangan panel.<br/><br/>
         Sistem akan mendistribusikan berurutan berdasarkan ID reviewer dan ID juri (round-robin) sesuai preview.<br/><br/>Lanjutkan?`;

    const result = await Swal.fire({
      title: "Konfirmasi Distribusi", html: confirmText, icon: "question",
      showCancelButton: true, confirmButtonColor: "#0D59F2", cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Distribusikan", cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      setExecuting(true);

      if (tahap === 1) {
        await executeAutoDistribusi(id_program, tahap);
      } else {
        const rencana = preview?.rencana_distribusi || [];

        if (rencana.length === 0) {
          await executeAutoDistribusiTahap2(id_program);
        } else {
          for (const item of rencana) {
            const id_proposal = toNumberId(item?.id_proposal);
            const id_reviewer = toNumberId(
              item?.reviewer?.id_user
              ?? item?.reviewer?.id_reviewer
              ?? item?.id_reviewer
              ?? item?.id_user_reviewer
            );
            const id_juri = toNumberId(
              item?.juri?.id_user
              ?? item?.juri?.id_juri
              ?? item?.id_juri
              ?? item?.id_user_juri
            );

            if (!id_proposal || !id_reviewer || !id_juri) {
              throw new Error("Rencana distribusi tidak valid");
            }

            await executeManualDistribusiTahap2(id_program, {
              id_proposal,
              id_reviewer,
              id_juri,
            });
          }
        }
      }

      await Swal.fire({
        icon: "success", title: "Berhasil", text: "Distribusi berhasil dieksekusi",
        timer: 2000, timerProgressBar: true, showConfirmButton: false,
      });
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
    return (
      <Box sx={{ position: "relative", minHeight: 280 }}>
        <LoadingScreen message="Memuat preview distribusi..." overlay minHeight="280px" />
      </Box>
    );
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

  const semuaSudahTerdistribusi = tahap === 2 && preview.belum_terdistribusi === 0;

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
            <StatCard label="Sudah Berpasangan" value={preview.sudah_terdistribusi} color="#4CAF50" bg="#E8F5E9" />
            <StatCard label="Belum Berpasangan" value={preview.belum_terdistribusi} color="#F44336" bg="#FFEBEE" />
            <StatCard label="Jumlah Pasang" value={preview.jumlah_pasang} color="#FF9800" bg="#FFF3E0" />
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

                <Button size="small" onClick={() => toggleExpand(reviewer.id_reviewer)}
                  sx={{ textTransform: "none", borderRadius: "50px", mt: 1 }}>
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
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ p: 3, borderRadius: 2, background: "#f0f4ff", border: "1px solid #c7d7fc" }}>
            <Typography sx={{ fontWeight: 700, mb: 1, color: "#0D59F2" }}>Sistem Pasangan (Reviewer + Juri)</Typography>
            <Typography sx={{ fontSize: 14, color: "#444", mb: 0.5 }}>
              Tersedia <b>{preview.total_reviewer}</b> reviewer dan <b>{preview.total_juri}</b> juri →{" "}
              <b>{preview.jumlah_pasang}</b> pasang unik siap dipakai terlebih dahulu.
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#444", mb: 0.5 }}>
              Proposal yang sudah berpasangan: <b style={{ color: "#2e7d32" }}>{preview.sudah_terdistribusi}</b>
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#444" }}>
              Proposal sisa untuk didistribusikan: <b style={{ color: preview.belum_terdistribusi > 0 ? "#c62828" : "#2e7d32" }}>{preview.belum_terdistribusi}</b>
            </Typography>
          </Box>

          {preview.detail_sudah && preview.detail_sudah.length > 0 && (
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#2e7d32", mb: 1 }}>
                Sudah Berpasangan ({preview.detail_sudah.length})
              </Typography>
              <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Proposal</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Reviewer</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Juri</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.detail_sudah.map((item) => (
                      <TableRow key={item.id_proposal} hover>
                        <TableCell>
                          <Typography sx={{ fontSize: 12, maxWidth: 250 }}>{item.judul}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12 }}>{item.reviewer?.nama_lengkap || "-"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12 }}>{item.juri?.nama_lengkap || "-"}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {preview.rencana_distribusi && preview.rencana_distribusi.length > 0 && (
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#e65100", mb: 1 }}>
                Akan Didistribusikan ({preview.rencana_distribusi.length})
              </Typography>
              <TableContainer sx={{ borderRadius: "12px", border: "1px solid #ffe0cc" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#fff3e0" }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Proposal</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Reviewer</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Juri</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.rencana_distribusi.map((item) => (
                      <TableRow key={item.id_proposal} hover>
                        <TableCell>
                          <Typography sx={{ fontSize: 12, maxWidth: 250 }}>{item.judul}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12 }}>{item.reviewer?.nama_lengkap || "-"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12 }}>{item.juri?.nama_lengkap || "-"}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {semuaSudahTerdistribusi && (
            <Box sx={{ p: 2.5, borderRadius: 2, background: "#e8f5e9", border: "1px solid #a5d6a7", textAlign: "center" }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#2e7d32" }}>
                ✓ Semua proposal sudah memiliki pasangan reviewer dan juri
              </Typography>
            </Box>
          )}
        </Box>
      )}

      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 3 }}>
        <Button variant="outlined" onClick={fetchPreview} disabled={executing}
          sx={{ textTransform: "none", borderRadius: "50px" }}>
          Refresh Preview
        </Button>
        <Button
          variant="contained"
          onClick={handleExecute}
          disabled={executing || semuaSudahTerdistribusi}
          sx={{ textTransform: "none", borderRadius: "50px", backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" } }}
        >
          {executing
            ? "Memproses..."
            : semuaSudahTerdistribusi
              ? "Semua Sudah Berpasangan"
              : "Eksekusi Distribusi Otomatis"}
        </Button>
      </Box>
    </Box>
  );
}