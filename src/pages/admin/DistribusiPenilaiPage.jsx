import { useState, useEffect, useCallback } from "react";
import { Box, Paper, Typography, Tabs, Tab, TextField, MenuItem, useMediaQuery, useTheme } from "@mui/material";
import { TuneOutlined } from "@mui/icons-material";
import BodyLayout from "../../components/layouts/BodyLayout";
import AdminSidebar from "../../components/layouts/AdminSidebar";
import PageTransition from "../../components/PageTransition";
import DistribusiOtomatisTab from "../../components/admin/DistribusiOtomatisTab";
import DistribusiManualTab from "../../components/admin/DistribusiManualTab";
import HistoryDistribusiTable from "../../components/admin/HistoryDistribusiTable";
import { getMyProgram, getTahapProgram } from "../../api/admin";
import Swal from "sweetalert2";

const COLORS = {
  primary:      "#0D59F2",
  primaryLight: "#E0F2FE",
  primaryDark:  "#0369A1",
  primaryMuted: "#93C5FD",
  secondary:    "#2563EB",
  accent:       "#3B82F6",
  slate:        "#64748B",
  slateLight:   "#F1F5F9",
  success:      "#059669",
  successLight: "#ECFDF5",
  warning:      "#D97706",
  warningLight: "#FFFBEB",
  error:        "#DC2626",
  errorLight:   "#ff7070",
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

const tabLabels = {
  1: ["Distribusi Otomatis", "Distribusi Manual", "History Distribusi"],
  2: ["Distribusi Otomatis Panel", "Distribusi Manual Panel", "History Distribusi"],
};

const getProgramDisplayName = (program) => {
  const nama = program?.nama_program?.trim();
  const ket  = program?.keterangan?.trim();
  if (nama && ket && nama.toLowerCase() !== ket.toLowerCase()) return ket;
  return nama || ket || "PENDAFTAR PMW";
};

export default function DistribusiPenilaiPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedTahap, setSelectedTahap] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [programOptions, setProgramOptions] = useState([]);
  const [tahapOptions, setTahapOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyProgram();
      const myProgram = res?.data;
      if (myProgram?.id_program) {
        setProgramOptions([myProgram]);
        setSelectedProgram(myProgram.id_program);

        const tahapRes = await getTahapProgram(myProgram.id_program);
        const mappedTahap = (tahapRes?.data || [])
          .filter((t) => Number(t.urutan) === 1 || Number(t.urutan) === 2)
          .sort((a, b) => Number(a.urutan) - Number(b.urutan))
          .map((t) => {
            const urutan = Number(t.urutan);
            const fallbackNama = urutan === 1 ? "Desk Evaluasi" : "Wawancara";
            const rawNama = t.nama_tahap || fallbackNama;
            const cleanNama = rawNama.replace(/^tahap\s*\d+[\s\-—]*/i, "").trim();
            return {
              value: urutan,
              label: `Tahap ${urutan} — ${cleanNama}`,
            };
          });

        setTahapOptions(mappedTahap);
        setSelectedTahap(mappedTahap[0]?.value || "");
      } else {
        setProgramOptions([]);
        setSelectedProgram("");
        setTahapOptions([]);
        setSelectedTahap("");
      }
    } catch {
      Swal.fire({ icon: "error", title: "Gagal", text: "Gagal memuat daftar program", confirmButtonColor: COLORS.primary });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrograms(); }, [fetchPrograms]);
  useEffect(() => { setActiveTab(0); }, [selectedTahap]);

  const handleDistribusiSuccess = (message) => {
    setRefreshHistory((prev) => prev + 1);
    Swal.fire({ icon: "success", title: "Berhasil", text: message || "Distribusi berhasil!", timer: 2000, timerProgressBar: true, showConfirmButton: false });
  };

  const handleDistribusiError = (message) => {
    Swal.fire({ icon: "error", title: "Gagal", text: message || "Terjadi kesalahan", confirmButtonColor: COLORS.primary });
  };

  return (
    <BodyLayout Sidebar={AdminSidebar}>
      <PageTransition>
        <Box sx={{ px: 1, py: 1 }}>
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: { xs: 26, sm: 32, md: 36 }, fontWeight: 800, color: "#1F2937", mb: 0.5 }}>
              Distribusi Penilai
            </Typography>
            <Typography sx={{ fontSize: { xs: 14, sm: 16 }, color: "#6B7280" }}>
              Kelola distribusi proposal ke penilai untuk setiap tahap penilaian
            </Typography>
          </Box>

          <Paper sx={{
            borderRadius: "20px",
            border: "1.5px solid #E5E7EB",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            overflow: "hidden",
            mb: 3,
          }}>
            <Box sx={{ height: 4, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />

            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#374151", mb: 1.5 }}>
                Filter Program & Tahap
              </Typography>

              <Box sx={{
                display: "flex",
                gap: { xs: 1.25, sm: 2 },
                flexDirection: { xs: "column", lg: "row" },
                alignItems: { xs: "stretch", lg: "center" },
              }}>
              
                <TextField
                  select size="small"
                  value={selectedProgram}
                  disabled
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (v) => (
                      <span style={{ fontSize: 14, color: !v ? "#9CA3AF" : "inherit" }}>
                        {!v ? "Pilih Program" : programOptions.find(p => String(p.id_program) === String(v))
                          ? getProgramDisplayName(programOptions.find(p => String(p.id_program) === String(v)))
                          : v}
                      </span>
                    ),
                  }}
                  sx={{
                    ...roundedField,
                    flex: 1,
                  }}
                >
                  {programOptions.map((prog) => (
                    <MenuItem key={prog.id_program} value={prog.id_program} sx={{ fontSize: 13 }}>
                      {getProgramDisplayName(prog)}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select size="small"
                  value={selectedTahap}
                  onChange={(e) => setSelectedTahap(Number(e.target.value))}
                  disabled={loading || tahapOptions.length === 0}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (v) => (
                      <span style={{ fontSize: 14, color: !v ? "#9CA3AF" : "inherit" }}>
                        {!v ? "Pilih Tahap" : tahapOptions.find(t => t.value === v)?.label || v}
                      </span>
                    ),
                  }}
                  sx={{
                    ...roundedField,
                    flex: 1,
                  }}
                >
                  {tahapOptions.length === 0 && (
                    <MenuItem value="" sx={{ fontSize: 13 }}>Belum ada tahap</MenuItem>
                  )}
                  {tahapOptions.map((tahap) => (
                    <MenuItem key={tahap.value} value={tahap.value} sx={{ fontSize: 13 }}>
                      {tahap.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
          </Paper>

          {!selectedProgram ? (
            <Paper sx={{
              borderRadius: "20px",
              border: "1.5px solid #E5E7EB",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            }}>
              <Box sx={{ height: 4, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
              <Box sx={{ textAlign: "center", py: 12 }}>
                <Box sx={{
                  width: 120, height: 120, borderRadius: "50%",
                  backgroundColor: COLORS.slateLight,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  mx: "auto", mb: 3,
                }}>
                  <TuneOutlined sx={{ fontSize: 52, color: COLORS.primaryMuted }} />
                </Box>
                <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#1F2937", mb: 1 }}>
                  Pilih Program Terlebih Dahulu
                </Typography>
                <Typography sx={{ fontSize: 16, color: COLORS.slate }}>
                  Pilih program untuk melihat dan mengelola distribusi penilai
                </Typography>
              </Box>
            </Paper>
          ) : tahapOptions.length === 0 ? (
            <Paper sx={{
              borderRadius: "20px",
              border: "1.5px solid #E5E7EB",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            }}>
              <Box sx={{ height: 4, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
              <Box sx={{ textAlign: "center", py: 12 }}>
                <Box sx={{
                  width: 120, height: 120, borderRadius: "50%",
                  backgroundColor: COLORS.slateLight,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  mx: "auto", mb: 3,
                }}>
                  <TuneOutlined sx={{ fontSize: 52, color: COLORS.primaryMuted }} />
                </Box>
                <Typography sx={{ fontSize: 22, fontWeight: 800, color: "#1F2937", mb: 1 }}>
                  Tahap Penilaian Belum Diatur
                </Typography>
                <Typography sx={{ fontSize: 16, color: COLORS.slate }}>
                  Atur tahap penilaian di menu Program terlebih dahulu
                </Typography>
              </Box>
            </Paper>
          ) : (
            <Paper sx={{
              borderRadius: "20px",
              border: "1.5px solid #E5E7EB",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            }}>
              <Box sx={{ height: 4, background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})` }} />
              <Box sx={{ borderBottom: `1px solid ${COLORS.slateLight}`, backgroundColor: "#fff" }}>
                <Tabs
                  value={activeTab}
                  onChange={(_, v) => setActiveTab(v)}
                  variant={isMobile ? "scrollable" : "standard"}
                  scrollButtons={isMobile ? "auto" : false}
                  allowScrollButtonsMobile
                  sx={{
                    px: { xs: 1, sm: 2 },
                    "& .MuiTab-root": {
                      textTransform: "none",
                      fontSize: { xs: 13, sm: 14 },
                      fontWeight: 700,
                      color: "#64748B",
                      minHeight: 56,
                      px: { xs: 2, sm: 3 },
                      "&.Mui-selected": { fontWeight: 800, color: COLORS.primary },
                    },
                    "& .MuiTabs-indicator": {
                      backgroundColor: COLORS.primary,
                      height: 3,
                      borderRadius: "3px 3px 0 0",
                    },
                  }}
                >
                  {(tabLabels[selectedTahap] || tabLabels[1]).map((label, i) => (
                    <Tab key={i} label={label} />
                  ))}
                </Tabs>
              </Box>

              <Box sx={{ p: { xs: 2.5, sm: 4 }, minWidth: 0 }}>
                {activeTab === 0 && (
                  <DistribusiOtomatisTab
                    id_program={selectedProgram}
                    tahap={selectedTahap}
                    onSuccess={handleDistribusiSuccess}
                    onError={handleDistribusiError}
                  />
                )}
                {activeTab === 1 && (
                  <DistribusiManualTab
                    id_program={selectedProgram}
                    tahap={selectedTahap}
                    onSuccess={handleDistribusiSuccess}
                    onError={handleDistribusiError}
                  />
                )}
                {activeTab === 2 && (
                  <HistoryDistribusiTable
                    id_program={selectedProgram}
                    tahap={selectedTahap}
                    refresh={refreshHistory}
                    onError={handleDistribusiError}
                    onSuccess={handleDistribusiSuccess}
                  />
                )}
              </Box>
            </Paper>
          )}
        </Box>
      </PageTransition>
    </BodyLayout>
  );
}