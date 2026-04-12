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

const tableHeadCell = {
  fontWeight: 700,
  fontSize: 13,
  color: "#000",
  backgroundColor: "#fafafa",
  borderBottom: "2px solid #f0f0f0",
  py: 2,
};

const tableBodyRow = { "& td": { borderBottom: "1px solid #f5f5f5", py: 2 } };

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
        <Box sx={{ p: 2, borderRadius: "12px", border: "1px solid #d7e9d8", backgroundColor: "#f2faf3" }}>
          <Typography sx={{ fontSize: 12, color: "#5f7160" }}>Tanpa Bimbingan</Typography>
          <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#2e7d32" }}>{countTanpaBimbingan}</Typography>
        </Box>
        <Box sx={{ p: 2, borderRadius: "12px", border: "1px solid #d7e5fb", backgroundColor: "#f3f7ff" }}>
          <Typography sx={{ fontSize: 12, color: "#566b93" }}>Ringan (1-2)</Typography>
          <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#0D59F2" }}>{countRingan}</Typography>
        </Box>
        <Box sx={{ p: 2, borderRadius: "12px", border: "1px solid #fde3c7", backgroundColor: "#fff7ee" }}>
          <Typography sx={{ fontSize: 12, color: "#91653b" }}>Sedang (3-4)</Typography>
          <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#e65100" }}>{countSedang}</Typography>
        </Box>
        <Box sx={{ p: 2, borderRadius: "12px", border: "1px solid #f8d4d4", backgroundColor: "#fff4f4" }}>
          <Typography sx={{ fontSize: 12, color: "#8f4d4d" }}>Berat ({">"}4)</Typography>
          <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#c62828" }}>{countBerat}</Typography>
        </Box>
      </Box>

      <TableContainer sx={{ borderRadius: "12px", border: "1px solid #f0f0f0" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#fafafa" }}>
              <TableCell sx={tableHeadCell}>Nama Lengkap</TableCell>
              <TableCell sx={tableHeadCell}>NIP</TableCell>
              <TableCell sx={tableHeadCell}>Bidang Keahlian</TableCell>
              <TableCell sx={{ ...tableHeadCell, textAlign: "center", width: "120px" }}>
                Total Tim Dibimbing
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dosenMergedData.length === 0 ? (
              <TableRow sx={tableBodyRow}>
                <TableCell colSpan={4} sx={{ textAlign: "center", py: 4, color: "#999" }}>
                  Tidak ada dosen pembimbing
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

      <Box sx={{ p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f0f0f0", gap: 2, flexWrap: "wrap" }}>
        <Typography sx={{ fontSize: 13, color: "#777" }}>
          Menampilkan {startDisplay}–{endDisplay} dari {dosenMergedData.length} dosen
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
