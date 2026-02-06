import api from "./axios";

export const getTimStatus = async () => {
  const res = await api.get("/mahasiswa/tim/status");
  return res.data;
};

export const getTimDetail = async () => {
  const res = await api.get("/mahasiswa/tim/detail");
  return res.data;
};

export const createTim = async (payload) => {
  const res = await api.post("/mahasiswa/tim", payload);
  return res.data;
};

export const searchMahasiswa = async (nim) => {
  const res = await api.get(`/mahasiswa/search-mahasiswa?nim=${nim}`);
  return res.data;
};

export const acceptInvite = async (id_tim) => {
  const res = await api.post(`/mahasiswa/tim/${id_tim}/accept`);
  return res.data;
};

export const rejectInvite = async (id_tim, catatan) => {
  const res = await api.post(`/mahasiswa/tim/${id_tim}/reject`, { catatan });
  return res.data;
};