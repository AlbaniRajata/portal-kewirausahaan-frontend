import api from "./axios";

export const getListPenugasan = async (tahap, status = null) => {
  const params = new URLSearchParams();
  params.append('tahap', tahap);
  if (status !== null && status !== '') {
    params.append('status', status);
  }
  
  const res = await api.get(`/reviewer/penugasan?${params.toString()}`);
  return res.data;
};

export const getDetailPenugasan = async (id_distribusi) => {
  const res = await api.get(`/reviewer/penugasan/${id_distribusi}`);
  return res.data;
};

export const acceptPenugasan = async (id_distribusi) => {
  const res = await api.patch(`/reviewer/penugasan/${id_distribusi}/accept`);
  return res.data;
};

export const rejectPenugasan = async (id_distribusi, catatan) => {
  const res = await api.patch(`/reviewer/penugasan/${id_distribusi}/reject`, { catatan });
  return res.data;
};