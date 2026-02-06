import api from "./axios";

export const getAllJurusan = async () => {
  const res = await api.get("/public/jurusan");
  return res.data;
};