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