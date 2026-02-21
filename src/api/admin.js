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
  if (filters.status_verifikasi !== undefined) params.append("status_verifikasi", filters.status_verifikasi);
  if (filters.email_verified !== undefined) params.append("email_verified", filters.email_verified);
  if (filters.id_prodi) params.append("id_prodi", filters.id_prodi);
  if (filters.tanggal_dari) params.append("tanggal_dari", filters.tanggal_dari);
  if (filters.tanggal_sampai) params.append("tanggal_sampai", filters.tanggal_sampai);
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
  if (filters.status_verifikasi !== undefined) params.append("status_verifikasi", filters.status_verifikasi);
  if (filters.email_verified !== undefined) params.append("email_verified", filters.email_verified);
  if (filters.id_prodi) params.append("id_prodi", filters.id_prodi);
  if (filters.tanggal_dari) params.append("tanggal_dari", filters.tanggal_dari);
  if (filters.tanggal_sampai) params.append("tanggal_sampai", filters.tanggal_sampai);
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
  if (filters.id_program) params.append("id_program", filters.id_program);
  if (filters.status !== undefined && filters.status !== "") params.append("status", filters.status);
  const res = await api.get(`/admin/proposal?${params.toString()}`);
  return res.data;
};

export const getProposalDetailAdmin = async (id_proposal) => {
  const res = await api.get(`/admin/proposal/${id_proposal}`);
  return res.data;
};

export const getPreviewDistribusi = async (id_program, tahap) => {
  const res = await api.get(`/admin/program/${id_program}/distribusi/reviewer/tahap/${tahap}/preview`);
  return res.data;
};

export const executeAutoDistribusi = async (id_program, tahap) => {
  const res = await api.post(`/admin/program/${id_program}/distribusi/reviewer/tahap/${tahap}/auto`);
  return res.data;
};

export const executeBulkDistribusi = async (id_program, tahap, payload) => {
  const res = await api.post(`/admin/program/${id_program}/distribusi/reviewer/tahap/${tahap}/bulk`, payload);
  return res.data;
};

export const getReviewerList = async () => {
  const res = await api.get("/admin/reviewer");
  return res.data;
};

export const getDistribusiHistory = async (id_program, tahap) => {
  const res = await api.get(`/admin/program/${id_program}/distribusi/reviewer/tahap/${tahap}/history`);
  return res.data;
};

export const getDistribusiDetail = async (id_program, tahap, id_distribusi) => {
  const res = await api.get(`/admin/program/${id_program}/distribusi/reviewer/tahap/${tahap}/${id_distribusi}`);
  return res.data;
};

export const reassignReviewer = async (id_program, tahap, id_distribusi, id_reviewer_baru) => {
  const res = await api.post(`/admin/program/${id_program}/distribusi/reviewer/tahap/${tahap}/${id_distribusi}/reassign`, { id_reviewer_baru });
  return res.data;
};

export const getPreviewDistribusiTahap2 = async (id_program) => {
  const res = await api.get(`/admin/program/${id_program}/panel/tahap2/preview`);
  return res.data;
};

export const executeAutoDistribusiTahap2 = async (id_program) => {
  const res = await api.post(`/admin/program/${id_program}/panel/tahap2/auto`);
  return res.data;
};

export const executeManualDistribusiTahap2 = async (id_program, payload) => {
  const res = await api.post(`/admin/program/${id_program}/panel/tahap2/manual`, payload);
  return res.data;
};

export const getJuriList = async () => {
  const res = await api.get("/admin/juri");
  return res.data;
};

export const getDistribusiReviewerHistoryTahap2 = async (id_program) => {
  const res = await api.get(`/admin/program/${id_program}/distribusi/reviewer/tahap/2/history`);
  return res.data;
};

export const getDistribusiJuriHistoryTahap2 = async (id_program) => {
  const res = await api.get(`/admin/program/${id_program}/distribusi/juri/tahap/2/history`);
  return res.data;
};

export const getListProposalRekapTahap1 = async (id_program) => {
  const res = await api.get(`/admin/program/${id_program}/rekap-tahap1/list`);
  return res.data;
};

export const getListProposalRekapTahap2 = async (id_program) => {
  const res = await api.get(`/admin/program/${id_program}/rekap-tahap2/list`);
  return res.data;
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
  const res = await api.post(`/admin/program/${id_program}/proposal/finalisasi-wawancara-batch`, payload);
  return res.data;
};

export const getDashboardPengajuanPembimbing = async (status = "") => {
  const res = await api.get(`/admin/bimbingan/pengajuan${status ? `?status=${status}` : ""}`);
  return res.data;
};

export const getDashboardBimbingan = async (status = "") => {
  const res = await api.get(`/admin/bimbingan/jadwal${status ? `?status=${status}` : ""}`);
  return res.data;
};

export const getKriteriaPenilaian = async (id_tahap) => {
  const res = await api.get(`/admin/tahap/${id_tahap}/kriteria`);
  return res.data;
};

export const createKriteriaPenilaian = async (id_tahap, payload) => {
  const res = await api.post(`/admin/tahap/${id_tahap}/kriteria`, payload);
  return res.data;
};

export const updateKriteriaPenilaian = async (id_kriteria, payload) => {
  const res = await api.patch(`/admin/kriteria/${id_kriteria}`, payload);
  return res.data;
};

export const deleteKriteriaPenilaian = async (id_kriteria) => {
  const res = await api.delete(`/admin/kriteria/${id_kriteria}`);
  return res.data;
};

export const getKampus = async () => {
  const res = await api.get("/admin/kampus");
  return res.data;
};

export const createKampus = async (payload) => {
  const res = await api.post("/admin/kampus", payload);
  return res.data;
};

export const updateKampus = async (id_kampus, payload) => {
  const res = await api.patch(`/admin/kampus/${id_kampus}`, payload);
  return res.data;
};

export const deleteKampus = async (id_kampus) => {
  const res = await api.delete(`/admin/kampus/${id_kampus}`);
  return res.data;
};

export const getJurusan = async () => {
  const res = await api.get("/admin/jurusan");
  return res.data;
};

export const createJurusan = async (payload) => {
  const res = await api.post("/admin/jurusan", payload);
  return res.data;
};

export const updateJurusan = async (id_jurusan, payload) => {
  const res = await api.patch(`/admin/jurusan/${id_jurusan}`, payload);
  return res.data;
};

export const deleteJurusan = async (id_jurusan) => {
  const res = await api.delete(`/admin/jurusan/${id_jurusan}`);
  return res.data;
};

export const getProdi = async () => {
  const res = await api.get("/admin/prodi");
  return res.data;
};

export const createProdi = async (payload) => {
  const res = await api.post("/admin/prodi", payload);
  return res.data;
};

export const updateProdi = async (id_prodi, payload) => {
  const res = await api.patch(`/admin/prodi/${id_prodi}`, payload);
  return res.data;
};

export const deleteProdi = async (id_prodi) => {
  const res = await api.delete(`/admin/prodi/${id_prodi}`);
  return res.data;
};

export const getKategori = async () => {
  const res = await api.get("/admin/kategori");
  return res.data;
};

export const createKategori = async (payload) => {
  const res = await api.post("/admin/kategori", payload);
  return res.data;
};

export const updateKategori = async (id_kategori, payload) => {
  const res = await api.patch(`/admin/kategori/${id_kategori}`, payload);
  return res.data;
};

export const deleteKategori = async (id_kategori) => {
  const res = await api.delete(`/admin/kategori/${id_kategori}`);
  return res.data;
};

export const getMahasiswaList = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.is_active !== undefined && filters.is_active !== "") params.append("is_active", filters.is_active);
  if (filters.id_prodi) params.append("id_prodi", filters.id_prodi);
  if (filters.status_verifikasi !== undefined && filters.status_verifikasi !== "") params.append("status_verifikasi", filters.status_verifikasi);
  const res = await api.get(`/admin/pengguna/mahasiswa?${params.toString()}`);
  return res.data;
};

export const createMahasiswa = async (payload) => {
  const res = await api.post("/admin/pengguna/mahasiswa", payload);
  return res.data;
};

export const updateMahasiswa = async (id_user, payload) => {
  const res = await api.patch(`/admin/pengguna/mahasiswa/${id_user}`, payload);
  return res.data;
};

export const getDosenList = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.is_active !== undefined && filters.is_active !== "") params.append("is_active", filters.is_active);
  if (filters.id_prodi) params.append("id_prodi", filters.id_prodi);
  if (filters.status_verifikasi !== undefined && filters.status_verifikasi !== "") params.append("status_verifikasi", filters.status_verifikasi);
  const res = await api.get(`/admin/pengguna/dosen?${params.toString()}`);
  return res.data;
};

export const createDosen = async (payload) => {
  const res = await api.post("/admin/pengguna/dosen", payload);
  return res.data;
};

export const updateDosen = async (id_user, payload) => {
  const res = await api.patch(`/admin/pengguna/dosen/${id_user}`, payload);
  return res.data;
};

export const getReviewerListKelola = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.is_active !== undefined && filters.is_active !== "") params.append("is_active", filters.is_active);
  const res = await api.get(`/admin/pengguna/reviewer?${params.toString()}`);
  return res.data;
};

export const createReviewer = async (payload) => {
  const res = await api.post("/admin/pengguna/reviewer", payload);
  return res.data;
};

export const updateReviewer = async (id_user, payload) => {
  const res = await api.patch(`/admin/pengguna/reviewer/${id_user}`, payload);
  return res.data;
};

export const getJuriListKelola = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.is_active !== undefined && filters.is_active !== "") params.append("is_active", filters.is_active);
  const res = await api.get(`/admin/pengguna/juri?${params.toString()}`);
  return res.data;
};

export const createJuri = async (payload) => {
  const res = await api.post("/admin/pengguna/juri", payload);
  return res.data;
};

export const updateJuri = async (id_user, payload) => {
  const res = await api.patch(`/admin/pengguna/juri/${id_user}`, payload);
  return res.data;
};

export const toggleUserActive = async (id_user, is_active) => {
  const res = await api.patch(`/admin/pengguna/${id_user}/toggle-active`, { is_active });
  return res.data;
};

export const resetPassword = async (id_user, payload) => {
  const res = await api.patch(`/admin/pengguna/${id_user}/reset-password`, payload);
  return res.data;
};

export const getTimPesertaProgram = async () => {
  const res = await api.get("/admin/tim-peserta/program");
  return res.data;
};

export const getTimList = async (params = {}) => {
  const res = await api.get("/admin/tim-peserta/tim", { params });
  return res.data;
};

export const getTimDetail = async (id_tim) => {
  const res = await api.get(`/admin/tim-peserta/tim/${id_tim}`);
  return res.data;
};

export const getPesertaList = async (params = {}) => {
  const res = await api.get("/admin/tim-peserta/peserta", { params });
  return res.data;
};

export const getPesertaDetail = async (id_user, id_program) => {
  const res = await api.get(`/admin/tim-peserta/peserta/${id_user}/${id_program}`);
  return res.data;
};