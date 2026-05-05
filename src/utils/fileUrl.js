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

  if (filename.startsWith("/uploads/")) {
    return filename;
  } else if (filename.startsWith(`/${folder}/`) || filename.startsWith(folder + "/")) {
    const path = filename.startsWith("/") ? filename : `/${filename}`;
    return `/uploads${path}`;
  } else {
    return `/uploads/${folder}/${filename}`;
  }
};
