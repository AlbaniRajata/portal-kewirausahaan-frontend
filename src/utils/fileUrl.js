const getApiBaseUrl = () => {
  const raw = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "";
  if (!raw) return "";
  return raw.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");
};

export const getUploadUrl = (folder, filename) => {
  if (!filename) return null;
  if (filename.startsWith("http://") || filename.startsWith("https://")) return filename;

  let path = filename;
  if (path.startsWith("/uploads/")) {
    return path;
  } else if (path.startsWith(`/${folder}/`) || path.startsWith(folder + "/")) {
    path = path.startsWith("/") ? path : `/${path}`;
    return `/uploads${path}`;
  } else {
    return `/uploads/${folder}/${path}`;
  }
};

export const getDownloadUrl = (folder, filename) => {
  if (!filename) return null;
  if (filename.startsWith("http://") || filename.startsWith("https://")) return filename;

  const base = getApiBaseUrl();
  if (folder === "berita") {
    return `${base}/uploads/berita/download/${encodeURIComponent(filename)}`;
  }

  return `${base}/uploads/${folder}/${encodeURIComponent(filename)}`;
};
