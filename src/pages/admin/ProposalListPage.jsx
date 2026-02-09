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
  Chip,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Autocomplete,
} from "@mui/material";
import { Visibility, Description } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import { getProposalList } from "../../api/admin";
import { getAllProgram } from "../../api/public";

export default function ProposalListPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingProgram, setLoadingProgram] = useState(true);
  const [proposalList, setProposalList] = useState([]);
  const [programOptions, setProgramOptions] = useState([]);
  const [alert, setAlert] = useState("");

  const [filters, setFilters] = useState({
    id_program: "",
    status: [],
  });

  const statusOptions = [
    { value: 0, label: "Draft" },
    { value: 1, label: "Diajukan" },
    { value: 2, label: "Ditugaskan ke Reviewer" },
    { value: 3, label: "Tidak Lolos Desk" },
    { value: 4, label: "Lolos Desk" },
    { value: 5, label: "Wawancara Dijadwalkan" },
    { value: 6, label: "Panel Wawancara" },
    { value: 7, label: "Tidak Lolos Wawancara" },
    { value: 8, label: "Lolos Wawancara" },
    { value: 9, label: "Pembimbing Diajukan" },
    { value: 10, label: "Pembimbing Disetujui" },
  ];

  const fetchProgram = useCallback(async () => {
    try {
      setLoadingProgram(true);
      const response = await getAllProgram();
      if (response.success) {
        setProgramOptions(response.data);
      }
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
        
        const uniqueProposals = Array.from(
          new Map(allProposals.map((p) => [p.id_proposal, p])).values()
        );
        allProposals = uniqueProposals;
      }

      setProposalList(allProposals);
    } catch (err) {
      console.error("Error fetching proposals:", err);
      setAlert("Gagal memuat daftar proposal");
    } finally {
      setLoading(false);
    }
  }, [filters.id_program, filters.status]);

  useEffect(() => {
    fetchProgram();
    fetchProposals();
  }, [fetchProgram, fetchProposals]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);


  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusLabel = (statusCode) => {
    const labels = {
      0: { text: "Draft", color: "default" },
      1: { text: "Diajukan", color: "info" },
      2: { text: "Ditugaskan ke Reviewer", color: "primary" },
      3: { text: "Tidak Lolos Desk", color: "error" },
      4: { text: "Lolos Desk", color: "success" },
      5: { text: "Wawancara Dijadwalkan", color: "warning" },
      6: { text: "Panel Wawancara", color: "primary" },
      7: { text: "Tidak Lolos Wawancara", color: "error" },
      8: { text: "Lolos Wawancara", color: "success" },
      9: { text: "Pembimbing Diajukan", color: "info" },
      10: { text: "Pembimbing Disetujui", color: "success" },
    };
    return labels[statusCode] || { text: "Unknown", color: "default" };
  };

  const handleViewDetail = (id_proposal) => {
    navigate(`/admin/proposal/${id_proposal}`);
  };

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
            Daftar Proposal
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#777" }}>
            Kelola dan monitor proposal kewirausahaan
          </Typography>
        </Box>

        {alert && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setAlert("")}>
            {alert}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 600, mb: 2 }}>
            Filter Proposal
          </Typography>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ minWidth: 200, flex: "1 1 auto" }}>
              <TextField
                select
                fullWidth
                label="Program"
                value={filters.id_program}
                onChange={(e) => setFilters({ ...filters, id_program: e.target.value })}
                disabled={loadingProgram}
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
                onChange={(e, newValue) => {
                  setFilters({ ...filters, status: newValue.map((v) => v.value) });
                }}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) => option.value === value.value}
                renderInput={(params) => (
                  <TextField {...params} label="Status" placeholder="Pilih status" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.label}
                      {...getTagProps({ index })}
                      size="small"
                    />
                  ))
                }
              />
            </Box>
          </Box>
        </Paper>

        <Paper sx={{ overflow: "hidden" }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress />
            </Box>
          ) : proposalList.length === 0 ? (
            <Box sx={{ p: 8, textAlign: "center" }}>
              <Description sx={{ fontSize: 80, color: "#ddd", mb: 2 }} />
              <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#666", mb: 1 }}>
                Belum Ada Proposal
              </Typography>
              <Typography sx={{ fontSize: 14, color: "#999" }}>
                Proposal yang diajukan akan muncul di sini
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Judul Proposal</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Nama Tim</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Ketua Tim</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Program</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tanggal Submit</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: "center" }}>Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {proposalList.map((proposal) => {
                    const statusInfo = getStatusLabel(proposal.status);
                    return (
                      <TableRow key={proposal.id_proposal} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 500, maxWidth: 300 }}>
                            {proposal.judul}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 14 }}>
                            {proposal.nama_tim}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                              {proposal.ketua.nama_lengkap}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: "#666" }}>
                              {proposal.ketua.username}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 14 }}>
                            {proposal.keterangan}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={statusInfo.text}
                            color={statusInfo.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 14 }}>
                            {formatDate(proposal.tanggal_submit)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Visibility />}
                              onClick={() => handleViewDetail(proposal.id_proposal)}
                              sx={{ textTransform: "none" }}
                            >
                              Detail
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography sx={{ fontSize: 14, color: "#666" }}>
            Total: {proposalList.length} proposal
          </Typography>
        </Box>
      </Box>
    </BodyLayout>
  );
}