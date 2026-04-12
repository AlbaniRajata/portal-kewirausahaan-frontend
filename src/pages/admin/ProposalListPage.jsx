import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button,
  TextField, MenuItem, Autocomplete, Pagination,
} from "@mui/material";
import { Description, Download } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import * as XLSX from "xlsx-js-style";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import LoadingScreen from "../../components/common/LoadingScreen";
import { getMyProgram, getPesertaDetail, getProposalDetailAdmin, getProposalList } from "../../api/admin";

const roundedField = { "& .MuiOutlinedInput-root": { borderRadius: "15px" } };

const tableHeadCell = {
  fontWeight: 700, fontSize: 13, color: "#000",
  backgroundColor: "#fafafa", borderBottom: "2px solid #f0f0f0", py: 2,
};

const tableBodyRow = { "& td": { borderBottom: "1px solid #f5f5f5", py: 2 } };

const statusMap = {
  0: { label: "Draft",                       backgroundColor: "#666" },
  1: { label: "Diajukan",                    backgroundColor: "#1565c0" },
  2: { label: "Ditugaskan ke Reviewer",      backgroundColor: "#3949ab" },
  3: { label: "Tidak Lolos Desk Evaluasi",   backgroundColor: "#c62828" },
  4: { label: "Lolos Desk Evaluasi",         backgroundColor: "#2e7d32" },
  5: { label: "Panel Wawancara",             backgroundColor: "#3949ab" },
  6: { label: "Tidak Lolos Wawancara",       backgroundColor: "#c62828" },
  7: { label: "Lolos Wawancara",             backgroundColor: "#2e7d32" },
  8: { label: "Pembimbing Diajukan",         backgroundColor: "#1565c0" },
  9: { label: "Pembimbing Disetujui",        backgroundColor: "#2e7d32" },
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

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
};

const getDosenPembimbingName = (item) => {
  return (
    item?.nama_dosen ||
    item?.nama_pembimbing ||
    item?.dosen_pembimbing ||
    item?.pembimbing?.nama_dosen ||
    item?.pembimbing?.nama_lengkap ||
    item?.pengajuan_pembimbing?.nama_dosen ||
    "-"
  );
};

const centerWorksheetColumns = (worksheet, columns = [], startRow = 0, endRow = 0) => {
  for (let row = startRow; row <= endRow; row += 1) {
    columns.forEach((column) => {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: column });
      const cell = worksheet[cellRef];
      if (!cell) return;
      cell.s = {
        ...(cell.s || {}),
        alignment: {
          ...(cell.s?.alignment || {}),
          horizontal: "center",
          vertical: "center",
        },
      };
    });
  }
};

const getKategoriName = (proposal) => {
  return (
    proposal?.nama_kategori ||
    proposal?.kategori?.nama_kategori ||
    proposal?.kategori?.nama ||
    "Tanpa Kategori"
  );
};

const getProgramDisplayName = (program) => {
  const namaProgram = program?.nama_program?.trim();
  const keteranganProgram = program?.keterangan?.trim();

  if (namaProgram && keteranganProgram && namaProgram.toLowerCase() !== keteranganProgram.toLowerCase()) {
    return `${keteranganProgram}`;
  }

  return namaProgram || keteranganProgram || "PENDAFTAR PMW";
};

const getExportTitle = (program, tahunFilter) => {
  const programText = `${program?.nama_program || ""} ${program?.keterangan || ""}`.toLowerCase();

  let baseTitle = getProgramDisplayName(program).toUpperCase();
  if (programText.includes("pmw") || programText.includes("program mahasiswa wirausaha")) {
    baseTitle = "DAFTAR PROGRAM MAHASISWA WIRAUSAHA";
  } else if (programText.includes("inbis") || programText.includes("inkubator bisnis")) {
    baseTitle = "DAFTAR INKUBATOR BISNIS";
  }

  if (!tahunFilter) return baseTitle;
  return `${baseTitle} ${tahunFilter}`;
};

const getProgramNameForFilename = (program) => {
  const programText = `${program?.nama_program || ""} ${program?.keterangan || ""}`.toLowerCase();
  if (programText.includes("pmw") || programText.includes("program mahasiswa wirausaha")) {
    return "PMW";
  } else if (programText.includes("inbis") || programText.includes("inkubator bisnis")) {
    return "INBIS";
  }
  return program?.keterangan?.substring(0, 10).toUpperCase() || "Program";
};

const getAnggotaPeranLabel = (anggota) => {
  const peran = anggota?.peran;
  if (peran === 1 || String(peran).toLowerCase() === "ketua") return "Ketua";
  return "Anggota";
};

const getAnggotaKey = (anggota) => {
  return String(anggota?.id_user || anggota?.id || anggota?.nim || anggota?.username || "");
};

const getAnggotaProdi = (anggota, pesertaDetail) => {
  const jenjang = anggota?.jenjang ? `${anggota.jenjang} ` : "";
  const jenjangPeserta = pesertaDetail?.jenjang ? `${pesertaDetail.jenjang} ` : "";
  return (
    anggota?.prodi ||
    `${jenjang}${anggota?.nama_prodi || ""}`.trim() ||
    `${jenjangPeserta}${pesertaDetail?.nama_prodi || ""}`.trim() ||
    "-"
  );
};

const getAnggotaJurusan = (anggota, pesertaDetail) => {
  return (
    anggota?.nama_jurusan ||
    anggota?.jurusan ||
    anggota?.mahasiswa?.nama_jurusan ||
    pesertaDetail?.nama_jurusan ||
    "-"
  );
};

const getAnggotaNoHp = (anggota, pesertaDetail) => {
  return (
    anggota?.no_hp ||
    anggota?.nomor_hp ||
    anggota?.hp ||
    anggota?.mahasiswa?.no_hp ||
    pesertaDetail?.no_hp ||
    "-"
  );
};

const getAnggotaRowsForExport = (proposal, detail, pesertaDetailMap = new Map()) => {
  const anggotaRaw =
    detail?.anggota_tim ||
    detail?.anggota ||
    proposal?.anggota_tim ||
    [];

  if (Array.isArray(anggotaRaw) && anggotaRaw.length > 0) {
    return [...anggotaRaw]
      .sort((a, b) => {
        const peranA = getAnggotaPeranLabel(a) === "Ketua" ? 0 : 1;
        const peranB = getAnggotaPeranLabel(b) === "Ketua" ? 0 : 1;
        if (peranA !== peranB) return peranA - peranB;
        return (a?.nama_lengkap || "").localeCompare(b?.nama_lengkap || "", "id-ID");
      })
      .map((anggota) => {
        const anggotaKey = getAnggotaKey(anggota);
        const pesertaDetail = anggotaKey ? pesertaDetailMap.get(anggotaKey) : null;
        return {
        keterangan: getAnggotaPeranLabel(anggota),
        nama: anggota?.nama_lengkap || anggota?.nama || anggota?.username || "-",
        nim: anggota?.nim || "-",
        prodi: getAnggotaProdi(anggota, pesertaDetail),
        jurusan: getAnggotaJurusan(anggota, pesertaDetail),
        noHp: getAnggotaNoHp(anggota, pesertaDetail),
      };
      });
  }

  return [{
    keterangan: "Ketua",
    nama: proposal?.ketua?.nama_lengkap || "-",
    nim: proposal?.ketua?.nim || "-",
    prodi: getAnggotaProdi(proposal?.ketua, null),
    jurusan: getAnggotaJurusan(proposal?.ketua, null),
    noHp: getAnggotaNoHp(proposal?.ketua, null),
  }];
};

const statusOptions = Object.entries(statusMap).map(([value, { label }]) => ({ value: parseInt(value), label }));

export default function ProposalListPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [proposalList, setProposalList] = useState([]);
  const [programOptions, setProgramOptions] = useState([]);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const rowsPerPage = 10;

  const [filters, setFilters] = useState({ id_program: "", status: [], tahun: "" });

  useEffect(() => {
    getMyProgram()
      .then((res) => {
        const myProgram = res?.data;
        if (myProgram?.id_program) {
          setProgramOptions([myProgram]);
          setFilters((prev) => ({ ...prev, id_program: myProgram.id_program }));
        }
      })
      .catch(() => {
        Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat data program", confirmButtonColor: "#0D59F2" });
      });
  }, []);

  const fetchProposals = useCallback(async () => {
    try {
      if (!filters.id_program) {
        setProposalList([]);
        return;
      }
      setLoading(true);
      let allProposals = [];
      if (filters.status.length === 0) {
        const res = await getProposalList({ id_program: filters.id_program });
        allProposals = res.data || [];
      } else {
        const promises = filters.status.map((statusValue) =>
          getProposalList({ id_program: filters.id_program, status: statusValue })
        );
        const results = await Promise.all(promises);
        allProposals = results.flatMap((res) => res.data || []);
        allProposals = Array.from(new Map(allProposals.map((p) => [p.id_proposal, p])).values());
      }
      setProposalList(allProposals);
      setPage(1);
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat daftar proposal", confirmButtonColor: "#0D59F2" });
    } finally {
      setLoading(false);
    }
  }, [filters.id_program, filters.status]);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  const tahunOptions = Array.from(new Set(
    proposalList
      .map((item) => {
        const dateValue = item.tanggal_submit || item.created_at;
        if (!dateValue) return null;
        const year = new Date(dateValue).getFullYear();
        return Number.isNaN(year) ? null : year;
      })
      .filter(Boolean)
  )).sort((a, b) => b - a);

  const filteredProposalList = filters.tahun === ""
    ? proposalList
    : proposalList.filter((item) => {
      const dateValue = item.tanggal_submit || item.created_at;
      if (!dateValue) return false;
      return new Date(dateValue).getFullYear() === Number(filters.tahun);
    });

  const buildGroupedExportData = () => {
    const grouped = new Map();

    [...filteredProposalList]
      .sort((a, b) => {
        const kategoriA = getKategoriName(a);
        const kategoriB = getKategoriName(b);
        if (kategoriA !== kategoriB) return kategoriA.localeCompare(kategoriB, "id-ID");
        return (a?.judul || "").localeCompare(b?.judul || "", "id-ID");
      })
      .forEach((proposal) => {
        const kategori = getKategoriName(proposal);
        if (!grouped.has(kategori)) grouped.set(kategori, []);
        grouped.get(kategori).push(proposal);
      });

    return Array.from(grouped.entries()).map(([kategori, items]) => ({ kategori, items }));
  };

  const exportHeaders = [
    "NO",
    "NAMA USAHA",
    "NO",
    "KETERANGAN",
    "NAMA",
    "NIM",
    "PRODI",
    "JURUSAN",
    "NO HP",
    "DOSEN PEMBIMBING",
  ];

  const buildDetailedExportGroups = async () => {
    const groupedData = buildGroupedExportData();
    const allProposals = groupedData.flatMap((group) => group.items);

    const detailMap = new Map();
    const pesertaDetailMap = new Map();

    if (allProposals.length > 0) {
      const results = await Promise.allSettled(
        allProposals.map((proposal) => getProposalDetailAdmin(proposal.id_proposal))
      );

      results.forEach((result, index) => {
        const proposalId = allProposals[index]?.id_proposal;
        if (!proposalId) return;
        if (result.status === "fulfilled") {
          detailMap.set(proposalId, result.value?.data || null);
        }
      });
    }

    const pesertaQueue = new Map();
    allProposals.forEach((proposal) => {
      const detail = detailMap.get(proposal.id_proposal);
      const anggotaRaw = detail?.anggota_tim || detail?.anggota || proposal?.anggota_tim || [];
      if (!Array.isArray(anggotaRaw)) return;

      anggotaRaw.forEach((anggota) => {
        const anggotaKey = getAnggotaKey(anggota);
        const idUser = anggota?.id_user || anggota?.id;
        if (!anggotaKey || !idUser || !filters.id_program) return;
        if (!pesertaQueue.has(anggotaKey)) {
          pesertaQueue.set(anggotaKey, { idUser, idProgram: filters.id_program });
        }
      });
    });

    if (pesertaQueue.size > 0) {
      const pesertaTargets = Array.from(pesertaQueue.entries());
      const pesertaResults = await Promise.allSettled(
        pesertaTargets.map(([, value]) => getPesertaDetail(value.idUser, value.idProgram))
      );

      pesertaResults.forEach((result, index) => {
        if (result.status !== "fulfilled") return;
        const anggotaKey = pesertaTargets[index]?.[0];
        if (!anggotaKey) return;
        pesertaDetailMap.set(anggotaKey, result.value?.data || null);
      });
    }

    return groupedData.map((group) => ({
      kategori: group.kategori,
      items: group.items.map((proposal) => ({
        ...proposal,
        detail: detailMap.get(proposal.id_proposal) || null,
      })),
      pesertaDetailMap,
    }));
  };

  const buildExportFileName = () => {
    const selectedProgram = programOptions.find((prog) => String(prog.id_program) === String(filters.id_program)) || programOptions[0];
    const programName = getProgramNameForFilename(selectedProgram);
    if (filters.tahun) {
      return `DaftarProposal_${programName}_${filters.tahun}`;
    }
    return `DaftarProposal_${programName}`;
  };
  const exportFileBaseName = buildExportFileName();

  const handleExportXlsx = async () => {
    if (filteredProposalList.length === 0) {
      Swal.fire({ icon: "info", title: "Tidak ada data", text: "Tidak ada proposal untuk diekspor", confirmButtonColor: "#0D59F2" });
      return;
    }

    setExporting(true);
    try {
      const groupedData = await buildDetailedExportGroups();
      const selectedProgram = programOptions.find((prog) => String(prog.id_program) === String(filters.id_program)) || programOptions[0];
      const aoa = [[getExportTitle(selectedProgram, filters.tahun)], []];
    const merges = [{ s: { r: 0, c: 0 }, e: { r: 0, c: exportHeaders.length - 1 } }];
    const dataRowRanges = [];
    let rowIndex = 2;

    groupedData.forEach((group) => {
      aoa.push([String(group.kategori || "Tanpa Kategori").toUpperCase()]);
      merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: exportHeaders.length - 1 } });
      rowIndex += 1;

      aoa.push(exportHeaders);
      rowIndex += 1;

      let anggotaNomor = 1;
      group.items.forEach((proposal, proposalIndex) => {
        const anggotaRows = getAnggotaRowsForExport(proposal, proposal.detail, group.pesertaDetailMap);
        const startRow = rowIndex;

        anggotaRows.forEach((anggota, anggotaIndex) => {
          aoa.push([
            anggotaIndex === 0 ? proposalIndex + 1 : "",
            anggotaIndex === 0 ? proposal?.judul || "-" : "",
            anggotaNomor,
            anggota?.keterangan || "-",
            anggota?.nama || "-",
            anggota?.nim || "-",
            anggota?.prodi || "-",
            anggota?.jurusan || "-",
            anggota?.noHp || "-",
            anggotaIndex === 0 ? getDosenPembimbingName(proposal?.detail || proposal) : "",
          ]);
          anggotaNomor += 1;
          rowIndex += 1;
        });

        const endRow = rowIndex - 1;
        dataRowRanges.push({ startRow, endRow });

        if (anggotaRows.length > 1) {
          merges.push({ s: { r: startRow, c: 0 }, e: { r: endRow, c: 0 } });
          merges.push({ s: { r: startRow, c: 1 }, e: { r: endRow, c: 1 } });
          merges.push({ s: { r: startRow, c: 9 }, e: { r: endRow, c: 9 } });
        }
      });

      aoa.push([]);
      rowIndex += 1;
    });

    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    dataRowRanges.forEach(({ startRow, endRow }) => {
      centerWorksheetColumns(worksheet, [0, 1, 9], startRow, endRow);
    });
    worksheet["!merges"] = merges;
    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 48 },
      { wch: 6 },
      { wch: 14 },
      { wch: 28 },
      { wch: 16 },
      { wch: 32 },
      { wch: 20 },
      { wch: 17 },
      { wch: 30 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Proposal");
    XLSX.writeFile(workbook, `${exportFileBaseName}.xlsx`, { cellStyles: true });
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal mengekspor file XLSX", confirmButtonColor: "#0D59F2" });
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(filteredProposalList.length / rowsPerPage);
  const paginatedList = filteredProposalList.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box>
          <Box sx={{ mb: 4 }}>
            <Box>
              <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Daftar Proposal</Typography>
              <Typography sx={{ fontSize: 14, color: "#777" }}>Kelola dan monitor proposal kewirausahaan</Typography>
            </Box>
          </Box>

          <Paper sx={{ p: 3, mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2, flexWrap: "wrap" }}>
              <Typography sx={{ fontSize: 15, fontWeight: 700 }}>Proposal</Typography>
              <Box>
                <Button
                  variant="contained"
                  onClick={handleExportXlsx}
                  startIcon={<Download />}
                  sx={{
                    textTransform: "none",
                    borderRadius: "50px",
                    px: 2.2,
                    boxShadow: "none",
                    backgroundColor: "#2e7d32",
                    "&:hover": { backgroundColor: "#1b5e20" },
                  }}
                  disabled={filteredProposalList.length === 0 || exporting}
                >
                  {exporting ? "Mengekspor..." : "Ekspor Excel"}
                </Button>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Box sx={{ minWidth: 200, flex: "1 1 auto" }}>
                <TextField
                  select fullWidth size="small" label="Program"
                  value={filters.id_program}
                  onChange={(e) => setFilters({ ...filters, id_program: e.target.value })}
                  disabled
                  sx={roundedField}
                >
                  {programOptions.map((prog) => (
                    <MenuItem key={prog.id_program} value={prog.id_program}>{getProgramDisplayName(prog)}</MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box sx={{ minWidth: 300, flex: "2 1 auto" }}>
                <Autocomplete
                  multiple
                  options={statusOptions}
                  value={statusOptions.filter((opt) => filters.status.includes(opt.value))}
                  onChange={(e, newValue) => setFilters({ ...filters, status: newValue.map((v) => v.value) })}
                  getOptionLabel={(option) => option.label}
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  size="small"
                  renderInput={(params) => (
                    <TextField {...params} label="Status" placeholder="Pilih status" sx={roundedField} />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const si = statusMap[option.value];
                      return (
                        <StatusPill
                          key={index}
                          label={option.label}
                          backgroundColor={si?.backgroundColor || "#666"}
                          {...getTagProps({ index })}
                        />
                      );
                    })
                  }
                />
              </Box>
              <Box sx={{ minWidth: 170, flex: "1 1 170px" }}>
                <TextField
                  select fullWidth size="small" label="Tahun"
                  value={filters.tahun}
                  onChange={(e) => setFilters({ ...filters, tahun: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={roundedField}
                >
                  <MenuItem value="">Semua Tahun</MenuItem>
                  {tahunOptions.map((tahun) => (
                    <MenuItem key={tahun} value={String(tahun)}>{tahun}</MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ borderRadius: "16px", border: "1px solid #f0f0f0", overflow: "hidden" }}>
            {loading ? (
              <Box sx={{ position: "relative", minHeight: 320 }}>
                <LoadingScreen message="Memuat daftar proposal..." overlay minHeight="320px" />
              </Box>
            ) : paginatedList.length === 0 ? (
              <Box sx={{ p: 8, textAlign: "center" }}>
                <Box sx={{ width: 100, height: 100, borderRadius: "50%", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
                  <Description sx={{ fontSize: 48, color: "#ccc" }} />
                </Box>
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#444", mb: 1 }}>Belum Ada Proposal</Typography>
                <Typography sx={{ fontSize: 14, color: "#999" }}>Proposal yang diajukan akan muncul di sini</Typography>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {["Judul Proposal", "Nama Tim", "Ketua Tim", "Dosen Pembimbing", "Program", "Status", "Tanggal Submit", "Aksi"].map((h, i) => (
                          <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 7 && { textAlign: "center" }) }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedList.map((proposal) => {
                        const si = statusMap[proposal.status];
                        return (
                          <TableRow key={proposal.id_proposal} sx={tableBodyRow}>
                            <TableCell>
                              <Typography sx={{ fontWeight: 600, fontSize: 14, maxWidth: 300 }}>{proposal.judul}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13, color: "#555" }}>{proposal.nama_tim}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{proposal.ketua.nama_lengkap}</Typography>
                              <Typography sx={{ fontSize: 12, color: "#888" }}>{proposal.ketua.username}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13, color: "#555" }}>{getDosenPembimbingName(proposal)}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13, color: "#555" }}>{proposal.keterangan}</Typography>
                            </TableCell>
                            <TableCell>
                              <StatusPill label={si?.label || "Unknown"} backgroundColor={si?.backgroundColor || "#666"} />
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: 13, color: "#555" }}>{formatDate(proposal.tanggal_submit)}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Button size="small" variant="outlined"
                                onClick={() => navigate(`/admin/proposal/${proposal.id_proposal}`)}
                                sx={{ textTransform: "none", borderRadius: "50px", fontSize: 12, fontWeight: 600, px: 2, borderColor: "#0D59F2", color: "#0D59F2", "&:hover": { backgroundColor: "#f0f4ff" } }}
                              >
                                Detail
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ p: 3, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f0f0f0" }}>
                  <Typography sx={{ fontSize: 13, color: "#777" }}>
                    Menampilkan {((page - 1) * rowsPerPage) + 1}–{Math.min(page * rowsPerPage, filteredProposalList.length)} dari {filteredProposalList.length} proposal
                  </Typography>
                  <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} color="primary" shape="rounded" showFirstButton showLastButton />
                </Box>
              </>
            )}
          </Paper>
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}