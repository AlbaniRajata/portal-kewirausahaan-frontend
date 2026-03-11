import { useState, useEffect } from "react";
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

const tableHeadCell = {
  fontWeight: 700, fontSize: 13, color: "#000",
  backgroundColor: "#fafafa", borderBottom: "2px solid #f0f0f0", py: 1.5,
};

const tableBodyRow = { "& td": { borderBottom: "1px solid #f5f5f5", py: 1.5 } };

const formatDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

function ReviewerCard({ data }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, mb: 2, borderRadius: "12px" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
          {data.reviewer?.nama || data.user?.nama}
        </Typography>
        <Typography sx={{ fontSize: 12, color: "#888" }}>
          Submit: {formatDate(data.submitted_at)}
        </Typography>
      </Box>
      <TableContainer sx={{ borderRadius: "8px", border: "1px solid #f0f0f0" }}>
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
                    <Typography sx={{ fontSize: 11, color: "#888", fontStyle: "italic" }}>
                      Catatan: {d.catatan}
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ textAlign: "center" }}><Typography sx={{ fontSize: 13 }}>{d.bobot}</Typography></TableCell>
                <TableCell sx={{ textAlign: "center" }}><Typography sx={{ fontSize: 13 }}>{d.skor}</Typography></TableCell>
                <TableCell sx={{ textAlign: "right" }}><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{d.nilai}</Typography></TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ backgroundColor: "#e3f2fd" }}>
              <TableCell colSpan={3} sx={{ fontWeight: 700, textAlign: "right", fontSize: 13 }}>TOTAL</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: "right", color: "#0D59F2", fontSize: 15 }}>
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
    <Box sx={{ p: 2, mb: 2, backgroundColor: "#e3f2fd", borderRadius: "12px" }}>
      <Typography sx={{ fontSize: 13, color: "#1565c0" }}>{text}</Typography>
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ pr: 4 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
            {isHistory ? "History Detail Penilaian" : "Detail Rekap Penilaian"}
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#777", mt: 0.5 }}>{judul}</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 12, top: 8, color: "#888" }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ px: 3, py: 3 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
        ) : notFound ? (
          <EmptyInfo text="Belum ada penilaian yang tersedia untuk proposal ini" />
        ) : !data ? null : tahap === 1 ? (
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography sx={{ fontSize: 15, fontWeight: 700 }}>Penilaian Reviewer</Typography>
              {data.rata_rata_nilai != null && (
                <Box sx={{ px: 2, py: 0.75, backgroundColor: "#e3f2fd", borderRadius: "50px" }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0D59F2" }}>
                    Rata-rata: {data.rata_rata_nilai}
                  </Typography>
                </Box>
              )}
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

            <Paper variant="outlined" sx={{ p: 3, backgroundColor: "#f8f9ff", borderRadius: "12px" }}>
              <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2.5 }}>Ringkasan Gabungan</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
                {[
                  { label: "Total Reviewer", value: data.total_reviewer ?? 0, bg: "#e3f2fd", color: "#0D59F2" },
                  { label: "Total Juri", value: data.total_juri ?? 0, bg: "#e8f5e9", color: "#2e7d32" },
                  { label: "Total Gabungan", value: data.total_gabungan ?? 0, bg: "#fff3e0", color: "#e65100" },
                ].map((item) => (
                  <Box key={item.label} sx={{ textAlign: "center", p: 2.5, backgroundColor: item.bg, borderRadius: "12px" }}>
                    <Typography sx={{ fontSize: 12, color: "#666", mb: 0.5 }}>{item.label}</Typography>
                    <Typography sx={{ fontSize: 26, fontWeight: 700, color: item.color }}>{item.value}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained"
          sx={{ textTransform: "none", borderRadius: "50px", px: 4, fontWeight: 600, backgroundColor: "#FDB022", "&:hover": { backgroundColor: "#e09a1a" } }}>
          Tutup
        </Button>
      </DialogActions>
    </Dialog>
  );
}