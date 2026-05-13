import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Collapse,
  Chip,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Paper,
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

const tableHeadCell = {
  fontWeight: 700,
  fontSize: 13,
  color: "#374151",
  backgroundColor: "#F8FAFC",
  borderBottom: `2px solid ${COLORS.primaryMuted}`,
  py: 2,
};

const tableBodyRow = {
  "& td": { borderBottom: `1px solid ${COLORS.slateLight}`, py: 2 },
  "&:hover": { backgroundColor: "#F8FAFC" },
};

const statCard = {
  p: 2.5,
  borderRadius: "16px",
  border: "1px solid #e5e7eb",
  background: "#fff",
  boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
};

const formatRupiah = (value) => {
  if (!value) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const normalizeId = (value) => {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
};

const getReviewerIdFromItem = (item) =>
  normalizeId(
    item?.reviewer?.id_user ??
      item?.reviewer?.id_reviewer ??
      item?.id_reviewer ??
      item?.id_user_reviewer
  );

const getJuriIdFromItem = (item) =>
  normalizeId(
    item?.juri?.id_user ??
      item?.juri?.id_juri ??
      item?.id_juri ??
      item?.id_user_juri
  );

const toNumberId = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const sortByIdAsc = (list = []) =>
  [...list].sort((a, b) => {
    const aNum = Number(a?.id_user);
    const bNum = Number(b?.id_user);
    const aValid = !Number.isNaN(aNum);
    const bValid = !Number.isNaN(bNum);
    if (aValid && bValid) return aNum - bNum;
    if (aValid) return -1;
    if (bValid) return 1;
    return String(a?.nama_lengkap || "").localeCompare(String(b?.nama_lengkap || ""));
  });

const applyRoundRobinRencana = (previewData, reviewers, juries) => {
  if (!previewData?.rencana_distribusi?.length) return previewData;
  if (!reviewers?.length || !juries?.length) return previewData;

  const usedReviewer = new Set(
    (previewData.detail_sudah || []).map(getReviewerIdFromItem).filter(Boolean)
  );
  const usedJuri = new Set(
    (previewData.detail_sudah || []).map(getJuriIdFromItem).filter(Boolean)
  );

  const availableReviewer = sortByIdAsc(
    reviewers.filter((r) => !usedReviewer.has(normalizeId(r.id_user)))
  );
  const availableJuri = sortByIdAsc(
    juries.filter((j) => !usedJuri.has(normalizeId(j.id_user)))
  );

  if (!availableReviewer.length || !availableJuri.length) return previewData;

  const rencanaBaru = previewData.rencana_distribusi.map((item, index) => {
    const reviewer = availableReviewer[index % availableReviewer.length];
    const juri = availableJuri[index % availableJuri.length];
    return {
      ...item,
      reviewer: { ...(item.reviewer || {}), id_user: reviewer.id_user, nama_lengkap: reviewer.nama_lengkap },
      juri: { ...(item.juri || {}), id_user: juri.id_user, nama_lengkap: juri.nama_lengkap },
    };
  });

  return { ...previewData, rencana_distribusi: rencanaBaru };
};

const StatCard = ({ label, value, color, bg, borderColor }) => (
  <Box sx={{ ...statCard, backgroundColor: bg, borderColor: borderColor || "#e5e7eb" }}>
    <Typography sx={{ fontSize: 12, color: COLORS.slate, mb: 0.5 }}>{label}</Typography>
    <Typography sx={{ fontSize: 28, fontWeight: 800, color }}>{value}</Typography>
  </Box>
);

export default function DistribusiOtomatisTab({ id_program, tahap, onSuccess, onError }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [expandedReviewer, setExpandedReviewer] = useState({});
  const [errorMsg, setErrorMsg] = useState("");
  // Pagination states
  const [pageRekom, setPageRekom] = useState(1);
  const [pageDetail, setPageDetail] = useState(1);
  const [pageRencana, setPageRencana] = useState(1);
  const rowsPerPage = 10;

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
        setPreview(
          applyRoundRobinRencana(previewRes.data || null, reviewerRes.data || [], juriRes.data || [])
        );
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Gagal memuat preview distribusi");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, [id_program, tahap]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  useEffect(() => {
    // reset pagination when preview or tahap changes
    setPageRekom(1);
    setPageDetail(1);
    setPageRencana(1);
  }, [preview, tahap]);

  const toggleExpand = (id) =>
    setExpandedReviewer((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleExecute = async () => {
    const reviewerText =
      preview.total_proposal === 1
        ? "1 reviewer"
        : `${preview.total_reviewer} reviewer`;

    const confirmText =
      tahap === 1
        ? `Anda akan mendistribusikan <b>${preview.total_proposal}</b> proposal ke <b>${reviewerText}</b> secara otomatis.<br/><br/>Lanjutkan?`
        : `Anda akan mendistribusikan <b>${preview.belum_terdistribusi}</b> proposal yang belum memiliki pasangan panel.<br/><br/>
           Sistem akan mendistribusikan berurutan berdasarkan ID reviewer dan ID juri (round-robin) sesuai preview.<br/><br/>Lanjutkan?`;

    const result = await Swal.fire({
      title: "Konfirmasi Distribusi",
      html: confirmText,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: COLORS.primary,
      cancelButtonColor: "#d33",
      confirmButtonText: "Ya, Distribusikan",
      cancelButtonText: "Batal",
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
              item?.reviewer?.id_user ??
                item?.reviewer?.id_reviewer ??
                item?.id_reviewer ??
                item?.id_user_reviewer
            );
            const id_juri = toNumberId(
              item?.juri?.id_user ??
                item?.juri?.id_juri ??
                item?.id_juri ??
                item?.id_user_juri
            );

            if (!id_proposal || !id_reviewer || !id_juri) {
              throw new Error("Rencana distribusi tidak valid");
            }

            await executeManualDistribusiTahap2(id_program, { id_proposal, id_reviewer, id_juri });
          }
        }
      }

      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Distribusi berhasil dieksekusi",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      if (onSuccess) onSuccess("Distribusi berhasil dieksekusi");
      fetchPreview();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: err.response?.data?.message || "Terjadi kesalahan saat distribusi",
        confirmButtonColor: COLORS.primary,
      });
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
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#374151", mb: 1 }}>
          Tidak ada proposal siap distribusi
        </Typography>
        <Typography sx={{ fontSize: 13, color: COLORS.slate, mb: 3 }}>{errorMsg}</Typography>
        <Button
          variant="outlined"
          onClick={fetchPreview}
          sx={{ textTransform: "none", borderRadius: "50px", borderColor: COLORS.primary, color: COLORS.primary }}
        >
          Refresh Preview
        </Button>
      </Box>
    );
  }

  if (!preview) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <Typography sx={{ fontSize: 14, color: COLORS.slate, mb: 3 }}>
          Tidak ada data preview
        </Typography>
        <Button
          variant="outlined"
          onClick={fetchPreview}
          sx={{ textTransform: "none", borderRadius: "50px", borderColor: COLORS.primary, color: COLORS.primary }}
        >
          Refresh Preview
        </Button>
      </Box>
    );
  }

  const semuaSudahTerdistribusi = preview.belum_terdistribusi === 0;

  return (
    <Box>
      <Box
        sx={{
          mb: 3,
          display: "grid",
          gridTemplateColumns:
            tahap === 1
              ? { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }
              : { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
          gap: 2,
        }}
      >
        <StatCard
          label="Total Proposal"
          value={preview.total_proposal}
          color={COLORS.primary}
          bg="#f3f7ff"
          borderColor="#d7e5fb"
        />
        <StatCard
          label="Sudah Berpasangan"
          value={preview.sudah_terdistribusi}
          color={COLORS.success}
          bg="#f2faf3"
          borderColor="#d7e9d8"
        />
        <StatCard
          label="Belum Berpasangan"
          value={preview.belum_terdistribusi}
          color={COLORS.error}
          bg="#fff5f5"
          borderColor="#fecaca"
        />
        <StatCard
          label={tahap === 1 ? "Total Reviewer" : "Jumlah Pasang"}
          value={tahap === 1 ? preview.total_reviewer : preview.jumlah_pasang}
          color={tahap === 1 ? "#7C3AED" : COLORS.warning}
          bg={tahap === 1 ? "#F5F3FF" : "#fff7ee"}
          borderColor={tahap === 1 ? "#DDD6FE" : "#fde3c7"}
        />
      </Box>

      <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", mb: 2 }}>
        {tahap === 1 ? "Rekomendasi Distribusi" : "Preview Distribusi"}
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: "16px",
            border: `1.5px solid ${COLORS.primaryMuted}`,
            backgroundColor: "#f3f7ff",
          }}
        >
          <Typography sx={{ fontWeight: 700, mb: 1.5, color: COLORS.primary, fontSize: 14 }}>
            {tahap === 1 ? "Sistem Pasangan (2 Reviewer Internal)" : "Sistem Pasangan (Reviewer + Juri)"}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            <Typography sx={{ fontSize: 13, color: "#374151" }}>
              {tahap === 1 ? (
                <>
                  Tersedia <Box component="span" sx={{ fontWeight: 700 }}>{preview.total_reviewer}</Box> reviewer aktif. 
                  Setiap proposal akan dinilai oleh 2 orang reviewer berbeda.
                </>
              ) : (
                <>
                  Tersedia <Box component="span" sx={{ fontWeight: 700 }}>{preview.total_reviewer}</Box> reviewer dan{" "}
                  <Box component="span" sx={{ fontWeight: 700 }}>{preview.total_juri}</Box> juri →{" "}
                  <Box component="span" sx={{ fontWeight: 700 }}>{preview.jumlah_pasang}</Box> pasang unik.
                </>
              )}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#374151" }}>
              Proposal sudah berpasangan:{" "}
              <Box component="span" sx={{ fontWeight: 700, color: COLORS.success }}>
                {preview.sudah_terdistribusi}
              </Box>
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#374151" }}>
              Proposal sisa untuk didistribusikan:{" "}
              <Box
                component="span"
                sx={{
                  fontWeight: 700,
                  color: preview.belum_terdistribusi > 0 ? COLORS.error : COLORS.success,
                }}
              >
                {preview.belum_terdistribusi}
              </Box>
            </Typography>
          </Box>
        </Paper>

        {preview.detail_sudah && preview.detail_sudah.length > 0 && (
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORS.success, mb: 1.5 }}>
              Sudah Berpasangan ({preview.detail_sudah.length})
            </Typography>
            <TableContainer
              sx={{
                borderRadius: "16px",
                border: `1.5px solid ${COLORS.slateLight}`,
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                overflow: "auto",
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...tableHeadCell, fontSize: 12 }}>PROPOSAL</TableCell>
                    <TableCell sx={{ ...tableHeadCell, fontSize: 12 }}>KATEGORI</TableCell>
                    <TableCell sx={{ ...tableHeadCell, fontSize: 12 }}>{tahap === 1 ? "REVIEWER 1" : "REVIEWER"}</TableCell>
                    <TableCell sx={{ ...tableHeadCell, fontSize: 12 }}>{tahap === 1 ? "REVIEWER 2" : "JURI"}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    const list = preview.detail_sudah || [];
                    const start = (pageDetail - 1) * rowsPerPage;
                    const paginated = list.slice(start, start + rowsPerPage);
                    return paginated.map((item) => (
                      <TableRow key={item.id_proposal} sx={tableBodyRow}>
                        <TableCell>
                          <Typography sx={{ fontSize: 12, maxWidth: 250 }}>{item.judul}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12 }}>{item.nama_kategori || item.kategori || "-"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12, fontWeight: 500 }}>
                            {item.reviewer1?.nama_lengkap || item.reviewer?.nama_lengkap || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12, fontWeight: 500 }}>
                            {item.reviewer2?.nama_lengkap || item.juri?.nama_lengkap || "-"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Pagination
                count={Math.max(1, Math.ceil((preview.detail_sudah || []).length / rowsPerPage))}
                page={pageDetail}
                onChange={(e, v) => setPageDetail(v)}
                color="primary"
                shape="rounded"
              />
            </Box>
          </Box>
        )}

        {preview.rencana_distribusi && preview.rencana_distribusi.length > 0 && (
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: COLORS.warning, mb: 1.5 }}>
              Akan Didistribusikan ({preview.rencana_distribusi.length})
            </Typography>
            <TableContainer
              sx={{
                borderRadius: "16px",
                border: `1.5px solid #fde3c7`,
                backgroundColor: "#fff",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                overflow: "auto",
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#fff7ee" }}>
                    <TableCell sx={{ ...tableHeadCell, fontSize: 12, backgroundColor: "#fff7ee", borderBottom: `2px solid #fde3c7` }}>
                      PROPOSAL
                    </TableCell>
                    <TableCell sx={{ ...tableHeadCell, fontSize: 12, backgroundColor: "#fff7ee", borderBottom: `2px solid #fde3c7` }}>
                      KATEGORI
                    </TableCell>
                    <TableCell sx={{ ...tableHeadCell, fontSize: 12, backgroundColor: "#fff7ee", borderBottom: `2px solid #fde3c7` }}>
                      {tahap === 1 ? "REVIEWER 1" : "REVIEWER"}
                    </TableCell>
                    <TableCell sx={{ ...tableHeadCell, fontSize: 12, backgroundColor: "#fff7ee", borderBottom: `2px solid #fde3c7` }}>
                      {tahap === 1 ? "REVIEWER 2" : "JURI"}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    const list = preview.rencana_distribusi || [];
                    const start = (pageRencana - 1) * rowsPerPage;
                    const paginated = list.slice(start, start + rowsPerPage);
                    return paginated.map((item) => (
                      <TableRow key={item.id_proposal} sx={tableBodyRow}>
                        <TableCell>
                          <Typography sx={{ fontSize: 12, maxWidth: 250 }}>{item.judul}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12 }}>{item.nama_kategori || item.kategori || "-"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12, fontWeight: 500 }}>
                            {item.reviewer1?.nama_lengkap || item.reviewer?.nama_lengkap || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 12, fontWeight: 500 }}>
                            {item.reviewer2?.nama_lengkap || item.juri?.nama_lengkap || "-"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Pagination
                count={Math.max(1, Math.ceil((preview.rencana_distribusi || []).length / rowsPerPage))}
                page={pageRencana}
                onChange={(e, v) => setPageRencana(v)}
                color="primary"
                shape="rounded"
              />
            </Box>
          </Box>
        )}

        {semuaSudahTerdistribusi && (
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: "16px",
              backgroundColor: COLORS.successLight,
              border: `1.5px solid #6EE7B7`,
              textAlign: "center",
            }}
          >
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: COLORS.success }}>
              ✓ Semua proposal sudah memiliki pasangan penilai lengkap
            </Typography>
          </Paper>
        )}
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          justifyContent: { xs: "stretch", sm: "flex-end" },
          flexDirection: { xs: "column", sm: "row" },
          mt: 3,
        }}
      >
        <Button
          variant="outlined"
          onClick={fetchPreview}
          disabled={executing}
          sx={{
            textTransform: "none",
            borderRadius: "50px",
            fontWeight: 600,
            px: 3,
            width: { xs: "100%", sm: "auto" },
            whiteSpace: "nowrap",
            borderColor: COLORS.primary,
            color: COLORS.primary,
            "&:hover": { backgroundColor: "#f0f4ff" },
          }}
        >
          Refresh Preview
        </Button>
        <Button
          variant="contained"
          onClick={handleExecute}
          disabled={executing || semuaSudahTerdistribusi}
          sx={{
            textTransform: "none",
            borderRadius: "50px",
            fontWeight: 700,
            px: 3,
            width: { xs: "100%", sm: "auto" },
            whiteSpace: "nowrap",
            backgroundColor: COLORS.primary,
            "&:hover": { backgroundColor: "#0a47c4" },
            "&:disabled": { backgroundColor: "#ccc" },
          }}
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