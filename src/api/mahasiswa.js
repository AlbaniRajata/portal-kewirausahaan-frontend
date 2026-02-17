import api from "./axios";

export const getProfile = async () => {
  const res = await api.get("/mahasiswa/profile");
  return res.data;
};

export const updateProfile = async (formData) => {
  const res = await api.patch("/mahasiswa/profile", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const updatePassword = async (payload) => {
  const res = await api.put("/mahasiswa/password", payload);
  return res.data;
};

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

export const getProposalStatus = async () => {
  const res = await api.get("/mahasiswa/proposal/status");
  return res.data;
};

export const getProposalDetail = async (id_proposal) => {
  const res = await api.get(`/mahasiswa/proposal/${id_proposal}`);
  return res.data;
};

export const createProposal = async (formData) => {
  const res = await api.post("/mahasiswa/proposal", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateProposal = async (id_proposal, formData) => {
  const res = await api.patch(`/mahasiswa/proposal/${id_proposal}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const submitProposal = async (id_proposal) => {
  const res = await api.post(`/mahasiswa/proposal/${id_proposal}/submit`);
  return res.data;
};

export const getStatusPembimbing = async () => {
  const res = await api.get("/mahasiswa/pembimbing/status");
  return res.data;
};

export const getListDosen = async () => {
  const res = await api.get("/mahasiswa/pembimbing/dosen");
  return res.data;
};

export const ajukanPembimbing = async (payload) => {
  const res = await api.post("/mahasiswa/pembimbing/ajukan", payload);
  return res.data;
};

export const getListBimbingan = async () => {
  const res = await api.get("/mahasiswa/bimbingan");
  return res.data;
};

export const getDetailBimbingan = async (id_bimbingan) => {
  const res = await api.get(`/mahasiswa/bimbingan/${id_bimbingan}`);
  return res.data;
};

export const ajukanBimbingan = async (payload) => {
  const res = await api.post("/mahasiswa/bimbingan/ajukan", payload);
  return res.data;
};