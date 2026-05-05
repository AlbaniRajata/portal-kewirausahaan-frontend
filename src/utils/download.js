const getApiBaseUrl = () => {
  const raw = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "";
  if (!raw) return "";
  return raw.replace(/\/api\/v1\/?$/, "").replace(/\/api\/?$/, "").replace(/\/+$/, "");
};

const getCleanName = (value = "") => {
  const withoutQuery = String(value).split("?")[0].split("#")[0];
  return withoutQuery.split("/").filter(Boolean).pop() || "downloaded-file";
};

const buildDownloadUrl = (filename, folder) => {
  const apiBase = getApiBaseUrl();
  const value = String(filename || "").trim();
  if (!value) return null;

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/uploads/")) {
    return `${apiBase}${value}`;
  }

  if (value.startsWith("uploads/")) {
    return `${apiBase}/${value}`;
  }

  const cleanName = getCleanName(value);
  return `${apiBase}/uploads/${folder}/${encodeURIComponent(cleanName)}`;
};

export const downloadFile = async (filename, folder = "proposal") => {
  const url = buildDownloadUrl(filename, folder);
  const cleanName = getCleanName(filename);
  if (!url) return;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("File tidak ditemukan");

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = cleanName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Download gagal:", error);
    window.open(url, "_blank", "noopener,noreferrer");
  }
};