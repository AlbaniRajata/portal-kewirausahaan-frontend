import { useState, useEffect, useCallback, Fragment } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, Button, Collapse, Paper,
  Pagination, TextField, MenuItem,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowRight } from "@mui/icons-material";
import Swal from "sweetalert2";
import {
  getHistoryPenilaianTahap1,
  getHistoryPenilaianTahap2,
  getHistoryDetailTahap1,
  getHistoryDetailTahap2,
} from "../../api/admin";

const tableHeadCell = {
  fontWeight: 700,
  fontSize: 13,
  color: "#000",
  backgroundColor: "#fafafa",
  borderBottom: "2px solid #f0f0f0",
  py: 2,
};

const tableBodyRow = { "& td": { borderBottom: "1px solid #f5f5f5", py: 2 } };
const roundedField = { "& .MuiOutlinedInput-root": { borderRadius: "15px" } };
const ROWS_PER_PAGE = 10;

const STATUS_MAP = {
  2: { label: "Review Tahap 1", backgroundColor: "#3949ab" },
  3: { label: "Tidak Lolos Desk", backgroundColor: "#c62828" },
  4: { label: "Lolos Desk", backgroundColor: "#2e7d32" },
  5: { label: "Panel Wawancara", backgroundColor: "#f57f17" },
  6: { label: "Tidak Lolos Wawancara", backgroundColor: "#c62828" },
  7: { label: "Lolos Wawancara", backgroundColor: "#2e7d32" },
  8: { label: "Pembimbing Diajukan", backgroundColor: "#1565c0" },
  9: { label: "Pembimbing Disetujui", backgroundColor: "#0891b2" },
};

const StatusPill = ({ status }) => {
  const cfg = STATUS_MAP[status] || { label: `Status ${status}`, backgroundColor: "#666" };
  return (
    <Box sx={{
      display: "inline-flex",
      alignItems: "center",
      px: 1.5,
      py: 0.4,
      borderRadius: "50px",
      backgroundColor: cfg.backgroundColor,
      color: "#fff",
      fontSize: 12,
      fontWeight: 700,
      whiteSpace: "nowrap",
    }}>
      {cfg.label}
    </Box>
  );
};

const formatDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getProposalKey = (tahap, proposalId) => `${tahap}-${proposalId}`;

const getTahap1Nilai = (item) => {
  return item.rata_rata_nilai ?? item.total_nilai ?? item.nilai ?? item.nilai_akhir ?? item.rata_rata_reviewer ?? "-";
};

function ReviewerCard({ data }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.25, mb: 2, borderRadius: "12px" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
          {data.reviewer?.nama || data.user?.nama || "Reviewer"}
        </Typography>
        <Typography sx={{ fontSize: 12, color: "#888" }}>
          Submit: {formatDate(data.submitted_at)}
        </Typography>
      </Box>
      <TableContainer sx={{ borderRadius: "8px", border: "1px solid #f0f0f0" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={tableHeadCell}>Kriteria</TableCell>
              <TableCell sx={{ ...tableHeadCell, textAlign: "center", width: 80 }}>Bobot</TableCell>
              <TableCell sx={{ ...tableHeadCell, textAlign: "center", width: 80 }}>Skor</TableCell>
              <TableCell sx={{ ...tableHeadCell, textAlign: "right", width: 120 }}>Nilai</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data.detail || []).map((d) => (
              <TableRow key={d.id_kriteria} sx={tableBodyRow} hover>
                <TableCell>
                  <Typography sx={{ fontSize: 13 }}>{d.nama_kriteria}</Typography>
                  {d.catatan && (
                    <Typography sx={{ fontSize: 11, color: "#888", fontStyle: "italic" }}>
                      Catatan: {d.catatan}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ textAlign: "center" }}><Typography sx={{ fontSize: 13 }}>{d.bobot}</Typography></TableCell>
                <TableCell sx={{ textAlign: "center" }}><Typography sx={{ fontSize: 13 }}>{d.skor}</Typography></TableCell>
                <TableCell sx={{ textAlign: "right" }}><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{d.nilai}</Typography></TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ backgroundColor: "#e3f2fd" }}>
              <TableCell colSpan={3} sx={{ fontWeight: 700, textAlign: "right", fontSize: 13 }}>TOTAL</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: "right", color: "#0D59F2", fontSize: 15 }}>
                {data.total_nilai}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function EmptyInfo({ text }) {
  return (
    <Box sx={{ px: 2.5, py: 2, mb: 2, minHeight: 56, display: "flex", alignItems: "center", backgroundColor: "#e3f2fd", borderRadius: "12px" }}>
      <Typography sx={{ fontSize: 13, color: "#1565c0", lineHeight: 1.4 }}>{text}</Typography>
    </Box>
  );
}

function StageSection({
  tahap,
  title,
  list,
  kategoriFilter,
  tahunFilter,
  expandedKeys,
  setExpandedKeys,
  detailMap,
  setDetailMap,
  loadingKeys,
  setLoadingKeys,
  page,
  setPage,
  id_program,
}) {
  const filteredByKategori = kategoriFilter === ""
    ? list
    : list.filter((item) => (item.nama_kategori || "") === kategoriFilter);

  const filteredList = tahunFilter === ""
    ? filteredByKategori
    : filteredByKategori.filter((item) => {
      const dateValue = item.tanggal_finalisasi || item.updated_at || item.created_at;
      if (!dateValue) return false;
      return String(new Date(dateValue).getFullYear()) === tahunFilter;
    });

  const totalPages = Math.ceil(filteredList.length / ROWS_PER_PAGE);
  const paginated = filteredList.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const isExpanded = (proposalId) => expandedKeys.includes(getProposalKey(tahap, proposalId));

  const toggleExpand = async (proposal) => {
    const key = getProposalKey(tahap, proposal.id_proposal);
    setExpandedKeys((prev) => (
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    ));

    if (detailMap[key]) return;

    try {
      setLoadingKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
      const res = tahap === 1
        ? await getHistoryDetailTahap1(id_program, proposal.id_proposal)
        : await getHistoryDetailTahap2(id_program, proposal.id_proposal);
      setDetailMap((prev) => ({ ...prev, [key]: res.data || null }));
    } catch {
      setDetailMap((prev) => ({ ...prev, [key]: null }));
    } finally {
      setLoadingKeys((prev) => prev.filter((item) => item !== key));
    }
  };

  const renderExpandedContent = (proposal) => {
    const key = getProposalKey(tahap, proposal.id_proposal);
    const detail = detailMap[key];

    if (loadingKeys.includes(key)) {
      return <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}><CircularProgress size={24} /></Box>;
    }

    if (!detail) return <EmptyInfo text="Belum ada detail rekap untuk proposal ini" />;

    if (tahap === 1) {
      return (
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>Penilaian Reviewer</Typography>
          {detail.reviewer && detail.reviewer.length > 0 ? (
            detail.reviewer.map((r) => <ReviewerCard key={r.reviewer?.id_user || r.user?.id_user} data={r} />)
          ) : (
            <EmptyInfo text="Belum ada penilaian reviewer yang disubmit" />
          )}
        </Box>
      );
    }

    return (
      <Box sx={{ mt: 2 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>Panel Reviewer</Typography>
        {detail.reviewer_panel && detail.reviewer_panel.length > 0 ? (
          detail.reviewer_panel.map((r) => <ReviewerCard key={r.user?.id_user} data={r} />)
        ) : (
          <EmptyInfo text="Belum ada penilaian reviewer yang disubmit" />
        )}

        <Box sx={{ height: 16 }} />

        <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>Panel Juri</Typography>
        {detail.juri_panel && detail.juri_panel.length > 0 ? (
          detail.juri_panel.map((j) => <ReviewerCard key={j.user?.id_user} data={j} />)
        ) : (
          <EmptyInfo text="Belum ada penilaian juri yang disubmit" />
        )}

        <Paper variant="outlined" sx={{ p: 3, backgroundColor: "#f8f9ff", borderRadius: "12px", mt: 2 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2.5 }}>Ringkasan Panel</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            {[
              { label: "Total Reviewer", value: detail.total_reviewer ?? 0, bg: "#e3f2fd", color: "#0D59F2" },
              { label: "Total Juri", value: detail.total_juri ?? 0, bg: "#e8f5e9", color: "#2e7d32" },
            ].map((item) => (
              <Box key={item.label} sx={{ textAlign: "center", p: 2.5, backgroundColor: item.bg, borderRadius: "12px" }}>
                <Typography sx={{ fontSize: 12, color: "#666", mb: 0.5 }}>{item.label}</Typography>
                <Typography sx={{ fontSize: 26, fontWeight: 700, color: item.color }}>{item.value}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    );
  };

  return (
    <Box>
      <Typography sx={{ fontSize: 18, fontWeight: 700, mb: 2 }}>{title}</Typography>
      <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={tableHeadCell}>Judul Proposal</TableCell>
              <TableCell sx={tableHeadCell}>Tim</TableCell>
              <TableCell sx={tableHeadCell}>Kategori</TableCell>
              {tahap === 1 && (
                <TableCell sx={tableHeadCell}>Total Nilai</TableCell>
              )}
              {tahap === 2 && (
                <>
                  <TableCell sx={tableHeadCell}>Total Nilai Reviewer</TableCell>
                  <TableCell sx={tableHeadCell}>Total Nilai Juri</TableCell>
                </>
              )}
              <TableCell sx={tableHeadCell}>Tanggal Finalisasi</TableCell>
              <TableCell sx={tableHeadCell}>Status</TableCell>
              <TableCell sx={{ ...tableHeadCell, textAlign: "right", width: 56 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={tahap === 1 ? 6 : 7} sx={{ textAlign: "center", py: 6 }}>
                  <Typography sx={{ fontSize: 14, color: "#999" }}>Belum ada data pada kategori ini</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((p) => {
                const key = getProposalKey(tahap, p.id_proposal);
                return (
                  <Fragment key={key}>
                    <TableRow sx={{ ...tableBodyRow, cursor: "pointer" }} hover onClick={() => toggleExpand(p)}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: 13, maxWidth: 260 }}>{p.judul}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13 }}>{p.nama_tim}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: 13 }}>{p.nama_kategori || "-"}</Typography>
                      </TableCell>

                      {tahap === 1 && (
                        <TableCell>
                          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0D59F2" }}>{getTahap1Nilai(p)}</Typography>
                        </TableCell>
                      )}

                      {tahap === 2 && (
                        <>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#1565c0" }}>{p.rata_rata_reviewer ?? "-"}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#2e7d32" }}>{p.rata_rata_juri ?? "-"}</Typography>
                          </TableCell>
                        </>
                      )}

                      <TableCell>
                        <Typography sx={{ fontSize: 13 }}>{formatDate(p.tanggal_finalisasi)}</Typography>
                      </TableCell>
                      <TableCell>
                        <StatusPill status={p.status_proposal} />
                      </TableCell>
                      <TableCell sx={{ textAlign: "right" }}>
                        <Button
                          size="small"
                          variant="text"
                          endIcon={isExpanded(p.id_proposal) ? <KeyboardArrowDown /> : <KeyboardArrowRight />}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(p);
                          }}
                          sx={{ textTransform: "none", fontWeight: 600, color: "#0D59F2" }}
                        >
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ py: 0, borderBottom: isExpanded(p.id_proposal) ? "1px solid #f5f5f5" : 0 }} colSpan={tahap === 1 ? 6 : 7}>
                        <Collapse in={isExpanded(p.id_proposal)} timeout="auto" unmountOnExit>
                          <Box sx={{ px: 2, pt: 2, pb: 2 }}>
                            {renderExpandedContent(p)}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
        <Typography sx={{ fontSize: 13, color: "#777" }}>
          Menampilkan {Math.min((page - 1) * ROWS_PER_PAGE + 1, filteredList.length)}–{Math.min(page * ROWS_PER_PAGE, filteredList.length)} dari {filteredList.length} data
        </Typography>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, v) => setPage(v)}
          color="primary"
          shape="rounded"
          showFirstButton
          showLastButton
        />
      </Box>
    </Box>
  );
}

export default function HistoryPenilaianTab({ id_program }) {
  const [loading, setLoading] = useState(true);
  const [listTahap1, setListTahap1] = useState([]);
  const [listTahap2, setListTahap2] = useState([]);
  const [kategoriFilter, setKategoriFilter] = useState("");
  const [tahunFilter, setTahunFilter] = useState("");
  const [pageMap, setPageMap] = useState({ 1: 1, 2: 1 });
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [detailMap, setDetailMap] = useState({});
  const [loadingKeys, setLoadingKeys] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [res1, res2] = await Promise.all([
        getHistoryPenilaianTahap1(id_program),
        getHistoryPenilaianTahap2(id_program),
      ]);
      setListTahap1(res1.data || []);
      setListTahap2(res2.data || []);
      setPageMap({ 1: 1, 2: 1 });
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat history penilaian", confirmButtonColor: "#0D59F2" });
    } finally {
      setLoading(false);
    }
  }, [id_program]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const kategoriOptions = Array.from(new Set(
    [...listTahap1, ...listTahap2]
      .map((item) => item.nama_kategori || "")
      .filter(Boolean)
  )).sort((a, b) => a.localeCompare(b));

  const tahunOptions = Array.from(new Set(
    [...listTahap1, ...listTahap2]
      .map((item) => item.tanggal_finalisasi || item.updated_at || item.created_at)
      .filter(Boolean)
      .map((value) => String(new Date(value).getFullYear()))
  )).sort((a, b) => Number(b) - Number(a));

  useEffect(() => {
    setPageMap({ 1: 1, 2: 1 });
  }, [kategoriFilter, tahunFilter]);

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  }

  if (listTahap1.length === 0 && listTahap2.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography sx={{ fontSize: 14, color: "#999" }}>
          Belum ada history penilaian
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <TextField
            select size="small" label="Kategori"
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value)}
            sx={{ ...roundedField, minWidth: 220 }}
          >
            <MenuItem value="">Semua Kategori</MenuItem>
            {kategoriOptions.map((kategori) => (
              <MenuItem key={kategori} value={kategori}>{kategori}</MenuItem>
            ))}
          </TextField>

          <TextField
            select size="small" label="Tahun"
            value={tahunFilter}
            onChange={(e) => setTahunFilter(e.target.value)}
            sx={{ ...roundedField, minWidth: 160 }}
          >
            <MenuItem value="">Semua Tahun</MenuItem>
            {tahunOptions.map((tahun) => (
              <MenuItem key={tahun} value={tahun}>{tahun}</MenuItem>
            ))}
          </TextField>
        </Box>
        <Typography sx={{ fontSize: 13, color: "#777" }}>
          History Penilaian per tahap
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: "16px", borderColor: "#eceff1", mb: 3 }}>
        <StageSection
          tahap={1}
          title="Tahap 1 — Desk Evaluasi"
          list={listTahap1}
          kategoriFilter={kategoriFilter}
          tahunFilter={tahunFilter}
          expandedKeys={expandedKeys}
          setExpandedKeys={setExpandedKeys}
          detailMap={detailMap}
          setDetailMap={setDetailMap}
          loadingKeys={loadingKeys}
          setLoadingKeys={setLoadingKeys}
          page={pageMap[1] || 1}
          setPage={(v) => setPageMap((prev) => ({ ...prev, 1: v }))}
          id_program={id_program}
        />
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: "16px", borderColor: "#eceff1" }}>
        <StageSection
          tahap={2}
          title="Tahap 2 — Wawancara"
          list={listTahap2}
          kategoriFilter={kategoriFilter}
          tahunFilter={tahunFilter}
          expandedKeys={expandedKeys}
          setExpandedKeys={setExpandedKeys}
          detailMap={detailMap}
          setDetailMap={setDetailMap}
          loadingKeys={loadingKeys}
          setLoadingKeys={setLoadingKeys}
          page={pageMap[2] || 1}
          setPage={(v) => setPageMap((prev) => ({ ...prev, 2: v }))}
          id_program={id_program}
        />
      </Paper>
    </Box>
  );
}