import api from "./axios";

export const getProfile = async () => {
  const res = await api.get("/reviewer/profile");
  return res.data;
};

export const updateProfile = async (formData) => {
  const res = await api.patch("/reviewer/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updatePassword = async (payload) => {
  const res = await api.put("/reviewer/password", payload);
  return res.data;
};

export const getListPenugasan = async (tahap, status = null) => {
  const params = new URLSearchParams();
  params.append("tahap", tahap);
  if (status !== null && status !== "") {
    params.append("status", status);
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

export const getFormPenilaian = async (id_distribusi) => {
  const res = await api.get(`/reviewer/penilaian/${id_distribusi}`);
  return res.data;
};

export const simpanNilai = async (id_distribusi, payload) => {
  const res = await api.post(`/reviewer/penilaian/${id_distribusi}`, { nilai: payload });
  return res.data;
};

export const submitPenilaian = async (id_distribusi) => {
  const res = await api.post(`/reviewer/penilaian/${id_distribusi}/submit`);
  return res.data;
};

export const resetPenilaian = async (id_distribusi) => {
  const res = await api.post(`/reviewer/penilaian/${id_distribusi}/reset`);
  return res.data;
};

export const getPeringkat = async (tahap) => {
  const res = await api.get(`/reviewer/peringkat?tahap=${tahap}`);
  return res.data;
};

export const bulkSubmitPenilaian = async (id_distribusi_list) => {
  const res = await api.post(`/reviewer/penilaian/bulk-submit`, { id_distribusi_list });
  return res.data;
};

export const deleteProfilePhoto = async () => {
  const res = await api.delete("/reviewer/profile/foto");
  return res.data;
};