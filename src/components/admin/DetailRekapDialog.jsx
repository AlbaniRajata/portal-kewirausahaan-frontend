import { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, IconButton, CircularProgress,
  Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Divider, Paper, Chip,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { getRekapDesk, getRekapWawancara } from "../../api/admin";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

function ReviewerCard({ data }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
          {data.reviewer?.nama || data.user?.nama}
        </Typography>
        <Typography sx={{ fontSize: 12, color: "#888" }}>
          Submit: {formatDate(data.submitted_at)}
        </Typography>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: 700 }}>Kriteria</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: "center", width: 80 }}>Bobot</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: "center", width: 80 }}>Skor</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: "right", width: 120 }}>Nilai</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.detail.map((d) => (
              <TableRow key={d.id_kriteria} hover>
                <TableCell>
                  <Box>
                    <Typography sx={{ fontSize: 14 }}>{d.nama_kriteria}</Typography>
                    {d.catatan && (
                      <Typography sx={{ fontSize: 12, color: "#888", fontStyle: "italic" }}>
                        Catatan: {d.catatan}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ textAlign: "center" }}>{d.bobot}</TableCell>
                <TableCell sx={{ textAlign: "center" }}>{d.skor}</TableCell>
                <TableCell sx={{ textAlign: "right", fontWeight: 600 }}>{d.nilai}</TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ backgroundColor: "#e3f2fd" }}>
              <TableCell colSpan={3} sx={{ fontWeight: 700, textAlign: "right" }}>
                TOTAL
              </TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: "right", color: "#0D59F2", fontSize: 16 }}>
                {data.total_nilai}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default function DetailRekapDialog({ open, onClose, id_program, id_proposal, judul, tahap }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [alert, setAlert] = useState("");

  useEffect(() => {
    if (!open || !id_proposal) return;

    const fetchRekap = async () => {
      try {
        setLoading(true);
        setAlert("");
        setData(null);

        const res = tahap === 1
          ? await getRekapDesk(id_program, id_proposal)
          : await getRekapWawancara(id_program, id_proposal);

        if (res.data) {
          setData(res.data);
        } else {
          setAlert(res.message || "Belum ada penilaian yang disubmit");
        }
      } catch (err) {
        const msg = err.response?.data?.message || "Gagal memuat rekap penilaian";
        setAlert(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchRekap();
  }, [open, id_proposal, tahap, id_program]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ pr: 4 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
            Detail Rekap Penilaian
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#777", mt: 0.5 }}>
            {judul}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress />
          </Box>
        ) : alert ? (
          <Alert severity="info">{alert}</Alert>
        ) : !data ? null : tahap === 1 ? (
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>
              Penilaian Reviewer
            </Typography>

            {data.reviewer && data.reviewer.length > 0 ? (
              data.reviewer.map((r) => (
                <ReviewerCard key={r.reviewer.id_user} data={r} label="Reviewer" />
              ))
            ) : (
              <Alert severity="info">Belum ada penilaian reviewer yang disubmit</Alert>
            )}
          </Box>
        ) : (
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>
              Panel Reviewer
            </Typography>

            {data.reviewer_panel && data.reviewer_panel.length > 0 ? (
              data.reviewer_panel.map((r) => (
                <ReviewerCard key={r.user.id_user} data={r} label="Reviewer" />
              ))
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>
                Belum ada penilaian reviewer yang disubmit
              </Alert>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>
              Panel Juri
            </Typography>

            {data.juri_panel && data.juri_panel.length > 0 ? (
              data.juri_panel.map((j) => (
                <ReviewerCard key={j.user.id_user} data={j} label="Juri" />
              ))
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>
                Belum ada penilaian juri yang disubmit
              </Alert>
            )}

            <Divider sx={{ my: 3 }} />

            <Paper
              variant="outlined"
              sx={{ p: 2, backgroundColor: "#f8f9ff" }}
            >
              <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>
                Ringkasan Gabungan
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
                <Box sx={{ textAlign: "center", p: 2, backgroundColor: "#e3f2fd", borderRadius: 1 }}>
                  <Typography sx={{ fontSize: 12, color: "#666", mb: 0.5 }}>
                    Total Reviewer
                  </Typography>
                  <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#0D59F2" }}>
                    {data.total_reviewer ?? 0}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center", p: 2, backgroundColor: "#e8f5e9", borderRadius: 1 }}>
                  <Typography sx={{ fontSize: 12, color: "#666", mb: 0.5 }}>
                    Total Juri
                  </Typography>
                  <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#2e7d32" }}>
                    {data.total_juri ?? 0}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center", p: 2, backgroundColor: "#fff3e0", borderRadius: 1 }}>
                  <Typography sx={{ fontSize: 12, color: "#666", mb: 0.5 }}>
                    Total Gabungan
                  </Typography>
                  <Typography sx={{ fontSize: 24, fontWeight: 700, color: "#e65100" }}>
                    {data.total_gabungan ?? 0}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            backgroundColor: "#FDB022",
            "&:hover": { backgroundColor: "#E09A1A" },
            textTransform: "none",
            px: 3,
          }}
        >
          Kembali
        </Button>
      </DialogActions>
    </Dialog>
  );
}