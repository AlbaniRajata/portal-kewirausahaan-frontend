import api from "./axios";

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