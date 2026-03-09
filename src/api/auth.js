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

export const loginUser = async ({ email, password }) => {
  const res = await api.post("/auth/login", { email, password });
  return res.data;
};

export const logoutUser = async (refreshToken) => {
  const res = await api.post("/auth/logout", { refresh_token: refreshToken });
  return res.data;
};