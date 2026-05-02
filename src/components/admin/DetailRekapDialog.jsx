import { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, IconButton, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Divider, Paper,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import {
  getRekapDesk, getRekapWawancara,
  getHistoryDetailTahap1, getHistoryDetailTahap2,
} from "../../api/admin";
import LoadingScreen from "../common/LoadingScreen";

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

const tableHeadCell = {
  fontWeight: 700,
  fontSize: { xs: 11, sm: 12 },
  color: "#374151",
  backgroundColor: "#F8FAFC",
  borderBottom: `2px solid ${COLORS.primaryMuted}`,
  py: 1.5,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const tableBodyRow = {
  "& td": { borderBottom: `1px solid ${COLORS.slateLight}`, py: 1.5 },
  "&:hover": { backgroundColor: "#F8FAFC" },
};

const formatDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

function ReviewerCard({ data }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, mb: 2, borderRadius: "12px", borderColor: COLORS.slateLight, backgroundColor: "#FAFBFF" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
          {data.reviewer?.nama || data.user?.nama}
        </Typography>
        <Typography sx={{ fontSize: 12, color: COLORS.slate }}>
          Submit: {formatDate(data.submitted_at)}
        </Typography>
      </Box>
      <TableContainer sx={{ borderRadius: "10px", border: `1.5px solid ${COLORS.slateLight}` }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={tableHeadCell}>Kriteria</TableCell>
              <TableCell sx={{ ...tableHeadCell, textAlign: "center", width: 80 }}>Bobot</TableCell>
              <TableCell sx={{ ...tableHeadCell, textAlign: "center", width: 80 }}>Skor</TableCell>
              <TableCell sx={{ ...tableHeadCell, textAlign: "right", width: 120 }}>Nilai</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.detail.map((d) => (
              <TableRow key={d.id_kriteria} sx={tableBodyRow} hover>
                <TableCell>
                  <Typography sx={{ fontSize: 13 }}>{d.nama_kriteria}</Typography>
                  {d.catatan && (
                    <Typography sx={{ fontSize: 11, color: COLORS.slate, fontStyle: "italic" }}>
                      Catatan: {d.catatan}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ textAlign: "center" }}><Typography sx={{ fontSize: 13 }}>{d.bobot}</Typography></TableCell>
                <TableCell sx={{ textAlign: "center" }}><Typography sx={{ fontSize: 13 }}>{d.skor}</Typography></TableCell>
                <TableCell sx={{ textAlign: "right" }}><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{d.nilai}</Typography></TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ backgroundColor: COLORS.primaryLight }}>
              <TableCell colSpan={3} sx={{ fontWeight: 700, textAlign: "right", fontSize: 13 }}>TOTAL</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: "right", color: COLORS.primary, fontSize: 15 }}>
                {data.total_nilai}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function EmptyInfo({ text }) {
  return (
    <Box sx={{ p: 2, mb: 2, backgroundColor: COLORS.primaryLight, borderRadius: "12px", border: `1.5px solid ${COLORS.primaryMuted}` }}>
      <Typography sx={{ fontSize: 13, color: COLORS.primaryDark, fontWeight: 600 }}>{text}</Typography>
    </Box>
  );
}

export default function DetailRekapDialog({
  open, onClose, id_program, id_proposal, judul, tahap, isHistory = false,
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!open || !id_proposal) return;
    const fetchRekap = async () => {
      try {
        setLoading(true);
        setData(null);
        setNotFound(false);

        let res;
        if (isHistory) {
          res = tahap === 1
            ? await getHistoryDetailTahap1(id_program, id_proposal)
            : await getHistoryDetailTahap2(id_program, id_proposal);
        } else {
          res = tahap === 1
            ? await getRekapDesk(id_program, id_proposal)
            : await getRekapWawancara(id_program, id_proposal);
        }

        if (res.data) setData(res.data);
        else setNotFound(true);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchRekap();
  }, [open, id_proposal, tahap, id_program, isHistory]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "24px", overflow: "hidden" } }}>
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{
          background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)`,
          p: { xs: 2.5, sm: 3 }, color: "#fff", position: "relative",
        }}>
          <Typography sx={{ fontWeight: 800, fontSize: 18 }}>
            {isHistory ? "History Detail Penilaian" : "Detail Rekap Penilaian"}
          </Typography>
          <Typography sx={{ fontSize: 13, opacity: 0.9, mt: 0.5 }}>{judul}</Typography>
          <IconButton onClick={onClose} sx={{ position: "absolute", right: 16, top: 20, color: "#fff", "&:hover": { backgroundColor: "rgba(255,255,255,0.15)" } }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ px: { xs: 2.5, sm: 4 }, py: 3 }}>
        {loading ? (
          <Box sx={{ position: "relative", minHeight: 240 }}>
            <LoadingScreen message="Memuat detail rekap..." overlay minHeight="240px" />
          </Box>
        ) : notFound ? (
          <EmptyInfo text="Belum ada penilaian yang tersedia untuk proposal ini" />
        ) : !data ? null : tahap === 1 ? (
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography sx={{ fontSize: 15, fontWeight: 700 }}>Penilaian Reviewer</Typography>
            </Box>
            {data.reviewer && data.reviewer.length > 0 ? (
              data.reviewer.map((r) => <ReviewerCard key={r.reviewer?.id_user || r.user?.id_user} data={r} />)
            ) : (
              <EmptyInfo text="Belum ada penilaian reviewer yang disubmit" />
            )}
          </Box>
        ) : (
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>Panel Reviewer</Typography>
            {data.reviewer_panel && data.reviewer_panel.length > 0 ? (
              data.reviewer_panel.map((r) => <ReviewerCard key={r.user?.id_user} data={r} />)
            ) : (
              <EmptyInfo text="Belum ada penilaian reviewer yang disubmit" />
            )}

            <Divider sx={{ my: 3 }} />

            <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>Panel Juri</Typography>
            {data.juri_panel && data.juri_panel.length > 0 ? (
              data.juri_panel.map((j) => <ReviewerCard key={j.user?.id_user} data={j} />)
            ) : (
              <EmptyInfo text="Belum ada penilaian juri yang disubmit" />
            )}

            <Divider sx={{ my: 3 }} />

            <Paper variant="outlined" sx={{ p: 3, backgroundColor: "#f8f9ff", borderRadius: "12px", borderColor: COLORS.slateLight }}>
              <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2.5 }}>Ringkasan Panel</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                {[
                  { label: "Total Reviewer", value: data.total_reviewer ?? 0, bg: COLORS.primaryLight, color: COLORS.primary },
                  { label: "Total Juri", value: data.total_juri ?? 0, bg: COLORS.successLight, color: COLORS.success },
                ].map((item) => (
                  <Box key={item.label} sx={{ textAlign: "center", p: 2.5, backgroundColor: item.bg, borderRadius: "12px" }}>
                    <Typography sx={{ fontSize: 12, color: COLORS.slate, mb: 0.5 }}>{item.label}</Typography>
                    <Typography sx={{ fontSize: 26, fontWeight: 700, color: item.color }}>{item.value}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2.5, sm: 4 }, py: 2.5, backgroundColor: "#F8FAFC", borderTop: `1.5px solid ${COLORS.slateLight}` }}>
        <Button onClick={onClose} variant="contained"
          sx={{ textTransform: "none", borderRadius: "12px", px: 4, fontWeight: 700, backgroundColor: COLORS.primary, boxShadow: "0 4px 12px rgba(13,89,242,0.2)", "&:hover": { backgroundColor: COLORS.primaryDark, boxShadow: "0 6px 16px rgba(13,89,242,0.3)" } }}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
}