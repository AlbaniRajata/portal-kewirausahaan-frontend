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

export const verifyEmailKode = async (payload) => {
  const res = await api.post("/auth/verify-email", payload);
  return res.data;
};

export const resendVerificationKode = async (email) => {
  const res = await api.post("/auth/resend-verification", { email });
  return res.data;
};

export const cancelRegistrasi = async (payload) => {
  const res = await api.post("/auth/cancel-registration", payload);
  return res.data;
};

export const forgotPasswordRequest = async (email) => {
  const res = await api.post("/auth/forgot-password", { email });
  return res.data;
};

export const resetPasswordConfirm = async ({ token, new_password }) => {
  const res = await api.post("/auth/reset-password", { token, new_password });
  return res.data;
};