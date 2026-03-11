import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBeritaBySlug } from "../../api/public";

const BASE_URL = import.meta.env.VITE_API_URL?.replace("/api", "");
const poppins = "'Poppins', sans-serif";

const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
};

const getGambarUrl = (b) => {
  const filename = b?.file_gambar || b?.foto_berita || null;
  if (!filename) return null;
  if (filename.startsWith("http")) return filename;
  return `${BASE_URL}/uploads/berita/${filename}`;
};

export default function BeritaDetailPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [berita, setBerita] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getBeritaBySlug(slug);
      setBerita(res.data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const gambar = getGambarUrl(berita);

  if (loading) {
    return (
      <div style={{ fontFamily: poppins, minHeight: "100vh", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #e0e0e0", borderTopColor: "#0D59F2", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (notFound || !berita) {
    return (
      <div style={{ fontFamily: poppins, minHeight: "100vh", background: "#fafafa", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 24px" }}>
        <div style={{ fontSize: 64, fontWeight: 800, color: "#e0e0e0", fontFamily: poppins }}>404</div>
        <p style={{ fontSize: 16, color: "#888", fontFamily: poppins, margin: 0 }}>Berita tidak ditemukan</p>
        <button onClick={() => navigate("/")} style={{
          padding: "10px 28px", borderRadius: 50, border: "none",
          background: "#0D59F2", color: "#fff", fontSize: 14, fontWeight: 600,
          fontFamily: poppins, cursor: "pointer",
        }}>
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: poppins, minHeight: "100vh", background: "#fafafa" }}>
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }`}</style>

      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        padding: "14px 40px", display: "flex", alignItems: "center", gap: 16,
        boxSizing: "border-box",
      }}>
        <button onClick={() => navigate("/")} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "transparent", border: "none", cursor: "pointer",
          fontSize: 13, fontWeight: 600, color: "#888", fontFamily: poppins,
          padding: 0, transition: "color 0.2s",
        }}
          onMouseEnter={e => { e.currentTarget.style.color = "#0D59F2"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#888"; }}
        >
          ← Beranda
        </button>
        <span style={{ color: "#e0e0e0" }}>/</span>
        <span style={{ fontSize: 13, color: "#aaa", fontFamily: poppins, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>
          {berita.judul}
        </span>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px 100px", animation: "fadeUp 0.6s ease forwards" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: poppins, fontSize: 12, color: "#bbb", fontWeight: 500, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <span>{formatDate(berita.created_at)}</span>
            {berita.nama_author && (
              <>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#ddd", display: "inline-block" }} />
                <span>{berita.nama_author}</span>
              </>
            )}
          </div>

          <h1 style={{
            fontFamily: poppins, fontSize: "clamp(24px, 4vw, 42px)",
            fontWeight: 800, color: "#0a0a0a", margin: "0 0 0",
            lineHeight: 1.25, letterSpacing: "-1px",
          }}>
            {berita.judul}
          </h1>
        </div>

        {gambar && (
          <div style={{ borderRadius: 20, overflow: "hidden", marginBottom: 40, boxShadow: "0 8px 40px rgba(0,0,0,0.12)" }}>
            <img
              src={gambar}
              alt={berita.judul}
              style={{ width: "100%", maxHeight: 440, objectFit: "cover", display: "block" }}
            />
          </div>
        )}

        <div style={{
          background: "#fff", borderRadius: 20, padding: "40px 44px",
          border: "1px solid #f0f0f0", boxShadow: "0 2px 20px rgba(0,0,0,0.04)",
        }}>
          {berita.isi ? (
            <div
              style={{
                fontFamily: poppins, fontSize: 15, color: "#333",
                lineHeight: 1.9, whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {berita.isi.replace(/<[^>]*>/g, "")}
            </div>
          ) : (
            <p style={{ fontFamily: poppins, fontSize: 15, color: "#aaa", textAlign: "center", margin: 0 }}>
              Konten berita tidak tersedia
            </p>
          )}
        </div>

        <div style={{ marginTop: 48, paddingTop: 32, borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => navigate("/")} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 24px", borderRadius: 50,
            border: "1.5px solid #e0e0e0", background: "transparent",
            fontSize: 13, fontWeight: 600, color: "#666",
            fontFamily: poppins, cursor: "pointer", transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#0D59F2"; e.currentTarget.style.color = "#0D59F2"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#e0e0e0"; e.currentTarget.style.color = "#666"; }}
          >
            ← Kembali ke Beranda
          </button>
          <div style={{ fontFamily: poppins, fontSize: 12, color: "#bbb" }}>
            Diperbarui: {formatDate(berita.updated_at || berita.created_at)}
          </div>
        </div>
      </div>
    </div>
  );
}