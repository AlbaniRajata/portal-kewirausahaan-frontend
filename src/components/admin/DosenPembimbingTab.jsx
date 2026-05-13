import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Pagination,
} from "@mui/material";
import LoadingScreen from "../common/LoadingScreen";
import Swal from "sweetalert2";
import { getDosenPembimbing, getDosenBebanPembimbing } from "../../api/admin";

const COLORS = {
  primary: "#0D59F2",
  primaryLight: "#E0F2FE",
  primaryDark: "#0369A1",
  primaryMuted: "#93C5FD",
  slate: "#64748B",
  slateLight: "#F1F5F9",
  success: "#059669",
  warning: "#D97706",
  error: "#DC2626",
};

const tableHeadCell = {
  fontWeight: 800,
  fontSize: 12,
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  backgroundColor: "#F8FAFC",
  borderBottom: `2px solid ${COLORS.primaryMuted}`,
  py: 2.5,
};

const tableBodyRow = {
  "&:hover": { backgroundColor: "#F1F5F9/50" },
  "& td": { borderBottom: "1.5px solid #E2E8F0", py: 2 },
};

export default function DosenPembimbingTab({ id_program }) {
  const [dosenList, setDosenList] = useState([]);
  const [dosenBeban, setDosenBeban] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [dosenRes, dosenBebanRes] = await Promise.all([
        getDosenPembimbing(),
        getDosenBebanPembimbing(id_program),
      ]);

      setDosenList(dosenRes?.data || []);
      setDosenBeban(dosenBebanRes?.data || []);
    } catch {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Gagal memuat data",
        confirmButtonColor: "#0D59F2",
      });
    } finally {
      setLoading(false);
    }
  }, [id_program]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [dosenList.length, dosenBeban.length]);

  const getDosenBebanInfo = (id_dosen) => {
    return dosenBeban.find((d) => d.id_dosen === id_dosen) || { jumlah_bimbingan: 0 };
  };

  const dosenMergedData = dosenList.map((dosen) => ({
    ...dosen,
    ...getDosenBebanInfo(dosen.id_dosen),
  }));

  const totalPages = Math.max(1, Math.ceil(dosenMergedData.length / itemsPerPage));
  const startIdx = (page - 1) * itemsPerPage;
  const paginatedDosen = dosenMergedData.slice(startIdx, startIdx + itemsPerPage);
  const startDisplay = dosenMergedData.length === 0 ? 0 : startIdx + 1;
  const endDisplay = Math.min(page * itemsPerPage, dosenMergedData.length);
  const countTanpaBimbingan = dosenMergedData.filter((d) => Number(d.jumlah_bimbingan) === 0).length;
  const countRingan = dosenMergedData.filter((d) => Number(d.jumlah_bimbingan) > 0 && Number(d.jumlah_bimbingan) <= 2).length;
  const countSedang = dosenMergedData.filter((d) => Number(d.jumlah_bimbingan) > 2 && Number(d.jumlah_bimbingan) <= 4).length;
  const countBerat = dosenMergedData.filter((d) => Number(d.jumlah_bimbingan) > 4).length;

  if (loading) {
    return (
      <Box sx={{ position: "relative", minHeight: 320 }}>
        <LoadingScreen message="Memuat data dosen pembimbing..." overlay minHeight="320px" />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2.5, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 1.5 }}>
        <Box sx={{ p: 2, borderRadius: "16px", border: "1px solid #d7e9d8", backgroundColor: "#f2faf3", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
          <Typography sx={{ fontSize: 12, color: "#5f7160" }}>Tanpa Bimbingan</Typography>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: COLORS.success }}>{countTanpaBimbingan}</Typography>
        </Box>
        <Box sx={{ p: 2, borderRadius: "16px", border: "1px solid #d7e5fb", backgroundColor: "#f3f7ff", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
          <Typography sx={{ fontSize: 12, color: "#566b93" }}>Ringan (1-2)</Typography>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: COLORS.primary }}>{countRingan}</Typography>
        </Box>
        <Box sx={{ p: 2, borderRadius: "16px", border: "1px solid #fde3c7", backgroundColor: "#fff7ee", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
          <Typography sx={{ fontSize: 12, color: "#91653b" }}>Sedang (3-4)</Typography>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: COLORS.warning }}>{countSedang}</Typography>
        </Box>
        <Box sx={{ p: 2, borderRadius: "16px", border: "1px solid #f8d4d4", backgroundColor: "#fff4f4", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
          <Typography sx={{ fontSize: 12, color: "#8f4d4d" }}>Berat ({">"}4)</Typography>
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: COLORS.error }}>{countBerat}</Typography>
        </Box>
      </Box>

      <TableContainer sx={{ borderRadius: "16px", border: "1.5px solid #E2E8F0", overflow: "auto", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}>
        <Table sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#fafafa" }}>
              <TableCell sx={tableHeadCell}>NAMA LENGKAP</TableCell>
              <TableCell sx={tableHeadCell}>NIP</TableCell>
              <TableCell sx={tableHeadCell}>BIDANG KEAHLIAN</TableCell>
              <TableCell sx={{ ...tableHeadCell, textAlign: "center", width: "120px" }}>
                TOTAL TIM DIBIMBING
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dosenMergedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} sx={{ textAlign: "center", py: 6 }}>
                  <Typography sx={{ fontSize: { xs: 16, sm: 18 }, fontWeight: 800, color: "#1E293B", mb: 0.5 }}>
                    Belum ada dosen pembimbing
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: COLORS.slate, fontWeight: 500 }}>
                    Belum ada data dosen pembimbing yang tersedia
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedDosen.map((dosen) => (
                <TableRow
                  key={dosen.id_dosen}
                  sx={{
                    ...tableBodyRow,
                    backgroundColor: dosen.jumlah_bimbingan === 0 ? "#fafafa" : "transparent",
                  }}
                >
                  <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>
                    {dosen.nama_lengkap}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{dosen.nip}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>
                    {dosen.bidang_keahlian || "-"}
                  </TableCell>
                  <TableCell sx={{ textAlign: "center" }}>
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        px: 2,
                        py: 0.75,
                        borderRadius: "50px",
                        backgroundColor:
                          dosen.jumlah_bimbingan === 0
                            ? "#e8f5e9"
                            : dosen.jumlah_bimbingan <= 2
                            ? "#e3f2fd"
                            : dosen.jumlah_bimbingan <= 4
                            ? "#fff3e0"
                            : "#ffebee",
                        color:
                          dosen.jumlah_bimbingan === 0
                            ? "#2e7d32"
                            : dosen.jumlah_bimbingan <= 2
                            ? "#0D59F2"
                            : dosen.jumlah_bimbingan <= 4
                            ? "#e65100"
                            : "#c62828",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      {dosen.jumlah_bimbingan || 0}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexDirection: { xs: "column", sm: "row" }, px: 1 }}>
        <Typography sx={{ fontSize: 14, color: COLORS.slate, fontWeight: 600 }}>
          Menampilkan <span style={{ color: "#1E293B" }}>{startDisplay}–{endDisplay}</span> dari <span style={{ color: "#1E293B" }}>{dosenMergedData.length}</span> dosen
        </Typography>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, v) => setPage(v)}
          color="primary"
          shape="rounded"
          size="small"
          sx={{
            "& .MuiPaginationItem-root": {
              fontWeight: 700,
              borderRadius: "10px",
              "&.Mui-selected": {
                backgroundColor: COLORS.primary,
                color: "#fff",
                "&:hover": { backgroundColor: COLORS.primaryDark },
              },
            },
          }}
        />
      </Box>
    </Box>
  );
}
