import { useState, useEffect } from "react";
import { CircularProgress, Box } from "@mui/material";
import BodyLayout from "../../components/layouts/BodyLayout";
import SidebarMahasiswa from "../../components/layouts/MahasiswaSidebar";
import PengajuanAnggotaPage from "./PengajuanAnggotaPage";
import UndanganAnggotaPage from "./UndanganAnggotaPage";
import { getTimStatus } from "../../api/mahasiswa";

export default function AnggotaTimPage() {
  const [loading, setLoading] = useState(true);
  const [timStatus, setTimStatus] = useState(null);

  useEffect(() => {
    fetchTimStatus();
  }, []);

  const fetchTimStatus = async () => {
    try {
      setLoading(true);
      const response = await getTimStatus();
      setTimStatus(response.data);
    } catch (err) {
      console.error("Error fetching tim status:", err);
    } finally {
      setLoading(false);
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

  if (!timStatus?.hasTim) {
    return <PengajuanAnggotaPage />;
  }

  if (timStatus?.isKetua) {
    return <PengajuanAnggotaPage />;
  }

  if (timStatus?.isAnggota && timStatus?.statusAnggota === 0) {
    return <UndanganAnggotaPage />;
  }

  if (timStatus?.isAnggota && timStatus?.statusAnggota === 1) {
    return <PengajuanAnggotaPage />;
  }

  if (timStatus?.isAnggota && timStatus?.statusAnggota === 2) {
    return <PengajuanAnggotaPage />;
  }

  return <PengajuanAnggotaPage />;
}