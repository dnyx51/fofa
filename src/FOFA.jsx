import React, { useEffect, useRef, useState } from "react";

// ============================================================================
// FOFA — Football Open For All
// A single-page idealistic narrative on football as the language between us.
// ============================================================================

const COLORS = {
  bg: "#080C08",
  bgSoft: "#0E140E",
  green: "#1AFF6E",
  greenDeep: "#0D8F3C",
  body: "#C8D4C0",
  gold: "#C8A84B",
  teal: "#1AC8C8",
  hairline: "rgba(200, 212, 192, 0.08)",
};

// ----------------------------------------------------------------------------
// FOFA Logo — uses the brand PNG (fan-in-armchair design recolored to greens)
// File lives at /public/fofa-logo.png and is served from the site root.
// ----------------------------------------------------------------------------
function FofaMark({ size = 22 }) {
  return (
    <img
      src="/fofa-logo.png"
      alt="FOFA — Football Open For All"
      style={{
        height: size,
        width: "auto",
        display: "block",
      }}
    />
  );
}

// ----------------------------------------------------------------------------
// Reveal — fades children in on scroll
// ----------------------------------------------------------------------------
function Reveal({ children, delay = 0, y = 24, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : `translateY(${y}px)`,
        transition: `opacity 1.4s cubic-bezier(.2,.7,.2,1) ${delay}ms, transform 1.4s cubic-bezier(.2,.7,.2,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Subtle starfield / grain background for the hero
// ----------------------------------------------------------------------------
function HeroAtmosphere() {
  const stars = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < 80; i++) {
      arr.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        r: Math.random() * 1.2 + 0.2,
        o: Math.random() * 0.5 + 0.1,
        d: Math.random() * 4 + 2,
      });
    }
    return arr;
  }, []);
  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <defs>
        <radialGradient id="glow" cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor={COLORS.green} stopOpacity="0.10" />
          <stop offset="40%" stopColor={COLORS.green} stopOpacity="0.03" />
          <stop offset="100%" stopColor={COLORS.bg} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#glow)" />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.1} fill="#F2F5EE" opacity={s.o}>
          <animate attributeName="opacity" values={`${s.o};${s.o * 0.2};${s.o}`} dur={`${s.d}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

// ----------------------------------------------------------------------------
// Section Number — large, ghosted chapter marker
// ----------------------------------------------------------------------------
function ChapterMark({ num, label }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 32 }}>
      <span
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          letterSpacing: "0.3em",
          color: COLORS.gold,
          textTransform: "uppercase",
        }}
      >
        Chapter {num}
      </span>
      <span style={{ flex: 1, height: 1, background: COLORS.hairline }} />
      <span
        style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          letterSpacing: "0.3em",
          color: COLORS.body,
          opacity: 0.6,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Pitch Lines — decorative SVG of a football pitch, faintly drawn
// ----------------------------------------------------------------------------
function PitchLines({ opacity = 0.18 }) {
  return (
    <svg viewBox="0 0 600 380" style={{ width: "100%", height: "auto", opacity }} fill="none">
      <rect x="10" y="10" width="580" height="360" stroke={COLORS.green} strokeWidth="0.8" />
      <line x1="300" y1="10" x2="300" y2="370" stroke={COLORS.green} strokeWidth="0.8" />
      <circle cx="300" cy="190" r="50" stroke={COLORS.green} strokeWidth="0.8" />
      <circle cx="300" cy="190" r="2" fill={COLORS.green} />
      <rect x="10" y="115" width="80" height="150" stroke={COLORS.green} strokeWidth="0.8" />
      <rect x="510" y="115" width="80" height="150" stroke={COLORS.green} strokeWidth="0.8" />
      <rect x="10" y="155" width="30" height="70" stroke={COLORS.green} strokeWidth="0.8" />
      <rect x="560" y="155" width="30" height="70" stroke={COLORS.green} strokeWidth="0.8" />
    </svg>
  );
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------
export default function FOFA() {
  return (
    <div
      style={{
        background: COLORS.bg,
        color: COLORS.body,
        fontFamily: "'Crimson Pro', Georgia, serif",
        minHeight: "100vh",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,500;1,400&family=DM+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: ${COLORS.bg}; }

        ::selection { background: ${COLORS.green}; color: ${COLORS.bg}; }

        .display {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.01em;
          line-height: 0.92;
        }

        .label {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
        }

        .prose {
          font-family: 'Crimson Pro', Georgia, serif;
          font-weight: 300;
          line-height: 1.6;
          font-size: 19px;
          color: ${COLORS.body};
        }

        .nav-link {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: ${COLORS.body};
          text-decoration: none;
          opacity: 0.7;
          transition: opacity 0.3s, color 0.3s;
        }
        .nav-link:hover { opacity: 1; color: ${COLORS.green}; }

        .grain {
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0.04;
          z-index: 100;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>");
          mix-blend-mode: overlay;
        }

        @keyframes drift {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(2%, -1%); }
        }

        @keyframes pulse-soft {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.9; }
        }

        .ball-pulse { animation: pulse-soft 3s ease-in-out infinite; }

        .cta {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: ${COLORS.bg};
          background: ${COLORS.green};
          padding: 18px 32px;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(.2,.7,.2,1);
        }
        .cta:hover { background: #fff; transform: translateY(-2px); }

        .cta-ghost {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: ${COLORS.body};
          background: transparent;
          padding: 18px 32px;
          text-decoration: none;
          border: 1px solid ${COLORS.hairline};
          cursor: pointer;
          transition: all 0.3s;
        }
        .cta-ghost:hover { border-color: ${COLORS.green}; color: ${COLORS.green}; }

        .ambassador-card {
          padding: 32px;
          border: 1px solid ${COLORS.hairline};
          background: linear-gradient(180deg, rgba(255,255,255,0.015) 0%, transparent 100%);
          transition: all 0.5s cubic-bezier(.2,.7,.2,1);
          position: relative;
          overflow: hidden;
        }
        .ambassador-card:hover {
          border-color: ${COLORS.gold};
          transform: translateY(-4px);
        }
        .ambassador-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, ${COLORS.gold}, transparent);
          opacity: 0;
          transition: opacity 0.5s;
        }
        .ambassador-card:hover::before { opacity: 0.7; }

        .pillar {
          padding: 40px 0;
          border-top: 1px solid ${COLORS.hairline};
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 64px !important; }
          .chapter-title { font-size: 48px !important; }
          .closing-title { font-size: 56px !important; }
          .container { padding-left: 24px !important; padding-right: 24px !important; }
          .ambassador-grid { grid-template-columns: 1fr !important; }
          .pillar-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .nav-links { display: none !important; }
        }
      `}</style>

      <div className="grain" />

      {/* ============================================================ */}
      {/* NAVIGATION                                                    */}
      {/* ============================================================ */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: "24px 48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(180deg, rgba(8,12,8,0.85) 0%, rgba(8,12,8,0) 100%)",
          backdropFilter: "blur(8px)",
        }}
      >
        <FofaMark size={36} />
        <div className="nav-links" style={{ display: "flex", gap: 40 }}>
          <a href="#origin" className="nav-link">I. Origin</a>
          <a href="#development" className="nav-link">II. Development</a>
          <a href="#unity" className="nav-link">III. Unity</a>
          <a href="#join" className="nav-link">Join</a>
          <a href="#clubs/apply" className="nav-link">For Clubs</a>
        </div>
      </nav>

      {/* ============================================================ */}
      {/* HERO                                                          */}
      {/* ============================================================ */}
      <section
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "120px 48px 80px",
          overflow: "hidden",
        }}
      >
        <HeroAtmosphere />

        <div className="container" style={{ position: "relative", maxWidth: 1280, margin: "0 auto", width: "100%" }}>
          <Reveal delay={200}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 48 }}>
              <span style={{ width: 40, height: 1, background: COLORS.gold }} />
              <span className="label" style={{ color: COLORS.gold }}>
                A Letter to Anyone Who Has Ever Loved the Game
              </span>
            </div>
          </Reveal>

          <Reveal delay={400}>
            <h1
              className="display hero-title"
              style={{
                fontSize: "clamp(64px, 11vw, 168px)",
                color: "#F2F5EE",
                margin: "0 0 48px",
                maxWidth: "12ch",
              }}
            >
              Football is the
              <br />
              <span style={{ color: COLORS.green }}>language</span>
              <br />
              between us.
            </h1>
          </Reveal>

          <Reveal delay={700}>
            <p className="prose" style={{ maxWidth: 620, fontSize: 22, marginBottom: 56 }}>
              Before we share a tongue, before we share a flag, we share a ball. A pitch drawn in dust.
              A goal made of two stones. A roar that rises in any city, in any tongue, when the net moves.
              <br /><br />
              <span style={{ color: "#F2F5EE", fontStyle: "italic" }}>
                FOFA is built for the people who already know this.
              </span>
            </p>
          </Reveal>

          <Reveal delay={900}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              <a href="#origin" className="cta">
                Begin the Story
                <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
                  <path d="M0 5 L18 5 M14 1 L18 5 L14 9" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </a>
              <a href="#join" className="cta-ghost">Join FOFA</a>
            </div>
          </Reveal>
        </div>

        {/* Scroll cue */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            opacity: 0.5,
          }}
        >
          <span className="label" style={{ fontSize: 9 }}>Scroll</span>
          <div style={{ width: 1, height: 40, background: COLORS.body, opacity: 0.4 }} />
        </div>
      </section>

      {/* ============================================================ */}
      {/* CHAPTER I — ORIGIN / GRASSROOTS                              */}
      {/* ============================================================ */}
      <section id="origin" style={{ padding: "160px 48px", position: "relative" }}>
        <div className="container" style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Reveal>
            <ChapterMark num="I" label="Where the Grassroots Are From" />
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 80, alignItems: "start" }}>
            <div>
              <Reveal delay={100}>
                <h2
                  className="display chapter-title"
                  style={{
                    fontSize: "clamp(48px, 7vw, 104px)",
                    color: "#F2F5EE",
                    margin: "0 0 48px",
                  }}
                >
                  Every story
                  <br />
                  begins on
                  <br />
                  <span style={{ color: COLORS.green, fontStyle: "italic", fontWeight: 700 }}>uneven ground.</span>
                </h2>
              </Reveal>

              <Reveal delay={300}>
                <p className="prose" style={{ maxWidth: 560, marginBottom: 32 }}>
                  A favela in Rio. A backstreet in Lagos. A frozen field in Reykjavík. A car park in Manchester.
                  Football does not begin in stadiums. It begins in the places no one is watching, with the people
                  no one yet knows.
                </p>
              </Reveal>

              <Reveal delay={500}>
                <p className="prose" style={{ maxWidth: 560, marginBottom: 32 }}>
                  Grassroots are not a category. They are a covenant — that the kid with worn shoes and a wild
                  imagination matters as much as the legend on the screen. That the local coach who shows up at
                  six on a Sunday morning is part of the same game as a Champions League final.
                </p>
              </Reveal>

              <Reveal delay={700}>
                <p className="prose" style={{ maxWidth: 560, color: "#F2F5EE", fontStyle: "italic" }}>
                  FOFA exists to honour that covenant. To remember that the roots come first.
                </p>
              </Reveal>
            </div>

            {/* Right column: visual */}
            <Reveal delay={400}>
              <div style={{ position: "relative", paddingTop: 40 }}>
                <div style={{ marginBottom: 32 }}>
                  <PitchLines opacity={0.22} />
                </div>
                <div
                  style={{
                    border: `1px solid ${COLORS.hairline}`,
                    padding: 32,
                    background: "rgba(255,255,255,0.015)",
                  }}
                >
                  <div className="label" style={{ color: COLORS.gold, marginBottom: 16 }}>
                    The First Touch
                  </div>
                  <p
                    className="prose"
                    style={{ fontSize: 17, fontStyle: "italic", margin: 0, color: "#F2F5EE" }}
                  >
                    "I learned to play in a dust patch behind my mother's house. There were no goals, no lines,
                    no rules. Only the ball, and the others, and the light before night came."
                  </p>
                  <div className="label" style={{ marginTop: 20, opacity: 0.5, fontSize: 10 }}>
                    — A story repeated, in a thousand languages, ten million times.
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CHAPTER II — DEVELOPMENT                                      */}
      {/* ============================================================ */}
      <section
        id="development"
        style={{
          padding: "160px 48px",
          position: "relative",
          background: COLORS.bgSoft,
          borderTop: `1px solid ${COLORS.hairline}`,
          borderBottom: `1px solid ${COLORS.hairline}`,
        }}
      >
        <div className="container" style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Reveal>
            <ChapterMark num="II" label="Where Football Is Developed" />
          </Reveal>

          <Reveal delay={100}>
            <h2
              className="display chapter-title"
              style={{
                fontSize: "clamp(48px, 7vw, 104px)",
                color: "#F2F5EE",
                margin: "0 0 64px",
                maxWidth: "14ch",
              }}
            >
              Talent is wild.
              <br />
              The game makes
              <br />
              it <span style={{ color: COLORS.green, fontStyle: "italic", fontWeight: 700 }}>whole.</span>
            </h2>
          </Reveal>

          <Reveal delay={300}>
            <p className="prose" style={{ maxWidth: 720, marginBottom: 80, fontSize: 21 }}>
              Between the dust patch and the world stage stands a quiet army — coaches, scouts, referees,
              physios, club staff, parents who drive at dawn, journalists who write at midnight, fans who
              have watched the same lower-league side for forty winters. They are the ones who turn the wild
              into the whole.
            </p>
          </Reveal>

          {/* The Three Pillars of Development */}
          <div className="pillar-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 48 }}>
            {[
              {
                num: "01",
                title: "The Hands That Shape",
                body: "Coaches and mentors who see a player not for what they are, but for what they could become. FOFA gathers their wisdom and makes it findable — for a club in Stockport, for an academy in Nairobi, for anyone who needs it.",
              },
              {
                num: "02",
                title: "The Eyes That Watch",
                body: "Scouts, analysts, experts who carry decades of pattern recognition. Their judgment, once locked in private notebooks, becomes a shared intelligence — searchable, attributable, honoured.",
              },
              {
                num: "03",
                title: "The Voices That Tell",
                body: "Pundits, writers, fans with archives in their heads. The stories that surround the game — the rivalries, the comebacks, the small acts of grace — are the connective tissue of football culture.",
              },
            ].map((p, i) => (
              <Reveal key={i} delay={400 + i * 150}>
                <div className="pillar">
                  <div
                    className="display"
                    style={{
                      fontSize: 56,
                      color: COLORS.green,
                      opacity: 0.4,
                      marginBottom: 16,
                    }}
                  >
                    {p.num}
                  </div>
                  <h3
                    className="display"
                    style={{
                      fontSize: 26,
                      color: "#F2F5EE",
                      margin: "0 0 16px",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {p.title}
                  </h3>
                  <p className="prose" style={{ fontSize: 17, margin: 0 }}>
                    {p.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={900}>
            <div
              style={{
                marginTop: 96,
                padding: "48px 0",
                borderTop: `1px solid ${COLORS.hairline}`,
                textAlign: "center",
              }}
            >
              <p
                className="prose"
                style={{
                  fontSize: 24,
                  fontStyle: "italic",
                  color: "#F2F5EE",
                  maxWidth: 760,
                  margin: "0 auto",
                }}
              >
                "The game is bigger than any one of us. It is made by all of us. FOFA is the place where
                that truth becomes a system."
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CHAPTER III — UNITY                                          */}
      {/* ============================================================ */}
      <section id="unity" style={{ padding: "160px 48px", position: "relative" }}>
        <div className="container" style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Reveal>
            <ChapterMark num="III" label="How We Become One" />
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 80, alignItems: "center" }}>
            <Reveal delay={100}>
              <h2
                className="display chapter-title"
                style={{
                  fontSize: "clamp(48px, 7vw, 104px)",
                  color: "#F2F5EE",
                  margin: 0,
                }}
              >
                Strangers,
                <br />
                bound by
                <br />
                <span style={{ color: COLORS.green, fontStyle: "italic", fontWeight: 700 }}>ninety</span>
                <br />
                minutes.
              </h2>
            </Reveal>

            <div>
              <Reveal delay={300}>
                <p className="prose" style={{ marginBottom: 28, fontSize: 21 }}>
                  Two strangers on opposite sides of the planet wake up early for the same kickoff. They
                  hold their breath at the same moment. They exhale together when the ball crosses the line.
                  They will never meet. They are, for those minutes, the same person.
                </p>
              </Reveal>

              <Reveal delay={500}>
                <p className="prose" style={{ marginBottom: 28 }}>
                  This is the quiet miracle of the game — and the quiet purpose of FOFA. Not to replace what
                  football already does, but to give it a network worthy of its reach. Fans linked to clubs
                  linked to legends linked to grassroots. A circle, not a hierarchy.
                </p>
              </Reveal>

              <Reveal delay={700}>
                <p className="prose" style={{ color: COLORS.gold, fontStyle: "italic", fontSize: 19 }}>
                  We move together, or we do not move at all.
                </p>
              </Reveal>
            </div>
          </div>

          {/* Network visualization — abstract circles */}
          <Reveal delay={400}>
            <div style={{ marginTop: 120, display: "flex", justifyContent: "center" }}>
              <svg viewBox="0 0 800 240" style={{ width: "100%", maxWidth: 900, height: "auto" }}>
                <defs>
                  <radialGradient id="node-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={COLORS.green} stopOpacity="0.6" />
                    <stop offset="100%" stopColor={COLORS.green} stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Connecting lines */}
                {[
                  [120, 120, 280, 80],
                  [120, 120, 280, 160],
                  [280, 80, 400, 120],
                  [280, 160, 400, 120],
                  [400, 120, 520, 80],
                  [400, 120, 520, 160],
                  [520, 80, 680, 120],
                  [520, 160, 680, 120],
                  [280, 80, 280, 160],
                  [520, 80, 520, 160],
                ].map(([x1, y1, x2, y2], i) => (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={COLORS.green}
                    strokeWidth="0.5"
                    opacity="0.35"
                  />
                ))}

                {/* Nodes */}
                {[
                  { x: 120, y: 120, label: "GRASSROOTS", r: 8 },
                  { x: 280, y: 80, label: "FANS", r: 6 },
                  { x: 280, y: 160, label: "EXPERTS", r: 6 },
                  { x: 400, y: 120, label: "FOFA", r: 12, primary: true },
                  { x: 520, y: 80, label: "CLUBS", r: 6 },
                  { x: 520, y: 160, label: "LEGENDS", r: 6 },
                  { x: 680, y: 120, label: "THE GAME", r: 8, gold: true },
                ].map((n, i) => (
                  <g key={i}>
                    <circle cx={n.x} cy={n.y} r={n.r * 2.5} fill="url(#node-glow)" className="ball-pulse" />
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={n.r}
                      fill={n.gold ? COLORS.gold : n.primary ? COLORS.green : "#F2F5EE"}
                    />
                    <text
                      x={n.x}
                      y={n.y + n.r + 22}
                      textAnchor="middle"
                      fill={COLORS.body}
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 9,
                        letterSpacing: "0.2em",
                      }}
                    >
                      {n.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================ */}
      {/* AMBASSADORS — FOR THE GOOD OF THE GAME                       */}
      {/* ============================================================ */}
      <section
        style={{
          padding: "160px 48px",
          background: COLORS.bgSoft,
          borderTop: `1px solid ${COLORS.hairline}`,
          borderBottom: `1px solid ${COLORS.hairline}`,
          position: "relative",
        }}
      >
        <div className="container" style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <span className="label" style={{ color: COLORS.gold }}>
                The Voices Behind the Mission
              </span>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h2
              className="display closing-title"
              style={{
                fontSize: "clamp(56px, 8vw, 120px)",
                color: "#F2F5EE",
                textAlign: "center",
                margin: "0 0 32px",
              }}
            >
              For the good
              <br />
              of the <span style={{ color: COLORS.gold, fontStyle: "italic", fontWeight: 700 }}>game.</span>
            </h2>
          </Reveal>

          <Reveal delay={300}>
            <p
              className="prose"
              style={{
                maxWidth: 640,
                margin: "0 auto 96px",
                textAlign: "center",
                fontSize: 19,
              }}
            >
              The people who walk with FOFA are not endorsements. They are believers — figures who have
              given their lives to the game and who hold the same conviction we do: that football is a
              shared inheritance, and it is our turn to look after it.
            </p>
          </Reveal>

          <div className="ambassador-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              {
                name: "Keith Hackett",
                role: "Sports Lead & Advisor",
                bio: "PGMOL Founder. Former FIFA Referee. The man whose phrase — 'For the good of the game' — became our compass.",
                quote: "Football's first duty is to its conscience.",
                accent: COLORS.gold,
              },
              {
                name: "Tom Watt",
                role: "Arsenal FC Ambassador",
                bio: "Actor, author, and one of football's most thoughtful storytellers. A voice for the fan who has always been here.",
                quote: "The terraces are where the soul of the game lives.",
                accent: COLORS.green,
              },
              {
                name: "Tony Adams",
                role: "Celebrity Advisor",
                bio: "Arsenal Legend. England Captain. A figure who knows what the game can take from a player — and what it can give back.",
                quote: "The game saved me. We owe it the same.",
                accent: COLORS.green,
              },
            ].map((a, i) => (
              <Reveal key={i} delay={400 + i * 150}>
                <div className="ambassador-card">
                  <div
                    className="label"
                    style={{ color: a.accent, marginBottom: 24 }}
                  >
                    {String(i + 1).padStart(2, "0")} / Ambassador
                  </div>

                  {/* Portrait placeholder — abstract */}
                  <div
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: "50%",
                      border: `1px solid ${a.accent}`,
                      background: `radial-gradient(circle at 30% 30%, ${a.accent}33, transparent 70%)`,
                      marginBottom: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      className="display"
                      style={{ fontSize: 28, color: a.accent }}
                    >
                      {a.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>

                  <h3
                    className="display"
                    style={{
                      fontSize: 30,
                      color: "#F2F5EE",
                      margin: "0 0 8px",
                    }}
                  >
                    {a.name}
                  </h3>
                  <div
                    className="label"
                    style={{ color: COLORS.body, opacity: 0.6, marginBottom: 24 }}
                  >
                    {a.role}
                  </div>
                  <p className="prose" style={{ fontSize: 16, marginBottom: 28 }}>
                    {a.bio}
                  </p>
                  <div
                    style={{
                      paddingTop: 24,
                      borderTop: `1px solid ${COLORS.hairline}`,
                    }}
                  >
                    <p
                      className="prose"
                      style={{
                        fontStyle: "italic",
                        fontSize: 17,
                        color: "#F2F5EE",
                        margin: 0,
                      }}
                    >
                      "{a.quote}"
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* JOIN                                                          */}
      {/* ============================================================ */}
      <section id="join" style={{ padding: "200px 48px", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, ${COLORS.green}0F 0%, transparent 60%)`,
            pointerEvents: "none",
          }}
        />

        <div
          className="container"
          style={{
            maxWidth: 900,
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
          }}
        >
          <Reveal>
            <span className="label" style={{ color: COLORS.gold }}>
              An Invitation
            </span>
          </Reveal>

          <Reveal delay={150}>
            <h2
              className="display closing-title"
              style={{
                fontSize: "clamp(56px, 9vw, 132px)",
                color: "#F2F5EE",
                margin: "32px 0 48px",
              }}
            >
              Football,
              <br />
              <span style={{ color: COLORS.green }}>open</span> for all.
            </h2>
          </Reveal>

          <Reveal delay={350}>
            <p className="prose" style={{ fontSize: 21, marginBottom: 64, maxWidth: 620, margin: "0 auto 64px" }}>
              Whether you are a fan who has loved a club since childhood, an expert with knowledge to share,
              a club ready to meet the people who care about you, or a legend with wisdom to pass on —
              there is a place here for you.
              <br /><br />
              <span style={{ color: "#F2F5EE", fontStyle: "italic" }}>
                The door is open. Walk through.
              </span>
            </p>
          </Reveal>

          <Reveal delay={500}>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="#portal" className="cta">
                Join as a Fan
                <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
                  <path d="M0 5 L18 5 M14 1 L18 5 L14 9" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </a>
              <a href="#clubs/apply" className="cta-ghost">For Clubs</a>
              <a href="#" className="cta-ghost">For Experts</a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FOOTER                                                        */}
      {/* ============================================================ */}
      <footer
        style={{
          padding: "80px 48px 48px",
          borderTop: `1px solid ${COLORS.hairline}`,
          background: COLORS.bg,
        }}
      >
        <div
          className="container"
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: 48,
            alignItems: "start",
          }}
        >
          <div>
            <FofaMark size={48} />
            <p
              className="prose"
              style={{
                fontSize: 14,
                marginTop: 24,
                maxWidth: 320,
                opacity: 0.7,
              }}
            >
              FOFA — Football Open For All. A platform built on the belief that the game belongs to everyone
              who has ever loved it.
            </p>
            <div className="label" style={{ marginTop: 32, opacity: 0.4, fontSize: 10 }}>
              A Legacy Protocol Labs Initiative
            </div>
          </div>

          {[
            { title: "The Story", links: ["Origin", "Development", "Unity"] },
            { title: "Take Part", links: ["For Fans", "For Clubs", "For Experts"] },
            { title: "About", links: ["Mission", "Team", "Contact"] },
          ].map((col, i) => (
            <div key={i}>
              <div className="label" style={{ color: COLORS.gold, marginBottom: 20 }}>
                {col.title}
              </div>
              {col.links.map((l, j) => (
                <a
                  key={j}
                  href="#"
                  style={{
                    display: "block",
                    fontFamily: "'Crimson Pro', serif",
                    fontSize: 15,
                    color: COLORS.body,
                    textDecoration: "none",
                    marginBottom: 10,
                    opacity: 0.75,
                    transition: "opacity 0.3s, color 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = COLORS.green;
                    e.currentTarget.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = COLORS.body;
                    e.currentTarget.style.opacity = "0.75";
                  }}
                >
                  {l}
                </a>
              ))}
            </div>
          ))}
        </div>

        <div
          style={{
            maxWidth: 1280,
            margin: "64px auto 0",
            paddingTop: 32,
            borderTop: `1px solid ${COLORS.hairline}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <span className="label" style={{ opacity: 0.4, fontSize: 10 }}>
            © 2026 Legacy Protocol Labs Pte. Ltd. — Singapore
          </span>
          <span
            className="label"
            style={{ color: COLORS.gold, opacity: 0.6, fontSize: 10, fontStyle: "italic" }}
          >
            For the good of the game.
          </span>
        </div>
      </footer>
    </div>
  );
}
