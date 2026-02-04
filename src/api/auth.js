import api from "./axios";

export const registerMahasiswa = async (formData) => {
  const res = await api.post("/auth/register/mahasiswa", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const registerDosen = async (payload) => {
  const res = await api.post("/auth/register/dosen", payload);
  return res.data;
};

export const loginUser = async (payload) => {
  const res = await api.post("/auth/login", payload);
  return res.data;
};
