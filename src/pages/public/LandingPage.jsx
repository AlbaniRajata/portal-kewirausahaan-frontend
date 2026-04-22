import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getBeritaPublik } from "../../api/public";

const BASE_URL = import.meta.env.VITE_API_URL?.replace("/api", "");

const poppins = "'Poppins', sans-serif";

const PROGRAMS = [
  {
    tag: "PMW",
    name: "Program Mahasiswa Wirausaha",
    desc: "Mendorong mahasiswa mengembangkan jiwa kewirausahaan dengan dukungan pendanaan, mentoring, dan pembimbingan dari dosen berpengalaman.",
    accent: "#0D59F2",
  },
  {
    tag: "INBIS",
    name: "Inkubator Bisnis",
    desc: "Wadah pengembangan startup mahasiswa menjadi bisnis berkelanjutan melalui program inkubasi intensif bersama praktisi industri.",
    accent: "#7c3aed",
  },
];

const STATS = [
  { value: "500+", label: "Mahasiswa Terdaftar" },
  { value: "120+", label: "Proposal Disetujui" },
  { value: "80+",  label: "Bisnis Aktif" },
  { value: "95%",  label: "Tingkat Kepuasan" },
];

const STEPS = [
  { num: "01", title: "Daftar & Lengkapi Biodata", desc: "Buat akun mahasiswa dan isi data diri serta informasi akademik." },
  { num: "02", title: "Bentuk Tim & Ajukan Proposal", desc: "Bentuk tim, tulis proposal bisnis, dan unggah ke portal." },
  { num: "03", title: "Penilaian Tahap 1 (Desk Evaluasi)", desc: "Proposal dievaluasi pada tahap pertama oleh reviewer berpengalaman." },
  { num: "04", title: "Penilaian Tahap 2 (Wawancara)", desc: "Proposal terbaik dipresentasikan ke juri dan reviewer untuk mendapat pendanaan." },
];

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function useCountUp(target, inView, duration = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const numeric = parseFloat(target.replace(/[^0-9.]/g, ""));
    const start = performance.now();
    const frame = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(ease * numeric));
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [inView, target, duration]);

  return count;
}

function Reveal({ children, delay = 0, direction = "up" }) {
  const [ref, inView] = useInView();
  const transforms = { up: "translateY(40px)", left: "translateX(-40px)", right: "translateX(40px)" };
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "none" : transforms[direction],
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
    }}>
      {children}
    </div>
  );
}

function StatItem({ value, label, delay }) {
  const [ref, inView] = useInView(0.3);
  const suffix = value.replace(/[0-9.]/g, "");
  const count = useCountUp(value, inView);

  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "none" : "translateY(40px)",
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      textAlign: "center",
    }}>
      <div style={{
        fontFamily: poppins, fontSize: 52, fontWeight: 800,
        color: "#fff", lineHeight: 1, letterSpacing: "-2px",
      }}>
        {count}{suffix}
      </div>
      <div style={{
        fontFamily: poppins, fontSize: 14,
        color: "rgba(255,255,255,0.7)", marginTop: 8, fontWeight: 500,
      }}>
        {label}
      </div>
    </div>
  );
}

function Bubbles({ colorA = "rgba(13,89,242,0.055)", colorB = "rgba(13,89,242,0.032)", large = 260, small = 182 }) {
  return (
    <>
      <div style={{
        position: "absolute", top: -large * 0.08, right: -large * 0.38,
        width: large, height: large, borderRadius: "50%",
        background: colorA, pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "absolute", bottom: -small * 0.14, left: -small * 0.15,
        width: small, height: small, borderRadius: "50%",
        background: colorA, pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "absolute", bottom: -small * 0.32, left: small * 0.18,
        width: small * 0.7, height: small * 0.7, borderRadius: "50%",
        background: colorB, pointerEvents: "none", zIndex: 0,
      }} />
    </>
  );
}

function Navbar({ scrolled, onRegisterClick }) {
  const navigate = useNavigate();
  return (
    <nav style={{
      position: "fixed", top: scrolled ? 12 : 0,
      left: scrolled ? 80 : 0,
      right: scrolled ? 80 : 0,
      zIndex: 1000,
      padding: "0 28px",
      height: 64,
      background: scrolled ? "#ffffff" : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      boxShadow: scrolled
        ? "0 8px 32px -8px rgba(0,0,0,0.14), 0 2px 8px -2px rgba(0,0,0,0.08)"
        : "none",
      border: scrolled ? "1.5px solid rgba(0,0,0,0.08)" : "1.5px solid transparent",
      borderRadius: scrolled ? "20px" : 0,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      transition: [
        "left 0.35s cubic-bezier(0.4,0,0.2,1)",
        "right 0.35s cubic-bezier(0.4,0,0.2,1)",
        "top 0.35s cubic-bezier(0.4,0,0.2,1)",
        "background-color 0.35s ease",
        "box-shadow 0.35s ease",
        "border-radius 0.35s ease",
        "border-color 0.35s ease",
      ].join(", "),
      boxSizing: "border-box",
      fontFamily: poppins,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "linear-gradient(135deg, #0D59F2, #1e40af)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 900, color: "#fff", fontFamily: poppins,
        }}>P</div>
        <span style={{
          fontFamily: poppins, fontSize: 16, fontWeight: 700,
          color: scrolled ? "#0a0a0a" : "#fff",
          transition: "color 0.35s ease",
        }}>PKK Polinema</span>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={() => navigate("/login")} style={{
          background: "transparent",
          border: `1.5px solid ${scrolled ? "#0D59F2" : "rgba(255,255,255,0.7)"}`,
          color: scrolled ? "#0D59F2" : "#fff",
          padding: "8px 22px", borderRadius: 50, cursor: "pointer",
          fontSize: 14, fontWeight: 600, fontFamily: poppins,
          transition: "all 0.3s",
        }}
          onMouseEnter={e => { e.target.style.background = "#0D59F2"; e.target.style.color = "#fff"; e.target.style.borderColor = "#0D59F2"; }}
          onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = scrolled ? "#0D59F2" : "#fff"; e.target.style.borderColor = scrolled ? "#0D59F2" : "rgba(255,255,255,0.7)"; }}
        >
          Masuk
        </button>
        <button onClick={onRegisterClick} style={{
          background: scrolled ? "#0D59F2" : "#fff",
          border: "none", color: scrolled ? "#fff" : "#0D59F2",
          padding: "8px 22px", borderRadius: 50, cursor: "pointer",
          fontSize: 14, fontWeight: 700, fontFamily: poppins,
          boxShadow: "0 4px 15px rgba(13,89,242,0.3)",
          transition: "all 0.3s",
        }}
          onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 25px rgba(13,89,242,0.4)"; }}
          onMouseLeave={e => { e.target.style.transform = "none"; e.target.style.boxShadow = "0 4px 15px rgba(13,89,242,0.3)"; }}
        >
          Daftar Sekarang
        </button>
      </div>
    </nav>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [berita, setBerita] = useState([]);
  const [loadingBerita, setLoadingBerita] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [openRegisterModal, setOpenRegisterModal] = useState(false);

  const handleRegisterChoice = (type) => {
    setOpenRegisterModal(false);
    if (type === "mahasiswa") navigate("/daftar/mahasiswa");
    else if (type === "dosen") navigate("/daftar/dosen");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setActiveStep((p) => (p + 1) % STEPS.length), 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getBeritaPublik({ limit: 6 })
      .then((res) => {
        const raw = res.data;
        const list = Array.isArray(raw) ? raw
          : Array.isArray(raw?.berita) ? raw.berita : [];
        setBerita(list);
      })
      .catch(() => setBerita([]))
      .finally(() => setLoadingBerita(false));
  }, []);

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  };

  const getGambarUrl = (b) => {
    const filename = b.file_gambar || b.foto_berita || null;
    if (!filename) return null;
    if (filename.startsWith("http")) return filename;
    return `/uploads/berita/${filename}`;
  };

  const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "");
  };

  return (
    <div style={{
      fontFamily: poppins,
      overflowX: "hidden",
      background: "linear-gradient(180deg, #020d24 0%, #0a2168 18%, #1553e6 34%, #4f85ff 56%, #3f74e8 70%, #2f62d3 84%, #1f4dbe 92%, #061228 100%)",
    }}>
      <style>{`
        @keyframes float { from { transform: translateY(0) rotate(0deg); } to { transform: translateY(-20px) rotate(10deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: none; } }
        @keyframes pulseGlow { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes skeletonShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      <Navbar scrolled={scrolled} onRegisterClick={() => setOpenRegisterModal(true)} />

      <section style={{
        minHeight: "100vh",
        background: "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden", padding: "0 24px",
      }}>
        <div style={{ position: "absolute", top: "10%", right: "8%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(13,89,242,0.4) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "5%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)", filter: "blur(40px)" }} />

        {[
          { size: 80, top: "20%", left: "10%", delay: 0 },
          { size: 50, top: "60%", right: "12%", delay: 1 },
          { size: 120, bottom: "15%", left: "20%", delay: 0.5 },
          { size: 40, top: "35%", right: "25%", delay: 1.5 },
        ].map((s, i) => (
          <div key={i} style={{
            position: "absolute", width: s.size, height: s.size,
            top: s.top, left: s.left, right: s.right, bottom: s.bottom,
            border: "1.5px solid rgba(255,255,255,0.1)",
            borderRadius: i % 2 === 0 ? "30%" : "50%",
            animation: `float ${3 + i}s ease-in-out infinite alternate`,
            animationDelay: `${s.delay}s`,
          }} />
        ))}

        <div style={{ textAlign: "center", position: "relative", zIndex: 1, maxWidth: 760 }}>
          <div style={{ animation: "fadeUp 0.8s ease forwards", opacity: 0 }}>
            <span style={{
              display: "inline-block", padding: "6px 18px", borderRadius: 50,
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600,
              fontFamily: poppins, marginBottom: 28, letterSpacing: "2px", textTransform: "uppercase",
            }}>
              UPA PKK POLINEMA
            </span>
          </div>

          <div style={{ animation: "fadeUp 0.8s ease 0.15s forwards", opacity: 0 }}>
            <h1 style={{
              fontFamily: poppins, fontSize: "clamp(36px, 6vw, 70px)",
              fontWeight: 800, color: "#fff", margin: "0 0 8px",
              lineHeight: 1.1, letterSpacing: "-2px",
            }}>
              Portal
              <span style={{ color: "#dbeafe", fontStyle: "italic", fontWeight: 600, textShadow: "0 2px 12px rgba(3,10,30,0.45)" }}> Kewirausahaan</span>
            </h1>
            <h1 style={{
              fontFamily: poppins, fontSize: "clamp(36px, 6vw, 70px)",
              fontWeight: 800, color: "#fff", margin: "0 0 28px",
              lineHeight: 1.1, letterSpacing: "-2px",
            }}>
              Kampus Polinema
            </h1>
          </div>

          <div style={{ animation: "fadeUp 0.8s ease 0.3s forwards", opacity: 0 }}>
            <p style={{
              fontFamily: poppins, fontSize: "clamp(14px, 1.8vw, 17px)",
              color: "rgba(255,255,255,0.7)", lineHeight: 1.85,
              margin: "0 auto 40px", maxWidth: 520, fontWeight: 400,
            }}>
              Wujudkan ide bisnis Anda bersama Program Mahasiswa Wirausaha & Program Inkubasi Mahasiswa. Dari proposal hingga pendanaan, kami hadir mendampingi setiap langkah perjalanan wirausaha Anda.
            </p>
          </div>

          <div style={{ animation: "fadeUp 0.8s ease 0.45s forwards", opacity: 0, display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => setOpenRegisterModal(true)} style={{
              padding: "14px 36px", borderRadius: 50, border: "none",
              background: "#fff", color: "#0D59F2",
              fontSize: 14, fontWeight: 700, fontFamily: poppins, cursor: "pointer",
              boxShadow: "0 8px 30px rgba(0,0,0,0.3)", transition: "all 0.3s",
            }}
              onMouseEnter={e => { e.target.style.transform = "translateY(-3px)"; e.target.style.boxShadow = "0 16px 40px rgba(0,0,0,0.4)"; }}
              onMouseLeave={e => { e.target.style.transform = "none"; e.target.style.boxShadow = "0 8px 30px rgba(0,0,0,0.3)"; }}
            >
              Mulai Pendaftaran
            </button>
            <button onClick={() => navigate("/login")} style={{
              padding: "14px 36px", borderRadius: 50, cursor: "pointer",
              background: "transparent", border: "1.5px solid rgba(255,255,255,0.4)",
              color: "#fff", fontSize: 14, fontWeight: 600,
              fontFamily: poppins, transition: "all 0.3s",
            }}
              onMouseEnter={e => { e.target.style.background = "rgba(255,255,255,0.1)"; e.target.style.borderColor = "rgba(255,255,255,0.8)"; }}
              onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.borderColor = "rgba(255,255,255,0.4)"; }}
            >
              Sudah punya akun
            </button>
          </div>
        </div>

        <div style={{
          position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          animation: "pulseGlow 2s ease-in-out infinite",
        }}>
          <span style={{ fontFamily: poppins, color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: "3px", fontWeight: 600 }}>SCROLL</span>
          <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)" }} />
        </div>
      </section>

      <section style={{ background: "transparent", padding: "60px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 40 }}>
          {STATS.map((s, i) => (
            <StatItem key={i} value={s.value} label={s.label} delay={i * 0.1} />
          ))}
        </div>
      </section>

      <section style={{ padding: "100px 24px", background: "#fafafa", position: "relative", overflow: "visible" }}>
        <Bubbles colorA="rgba(13,89,242,0.05)" colorB="rgba(13,89,242,0.028)" large={300} small={210} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <Reveal>
            <div style={{ marginBottom: 60 }}>
              <span style={{ fontFamily: poppins, fontSize: 12, fontWeight: 700, color: "#0D59F2", letterSpacing: "3px", textTransform: "uppercase" }}>Program Kami</span>
              <h2 style={{ fontFamily: poppins, fontSize: "clamp(28px, 3.5vw, 46px)", fontWeight: 800, color: "#0a0a0a", margin: "12px 0 0", lineHeight: 1.15, letterSpacing: "-1px" }}>
                Dua jalur menuju{" "}
                <span style={{ color: "#0D59F2", fontWeight: 300, fontStyle: "italic" }}>wirausaha sukses</span>
              </h2>
            </div>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 28 }}>
            {PROGRAMS.map((p, i) => (
              <Reveal key={i} delay={i * 0.15}>
                <div style={{
                  background: "#fff", borderRadius: 24, padding: "40px 36px",
                  border: "1px solid #f0f0f0",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
                  transition: "all 0.35s ease",
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-8px)"; e.currentTarget.style.boxShadow = `0 20px 60px rgba(13,89,242,0.12)`; e.currentTarget.style.borderColor = p.accent + "40"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.05)"; e.currentTarget.style.borderColor = "#f0f0f0"; }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, marginBottom: 20,
                    background: p.accent + "15",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: p.accent, opacity: 0.8 }} />
                  </div>
                  <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: 50, background: p.accent + "15", color: p.accent, fontSize: 12, fontWeight: 700, fontFamily: poppins, marginBottom: 16 }}>{p.tag}</span>
                  <h3 style={{ fontFamily: poppins, fontSize: 22, fontWeight: 700, color: "#0a0a0a", margin: "0 0 14px", lineHeight: 1.3 }}>{p.name}</h3>
                  <p style={{ fontFamily: poppins, fontSize: 14, color: "#666", lineHeight: 1.8, margin: 0 }}>{p.desc}</p>
                  <div style={{ marginTop: 28, width: 40, height: 3, background: p.accent, borderRadius: 2 }} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "100px 24px", background: "#fff", position: "relative", overflow: "visible" }}>
        <Bubbles colorA="rgba(13,89,242,0.045)" colorB="rgba(13,89,242,0.024)" large={310} small={200} />
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center", position: "relative", zIndex: 1 }}>
          <Reveal direction="left">
            <span style={{ fontFamily: poppins, fontSize: 12, fontWeight: 700, color: "#0D59F2", letterSpacing: "3px", textTransform: "uppercase" }}>Cara Kerja</span>
            <h2 style={{ fontFamily: poppins, fontSize: "clamp(26px, 3vw, 42px)", fontWeight: 800, color: "#0a0a0a", margin: "12px 0 20px", lineHeight: 1.2, letterSpacing: "-1px" }}>
              Empat langkah menuju{" "}
              <span style={{ color: "#0D59F2", fontWeight: 300, fontStyle: "italic" }}>pendanaan</span>
            </h2>
            <p style={{ fontFamily: poppins, fontSize: 14, color: "#888", lineHeight: 1.85, margin: "0 0 36px" }}>
              Proses terstruktur dari pendaftaran hingga keputusan pendanaan, dirancang untuk memaksimalkan potensi proposal Anda.
            </p>
            <button onClick={() => setOpenRegisterModal(true)} style={{
              padding: "13px 32px", borderRadius: 50, border: "none",
              background: "#0D59F2", color: "#fff",
              fontSize: 14, fontWeight: 700, fontFamily: poppins, cursor: "pointer",
              transition: "all 0.3s",
            }}
              onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 10px 30px rgba(13,89,242,0.35)"; }}
              onMouseLeave={e => { e.target.style.transform = "none"; e.target.style.boxShadow = "none"; }}
            >
              Daftar Sekarang
            </button>
          </Reveal>

          <Reveal direction="right">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {STEPS.map((step, i) => (
                <div key={i}
                  onClick={() => setActiveStep(i)}
                  style={{
                    padding: "20px 24px", borderRadius: 16, cursor: "pointer",
                    background: activeStep === i ? "#0D59F2" : "transparent",
                    border: `1.5px solid ${activeStep === i ? "#0D59F2" : "#f0f0f0"}`,
                    transition: "all 0.35s ease", marginBottom: 4,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                    <span style={{ fontFamily: poppins, fontSize: 22, fontWeight: 800, color: activeStep === i ? "rgba(255,255,255,0.3)" : "#e8e8e8", lineHeight: 1, flexShrink: 0 }}>{step.num}</span>
                    <div>
                      <div style={{ fontFamily: poppins, fontSize: 14, fontWeight: 700, color: activeStep === i ? "#fff" : "#0a0a0a", marginBottom: 4 }}>{step.title}</div>
                      <div style={{ fontFamily: poppins, fontSize: 13, color: activeStep === i ? "rgba(255,255,255,0.75)" : "#999", lineHeight: 1.65 }}>{step.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section style={{ padding: "100px 24px", background: "#fafafa", position: "relative", overflow: "visible" }}>
        <Bubbles colorA="rgba(13,89,242,0.04)" colorB="rgba(13,89,242,0.022)" large={260} small={178} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <Reveal>
            <div style={{ marginBottom: 52 }}>
              <span style={{ fontFamily: poppins, fontSize: 12, fontWeight: 700, color: "#0D59F2", letterSpacing: "3px", textTransform: "uppercase" }}>Berita & Informasi</span>
              <h2 style={{ fontFamily: poppins, fontSize: "clamp(28px, 3.5vw, 46px)", fontWeight: 800, color: "#0a0a0a", margin: "12px 0 0", lineHeight: 1.15, letterSpacing: "-1px" }}>
                Info terbaru dari{" "}
                <span style={{ color: "#0D59F2", fontWeight: 300, fontStyle: "italic" }}>program wirausaha</span>
              </h2>
            </div>
          </Reveal>

          {loadingBerita ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{
                  height: 280, borderRadius: 20,
                  background: "linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%)",
                  backgroundSize: "400% 100%",
                  animation: "skeletonShimmer 1.5s infinite",
                }} />
              ))}
            </div>
          ) : berita.length === 0 ? (
            <Reveal>
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0f0f0", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 4, background: "#ddd" }} />
                </div>
                <p style={{ fontFamily: poppins, fontSize: 15, color: "#aaa", fontWeight: 500 }}>Belum ada berita yang dipublikasikan</p>
              </div>
            </Reveal>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
              {berita.map((b, i) => {
                const gambar = getGambarUrl(b);
                const preview = stripHtml(b.isi);
                return (
                  <Reveal key={b.id_berita || i} delay={i * 0.08}>
                    <div
                      onClick={() => navigate(`/berita/${b.slug}`)}
                      style={{
                        background: "#fff", borderRadius: 20, overflow: "hidden",
                        border: "1px solid #f0f0f0",
                        boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
                        transition: "all 0.35s ease", height: "100%",
                        cursor: "pointer",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.1)"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.04)"; }}
                    >
                      {gambar ? (
                        <div style={{ height: 180, overflow: "hidden" }}>
                          <img
                            src={gambar}
                            alt={b.judul}
                            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
                            onMouseEnter={e => { e.target.style.transform = "scale(1.05)"; }}
                            onMouseLeave={e => { e.target.style.transform = "none"; }}
                          />
                        </div>
                      ) : (
                        <div style={{ height: 180, background: "linear-gradient(135deg, #0D59F215, #7c3aed15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(13,89,242,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ width: 20, height: 4, background: "#0D59F240", borderRadius: 2 }} />
                          </div>
                        </div>
                      )}
                      <div style={{ padding: "24px 24px 28px" }}>
                        <h3 style={{ fontFamily: poppins, fontSize: 15, fontWeight: 700, color: "#0a0a0a", margin: "0 0 10px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {b.judul}
                        </h3>
                        {preview && (
                          <p style={{ fontFamily: poppins, fontSize: 13, color: "#888", lineHeight: 1.7, margin: "0 0 16px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {preview}
                          </p>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontFamily: poppins, fontSize: 12, color: "#bbb", fontWeight: 500 }}>{formatDate(b.created_at)}</div>
                          <span style={{ fontFamily: poppins, fontSize: 12, color: "#0D59F2", fontWeight: 600 }}>Baca →</span>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section style={{
        padding: "100px 24px",
        background: "transparent",
        position: "relative", overflow: "visible",
      }}>
        <div style={{ position: "absolute", top: -90, right: -90, width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,0.038)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -70, left: -46, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.032)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -90, left: 124, width: 170, height: 170, borderRadius: "50%", background: "rgba(255,255,255,0.022)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "-30%", right: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(13,89,242,0.3) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <Reveal>
          <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
            <h2 style={{ fontFamily: poppins, fontSize: "clamp(28px, 4.5vw, 56px)", fontWeight: 800, color: "#fff", margin: "0 0 20px", lineHeight: 1.15, letterSpacing: "-1.5px" }}>
              Siap memulai perjalanan{" "}
              <span style={{ color: "#dbeafe", fontWeight: 600, fontStyle: "italic", textShadow: "0 2px 12px rgba(3,10,30,0.45)" }}>wirausaha</span>{" "}Anda?
            </h2>
            <p style={{ fontFamily: poppins, fontSize: 15, color: "rgba(255,255,255,0.65)", margin: "0 0 44px", lineHeight: 1.85 }}>
              Bergabunglah dengan ratusan mahasiswa Polinema yang telah mengembangkan bisnis mereka bersama Program Mahasiswa Wirausaha & Program Inkubasi Mahasiswa.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => setOpenRegisterModal(true)} style={{
                padding: "15px 40px", borderRadius: 50, border: "none",
                background: "#fff", color: "#0D59F2",
                fontSize: 14, fontWeight: 700, fontFamily: poppins, cursor: "pointer",
                boxShadow: "0 8px 30px rgba(0,0,0,0.3)", transition: "all 0.3s",
              }}
                onMouseEnter={e => { e.target.style.transform = "translateY(-3px)"; e.target.style.boxShadow = "0 16px 40px rgba(0,0,0,0.4)"; }}
                onMouseLeave={e => { e.target.style.transform = "none"; e.target.style.boxShadow = "0 8px 30px rgba(0,0,0,0.3)"; }}
              >
                Daftar Sekarang
              </button>
              <button onClick={() => navigate("/login")} style={{
                padding: "15px 40px", borderRadius: 50, cursor: "pointer",
                background: "transparent", border: "1.5px solid rgba(255,255,255,0.35)",
                color: "#fff", fontSize: 14, fontWeight: 600,
                fontFamily: poppins, transition: "all 0.3s",
              }}
                onMouseEnter={e => { e.target.style.background = "rgba(255,255,255,0.1)"; }}
                onMouseLeave={e => { e.target.style.background = "transparent"; }}
              >
                Masuk ke Akun
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      <footer style={{ background: "transparent", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #0D59F2, #1e40af)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#fff", fontFamily: poppins }}>P</div>
          <span style={{ fontFamily: poppins, fontSize: 15, fontWeight: 700, color: "#fff" }}>PKK Polinema</span>
        </div>
        <p style={{ fontFamily: poppins, fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
          {new Date().getFullYear()} UPA PKK Politeknik Negeri Malang. Hak cipta dilindungi.
        </p>
      </footer>

      {openRegisterModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenRegisterModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2, 13, 36, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 2000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 440,
              background: "#fff",
              borderRadius: 20,
              boxShadow: "0 24px 80px rgba(0,0,0,0.15)",
              padding: 32,
            }}
          >
            <h3 style={{ fontFamily: poppins, fontSize: 22, fontWeight: 800, color: "#0a0a0a", margin: "0 0 8px", textAlign: "center" }}>
              Daftar Sebagai
            </h3>
            <p style={{ fontFamily: poppins, fontSize: 14, color: "#999", margin: "0 0 32px", textAlign: "center" }}>
              Pilih jenis akun yang akan didaftarkan
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <button
                onClick={() => handleRegisterChoice("mahasiswa")}
                style={{
                  padding: "14.4px 16px",
                  borderRadius: 14,
                  border: "none",
                  background: "#0D59F2",
                  color: "#fff",
                  fontFamily: poppins,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(13,89,242,0.25)";
                  e.currentTarget.style.backgroundColor = "#0846c7";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.backgroundColor = "#0D59F2";
                }}
              >
                Mahasiswa
              </button>
              <button
                onClick={() => handleRegisterChoice("dosen")}
                style={{
                  padding: "14.4px 16px",
                  borderRadius: 14,
                  border: "1.5px solid #0D59F2",
                  background: "transparent",
                  color: "#0D59F2",
                  fontFamily: poppins,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(13,89,242,0.25)";
                  e.currentTarget.style.backgroundColor = "rgba(13,89,242,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Dosen
              </button>
            </div>

            <button
              onClick={() => setOpenRegisterModal(false)}
              style={{
                marginTop: 24,
                width: "100%",
                padding: "10px 12px",
                border: "none",
                background: "transparent",
                color: "#999",
                fontFamily: poppins,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#555";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#999";
              }}
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}