import { useState, useEffect, useCallback, Fragment } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, Button, Chip, CircularProgress, Pagination, TextField, MenuItem,
  IconButton, Collapse, Paper,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowRight } from "@mui/icons-material";
import Swal from "sweetalert2";
import { getListProposalRekapTahap1, finalisasiDeskBatch, getRekapDesk } from "../../api/admin";

const tableHeadCell = { fontWeight: 700, fontSize: 13, color: "#000", backgroundColor: "#fafafa", borderBottom: "2px solid #f0f0f0", py: 2 };
const tableBodyRow = { "& td": { borderBottom: "1px solid #f5f5f5", py: 2 } };
const roundedField = { "& .MuiOutlinedInput-root": { borderRadius: "15px" } };
const ROWS_PER_PAGE = 10;

const getStatusInfo = (status, totalReviewer, totalSubmit) => {
  if (status === 3) return { text: "Tidak Lolos Desk", color: "error" };
  if (status === 4) return { text: "Lolos Desk", color: "success" };
  if (status === 2) return totalSubmit === totalReviewer && totalReviewer > 0 ? { text: "Menunggu Finalisasi", color: "warning" } : { text: "Sedang Dinilai", color: "info" };
  return { text: "Unknown", color: "default" };
};

const formatDate = (d) => (!d ? "-" : new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }));
const getKey = (id) => `1-${id}`;

function ReviewerCard({ data }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.25, mb: 2, borderRadius: "12px" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{data.reviewer?.nama || data.user?.nama || "Reviewer"}</Typography>
        <Typography sx={{ fontSize: 12, color: "#888" }}>Submit: {formatDate(data.submitted_at)}</Typography>
      </Box>
      <TableContainer sx={{ borderRadius: "8px", border: "1px solid #f0f0f0" }}>
        <Table size="small">
          <TableHead><TableRow><TableCell sx={tableHeadCell}>Kriteria</TableCell><TableCell sx={{ ...tableHeadCell, textAlign: "center", width: 80 }}>Bobot</TableCell><TableCell sx={{ ...tableHeadCell, textAlign: "center", width: 80 }}>Skor</TableCell><TableCell sx={{ ...tableHeadCell, textAlign: "right", width: 120 }}>Nilai</TableCell></TableRow></TableHead>
          <TableBody>
            {(data.detail || []).map((d) => (
              <TableRow key={d.id_kriteria} sx={tableBodyRow} hover>
                <TableCell><Typography sx={{ fontSize: 13 }}>{d.nama_kriteria}</Typography>{d.catatan && <Typography sx={{ fontSize: 11, color: "#888", fontStyle: "italic" }}>Catatan: {d.catatan}</Typography>}</TableCell>
                <TableCell sx={{ textAlign: "center" }}><Typography sx={{ fontSize: 13 }}>{d.bobot}</Typography></TableCell>
                <TableCell sx={{ textAlign: "center" }}><Typography sx={{ fontSize: 13 }}>{d.skor}</Typography></TableCell>
                <TableCell sx={{ textAlign: "right" }}><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{d.nilai}</Typography></TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ backgroundColor: "#e3f2fd" }}><TableCell colSpan={3} sx={{ fontWeight: 700, textAlign: "right", fontSize: 13 }}>TOTAL</TableCell><TableCell sx={{ fontWeight: 700, textAlign: "right", color: "#0D59F2", fontSize: 15 }}>{data.total_nilai}</TableCell></TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function EmptyInfo({ text }) { return <Box sx={{ px: 2.5, py: 2, mb: 2, minHeight: 56, display: "flex", alignItems: "center", backgroundColor: "#e3f2fd", borderRadius: "12px" }}><Typography sx={{ fontSize: 13, color: "#1565c0", lineHeight: 1.4 }}>{text}</Typography></Box>; }

export default function RekapTahap1Tab({ id_program }) {
  const [loading, setLoading] = useState(true);
  const [proposalList, setProposalList] = useState([]);
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [kategoriFilter, setKategoriFilter] = useState("");
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [detailMap, setDetailMap] = useState({});
  const [loadingKeys, setLoadingKeys] = useState([]);

  const fetchProposals = useCallback(async () => { try { setLoading(true); const res = await getListProposalRekapTahap1(id_program); setProposalList(res.data || []); } catch { Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat data proposal", confirmButtonColor: "#0D59F2" }); } finally { setLoading(false); } }, [id_program]);
  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  const kategoriOptions = Array.from(new Set(proposalList.map((p) => p.nama_kategori || "").filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const filteredList = kategoriFilter === "" ? proposalList : proposalList.filter((p) => (p.nama_kategori || "") === kategoriFilter);
  const finalisableProposals = filteredList.filter((p) => p.status === 2 && p.total_submit === p.total_reviewer && p.total_reviewer > 0);
  const isAllSelected = finalisableProposals.length > 0 && finalisableProposals.every((p) => selected.includes(p.id_proposal));
  const isIndeterminate = selected.length > 0 && !isAllSelected;
  const totalPages = Math.ceil(filteredList.length / ROWS_PER_PAGE);
  const paginated = filteredList.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  useEffect(() => { setPage(1); setSelected([]); }, [kategoriFilter]);

  const handleSelectAll = (e) => setSelected(e.target.checked ? finalisableProposals.map((p) => p.id_proposal) : []);
  const handleSelectOne = (id) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleFinalisasi = async (isLolos) => {
    if (selected.length === 0) return;
    const label = isLolos ? "Lolos Desk" : "Tidak Lolos Desk";
    const result = await Swal.fire({ title: "Konfirmasi Finalisasi", html: `<b>${selected.length} proposal</b> akan difinalisasi sebagai <b>${label}</b>.<br/><br/>Tindakan ini tidak dapat dibatalkan.`, icon: "warning", showCancelButton: true, confirmButtonColor: isLolos ? "#0D59F2" : "#d33", cancelButtonColor: "#666", confirmButtonText: "Ya, Finalisasi", cancelButtonText: "Batal" });
    if (!result.isConfirmed) return;
    try { setSubmitting(true); await finalisasiDeskBatch(id_program, isLolos ? { lolos: selected, tidak_lolos: [] } : { lolos: [], tidak_lolos: selected }); await Swal.fire({ icon: "success", title: "Berhasil", text: "Finalisasi berhasil", timer: 2000, timerProgressBar: true, showConfirmButton: false }); setSelected([]); fetchProposals(); } catch (err) { Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal melakukan finalisasi", confirmButtonColor: "#0D59F2" }); } finally { setSubmitting(false); }
  };

  const toggleExpand = async (proposal) => {
    const key = getKey(proposal.id_proposal);
    setExpandedKeys((prev) => prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]);
    if (detailMap[key]) return;
    try { setLoadingKeys((prev) => (prev.includes(key) ? prev : [...prev, key])); const res = await getRekapDesk(id_program, proposal.id_proposal); setDetailMap((prev) => ({ ...prev, [key]: res.data || null })); } catch { setDetailMap((prev) => ({ ...prev, [key]: null })); } finally { setLoadingKeys((prev) => prev.filter((x) => x !== key)); }
  };

  const renderExpanded = (proposal) => {
    const key = getKey(proposal.id_proposal);
    const detail = detailMap[key];
    if (loadingKeys.includes(key)) return <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}><CircularProgress size={24} /></Box>;
    if (!detail) return <EmptyInfo text="Belum ada detail rekap untuk proposal ini" />;
    return <Box sx={{ mt: 2 }}><Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>Penilaian Reviewer</Typography>{detail.reviewer && detail.reviewer.length > 0 ? detail.reviewer.map((r) => <ReviewerCard key={r.reviewer?.id_user || r.user?.id_user} data={r} />) : <EmptyInfo text="Belum ada penilaian reviewer yang disubmit" />}</Box>;
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2, flexWrap: "wrap" }}>
        <TextField select size="small" label="Kategori" value={kategoriFilter} onChange={(e) => setKategoriFilter(e.target.value)} sx={{ ...roundedField, minWidth: 220 }}>
          <MenuItem value="">Semua Kategori</MenuItem>{kategoriOptions.map((k) => <MenuItem key={k} value={k}>{k}</MenuItem>)}
        </TextField>
        <Typography sx={{ fontSize: 14, color: "#555" }}>{selected.length > 0 ? `${selected.length} proposal terpilih` : `Total ${filteredList.length} proposal`}</Typography>
        <Box sx={{ display: "flex", gap: 1.5 }}><Button variant="outlined" color="error" onClick={() => handleFinalisasi(false)} disabled={selected.length === 0 || submitting} sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600 }}>Finalisasi Tidak Lolos</Button><Button variant="contained" onClick={() => handleFinalisasi(true)} disabled={selected.length === 0 || submitting} sx={{ textTransform: "none", borderRadius: "50px", px: 3, fontWeight: 600, backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" } }}>Finalisasi Lolos</Button></Box>
      </Box>

      {loading ? <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box> : filteredList.length === 0 ? <Box sx={{ textAlign: "center", py: 8 }}><Typography sx={{ fontSize: 14, color: "#999" }}>Belum ada proposal untuk tahap desk evaluasi</Typography></Box> : (
        <>
          <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "auto" }}>
            <Table>
              <TableHead><TableRow><TableCell padding="checkbox" sx={{ ...tableHeadCell }}><Checkbox checked={isAllSelected} indeterminate={isIndeterminate} onChange={handleSelectAll} /></TableCell><TableCell sx={tableHeadCell}>Judul Proposal</TableCell><TableCell sx={tableHeadCell}>Tim</TableCell><TableCell sx={tableHeadCell}>Kategori</TableCell><TableCell sx={tableHeadCell}>Penilaian Submit</TableCell><TableCell sx={tableHeadCell}>Status</TableCell><TableCell sx={{ ...tableHeadCell, textAlign: "right", width: 110 }} /></TableRow></TableHead>
              <TableBody>
                {paginated.map((p) => {
                  const statusInfo = getStatusInfo(p.status, p.total_reviewer, p.total_submit);
                  const isFinalisable = p.status === 2 && p.total_submit === p.total_reviewer && p.total_reviewer > 0;
                  const isSelected = selected.includes(p.id_proposal);
                  const key = getKey(p.id_proposal);
                  return (
                    <Fragment key={key}>
                      <TableRow sx={{ ...tableBodyRow, cursor: "pointer" }} hover selected={isSelected} onClick={() => toggleExpand(p)}>
                        <TableCell padding="checkbox"><Checkbox checked={isSelected} disabled={!isFinalisable} onChange={(e) => { e.stopPropagation(); handleSelectOne(p.id_proposal); }} /></TableCell>
                        <TableCell><Typography sx={{ fontWeight: 600, fontSize: 13, maxWidth: 280 }}>{p.judul}</Typography></TableCell>
                        <TableCell><Typography sx={{ fontSize: 13 }}>{p.nama_tim}</Typography></TableCell>
                        <TableCell><Typography sx={{ fontSize: 13 }}>{p.nama_kategori || "-"}</Typography></TableCell>
                        <TableCell><Chip label={`${p.total_submit} / ${p.total_reviewer}`} size="small" color={p.total_submit === p.total_reviewer ? "success" : "default"} /></TableCell>
                        <TableCell><Chip label={statusInfo.text} color={statusInfo.color} size="small" /></TableCell>
                        <TableCell sx={{ textAlign: "right" }}><Button size="small" variant="text" endIcon={expandedKeys.includes(key) ? <KeyboardArrowDown /> : <KeyboardArrowRight />} onClick={(e) => { e.stopPropagation(); toggleExpand(p); }} sx={{ textTransform: "none", fontWeight: 600, color: "#0D59F2" }}>Detail</Button></TableCell>
                      </TableRow>
                      <TableRow><TableCell sx={{ py: 0, borderBottom: expandedKeys.includes(key) ? "1px solid #f5f5f5" : 0 }} colSpan={7}><Collapse in={expandedKeys.includes(key)} timeout="auto" unmountOnExit><Box sx={{ px: 2, pt: 2, pb: 2 }}>{renderExpanded(p)}</Box></Collapse></TableCell></TableRow>
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}><Typography sx={{ fontSize: 13, color: "#777" }}>Menampilkan {Math.min((page - 1) * ROWS_PER_PAGE + 1, filteredList.length)}–{Math.min(page * ROWS_PER_PAGE, filteredList.length)} dari {filteredList.length} data</Typography><Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" showFirstButton showLastButton /></Box>
        </>
      )}
    </Box>
  );
}