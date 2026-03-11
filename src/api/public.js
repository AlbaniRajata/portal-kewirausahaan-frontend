import api from "./axios";

export const getProfile = async () => {
  const res = await api.get("/public/profile");
  return res.data;
};

export const getAllProdi = async (search = "") => {
  const params = search ? { search } : {};
  const res = await api.get("/public/prodi", { params });
  return res.data;
};

export const getAllProgram = async (search = "") => {
  const params = search ? { search } : {};
  const res = await api.get("/public/program", { params });
  return res.data;
};

export const getAllKategori = async () => {
  const res = await api.get("/public/kategori");
  return res.data;
};

export const getBeritaPublik = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.page) params.append("page", filters.page);
  if (filters.limit) params.append("limit", filters.limit);
  const res = await api.get(`/berita?${params.toString()}`);
  return res.data;
};

export const getBeritaBySlug = async (slug) => {
  const res = await api.get(`/berita/${slug}`);
  return res.data;
};