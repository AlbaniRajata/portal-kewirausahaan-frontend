import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getBeritaPublik } from "../../api/public";
import { getUploadUrl } from "../../utils/fileUrl";

const P = "'Poppins', sans-serif";

const PROGRAMS = [
  {
    idx: "01",
    tag: "PMW",
    name: "Program Mahasiswa Wirausaha",
    desc: "Mendorong mahasiswa mengembangkan jiwa kewirausahaan dengan dukungan pendanaan, mentoring, dan pembimbingan dari dosen berpengalaman.",
    color: "#C8FF00",
  },
  {
    idx: "02",
    tag: "INBIS",
    name: "Inkubator Bisnis",
    desc: "Wadah pengembangan startup mahasiswa menjadi bisnis berkelanjutan melalui program inkubasi intensif bersama praktisi industri.",
    color: "#FF6B35",
  },
];

const STATS = [
  { value: "500+", label: "Mahasiswa Terdaftar" },
  { value: "120+", label: "Proposal Disetujui" },
  { value: "80+",  label: "Bisnis Aktif" },
  { value: "95%",  label: "Tingkat Kepuasan" },
];

const STEPS = [
  { num: "01", title: "Daftar & Lengkapi Biodata",         desc: "Buat akun mahasiswa dan isi data diri serta informasi akademik." },
  { num: "02", title: "Bentuk Tim & Ajukan Proposal",       desc: "Bentuk tim, tulis proposal bisnis, dan unggah ke portal." },
  { num: "03", title: "Penilaian Tahap 1 — Desk Evaluasi",  desc: "Proposal dievaluasi pada tahap pertama oleh reviewer berpengalaman." },
  { num: "04", title: "Penilaian Tahap 2 — Wawancara",      desc: "Proposal terbaik dipresentasikan ke juri untuk mendapat pendanaan." },
];

function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function useCountUp(target, inView, duration = 1600) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const numeric = parseFloat(target.replace(/[^0-9.]/g, ""));
    const start = performance.now();
    const frame = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(ease * numeric));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [inView, target, duration]);
  return count;
}

function Reveal({ children, delay = 0, y = 48 }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "none" : `translateY(${y}px)`,
      transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
    }}>
      {children}
    </div>
  );
}

function StatCount({ value, label, delay }) {
  const [ref, inView] = useInView(0.3);
  const suffix = value.replace(/[0-9.]/g, "");
  const count  = useCountUp(value, inView);
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "none" : "translateY(32px)",
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      borderLeft: "2px solid rgba(255,255,255,0.1)",
      paddingLeft: "clamp(16px,2.5vw,28px)",
    }}>
      <div style={{ fontFamily: P, fontSize: "clamp(36px,5vw,64px)", fontWeight: 800, color: "#C8FF00", lineHeight: 1, letterSpacing: "-2px" }}>
        {count}{suffix}
      </div>
      <div style={{ fontFamily: P, fontSize: "clamp(11px,1.2vw,13px)", fontWeight: 400, color: "rgba(255,255,255,0.45)", marginTop: 8, lineHeight: 1.4 }}>
        {label}
      </div>
    </div>
  );
}

function Modal({ open, onClose, onChoice }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      animation: "mfade .2s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 400, background: "#fff", borderRadius: 24,
        padding: "clamp(24px,5vw,40px)",
        animation: "mslide .3s cubic-bezier(.16,1,.3,1)",
      }}>
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div style={{ fontFamily: P, fontSize: 22, fontWeight: 800, color: "#0a0a14", letterSpacing: "-0.5px", marginBottom: 6 }}>Daftar Sebagai</div>
          <div style={{ fontFamily: P, fontSize: 14, color: "#aaa" }}>Pilih jenis akun yang akan didaftarkan</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { key: "mahasiswa", label: "Mahasiswa", sub: "Ajukan proposal & ikuti program", solid: true },
            { key: "dosen",     label: "Dosen",     sub: "Bimbing & evaluasi proposal",     solid: false },
          ].map(o => (
            <button key={o.key} onClick={() => onChoice(o.key)} style={{
              padding: "16px 20px", borderRadius: 14, cursor: "pointer",
              background: o.solid ? "#0D59F2" : "transparent",
              border: o.solid ? "none" : "1.5px solid rgba(0,0,0,0.1)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              transition: "all .22s", textAlign: "left",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div>
                <div style={{ fontFamily: P, fontSize: 15, fontWeight: 700, color: o.solid ? "#fff" : "#0a0a14", marginBottom: 2 }}>{o.label}</div>
                <div style={{ fontFamily: P, fontSize: 12, color: o.solid ? "rgba(255,255,255,0.6)" : "#aaa" }}>{o.sub}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke={o.solid ? "#fff" : "#0D59F2"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{
          marginTop: 16, width: "100%", padding: "10px", border: "none",
          background: "#DC2626", fontFamily: P, fontSize: 13, fontWeight: 600,
          color: "#fff", cursor: "pointer", borderRadius: 10, transition: "color .2s",
        }}
        >Batal</button>
      </div>
    </div>
  );
}

function ProgramCard({ prog }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 24,
        padding: "clamp(28px,4vw,48px)",
        background: hov ? "#0D59F2" : "#191930",
        border: `1px solid ${hov ? "#0D59F2" : "rgba(255,255,255,0.05)"}`,
        transition: "all .4s cubic-bezier(.16,1,.3,1)",
        transform: hov ? "translateY(-6px)" : "none",
        cursor: "default", position: "relative", overflow: "hidden",
        minHeight: "clamp(260px,30vw,320px)",
      }}
    >
      <div style={{
        position: "absolute", top: 0, right: 0, fontFamily: P, fontWeight: 900,
        fontSize: "clamp(80px,12vw,160px)", lineHeight: 0.85,
        color: hov ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)",
        userSelect: "none", pointerEvents: "none", transition: "color .4s",
      }}>{prog.idx}</div>
      <div style={{
        display: "inline-block", padding: "5px 14px", borderRadius: 999,
        background: hov ? "rgba(255,255,255,0.15)" : `${prog.color}18`,
        color: hov ? "#fff" : prog.color,
        fontFamily: P, fontSize: 11, fontWeight: 700,
        letterSpacing: "2px", textTransform: "uppercase", marginBottom: 20,
        border: `1px solid ${hov ? "rgba(255,255,255,0.2)" : prog.color + "35"}`,
        transition: "all .4s",
      }}>{prog.tag}</div>
      <h3 style={{
        fontFamily: P, fontSize: "clamp(17px,2.2vw,24px)", fontWeight: 800,
        color: "#fff", margin: "0 0 16px", lineHeight: 1.25, position: "relative", letterSpacing: "-0.5px",
      }}>{prog.name}</h3>
      <p style={{
        fontFamily: P, fontSize: "clamp(13px,1.4vw,14px)", fontWeight: 400,
        color: hov ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)",
        lineHeight: 1.8, margin: 0, position: "relative", transition: "color .4s",
      }}>{prog.desc}</p>
      <div style={{
        marginTop: 32, height: 2, borderRadius: 1,
        background: hov ? "rgba(255,255,255,0.3)" : prog.color,
        width: hov ? "60%" : 36,
        transition: "all .4s cubic-bezier(.16,1,.3,1)",
      }}/>
    </div>
  );
}

function StepRow({ step, active, isLast, onClick }) {
  return (
    <div onClick={onClick} style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: "0 16px", cursor: "pointer" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
          background: active ? "#0a0a14" : "#F5F5F8",
          border: `2px solid ${active ? "#0a0a14" : "#E8E8EF"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all .35s cubic-bezier(.16,1,.3,1)",
          boxShadow: active ? "0 4px 20px rgba(0,0,0,0.15)" : "none",
        }}>
          <span style={{ fontFamily: P, fontSize: 11, fontWeight: 800, color: active ? "#C8FF00" : "#aaa" }}>{step.num}</span>
        </div>
        {!isLast && (
          <div style={{
            width: 2, flex: 1, minHeight: 20, marginTop: 4,
            background: active ? "#0a0a14" : "#E8E8EF",
            transition: "background .35s ease", borderRadius: 1,
          }}/>
        )}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : 28, paddingTop: 10 }}>
        <div style={{
          fontFamily: P, fontSize: "clamp(13px,1.4vw,15px)", fontWeight: 700,
          color: active ? "#0a0a14" : "#bbb", marginBottom: 6, lineHeight: 1.35, transition: "color .35s ease",
        }}>{step.title}</div>
        <div style={{
          fontFamily: P, fontSize: 13, fontWeight: 400,
          color: active ? "#666" : "#ccc", lineHeight: 1.7, transition: "color .35s ease",
        }}>{step.desc}</div>
      </div>
    </div>
  );
}

function NewsCard({ b, navigate, fmtDate, imgUrl, strip }) {
  const [hov, setHov] = useState(false);
  const gambar  = imgUrl(b);
  const preview = strip(b.isi);
  const fileName = b.file_gambar || b.foto_berita || b.file_pdf || "";
  const isPdf = /\.pdf$/i.test(fileName);
  return (
    <article
      onClick={() => navigate(`/berita/${b.slug}`)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "#191930", borderRadius: 20, overflow: "hidden",
        border: `1px solid ${hov ? "rgba(200,255,0,0.2)" : "rgba(255,255,255,0.05)"}`,
        transform: hov ? "translateY(-6px)" : "none",
        boxShadow: hov ? "0 20px 60px rgba(0,0,0,0.4)" : "0 2px 12px rgba(0,0,0,0.2)",
        transition: "all .35s cubic-bezier(.16,1,.3,1)",
        cursor: "pointer", display: "flex", flexDirection: "column",
      }}
    >
      <div style={{ height: 200, overflow: "hidden", position: "relative", flexShrink: 0 }}>
        {gambar && !isPdf ? (
          <img src={gambar} alt={b.judul} style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: hov ? "scale(1.06)" : "scale(1)",
            transition: "transform .6s cubic-bezier(.16,1,.3,1)",
          }}/>
        ) : isPdf ? (
          <div style={{
            width: "100%",
            height: "100%",
            background: "linear-gradient(180deg, #2b1320 0%, #191930 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}>
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true">
              <rect x="12" y="8" width="28" height="36" rx="5" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)"/>
              <path d="M22 8v8a2 2 0 0 0 2 2h8" stroke="rgba(255,255,255,0.28)" strokeWidth="2"/>
              <path d="M20 26h12M20 31h12" stroke="#C8FF00" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div style={{
              padding: "4px 10px",
              borderRadius: 999,
              background: "rgba(200,255,0,0.12)",
              color: "#C8FF00",
              fontFamily: P,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "1px",
            }}>PDF</div>
          </div>
        ) : (
          <div style={{ height: "100%", background: "#0f0f24", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="8" width="24" height="16" rx="3" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
              <path d="M10 16h12M10 20h8" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        )}
        <div style={{
          position: "absolute", top: 14, left: 14,
          background: "rgba(10,10,20,0.85)", backdropFilter: "blur(6px)",
          borderRadius: 999, padding: "4px 12px",
          fontFamily: P, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}>{fmtDate(b.created_at)}</div>
      </div>
      <div style={{ padding: "clamp(18px,2.5vw,24px)", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{
          fontFamily: P, fontSize: "clamp(14px,1.5vw,16px)", fontWeight: 700,
          color: "#fff", margin: "0 0 10px", lineHeight: 1.45,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{b.judul}</h3>
        {preview && (
          <p style={{
            fontFamily: P, fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.35)",
            lineHeight: 1.7, margin: "0 0 18px", flex: 1,
            display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>{preview}</p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: P, fontSize: 13, fontWeight: 600, color: "#C8FF00", marginTop: "auto" }}>
          Baca selengkapnya
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7h10M8 3l4 4-4 4" stroke="#C8FF00" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </article>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [berita, setBerita] = useState([]);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [showCursorLight, setShowCursorLight] = useState(true);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    const handleScroll = () => {
      setShowCursorLight(window.scrollY < window.innerHeight * 0.8);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  const [loadingBerita, setLoadingBerita] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setActiveStep(p => (p + 1) % STEPS.length), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    getBeritaPublik({ limit: 6 })
      .then(res => {
        const raw = res.data;
        const data = raw?.data || raw;
        const list = Array.isArray(data) ? data : Array.isArray(data?.berita) ? data.berita : [];
        setBerita(list);
      })
      .catch(() => setBerita([]))
      .finally(() => setLoadingBerita(false));
  }, []);

  const fmtDate = d => d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "";
  const imgUrl  = b => { const f = b.file_gambar || b.foto_berita || null; if (!f) return null; return f.startsWith("http") ? f : getUploadUrl("berita", f); };
  const strip   = h => h ? h.replace(/<[^>]*>/g, "") : "";

  const handleChoice = type => {
    setOpenModal(false);
    navigate(type === "mahasiswa" ? "/daftar/mahasiswa" : "/daftar/dosen");
  };

  return (
    <div style={{ fontFamily: P, overflowX: "hidden", background: "#0a0a14" }}>
       <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,600;1,800&display=swap');
        *,*::before,*::after{box-sizing:border-box;}
        @keyframes mfade{from{opacity:0}to{opacity:1}}
        @keyframes mslide{from{opacity:0;transform:translateY(20px) scale(.97)}to{opacity:1;transform:none}}
        @keyframes hup{from{opacity:0;transform:translateY(60px)}to{opacity:1;transform:none}}
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes orbFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-30px) scale(1.04)}}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        @keyframes skshimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        .hide-scrollbar::-webkit-scrollbar{display:none}
      `}</style>

      <Modal open={openModal} onClose={() => setOpenModal(false)} onChoice={handleChoice} />

      <section style={{
        minHeight: "100svh",
        background: "linear-gradient(160deg,#070b18 0%,#0c1530 40%,#0d1c48 70%,#070b18 100%)",
        padding: "0 clamp(20px,6vw,80px)",
        display: "flex", flexDirection: "column", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        {showCursorLight && (
          <div style={{
            position: "fixed",
            left: cursorPos.x,
            top: cursorPos.y,
            transform: "translate(-50%, -50%)",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle,rgba(200,255,0,0.15) 0%,rgba(200,255,0,0.05) 40%,transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
            transition: "left 0.1s ease-out, top 0.1s ease-out",
          }}/>
        )}
        <div style={{
          position: "absolute", top: "15%", right: "5%",
          width: "clamp(240px,35vw,520px)", height: "clamp(240px,35vw,520px)",
          borderRadius: "50%",
          background: "radial-gradient(circle,rgba(200,255,0,0.07) 0%,transparent 65%)",
          animation: "orbFloat 8s ease-in-out infinite", pointerEvents: "none",
        }}/>
        <div style={{
          position: "absolute", bottom: "10%", left: "2%",
          width: "clamp(140px,20vw,300px)", height: "clamp(140px,20vw,300px)",
          borderRadius: "50%",
          background: "radial-gradient(circle,rgba(13,89,242,0.12) 0%,transparent 65%)",
          animation: "orbFloat 11s ease-in-out infinite reverse", pointerEvents: "none",
        }}/>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)",
          backgroundSize: "clamp(40px,5vw,72px) clamp(40px,5vw,72px)",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%,black 20%,transparent 75%)",
        }}/>

        <div style={{ position: "relative", zIndex: 1, paddingTop: "clamp(80px,10vh,120px)", maxWidth: 1200 }}>
          <div style={{ animation: "hup .9s cubic-bezier(.16,1,.3,1) .05s both" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 32,
              padding: "6px 14px 6px 8px", borderRadius: 999,
              background: "rgba(200,255,0,0.08)", border: "1px solid rgba(200,255,0,0.2)",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C8FF00", animation: "blink 1.4s ease-in-out infinite", display: "inline-block" }}/>
              <span style={{ fontFamily: P, fontSize: 11, fontWeight: 600, color: "#C8FF00", letterSpacing: "2px", textTransform: "uppercase" }}>
                UPA PKK Polinema
              </span>
            </div>
          </div>

          <h1 style={{
            fontFamily: P, fontSize: "clamp(40px,8.5vw,110px)", fontWeight: 900,
            lineHeight: 0.95, letterSpacing: "clamp(-2px,-0.04em,-4px)", margin: "0 0 clamp(24px,3vw,40px)",
            animation: "hup .9s cubic-bezier(.16,1,.3,1) .12s both", color: "#fff",
          }}>
            Portal
            <br/>
            <span style={{
              background: "linear-gradient(90deg,#C8FF00 0%,#8FFF6B 40%,#C8FF00 100%)",
              backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              animation: "shimmer 4s linear infinite", display: "inline-block",
              fontStyle: "italic", fontWeight: 300,
            }}>Kewirausahaan</span>
            <br/>
            <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 300 }}>Kampus</span> Polinema
          </h1>

          <p style={{
            fontFamily: P, fontSize: "clamp(14px,1.5vw,17px)", fontWeight: 400,
            color: "rgba(255,255,255,0.5)", lineHeight: 1.85, maxWidth: 500,
            marginBottom: "clamp(32px,4vw,52px)",
            animation: "hup .9s cubic-bezier(.16,1,.3,1) .22s both",
          }}>
            Wujudkan ide bisnis Anda bersama Program Mahasiswa Wirausaha dan Inkubator Bisnis. Dari proposal hingga pendanaan, kami mendampingi setiap langkah.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", animation: "hup .9s cubic-bezier(.16,1,.3,1) .32s both" }}>
            <button onClick={() => setOpenModal(true)} style={{
              fontFamily: P, fontSize: 14, fontWeight: 700, cursor: "pointer",
              padding: "clamp(12px,1.5vw,15px) clamp(24px,3vw,36px)", borderRadius: 999,
              background: "#C8FF00", border: "none", color: "#0a0a14",
              boxShadow: "0 8px 32px rgba(200,255,0,0.25)", transition: "all .25s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(200,255,0,0.35)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(200,255,0,0.25)"; }}
            >Mulai Pendaftaran</button>
            <button onClick={() => navigate("/login")} style={{
              fontFamily: P, fontSize: 14, fontWeight: 500, cursor: "pointer",
              padding: "clamp(12px,1.5vw,15px) clamp(24px,3vw,36px)", borderRadius: 999,
              background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.7)", transition: "all .25s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
            >Sudah punya akun</button>
          </div>

          <div style={{
            marginTop: "clamp(52px,8vh,100px)",
            marginBottom: "clamp(60px,8vh,120px)",
            display: "flex", gap: "clamp(16px,4vw,56px)", flexWrap: "wrap",
            animation: "hup .9s cubic-bezier(.16,1,.3,1) .42s both",
          }}>
            {STATS.map((s,i) => <StatCount key={i} value={s.value} label={s.label} delay={i * 0.08} />)}
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(200,255,0,0.3),transparent)" }}/>
      </section>

      <div style={{ overflow: "hidden", background: "#0a0a14", padding: "clamp(18px,2.5vw,28px) 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", animation: "marquee 18s linear infinite", whiteSpace: "nowrap", width: "max-content" }}>
          {["PMW","INBIS","Kewirausahaan","Pendanaan","Mentoring","Inkubasi","PMW","INBIS","Kewirausahaan","Pendanaan","Mentoring","Inkubasi"].map((t,i) => (
            <span key={i} style={{
              fontFamily: P, fontSize: "clamp(10px,1.2vw,13px)", fontWeight: 600,
              color: i % 2 === 0 ? "rgba(255,255,255,0.18)" : "#C8FF00",
              letterSpacing: "3px", textTransform: "uppercase",
              padding: "0 clamp(20px,3vw,48px)",
            }}>{t} {i % 3 === 0 ? "✦" : "—"}</span>
          ))}
        </div>
      </div>

      <section style={{ background: "#0f1020", padding: "clamp(60px,8vw,120px) clamp(20px,6vw,80px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Reveal>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 24, marginBottom: "clamp(40px,5vw,72px)" }}>
              <h2 style={{ fontFamily: P, fontSize: "clamp(28px,5vw,64px)", fontWeight: 900, color: "#fff", lineHeight: 0.98, letterSpacing: "-2px", margin: 0 }}>
                Dua jalur<br/>
                <span style={{ color: "rgba(255,255,255,0.25)", fontWeight: 300 }}>menuju</span>{" "}
                <em style={{ color: "#C8FF00", fontWeight: 300 }}>sukses</em>
              </h2>
              <p style={{ fontFamily: P, fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.8, maxWidth: 320, margin: 0 }}>
                Pilih program yang paling sesuai dengan tahap perkembangan bisnis Anda.
              </p>
            </div>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: 20 }}>
            {PROGRAMS.map((prog, i) => (
              <Reveal key={i} delay={i * 0.12}><ProgramCard prog={prog} /></Reveal>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: "#fff", padding: "clamp(60px,8vw,120px) clamp(20px,6vw,80px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: "clamp(40px,6vw,100px)", alignItems: "start" }}>
            <Reveal>
              <div>
                <div style={{
                  display: "inline-block", padding: "5px 14px", borderRadius: 999,
                  background: "#0a0a14", color: "#C8FF00",
                  fontFamily: P, fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 24,
                }}>Cara Kerja</div>
                <h2 style={{ fontFamily: P, fontSize: "clamp(28px,4vw,56px)", fontWeight: 900, color: "#0a0a14", lineHeight: 0.98, letterSpacing: "-2px", margin: "0 0 24px" }}>
                  Empat<br/>langkah<br/><em style={{ color: "#0D59F2", fontWeight: 300 }}>menuju dana</em>
                </h2>
                <p style={{ fontFamily: P, fontSize: 14, color: "#888", lineHeight: 1.85, marginBottom: 40 }}>
                  Proses terstruktur dari pendaftaran hingga keputusan pendanaan, dirancang untuk memaksimalkan potensi proposal Anda.
                </p>
                <button onClick={() => setOpenModal(true)} style={{
                  fontFamily: P, fontSize: 14, fontWeight: 700, cursor: "pointer",
                  padding: "13px 30px", borderRadius: 999,
                  background: "#0a0a14", border: "none", color: "#fff",
                  display: "inline-flex", alignItems: "center", gap: 10, transition: "all .25s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#0D59F2"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#0a0a14"; e.currentTarget.style.transform = "none"; }}
                >
                  Daftar Sekarang
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7h10M8 3l4 4-4 4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {STEPS.map((step, i) => (
                  <StepRow key={i} step={step} active={activeStep === i} isLast={i === STEPS.length - 1} onClick={() => setActiveStep(i)} />
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section style={{ background: "#0f1020", padding: "clamp(60px,8vw,120px) clamp(20px,6vw,80px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Reveal>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 24, marginBottom: "clamp(40px,5vw,72px)" }}>
              <h2 style={{ fontFamily: P, fontSize: "clamp(28px,5vw,64px)", fontWeight: 900, color: "#fff", lineHeight: 0.98, letterSpacing: "-2px", margin: 0 }}>
                Info &amp;<br/><em style={{ color: "#C8FF00", fontWeight: 300 }}>Berita</em>{" "}
                <span style={{ color: "rgba(255,255,255,0.25)", fontWeight: 300 }}>terbaru</span>
              </h2>
            </div>
          </Reveal>
          {loadingBerita ? (
            <div style={{ display: "flex", gap: 20, overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }} className="hide-scrollbar">
              {[1,2,3].map(i => (
                <div key={i} style={{
                  minWidth: 280, height: 320, borderRadius: 20, flexShrink: 0,
                  background: "linear-gradient(90deg,#1a1a2e 25%,#22223a 50%,#1a1a2e 75%)",
                  backgroundSize: "400% 100%", animation: "skshimmer 1.5s infinite",
                }}/>
              ))}
            </div>
          ) : berita.length === 0 ? (
            <Reveal>
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <p style={{ fontFamily: P, fontSize: 15, color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>Belum ada berita yang dipublikasikan</p>
              </div>
            </Reveal>
          ) : (
            <div style={{ display: "flex", gap: 20, overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }} className="hide-scrollbar">
              {berita.map((b, i) => (
                <div key={b.id_berita || i} style={{ minWidth: 280, flexShrink: 0 }}>
                  <NewsCard b={b} navigate={navigate} fmtDate={fmtDate} imgUrl={imgUrl} strip={strip} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ background: "#0a0a14", padding: "clamp(60px,8vw,120px) clamp(20px,6vw,80px)", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: "clamp(300px,60vw,800px)", height: "clamp(300px,60vw,800px)", borderRadius: "50%",
          background: "radial-gradient(circle,rgba(13,89,242,0.15) 0%,transparent 65%)", pointerEvents: "none",
        }}/>
        <Reveal>
          <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
            <h2 style={{ fontFamily: P, fontSize: "clamp(32px,7vw,96px)", fontWeight: 900, color: "#fff", lineHeight: 0.95, letterSpacing: "clamp(-2px,-0.04em,-3px)", margin: "0 0 clamp(16px,2vw,28px)" }}>
              Siap jadi<br/>
              <em style={{
                background: "linear-gradient(90deg,#C8FF00,#8FFF6B,#C8FF00)",
                backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                animation: "shimmer 4s linear infinite", fontWeight: 300,
              }}>wirausahawan</em><br/>berikutnya?
            </h2>
            <p style={{ fontFamily: P, fontSize: "clamp(14px,1.5vw,16px)", color: "rgba(255,255,255,0.45)", lineHeight: 1.85, margin: "0 auto clamp(32px,4vw,56px)", maxWidth: 480 }}>
              Bergabunglah dengan ratusan mahasiswa Polinema yang telah mengembangkan bisnis mereka bersama program kami.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => setOpenModal(true)} style={{
                fontFamily: P, fontSize: "clamp(13px,1.4vw,15px)", fontWeight: 700, cursor: "pointer",
                padding: "clamp(13px,1.5vw,16px) clamp(28px,3.5vw,44px)", borderRadius: 999,
                background: "#C8FF00", border: "none", color: "#0a0a14",
                boxShadow: "0 8px 32px rgba(200,255,0,0.2)", transition: "all .25s",
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 20px 48px rgba(200,255,0,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(200,255,0,0.2)"; }}
              >Daftar Sekarang</button>
              <button onClick={() => navigate("/login")} style={{
                fontFamily: P, fontSize: "clamp(13px,1.4vw,15px)", fontWeight: 500, cursor: "pointer",
                padding: "clamp(13px,1.5vw,16px) clamp(28px,3.5vw,44px)", borderRadius: 999,
                background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.65)", transition: "all .25s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >Masuk ke Akun</button>
            </div>
          </div>
        </Reveal>
      </section>

      <footer style={{ background: "#06060f", padding: "clamp(24px,3.5vw,44px) clamp(20px,6vw,80px)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logoupapkk.svg" alt="Logo PKK" style={{ width: 28, height: 28, borderRadius: 8 }} />
            <span style={{ fontFamily: P, fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>UPA PKK Polinema</span>
          </div>
          <p style={{ fontFamily: P, fontSize: 13, color: "rgba(255,255,255,0.2)", margin: 0 }}>
            © {new Date().getFullYear()} UPA PKK Politeknik Negeri Malang
          </p>
        </div>
      </footer>
    </div>
  );
}