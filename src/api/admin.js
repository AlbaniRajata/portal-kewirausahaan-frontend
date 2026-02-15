import api from "./axios";

export const getMyProgram = async () => {
  const res = await api.get("/admin/program/my");
  return res.data;
};

export const setProgramTimeline = async (id_program, payload) => {
  const res = await api.patch(`/admin/program/${id_program}/timeline`, payload);
  return res.data;
};

export const getTahapProgram = async (id_program) => {
  const res = await api.get(`/admin/program/${id_program}/tahap`);
  return res.data;
};

export const createTahapProgram = async (id_program, payload) => {
  const res = await api.post(`/admin/program/${id_program}/tahap`, payload);
  return res.data;
};

export const updateTahapProgram = async (id_tahap, payload) => {
  const res = await api.patch(`/admin/tahap/${id_tahap}`, payload);
  return res.data;
};

export const deleteTahapProgram = async (id_tahap) => {
  const res = await api.delete(`/admin/tahap/${id_tahap}`);
  return res.data;
};

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

export const getProposalList = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.id_program) params.append('id_program', filters.id_program);
  if (filters.status !== undefined && filters.status !== '') params.append('status', filters.status);

  const res = await api.get(`/admin/proposal?${params.toString()}`);
  return res.data;
};

export const getProposalDetailAdmin = async (id_proposal) => {
  const res = await api.get(`/admin/proposal/${id_proposal}`);
  return res.data;
};

export const getPreviewDistribusi = async (id_program, tahap) => {
  const response = await api.get(
    `/admin/program/${id_program}/distribusi/reviewer/tahap/${tahap}/preview`
  );
  return response.data;
};

export const executeAutoDistribusi = async (id_program, tahap) => {
  const response = await api.post(
    `/admin/program/${id_program}/distribusi/reviewer/tahap/${tahap}/auto`
  );
  return response.data;
};

export const executeBulkDistribusi = async (id_program, tahap, payload) => {
  const response = await api.post(
    `/admin/program/${id_program}/distribusi/reviewer/tahap/${tahap}/bulk`,
    payload
  );
  return response.data;
};

export const getReviewerList = async () => {
  const response = await api.get('/admin/reviewer');
  return response.data;
};

export const getDistribusiHistory = async (id_program, tahap) => {
  const response = await api.get(
    `/admin/program/${id_program}/distribusi/reviewer/tahap/${tahap}/history`
  );
  return response.data;
};

export const getDistribusiDetail = async (id_program, tahap, id_distribusi) => {
  const response = await api.get(
    `/admin/program/${id_program}/distribusi/reviewer/tahap/${tahap}/${id_distribusi}`
  );
  return response.data;
};

export const reassignReviewer = async (id_program, tahap, id_distribusi, id_reviewer_baru) => {
  const response = await api.post(
    `/admin/program/${id_program}/distribusi/reviewer/tahap/${tahap}/${id_distribusi}/reassign`,
    { id_reviewer_baru }
  );
  return response.data;
};

export const getPreviewDistribusiTahap2 = async (id_program) => {
  const response = await api.get(
    `/admin/program/${id_program}/panel/tahap2/preview`
  );
  return response.data;
};

export const executeAutoDistribusiTahap2 = async (id_program) => {
  const response = await api.post(
    `/admin/program/${id_program}/panel/tahap2/auto`
  );
  return response.data;
};

export const executeManualDistribusiTahap2 = async (id_program, payload) => {
  const response = await api.post(
    `/admin/program/${id_program}/panel/tahap2/manual`,
    payload
  );
  return response.data;
};

export const getJuriList = async () => {
  const response = await api.get('/admin/juri');
  return response.data;
};

export const getDistribusiReviewerHistoryTahap2 = async (id_program) => {
  const response = await api.get(
    `/admin/program/${id_program}/distribusi/reviewer/tahap/2/history`
  );
  return response.data;
};

export const getDistribusiJuriHistoryTahap2 = async (id_program) => {
  const response = await api.get(
    `/admin/program/${id_program}/distribusi/juri/tahap/2/history`
  );
  return response.data;
};

export const getRekapDesk = async (id_program, id_proposal) => {
  const res = await api.get(`/admin/program/${id_program}/proposal/${id_proposal}/rekap-desk`);
  return res.data;
};

export const getRekapWawancara = async (id_program, id_proposal) => {
  const res = await api.get(`/admin/program/${id_program}/proposal/${id_proposal}/rekap-wawancara`);
  return res.data;
};

export const finalisasiDeskBatch = async (id_program, payload) => {
  const res = await api.post(`/admin/program/${id_program}/proposal/finalisasi-desk-batch`, payload);
  return res.data;
};

export const finalisasiWawancaraBatch = async (id_program, payload) => {
  const res = await api.post(`/admin/program/${id_program}/proposal/finalisasi-wawancara`, payload);
  return res.data;
};