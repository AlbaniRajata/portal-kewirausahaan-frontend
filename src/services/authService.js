import api from "../api/axios";

const authService = {
  login: async (payload) => {
    const res = await api.post("/auth/login", payload);
    return res.data;
  },

  registerMahasiswa: async (payload) => {
    const res = await api.post("/auth/register/mahasiswa", payload);
    return res.data;
  },

  registerDosen: async (payload) => {
    const res = await api.post("/auth/register/dosen", payload);
    return res.data;
  },
};

export default authService;
