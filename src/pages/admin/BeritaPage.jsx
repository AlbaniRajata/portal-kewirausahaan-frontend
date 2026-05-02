import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button,
  TextField, MenuItem, Pagination, InputAdornment, Avatar,
} from "@mui/material";
import { Search, Newspaper } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import { getBeritaListAdmin, deleteBerita } from "../../api/admin";

const COLORS = {
  primary:      "#0D59F2",
  primaryLight: "#E0F2FE",
  primaryDark:  "#0369A1",
  primaryMuted: "#93C5FD",
  secondary:    "#2563EB",
  accent:       "#3B82F6",
  slate:        "#64748B",
  slateLight:   "#F1F5F9",
  warning:      "#D97706",
  warningLight: "#FFFBEB",
  error:        "#DC2626",
  success:      "#059669",
  successLight: "#ECFDF5",
};

const roundedField = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "#fff",
    transition: "box-shadow 0.2s",
    "&:hover fieldset": { borderColor: COLORS.primary },
    "&.Mui-focused fieldset": { borderColor: COLORS.primary },
    "&.Mui-focused": { boxShadow: `0 0 0 3px ${COLORS.primaryLight}` },
  },
};

const tableHeadCell = {
  fontWeight: 700,
  fontSize: { xs: 11, sm: 12 },
  color: "#374151",
  backgroundColor: "#F8FAFC",
  borderBottom: `2px solid ${COLORS.primaryMuted}`,
  py: 2,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const tableBodyRow = {
  "& td": { borderBottom: `1px solid ${COLORS.slateLight}`, py: 2 },
  "&:hover": { backgroundColor: "#F8FAFC" },
};

const StatusPill = ({ label, backgroundColor }) => (
  <Box sx={{
    display: "inline-flex", alignItems: "center",
    px: 1.5, py: 0.4, borderRadius: "50px",
    backgroundColor, color: "#fff", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
  }}>
    {label}
  </Box>
);

const formatDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};

export default function BeritaPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "", tahun: "" });
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getBeritaListAdmin(filters);
      setList(res.data || []);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat daftar berita", confirmButtonColor: "#0D59F2" });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); setPage(1); }, [fetchData]);

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: "Hapus Berita?",
      html: `Berita <b>${item.judul}</b> akan dihapus permanen.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33", cancelButtonColor: "#666",
      confirmButtonText: "Ya, Hapus", cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteBerita(item.id_berita);
      await Swal.fire({ icon: "success", title: "Berhasil", text: "Berita berhasil dihapus", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      fetchData();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Gagal", text: err.response?.data?.message || "Gagal menghapus berita", confirmButtonColor: "#0D59F2" });
    }
  };

  const tahunOptions = Array.from(new Set(
    list
      .map((item) => {
        if (!item.created_at) return null;
        const year = new Date(item.created_at).getFullYear();
        return Number.isNaN(year) ? null : year;
      })
      .filter(Boolean)
  )).sort((a, b) => b - a);

  const filteredList = filters.tahun === ""
    ? list
    : list.filter((item) => item.created_at && new Date(item.created_at).getFullYear() === Number(filters.tahun));

  const totalPages = Math.ceil(filteredList.length / rowsPerPage);
  const paginatedList = filteredList.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box sx={{ px: 1, py: 1 }}>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: { xs: 26, sm: 32, md: 36 }, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>Berita</Typography>
            <Typography sx={{ fontSize: { xs: 14, sm: 16 }, color: "#6B7280" }}>Kelola berita dan pengumuman yang tampil di halaman publik</Typography>
          </Box>

          <Paper sx={{
            borderRadius: "20px",
            border: "1.5px solid #E5E7EB",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          }}>
            <Box sx={{ height: 4, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
            <Box sx={{ p: { xs: 2.5, sm: 3.5 }, borderBottom: `1.5px solid ${COLORS.slateLight}`, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
              <TextField
                size="small" placeholder="Cari judul berita..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: "#9CA3AF" }} /></InputAdornment> }}
                sx={{ ...roundedField, minWidth: 240, flex: "1 1 240px" }}
              />
              <TextField
                select size="small"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (v) => (
                    <span style={{ fontSize: 14, color: !v ? "#9CA3AF" : "inherit" }}>
                      {!v ? "Semua Status" : (v === "1" ? "Published" : "Draft")}
                    </span>
                  ),
                }}
                sx={{ ...roundedField, width: { xs: "100%", sm: "auto" }, minWidth: { sm: 160 } }}
              >
                <MenuItem value="" sx={{ fontSize: 13 }}>Semua Status</MenuItem>
                <MenuItem value="0" sx={{ fontSize: 13 }}>Draft</MenuItem>
                <MenuItem value="1" sx={{ fontSize: 13 }}>Published</MenuItem>
              </TextField>
              <TextField
                select size="small"
                value={filters.tahun}
                onChange={(e) => setFilters({ ...filters, tahun: e.target.value })}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (v) => (
                    <span style={{ fontSize: 14, color: !v ? "#9CA3AF" : "inherit" }}>
                      {!v ? "Semua Tahun" : v}
                    </span>
                  ),
                }}
                sx={{ ...roundedField, width: { xs: "100%", sm: "auto" }, minWidth: { sm: 150 } }}
              >
                <MenuItem value="" sx={{ fontSize: 13 }}>Semua Tahun</MenuItem>
                {tahunOptions.map((tahun) => (
                  <MenuItem key={tahun} value={String(tahun)} sx={{ fontSize: 13 }}>{tahun}</MenuItem>
                ))}
              </TextField>
              <Box sx={{ flex: 1 }} />
              <Button
                variant="contained"
                onClick={() => navigate("/admin/berita/tambah")}
                sx={{
                  textTransform: "none", borderRadius: "12px", px: 3, py: 1.2, fontWeight: 700,
                  backgroundColor: COLORS.primary,
                  boxShadow: "0 4px 12px rgba(13,89,242,0.2)",
                  width: { xs: "100%", sm: "auto" },
                  whiteSpace: "nowrap",
                  "&:hover": { backgroundColor: COLORS.primaryDark, boxShadow: "0 6px 16px rgba(13,89,242,0.3)" },
                }}
              >
                Tambah Berita
              </Button>
            </Box>

            <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
              {loading ? (
                <Box sx={{ position: "relative", minHeight: 320 }}>
                  <LoadingScreen message="Memuat berita..." overlay minHeight="320px" />
                </Box>
              ) : paginatedList.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 10 }}>
                  <Box sx={{ width: 100, height: 100, borderRadius: "50%", backgroundColor: COLORS.slateLight, display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
                    <Newspaper sx={{ fontSize: 48, color: COLORS.primaryMuted }} />
                  </Box>
                  <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#1F2937", mb: 1 }}>Belum Ada Berita</Typography>
                  <Typography sx={{ fontSize: 14, color: COLORS.slate }}>Klik Tambah Berita untuk membuat berita pertama</Typography>
                </Box>
              ) : (
                <>
                  <TableContainer sx={{ borderRadius: "12px", border: `1.5px solid ${COLORS.slateLight}`, overflow: "auto", mb: 3 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          {["Gambar", "Judul", "Penulis", "Status", "Tanggal", "Aksi"].map((h, i) => (
                            <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 5 && { textAlign: "center" }) }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedList.map((item) => (
                          <TableRow key={item.id_berita} sx={tableBodyRow}>
                            <TableCell sx={{ width: 72 }}>
                              {item.file_gambar ? (
                                <Box
                                  component="img"
                                  src={`/uploads/berita/${item.file_gambar}`}
                                  alt={item.judul}
                                  sx={{ width: 56, height: 44, borderRadius: "8px", objectFit: "cover", display: "block" }}
                                />
                              ) : (
                                <Avatar variant="rounded" sx={{ width: 56, height: 44, borderRadius: "8px", backgroundColor: "#f0f0f0" }}>
                                  <Newspaper sx={{ color: "#ccc", fontSize: 22 }} />
                                </Avatar>
                              )}
                            </TableCell>
                            <TableCell sx={{ maxWidth: 320 }}>
                              <Typography sx={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.judul}</Typography>
                              <Typography sx={{ fontSize: 11, color: "#aaa" }}>/{item.slug}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13 }}>{item.nama_author || "-"}</Typography>
                            </TableCell>
                            <TableCell>
                              <StatusPill
                                label={item.status === 1 ? "Published" : "Draft"}
                                backgroundColor={item.status === 1 ? COLORS.success : COLORS.slate}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13, color: "#6B7280" }}>{formatDate(item.created_at)}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                                <Button size="small" variant="outlined"
                                  onClick={() => navigate(`/admin/berita/${item.id_berita}`)}
                                  sx={{ textTransform: "none", borderRadius: "12px", fontSize: 12, fontWeight: 600, color: COLORS.primary, borderColor: COLORS.primary, "&:hover": { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primaryDark } }}
                                >
                                  Edit
                                </Button>
                                <Button size="small" variant="outlined"
                                  onClick={() => handleDelete(item)}
                                  sx={{ textTransform: "none", borderRadius: "12px", fontSize: 12, fontWeight: 600, color: COLORS.error, borderColor: COLORS.error, "&:hover": { backgroundColor: "rgba(220,38,38,0.05)" } }}
                                >
                                  Hapus
                                </Button>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
                    <Typography sx={{ fontSize: 13, color: COLORS.slate, textAlign: { xs: "center", sm: "left" } }}>
                      Menampilkan {((page - 1) * rowsPerPage) + 1}–{Math.min(page * rowsPerPage, filteredList.length)} dari {filteredList.length} berita
                    </Typography>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={(e, v) => setPage(v)}
                      color="primary"
                      shape="rounded"
                      showFirstButton
                      showLastButton
                      size="small"
                    />
                  </Box>
                </>
              )}
            </Box>
          </Paper>
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}