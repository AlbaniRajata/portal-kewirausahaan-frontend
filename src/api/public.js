import api from "./axios";

export const getAllProdi = async (search = "") => {
  const params = search ? { search } : {};
  const res = await api.get("/public/prodi", { params });
  return res.data;
};