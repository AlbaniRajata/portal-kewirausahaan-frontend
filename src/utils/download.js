export const downloadFile = async (filename, folder = "proposal") => {
  const baseUrl = import.meta.env.VITE_API_URL.replace("/api", "");
  const url = `${baseUrl}/uploads/${folder}/${filename}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("File tidak ditemukan");
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Download gagal:", error);
  }
};