import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Autocomplete,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Add, Delete, Search } from "@mui/icons-material";
import Swal from "sweetalert2";
import BodyLayout from "../../components/layouts/BodyLayout";
import SidebarMahasiswa from "../../components/layouts/MahasiswaSidebar";
import { getTimStatus, getTimDetail, createTim, searchMahasiswa } from "../../api/tim";
import { getAllProgram } from "../../api/public";

export default function AnggotaTimPage() {
  const [loading, setLoading] = useState(true);
  const [loadingProgram, setLoadingProgram] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searching, setSearching] = useState(false);

  const [timStatus, setTimStatus] = useState(null);
  const [timDetail, setTimDetail] = useState(null);
  const [programOptions, setProgramOptions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  const [formTim, setFormTim] = useState({
    nama_tim: "",
    id_program: null,
    anggota: [{ nim: "", nama_lengkap: "", id_user: null }],
  });

  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState("");

  useEffect(() => {
    fetchTimStatus();
    fetchProgram();
  }, []);

  const fetchTimStatus = async () => {
    try {
      setLoading(true);
      const response = await getTimStatus();
      setTimStatus(response.data);

      if (response.data.hasTim) {
        const detail = await getTimDetail();
        setTimDetail(detail.data);
      }
    } catch (err) {
      console.error("Error fetching tim status:", err);
      setAlert("Gagal memuat status tim. Silakan refresh halaman.");
    } finally {
      setLoading(false);
    }
  };

  const fetchProgram = async () => {
    try {
      setLoadingProgram(true);
      const response = await getAllProgram();
      if (response.success) {
        const formatted = response.data.map((item) => ({
          label: item.keterangan,
          id: item.id_program,
        }));
        setProgramOptions(formatted);
      }
    } catch (err) {
      console.error("Error fetching program:", err);
    } finally {
      setLoadingProgram(false);
    }
  };

  const handleSearchMahasiswa = async (index, nim) => {
    if (!nim || nim.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await searchMahasiswa(nim);
      setSearchResults(response.data || []);
    } catch (err) {
      console.error("Error searching mahasiswa:", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectMahasiswa = (index, mahasiswa) => {
    const newAnggota = [...formTim.anggota];
    newAnggota[index] = {
      nim: mahasiswa.nim,
      nama_lengkap: mahasiswa.nama_lengkap,
      id_user: mahasiswa.id_user,
    };
    setFormTim({ ...formTim, anggota: newAnggota });
    setSearchResults([]);
    setErrors((prev) => ({ ...prev, [`anggota_${index}`]: "" }));
  };

  const handleAddAnggota = () => {
    if (formTim.anggota.length >= 4) {
      setAlert("Maksimal 4 anggota (total 5 termasuk ketua)");
      return;
    }
    setFormTim({
      ...formTim,
      anggota: [...formTim.anggota, { nim: "", nama_lengkap: "", id_user: null }],
    });
  };

  const handleRemoveAnggota = (index) => {
    const newAnggota = formTim.anggota.filter((_, i) => i !== index);
    setFormTim({ ...formTim, anggota: newAnggota });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formTim.nama_tim || formTim.nama_tim.trim() === "") {
      newErrors.nama_tim = "Nama tim wajib diisi";
    }

    if (!formTim.id_program) {
      newErrors.id_program = "Program wajib dipilih";
    }

    if (formTim.anggota.length < 2) {
      newErrors.anggota = "Minimal 2 anggota harus ditambahkan";
    }

    formTim.anggota.forEach((item, index) => {
      if (!item.nim || !item.id_user) {
        newErrors[`anggota_${index}`] = "Mahasiswa belum dipilih";
      }
    });

    const nimSet = new Set();
    formTim.anggota.forEach((item, index) => {
      if (item.nim && nimSet.has(item.nim)) {
        newErrors[`anggota_${index}`] = "NIM tidak boleh duplikat";
      }
      nimSet.add(item.nim);
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setAlert("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    setSubmitting(true);
    setAlert("");

    try {
      const payload = {
        nama_tim: formTim.nama_tim.trim(),
        id_program: formTim.id_program.id,
        anggota: formTim.anggota.map((item) => ({
          nim: item.nim,
        })),
      };

      const response = await createTim(payload);

      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: response.message || "Tim berhasil dibuat",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      fetchTimStatus();
    } catch (err) {
      console.error("Error creating tim:", err);
      const errorMessage = err.response?.data?.message || "Gagal membuat tim";
      setAlert(errorMessage);

      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: errorMessage,
        confirmButtonText: "OK",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 0:
        return { label: "Menunggu", color: "warning" };
      case 1:
        return { label: "Disetujui", color: "success" };
      case 2:
        return { label: "Ditolak", color: "error" };
      default:
        return { label: "Unknown", color: "default" };
    }
  };

  if (loading) {
    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <CircularProgress />
        </Box>
      </BodyLayout>
    );
  }

  if (timStatus?.hasTim && timStatus?.isKetua) {
    const allApproved = timDetail?.anggota?.every((item) => item.peran === 1 || item.status === 1);

    return (
      <BodyLayout Sidebar={SidebarMahasiswa}>
        <Box>
          <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
            Anggota Tim
          </Typography>
          <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>
            Detail tim Anda
          </Typography>

          {allApproved && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Semua anggota telah menyetujui undangan. Tim Anda sudah lengkap.
            </Alert>
          )}

          {!allApproved && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Anda sudah mengajukan anggota tim. Menunggu persetujuan anggota.
            </Alert>
          )}

          <Paper sx={{ p: 4 }}>
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Nama Tim
              </Typography>
              <TextField
                fullWidth
                value={timDetail?.nama_tim || ""}
                disabled
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Program
              </Typography>
              <TextField
                fullWidth
                value={timDetail?.keterangan || ""}
                disabled
              />
            </Box>

            <Typography sx={{ fontWeight: 600, mb: 2 }}>
              Daftar Anggota
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>NIM</TableCell>
                    <TableCell>Nama Lengkap</TableCell>
                    <TableCell>Peran</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timDetail?.anggota?.map((item, index) => {
                    const statusInfo = getStatusLabel(item.status);
                    return (
                      <TableRow key={index}>
                        <TableCell>{item.nim}</TableCell>
                        <TableCell>{item.nama_lengkap}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.peran === 1 ? "Ketua" : "Anggota"}
                            color={item.peran === 1 ? "primary" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {item.peran === 1 ? (
                            <Chip label="Otomatis" color="success" size="small" />
                          ) : (
                            <Chip label={statusInfo.label} color={statusInfo.color} size="small" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </BodyLayout>
    );
  }

  return (
    <BodyLayout Sidebar={SidebarMahasiswa}>
      <Box>
        <Typography sx={{ fontSize: 28, fontWeight: 700, mb: 1 }}>
          Anggota Tim
        </Typography>
        <Typography sx={{ fontSize: 14, color: "#777", mb: 4 }}>
          Lengkapi form di bawah ini untuk mengajukan anggota tim
        </Typography>

        {alert && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {alert}
          </Alert>
        )}

        <Paper sx={{ p: 4 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700, mb: 3 }}>
            Pengajuan Anggota Tim
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>
              Nama Tim
            </Typography>
            <TextField
              fullWidth
              placeholder="Masukkan nama tim Anda"
              value={formTim.nama_tim}
              onChange={(e) => {
                setFormTim({ ...formTim, nama_tim: e.target.value });
                setErrors((prev) => ({ ...prev, nama_tim: "" }));
                setAlert("");
              }}
              error={!!errors.nama_tim}
              helperText={errors.nama_tim}
              disabled={submitting}
            />
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>
              Program
            </Typography>
            {loadingProgram ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Autocomplete
                options={programOptions}
                value={formTim.id_program}
                onChange={(e, value) => {
                  setFormTim({ ...formTim, id_program: value });
                  setErrors((prev) => ({ ...prev, id_program: "" }));
                  setAlert("");
                }}
                getOptionLabel={(option) => option.label || ""}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                disabled={submitting}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Pilih program"
                    error={!!errors.id_program}
                    helperText={errors.id_program}
                  />
                )}
              />
            )}
          </Box>

          <Typography sx={{ fontWeight: 600, mb: 2 }}>
            Daftar Anggota
          </Typography>

          {formTim.anggota.map((item, index) => (
            <Box
              key={index}
              sx={{
                mb: 2,
                p: 2,
                border: "1px solid #e0e0e0",
                borderRadius: 2,
                backgroundColor: "#fafafa",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography sx={{ fontWeight: 600 }}>
                  Anggota {index + 1}
                </Typography>
                {formTim.anggota.length > 1 && (
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveAnggota(index)}
                    disabled={submitting}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                )}
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>
                    NIM
                  </Typography>
                  <Autocomplete
                    freeSolo
                    options={searchResults}
                    getOptionLabel={(option) =>
                      typeof option === "string" ? option : option.nim || ""
                    }
                    onInputChange={(e, value) => handleSearchMahasiswa(index, value)}
                    onChange={(e, value) => {
                      if (value && typeof value === "object") {
                        handleSelectMahasiswa(index, value);
                      }
                    }}
                    value={item.nim}
                    disabled={submitting}
                    loading={searching}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Masukkan NIM anggota"
                        error={!!errors[`anggota_${index}`]}
                        helperText={errors[`anggota_${index}`]}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {searching ? <CircularProgress size={20} /> : <Search />}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box>
                          <Typography sx={{ fontWeight: 600 }}>{option.nim}</Typography>
                          <Typography sx={{ fontSize: 12, color: "#666" }}>
                            {option.nama_lengkap}
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: "#999" }}>
                            {option.jenjang} {option.nama_prodi}
                          </Typography>
                        </Box>
                      </li>
                    )}
                  />
                </Box>

                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>
                    Nama Lengkap
                  </Typography>
                  <TextField
                    fullWidth
                    value={item.nama_lengkap}
                    disabled
                    placeholder="Akan otomatis terisi"
                  />
                </Box>
              </Box>
            </Box>
          ))}

          {formTim.anggota.length < 4 && (
            <Button
              startIcon={<Add />}
              onClick={handleAddAnggota}
              disabled={submitting}
              sx={{
                mb: 3,
                textTransform: "none",
                color: "#0D59F2",
              }}
            >
              Tambah Lainnya
            </Button>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              sx={{
                px: 4,
                py: 1.2,
                textTransform: "none",
                fontWeight: 600,
                backgroundColor: "#0D59F2",
                "&:hover": { backgroundColor: "#0846c7" },
              }}
            >
              {submitting ? "Mengajukan..." : "Ajukan Anggota Tim"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </BodyLayout>
  );
}