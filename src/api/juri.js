import api from "./axios";

export const getListPenugasan = async (status = null) => {
  const params = new URLSearchParams();
  if (status !== null && status !== '') {
    params.append('status', status);
  }
  
  const res = await api.get(`/juri/penugasan?${params.toString()}`);
  return res.data;
};

export const getDetailPenugasan = async (id_distribusi) => {
  const res = await api.get(`/juri/penugasan/${id_distribusi}`);
  return res.data;
};

export const acceptPenugasan = async (id_distribusi) => {
  const res = await api.patch(`/juri/penugasan/${id_distribusi}/accept`);
  return res.data;
};

export const rejectPenugasan = async (id_distribusi, catatan) => {
  const res = await api.patch(`/juri/penugasan/${id_distribusi}/reject`, { catatan });
  return res.data;
};

export const getFormPenilaian = async (id_distribusi) => {
  const res = await api.get(`/juri/penilaian/${id_distribusi}`);
  return res.data;
};

export const simpanNilai = async (id_distribusi, payload) => {
  const res = await api.post(`/juri/penilaian/${id_distribusi}`, { nilai: payload });
  return res.data;
};

export const submitPenilaian = async (id_distribusi) => {
  const res = await api.post(`/juri/penilaian/${id_distribusi}/submit`);
  return res.data;
};