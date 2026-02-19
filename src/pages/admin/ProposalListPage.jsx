import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Autocomplete,
  Pagination,
} from "@mui/material";
import { Visibility, Description } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import { getProposalList } from "../../api/admin";
import { getAllProgram } from "../../api/public";

const roundedField = {
  "& .MuiOutlinedInput-root": { borderRadius: "15px" },
};

const tableHeadCell = {
  fontWeight: 700,
  fontSize: 13,
  color: "#000",
  backgroundColor: "#fafafa",
  borderBottom: "2px solid #f0f0f0",
  py: 2,
};

const tableBodyRow = {
  "& td": { borderBottom: "1px solid #f5f5f5", py: 2 },
};

const StatusPill = ({ label, bg, color }) => (
  <Box sx={{
    display: "inline-flex", alignItems: "center",
    px: 1.5, py: 0.4, borderRadius: "50px",
    backgroundColor: bg, color, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
  }}>
    {label}
  </Box>
);

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
};

const statusMap = {
  0: { label: "Draft", color: "#f5f5f5", bg: "#666" },
  1: { label: "Diajukan", color: "#e3f2fd", bg: "#1565c0" },
  2: { label: "Ditugaskan ke Reviewer", color: "#e8eaf6", bg: "#3949ab" },
  3: { label: "Tidak Lolos Desk Evaluasi", color: "#fce4ec", bg: "#c62828" },
  4: { label: "Lolos Desk Evaluasi", color: "#e8f5e9", bg: "#2e7d32" },
  5: { label: "Panel Wawancara", color: "#e8eaf6", bg: "#3949ab" },
  6: { label: "Tidak Lolos Wawancara", color: "#fce4ec", bg: "#c62828" },
  7: { label: "Lolos Wawancara", color: "#e8f5e9", bg: "#2e7d32" },
  8: { label: "Pembimbing Diajukan", color: "#e3f2fd", bg: "#1565c0" },
  9: { label: "Pembimbing Disetujui", color: "#e8f5e9", bg: "#2e7d32" },
};

export default function ProposalListPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingProgram, setLoadingProgram] = useState(true);
  const [proposalList, setProposalList] = useState([]);
  const [programOptions, setProgramOptions] = useState([]);
  const [alert, setAlert] = useState("");

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const [filters, setFilters] = useState({ id_program: "", status: [] });

  const statusOptions = Object.entries(statusMap).map(([value, { label }]) => ({ value: parseInt(value), label }));

  const fetchProgram = useCallback(async () => {
    try {
      setLoadingProgram(true);
      const response = await getAllProgram();
      if (response.success) setProgramOptions(response.data);
    } catch (err) {
      console.error("Error fetching program:", err);
    } finally {
      setLoadingProgram(false);
    }
  }, []);

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      let allProposals = [];
      if (filters.status.length === 0) {
        const response = await getProposalList({ id_program: filters.id_program });
        allProposals = response.data || [];
      } else {
        const promises = filters.status.map((statusValue) =>
          getProposalList({ id_program: filters.id_program, status: statusValue })
        );
        const results = await Promise.all(promises);
        allProposals = results.flatMap((res) => res.data || []);
        const uniqueProposals = Array.from(new Map(allProposals.map((p) => [p.id_proposal, p])).values());
        allProposals = uniqueProposals;
      }
      setProposalList(allProposals);
      setPage(1);
    } catch (err) {
      console.error("Error fetching proposals:", err);
      setAlert("Gagal memuat daftar proposal");
    } finally {
      setLoading(false);
    }
  }, [filters.id_program, filters.status]);

  useEffect(() => { fetchProgram(); }, [fetchProgram]);
  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  // Pagination
  const totalPages = Math.ceil(proposalList.length / rowsPerPage);
  const paginatedList = proposalList.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>Daftar Proposal</Typography>
          <Typography sx={{ fontSize: 14, color: "#777" }}>Kelola dan monitor proposal kewirausahaan</Typography>
        </Box>

        {alert && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }} onClose={() => setAlert("")}>
            {alert}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3, borderRadius: "16px", border: "1px solid #f0f0f0" }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>Filter Proposal</Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ minWidth: 200, flex: "1 1 auto" }}>
              <TextField
                select fullWidth size="small"
                label="Program"
                value={filters.id_program}
                onChange={(e) => setFilters({ ...filters, id_program: e.target.value })}
                disabled={loadingProgram}
                sx={roundedField}
              >
                <MenuItem value="">Semua Program</MenuItem>
                {programOptions.map((prog) => (
                  <MenuItem key={prog.id_program} value={prog.id_program}>
                    {prog.keterangan}
                  </MenuItem>
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
                        bg={si?.bg || "#f5f5f5"}
                        color={si?.color || "#666"}
                        {...getTagProps({ index })}
                      />
                    );
                  })
                }
              />
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ borderRadius: "16px", border: "1px solid #f0f0f0", overflow: "hidden" }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
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
                      {["Judul Proposal", "Nama Tim", "Ketua Tim", "Program", "Status", "Tanggal Submit", "Aksi"].map((h, i) => (
                        <TableCell key={i} sx={{ ...tableHeadCell, ...(i === 6 && { textAlign: "center" }) }}>{h}</TableCell>
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
                            <Box>
                              <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{proposal.ketua.nama_lengkap}</Typography>
                              <Typography sx={{ fontSize: 12, color: "#888" }}>{proposal.ketua.username}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, color: "#555" }}>{proposal.keterangan}</Typography>
                          </TableCell>
                          <TableCell>
                            <StatusPill label={si?.label || "Unknown"} bg={si?.bg || "#f5f5f5"} color={si?.color || "#666"} />
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontSize: 13, color: "#555" }}>{formatDate(proposal.tanggal_submit)}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Visibility sx={{ fontSize: 14 }} />}
                              onClick={() => navigate(`/admin/proposal/${proposal.id_proposal}`)}
                              sx={{
                                textTransform: "none", borderRadius: "50px",
                                fontSize: 12, fontWeight: 600, px: 2,
                                borderColor: "#0D59F2", color: "#0D59F2",
                                "&:hover": { backgroundColor: "#f0f4ff" },
                              }}
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
                  Menampilkan {((page - 1) * rowsPerPage) + 1}-{Math.min(page * rowsPerPage, proposalList.length)} dari {proposalList.length} proposal
                </Typography>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(e, value) => setPage(value)}
                  color="primary"
                  shape="rounded"
                  showFirstButton
                  showLastButton
                />
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </BodyLayout>
  );
}