export const getErrorMessage = (error, fallback = "Terjadi kesalahan. Silahkan coba lagi.") => {
  const isOffline = typeof navigator !== "undefined" && navigator.onLine === false;
  const isNetworkError = error?.code === "ERR_NETWORK" || !error?.response;

  if (isOffline || isNetworkError) {
    return "Tidak ada koneksi internet. Periksa jaringan Anda lalu coba lagi.";
  }

  return error?.response?.data?.message || fallback;
};
