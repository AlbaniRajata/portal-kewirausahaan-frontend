import api from "./axios";

export const getPengajuanMasuk = async () => {
  const res = await api.get("/dosen/pembimbing/pengajuan");
  return res.data;
};

export const getDetailPengajuan = async (id_pengajuan) => {
  const res = await api.get(`/dosen/pembimbing/pengajuan/${id_pengajuan}`);
  return res.data;
};

export const approvePengajuan = async (id_pengajuan) => {
  const res = await api.patch(`/dosen/pembimbing/pengajuan/${id_pengajuan}/approve`);
  return res.data;
};

export const rejectPengajuan = async (id_pengajuan, catatan) => {
  const res = await api.patch(`/dosen/pembimbing/pengajuan/${id_pengajuan}/reject`, { catatan });
  return res.data;
};

export const getBimbinganMasuk = async () => {
  const res = await api.get("/dosen/bimbingan/pengajuan");
  return res.data;
};

export const getDetailBimbinganDosen = async (id_bimbingan) => {
  const res = await api.get(`/dosen/bimbingan/pengajuan/${id_bimbingan}`);
  return res.data;
};

export const approveBimbingan = async (id_bimbingan) => {
  const res = await api.patch(`/dosen/bimbingan/pengajuan/${id_bimbingan}/approve`);
  return res.data;
};

export const rejectBimbingan = async (id_bimbingan, catatan) => {
  const res = await api.patch(`/dosen/bimbingan/pengajuan/${id_bimbingan}/reject`, { catatan });
  return res.data;
};