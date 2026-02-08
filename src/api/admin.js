import api from "./axios";

export const getPendingMahasiswa = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status_verifikasi !== undefined) params.append('status_verifikasi', filters.status_verifikasi);
  if (filters.email_verified !== undefined) params.append('email_verified', filters.email_verified);
  if (filters.id_prodi) params.append('id_prodi', filters.id_prodi);
  if (filters.tanggal_dari) params.append('tanggal_dari', filters.tanggal_dari);
  if (filters.tanggal_sampai) params.append('tanggal_sampai', filters.tanggal_sampai);

  const res = await api.get(`/admin/verifikasi/mahasiswa?${params.toString()}`);
  return res.data;
};

export const getDetailMahasiswa = async (id) => {
  const res = await api.get(`/admin/verifikasi/mahasiswa/${id}`);
  return res.data;
};

export const approveMahasiswa = async (id) => {
  const res = await api.post(`/admin/verifikasi/mahasiswa/${id}/approve`);
  return res.data;
};

export const rejectMahasiswa = async (id, catatan) => {
  const res = await api.post(`/admin/verifikasi/mahasiswa/${id}/reject`, { catatan });
  return res.data;
};

export const getPendingDosen = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status_verifikasi !== undefined) params.append('status_verifikasi', filters.status_verifikasi);
  if (filters.email_verified !== undefined) params.append('email_verified', filters.email_verified);
  if (filters.id_prodi) params.append('id_prodi', filters.id_prodi);
  if (filters.tanggal_dari) params.append('tanggal_dari', filters.tanggal_dari);
  if (filters.tanggal_sampai) params.append('tanggal_sampai', filters.tanggal_sampai);

  const res = await api.get(`/admin/verifikasi/dosen?${params.toString()}`);
  return res.data;
};

export const getDetailDosen = async (id) => {
  const res = await api.get(`/admin/verifikasi/dosen/${id}`);
  return res.data;
};

export const approveDosen = async (id) => {
  const res = await api.post(`/admin/verifikasi/dosen/${id}/approve`);
  return res.data;
};

export const rejectDosen = async (id) => {
  const res = await api.post(`/admin/verifikasi/dosen/${id}/reject`);
  return res.data;
};

export const setProgramTimeline = async (id_program, data) => {
  const res = await api.patch(`/admin/program/${id_program}/timeline`, data);
  return res.data;
};