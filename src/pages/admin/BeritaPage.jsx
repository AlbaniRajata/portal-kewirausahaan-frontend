import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, CircularProgress,
  TextField, MenuItem, Pagination, InputAdornment, Avatar,
} from "@mui/material";
import { Add, Edit, Delete, Search, Newspaper } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import { getBeritaListAdmin, deleteBerita } from "../../api/admin";

const BASE_URL = import.meta.env.VITE_API_URL.replace("/api", "");

const roundedField = { "& .MuiOutlinedInput-root": { borderRadius: "15px" } };

const tableHeadCell = {
  fontWeight: 700, fontSize: 13, color: "#000",
  backgroundColor: "#fafafa", borderBottom: "2px solid #f0f0f0", py: 2,
};

const tableBodyRow = { "& td": { borderBottom: "1px solid #f5f5f5", py: 2 } };

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
  const [filters, setFilters] = useState({ search: "", status: "" });
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

  const totalPages = Math.ceil(list.length / rowsPerPage);
  const paginatedList = list.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Berita</Typography>
          <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>Kelola berita dan pengumuman yang tampil di halaman publik</Typography>

          <Paper sx={{ borderRadius: "16px", border: "1px solid #f0f0f0", overflow: "hidden" }}>
            <Box sx={{ p: 3, borderBottom: "1px solid #f0f0f0", display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
              <TextField
                size="small" placeholder="Cari judul berita..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: "#aaa" }} /></InputAdornment> }}
                sx={{ ...roundedField, minWidth: 240, flex: "1 1 240px" }}
              />
              <TextField
                select size="small" label="Status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                InputLabelProps={{ shrink: true }}
                sx={{ ...roundedField, minWidth: 160 }}
              >
                <MenuItem value="">Semua Status</MenuItem>
                <MenuItem value="0">Draft</MenuItem>
                <MenuItem value="1">Published</MenuItem>
              </TextField>
              <Box sx={{ flex: 1 }} />
              <Button
                variant="contained"
                startIcon={<Add sx={{ fontSize: 14 }} />}
                onClick={() => navigate("/admin/berita/tambah")}
                sx={{ textTransform: "none", borderRadius: "50px", px: 3, py: 1.2, fontWeight: 600, backgroundColor: "#0D59F2", "&:hover": { backgroundColor: "#0a47c4" }, whiteSpace: "nowrap" }}
              >
                Tambah Berita
              </Button>
            </Box>

            <Box sx={{ p: 3 }}>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
              ) : paginatedList.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 10 }}>
                  <Box sx={{ width: 100, height: 100, borderRadius: "50%", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
                    <Newspaper sx={{ fontSize: 48, color: "#ccc" }} />
                  </Box>
                  <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#444", mb: 1 }}>Belum Ada Berita</Typography>
                  <Typography sx={{ fontSize: 14, color: "#999" }}>Klik Tambah Berita untuk membuat berita pertama</Typography>
                </Box>
              ) : (
                <>
                  <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0", overflow: "auto", mb: 3 }}>
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
                                  src={`${BASE_URL}/uploads/berita/${item.file_gambar}`}
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
                                backgroundColor={item.status === 1 ? "#2e7d32" : "#757575"}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13, color: "#555" }}>{formatDate(item.created_at)}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                                <Button size="small" variant="outlined"
                                  startIcon={<Edit sx={{ fontSize: 13 }} />}
                                  onClick={() => navigate(`/admin/berita/${item.id_berita}`)}
                                  sx={{ textTransform: "none", borderRadius: "8px", fontSize: 12, fontWeight: 600, color: "#0D59F2", borderColor: "#e3f2fd", "&:hover": { backgroundColor: "#f0f4ff", borderColor: "#0D59F2" } }}
                                >
                                  Edit
                                </Button>
                                <Button size="small" variant="outlined"
                                  startIcon={<Delete sx={{ fontSize: 13 }} />}
                                  onClick={() => handleDelete(item)}
                                  sx={{ textTransform: "none", borderRadius: "8px", fontSize: 12, fontWeight: 600, color: "#c62828", borderColor: "#fce4ec", "&:hover": { backgroundColor: "rgba(198,40,40,0.05)" } }}
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

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ fontSize: 13, color: "#777" }}>
                      Menampilkan {((page - 1) * rowsPerPage) + 1}–{Math.min(page * rowsPerPage, list.length)} dari {list.length} berita
                    </Typography>
                    <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} color="primary" shape="rounded" showFirstButton showLastButton />
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