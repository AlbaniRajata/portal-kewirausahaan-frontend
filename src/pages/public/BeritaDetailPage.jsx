import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getBeritaBySlug } from "../../api/public";

const P = "'Poppins', sans-serif";

const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getGambarUrl = (b) => {
  const filename = b?.file_gambar || b?.foto_berita || null;
  if (!filename) return null;
  if (filename.startsWith("http")) return filename;
  return `/uploads/berita/${filename}`;
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
      setNotFound(false);
      const res = await getBeritaBySlug(slug);
      setBerita(res.data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const gambar = getGambarUrl(berita);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#070b18 0%,#0c1530 40%,#0d1c48 70%,#070b18 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          width: 44,
          height: 44,
          border: "3px solid rgba(255,255,255,0.12)",
          borderTopColor: "#C8FF00",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (notFound || !berita) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg,#070b18 0%,#0c1530 40%,#0d1c48 70%,#070b18 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "0 24px",
        fontFamily: P,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 72, fontWeight: 900, color: "rgba(255,255,255,0.18)", letterSpacing: "-3px" }}>
          404
        </div>
        <div style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>
          Berita tidak ditemukan
        </div>
        <button
          onClick={() => navigate("/")}
          style={{
            marginTop: 8,
            padding: "12px 28px",
            borderRadius: 999,
            border: "none",
            background: "#C8FF00",
            color: "#0a0a14",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: P, minHeight: "100vh", background: "#0a0a14", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,600;1,800&display=swap');
        *,*::before,*::after{box-sizing:border-box;}
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
      `}</style>

      <div style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        background:
          "radial-gradient(circle at 20% 20%, rgba(200,255,0,0.08) 0%, transparent 28%), radial-gradient(circle at 80% 10%, rgba(13,89,242,0.14) 0%, transparent 30%)",
      }} />

      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(10,10,20,0.82)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "14px clamp(20px,4vw,40px)",
      }}>
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}>
          <button
            onClick={() => navigate("/")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              color: "rgba(255,255,255,0.65)",
              fontFamily: P,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span style={{ color: "#C8FF00" }}>←</span> Beranda
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <img
              src="/logoupapkk.svg"
              alt="Logo PKK"
              style={{ width: 28, height: 28, borderRadius: 8 }}
            />
            <span style={{
              fontSize: 13,
              fontWeight: 700,
              color: "rgba(255,255,255,0.55)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              UPA PKK Polinema
            </span>
          </div>
        </div>
      </nav>

      <main style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "clamp(32px,5vw,56px) clamp(20px,4vw,40px) clamp(72px,8vw,120px)",
        position: "relative",
        zIndex: 1,
        animation: "fadeUp .6s ease both",
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 18,
          padding: "6px 14px 6px 8px",
          borderRadius: 999,
          background: "rgba(200,255,0,0.08)",
          border: "1px solid rgba(200,255,0,0.18)",
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#C8FF00",
            display: "inline-block",
          }} />
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#C8FF00",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}>
            Info & Berita
          </span>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 14,
            color: "rgba(255,255,255,0.45)",
            fontSize: 12,
            fontWeight: 500,
          }}>
            <span>{formatDate(berita.created_at)}</span>
            {berita.nama_author && (
              <>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.22)" }} />
                <span>{berita.nama_author}</span>
              </>
            )}
          </div>

          <h1 style={{
            fontSize: "clamp(28px,5vw,56px)",
            lineHeight: 1.05,
            letterSpacing: "-2px",
            margin: 0,
            color: "#fff",
            fontWeight: 900,
            maxWidth: 920,
          }}>
            {berita.judul}
          </h1>
        </div>

        {gambar && (
          <div style={{
            borderRadius: 28,
            overflow: "hidden",
            marginBottom: 28,
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
            position: "relative",
          }}>
            <img
              src={gambar}
              alt={berita.judul}
              style={{
                width: "100%",
                maxHeight: 520,
                objectFit: "cover",
                display: "block",
              }}
            />
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(10,10,20,0) 60%, rgba(10,10,20,0.35) 100%)",
            }} />
          </div>
        )}

        <article style={{
          background: "#fff",
          borderRadius: 28,
          padding: "clamp(24px,4vw,52px)",
          boxShadow: "0 18px 70px rgba(0,0,0,0.22)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 24,
            paddingBottom: 18,
            borderBottom: "1px solid #f0f0f4",
          }}>
            <div style={{ color: "#666", fontSize: 13, fontWeight: 600 }}>
              Diperbarui: {formatDate(berita.updated_at || berita.created_at)}
            </div>

            <button
              onClick={() => navigate("/")}
              style={{
                padding: "10px 18px",
                borderRadius: 999,
                border: "1.5px solid #e5e7eb",
                background: "transparent",
                color: "#0a0a14",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Kembali
            </button>
          </div>

          {berita.isi ? (
            <div style={{
              fontSize: 15,
              lineHeight: 2,
              color: "#2b2b2b",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {berita.isi.replace(/<[^>]*>/g, "")}
            </div>
          ) : (
            <p style={{ fontSize: 15, color: "#888", textAlign: "center", margin: 0 }}>
              Konten berita tidak tersedia
            </p>
          )}
        </article>
      </main>
    </div>
  );
}