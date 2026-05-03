import React, { useEffect, useState } from "react";

// ============================================================================
// FOFA PUBLIC CLUBS PAGE
// Browse all approved clubs OR view individual club profile
// ============================================================================

const COLORS = {
  bg: "#080C08",
  bgSoft: "#0E140E",
  bgCard: "#0A1109",
  green: "#1AFF6E",
  greenGlow: "rgba(26, 255, 110, 0.15)",
  body: "#C8D4C0",
  gold: "#C8A84B",
  teal: "#1AC8C8",
  red: "#FF4757",
  purple: "#9C88FF",
  hairline: "rgba(200, 212, 192, 0.08)",
  hairlineStrong: "rgba(200, 212, 192, 0.15)",
};

const API_URL = import.meta.env.VITE_API_URL || "https://fofa-xi.vercel.app/api";

export default function ClubsPage() {
  const [view, setView] = useState("loading"); // loading, list, detail
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [topFans, setTopFans] = useState([]);
  const [endorsements, setEndorsements] = useState([]);
  
  useEffect(() => {
    handleRoute();
    window.addEventListener("hashchange", handleRoute);
    return () => window.removeEventListener("hashchange", handleRoute);
  }, []);
  
  function handleRoute() {
    const hash = window.location.hash;
    // #clubs/[slug] -> detail view
    // #clubs -> list view
    const match = hash.match(/^#clubs\/([a-z0-9-]+)$/);
    if (match) {
      loadClubDetail(match[1]);
    } else {
      loadClubsList();
    }
  }
  
  async function loadClubsList() {
    setView("loading");
    try {
      const response = await fetch(`${API_URL}/clubs`);
      const data = await response.json();
      setClubs(data.clubs || []);
      setView("list");
    } catch (err) {
      console.error(err);
      setView("list");
    }
  }
  
  async function loadClubDetail(slug) {
    setView("loading");
    try {
      const response = await fetch(`${API_URL}/clubs/${slug}`);
      if (!response.ok) {
        setView("not-found");
        return;
      }
      const data = await response.json();
      setSelectedClub(data.club);
      setTopFans(data.top_fans || []);
      
      // Also fetch endorsements (don't fail page if this fails)
      try {
        const endorseResponse = await fetch(`${API_URL}/clubs/${slug}/endorsements`);
        if (endorseResponse.ok) {
          const endorseData = await endorseResponse.json();
          setEndorsements(endorseData.endorsements || []);
        } else {
          setEndorsements([]);
        }
      } catch (e) {
        setEndorsements([]);
      }
      
      setView("detail");
    } catch (err) {
      console.error(err);
      setView("not-found");
    }
  }
  
  return (
    <div style={{
      background: COLORS.bg,
      color: COLORS.body,
      fontFamily: "'Crimson Pro', Georgia, serif",
      minHeight: "100vh",
    }}>
      <GlobalStyles />
      <Header />
      
      <div style={{ padding: "0 20px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {view === "loading" && <LoadingState />}
          {view === "list" && <ClubsListView clubs={clubs} />}
          {view === "detail" && selectedClub && (
            <ClubDetailView club={selectedClub} topFans={topFans} endorsements={endorsements} />
          )}
          {view === "not-found" && <NotFoundView />}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HEADER
// ============================================================================

function Header() {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 24px",
      borderBottom: `1px solid ${COLORS.hairline}`,
    }}>
      <a href="/" style={{ textDecoration: "none", display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{
          fontSize: 24,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900,
          color: COLORS.green,
          letterSpacing: "0.05em",
        }}>
          FOFA
        </div>
        <div style={{
          fontSize: 10,
          fontFamily: "'DM Mono', monospace",
          color: COLORS.body,
          opacity: 0.5,
          letterSpacing: "0.15em",
          borderLeft: `1px solid ${COLORS.hairline}`,
          paddingLeft: 12,
        }}>
          CLUBS
        </div>
      </a>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <a href="#leaders" style={{
          color: COLORS.body,
          opacity: 0.7,
          fontSize: 11,
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          textDecoration: "none",
        }}>
          Leaderboard
        </a>
        <a href="#portal" style={{
          background: COLORS.green,
          color: COLORS.bg,
          padding: "10px 20px",
          textDecoration: "none",
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 700,
          borderRadius: 4,
        }}>
          Join FOFA →
        </a>
      </div>
    </div>
  );
}

// ============================================================================
// LIST VIEW
// ============================================================================

function ClubsListView({ clubs }) {
  return (
    <div>
      {/* Hero */}
      <div style={{ textAlign: "center", padding: "60px 0 32px" }}>
        <div style={{
          fontSize: 11,
          fontFamily: "'DM Mono', monospace",
          color: COLORS.gold,
          letterSpacing: "0.25em",
          marginBottom: 16,
        }}>
          — VERIFIED CLUBS
        </div>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "clamp(40px, 9vw, 84px)",
          fontWeight: 900,
          color: "#F2F5EE",
          margin: "0 0 16px",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}>
          The Clubs<br/>
          <span style={{ color: COLORS.green }}>On FOFA</span>
        </h1>
        <p style={{
          color: COLORS.body,
          opacity: 0.7,
          maxWidth: 560,
          margin: "0 auto",
          fontSize: 16,
          lineHeight: 1.6,
        }}>
          Real clubs, verified through our AI agent. Find your team and join their fan community.
        </p>
      </div>
      
      {/* Clubs grid */}
      {clubs.length === 0 ? (
        <EmptyClubsList />
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
          marginTop: 32,
        }}>
          {clubs.map(club => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      )}
      
      {/* CTA for clubs */}
      <div style={{
        marginTop: 80,
        padding: 40,
        background: `linear-gradient(135deg, ${COLORS.bgCard} 0%, ${COLORS.bgSoft} 100%)`,
        border: `1px solid ${COLORS.hairlineStrong}`,
        borderRadius: 8,
        textAlign: "center",
      }}>
        <div style={{
          fontSize: 11,
          fontFamily: "'DM Mono', monospace",
          color: COLORS.gold,
          letterSpacing: "0.25em",
          marginBottom: 16,
        }}>
          — FOR CLUBS
        </div>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "clamp(28px, 5vw, 40px)",
          fontWeight: 900,
          color: "#F2F5EE",
          margin: "0 0 12px",
        }}>
          Run your <span style={{ color: COLORS.green }}>own club</span>?
        </h2>
        <p style={{ color: COLORS.body, opacity: 0.7, margin: "0 0 24px", fontSize: 15 }}>
          Apply to be featured. Connect with your most loyal supporters.
        </p>
        <a href="#clubs/apply" style={{
          display: "inline-block",
          background: COLORS.green,
          color: COLORS.bg,
          padding: "14px 28px",
          textDecoration: "none",
          fontFamily: "'DM Mono', monospace",
          fontSize: 12,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 700,
          borderRadius: 4,
        }}>
          Apply Now →
        </a>
      </div>
    </div>
  );
}

function ClubCard({ club }) {
  const initials = club.name.split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase();
  
  return (
    <a
      href={`#clubs/${club.slug}`}
      style={{
        background: COLORS.bgSoft,
        border: `1px solid ${COLORS.hairline}`,
        borderRadius: 4,
        padding: 24,
        textDecoration: "none",
        display: "block",
        transition: "all 0.2s",
        opacity: 0,
        animation: "fadeIn 0.3s ease-out forwards",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = COLORS.green;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = COLORS.hairline;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Avatar/Logo placeholder */}
      <div style={{
        width: 64,
        height: 64,
        borderRadius: "50%",
        background: club.primary_color || COLORS.bg,
        border: `2px solid ${COLORS.green}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 900,
        fontSize: 20,
        color: COLORS.green,
        marginBottom: 16,
      }}>
        {initials}
      </div>
      
      <h3 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 22,
        fontWeight: 900,
        color: "#F2F5EE",
        margin: "0 0 6px",
        letterSpacing: "-0.01em",
      }}>
        {club.name}
      </h3>
      
      <div style={{
        fontSize: 11,
        fontFamily: "'DM Mono', monospace",
        color: COLORS.body,
        opacity: 0.7,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginBottom: 16,
      }}>
        {club.country} · {club.league_tier || club.league}
      </div>
      
      <div style={{
        display: "flex",
        gap: 16,
        paddingTop: 16,
        borderTop: `1px solid ${COLORS.hairline}`,
      }}>
        <div>
          <div style={{
            fontSize: 18,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            color: COLORS.green,
          }}>
            {club.fan_count || 0}
          </div>
          <div style={{
            fontSize: 9,
            fontFamily: "'DM Mono', monospace",
            color: COLORS.body,
            opacity: 0.5,
            letterSpacing: "0.15em",
          }}>
            FANS
          </div>
        </div>
        <div>
          <div style={{
            fontSize: 18,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            color: COLORS.gold,
          }}>
            {Math.round(club.total_loyalty_score || 0).toLocaleString()}
          </div>
          <div style={{
            fontSize: 9,
            fontFamily: "'DM Mono', monospace",
            color: COLORS.body,
            opacity: 0.5,
            letterSpacing: "0.15em",
          }}>
            LOYALTY
          </div>
        </div>
      </div>
    </a>
  );
}

function EmptyClubsList() {
  return (
    <div style={{
      textAlign: "center",
      padding: "80px 20px",
      background: COLORS.bgSoft,
      border: `1px solid ${COLORS.hairline}`,
      borderRadius: 4,
    }}>
      <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.4 }}>🏟️</div>
      <h3 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 24,
        color: "#F2F5EE",
        margin: "0 0 8px",
      }}>
        No clubs yet
      </h3>
      <p style={{ color: COLORS.body, opacity: 0.6, margin: "0 0 24px" }}>
        Be the first club to join FOFA.
      </p>
      <a href="#clubs/apply" style={{
        display: "inline-block",
        background: COLORS.green,
        color: COLORS.bg,
        padding: "14px 28px",
        textDecoration: "none",
        fontFamily: "'DM Mono', monospace",
        fontSize: 12,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontWeight: 700,
        borderRadius: 4,
      }}>
        Apply Now →
      </a>
    </div>
  );
}

// ============================================================================
// CLUB DETAIL VIEW
// ============================================================================

function ClubDetailView({ club, topFans, endorsements = [] }) {
  const initials = club.name.split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase();
  
  function getLevelColor(level) {
    const map = {
      legend: COLORS.red,
      master: COLORS.purple,
      veteran: COLORS.gold,
      devotee: COLORS.teal,
      supporter: COLORS.green,
      apprentice: COLORS.body,
    };
    return map[level] || COLORS.body;
  }
  
  return (
    <div>
      {/* Back link */}
      <a href="#clubs" style={{
        display: "inline-block",
        marginTop: 24,
        marginBottom: 24,
        color: COLORS.body,
        opacity: 0.7,
        fontSize: 12,
        fontFamily: "'DM Mono', monospace",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        textDecoration: "none",
      }}>
        ← Back to all clubs
      </a>
      
      {/* Hero with club info */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.bgCard} 0%, ${COLORS.bgSoft} 100%)`,
        border: `1px solid ${COLORS.hairlineStrong}`,
        borderRadius: 8,
        padding: 40,
        marginBottom: 24,
        display: "flex",
        gap: 32,
        alignItems: "center",
        flexWrap: "wrap",
      }}>
        {/* Logo */}
        <div style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: club.primary_color || COLORS.bg,
          border: `3px solid ${COLORS.green}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900,
          fontSize: 36,
          color: COLORS.green,
          flexShrink: 0,
          boxShadow: `0 0 40px ${COLORS.greenGlow}`,
        }}>
          {initials}
        </div>
        
        {/* Info */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            color: COLORS.gold,
            letterSpacing: "0.25em",
            marginBottom: 8,
          }}>
            ✓ VERIFIED CLUB
          </div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "clamp(32px, 6vw, 56px)",
            fontWeight: 900,
            color: "#F2F5EE",
            margin: "0 0 12px",
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}>
            {club.name}
          </h1>
          <p style={{
            color: COLORS.body,
            opacity: 0.8,
            fontSize: 16,
            margin: "0 0 8px",
          }}>
            {club.country} · {club.league}
          </p>
          {club.founded_year && (
            <p style={{
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
              color: COLORS.body,
              opacity: 0.5,
              letterSpacing: "0.15em",
              margin: 0,
            }}>
              FOUNDED {club.founded_year}
              {club.stadium && ` · ${club.stadium.toUpperCase()}`}
            </p>
          )}
        </div>
      </div>
      
      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 12,
        marginBottom: 32,
      }}>
        <div style={{
          background: COLORS.bgSoft,
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 4,
          padding: 24,
          textAlign: "center",
        }}>
          <div style={{
            fontSize: 36,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            color: COLORS.green,
          }}>
            {club.fan_count || 0}
          </div>
          <div style={{
            fontSize: 10,
            fontFamily: "'DM Mono', monospace",
            color: COLORS.body,
            opacity: 0.6,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginTop: 4,
          }}>
            FOFA Fans
          </div>
        </div>
        <div style={{
          background: COLORS.bgSoft,
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 4,
          padding: 24,
          textAlign: "center",
        }}>
          <div style={{
            fontSize: 36,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            color: COLORS.gold,
          }}>
            {Math.round(club.total_loyalty_score || 0).toLocaleString()}
          </div>
          <div style={{
            fontSize: 10,
            fontFamily: "'DM Mono', monospace",
            color: COLORS.body,
            opacity: 0.6,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginTop: 4,
          }}>
            Total Loyalty
          </div>
        </div>
      </div>
      
      {/* Description */}
      {club.description && (
        <div style={{
          background: COLORS.bgSoft,
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 4,
          padding: 24,
          marginBottom: 24,
        }}>
          <div style={{
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            color: COLORS.gold,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}>
            About
          </div>
          <p style={{
            color: COLORS.body,
            fontSize: 15,
            lineHeight: 1.7,
            margin: 0,
          }}>
            {club.description}
          </p>
        </div>
      )}
      
      {/* Expert Endorsements */}
      {endorsements.length > 0 && (
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.bgCard} 0%, ${COLORS.bgSoft} 100%)`,
          border: `1px solid ${COLORS.gold}40`,
          borderRadius: 4,
          padding: 24,
          marginBottom: 24,
          boxShadow: `0 0 30px ${COLORS.gold}10`,
        }}>
          <div style={{
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            color: COLORS.gold,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}>
            🛡️ Endorsed by FOFA Experts ({endorsements.length})
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {endorsements.map(end => {
              if (!end.expert) return null;
              const initials = end.expert.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
              const tierColors = {
                legend: "#FFD700",
                authority: "#C8A84B",
                ambassador: "#1AC8C8",
              };
              const typeIcons = {
                verifier: "🛡️",
                voice: "📢",
                ambassador: "🎖️",
              };
              const tierColor = tierColors[end.expert.tier] || "#C8A84B";
              const typeIcon = typeIcons[end.expert.expert_type] || "🎓";
              
              return (
                <div
                  key={end.id}
                  style={{
                    background: COLORS.bg,
                    border: `1px solid ${COLORS.hairline}`,
                    borderRadius: 4,
                    padding: 20,
                    display: "flex",
                    gap: 16,
                    alignItems: "flex-start",
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: COLORS.bg,
                    border: `2px solid ${tierColor}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900,
                    fontSize: 16,
                    color: tierColor,
                    flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Quote */}
                    <p style={{
                      color: "#F2F5EE",
                      fontSize: 15,
                      lineHeight: 1.6,
                      margin: "0 0 12px",
                      fontStyle: "italic",
                    }}>
                      "{end.endorsement_text}"
                    </p>
                    
                    {/* Expert info */}
                    <a
                      href={`#experts/${end.expert.slug}`}
                      style={{
                        textDecoration: "none",
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{
                        color: "#F2F5EE",
                        fontSize: 13,
                        fontWeight: 500,
                      }}>
                        {end.expert.display_name || end.expert.full_name}
                      </span>
                      <span style={{
                        fontSize: 10,
                        fontFamily: "'DM Mono', monospace",
                        color: tierColor,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}>
                        {typeIcon} {end.expert.expert_type}
                      </span>
                      {end.expert.current_role && (
                        <span style={{
                          fontSize: 11,
                          color: COLORS.body,
                          opacity: 0.5,
                          fontStyle: "italic",
                        }}>
                          · {end.expert.current_role}
                        </span>
                      )}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Top fans */}
      <div style={{
        background: COLORS.bgSoft,
        border: `1px solid ${COLORS.hairline}`,
        borderRadius: 4,
        padding: 24,
        marginBottom: 24,
      }}>
        <div style={{
          fontSize: 11,
          fontFamily: "'DM Mono', monospace",
          color: COLORS.gold,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: 16,
        }}>
          🏆 Top Supporters
        </div>
        
        {topFans.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: 32,
            color: COLORS.body,
            opacity: 0.5,
            fontSize: 14,
          }}>
            No supporters yet. Be the first!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {topFans.map((fan, i) => {
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
              const fanInitials = fan.display_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
              
              return (
                <div
                  key={fan.username}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    background: i < 3 ? COLORS.bgCard : COLORS.bg,
                    borderRadius: 4,
                    border: `1px solid ${i < 3 ? COLORS.gold + "30" : COLORS.hairline}`,
                  }}
                >
                  <div style={{
                    minWidth: 40,
                    textAlign: "center",
                    fontSize: medal ? 22 : 14,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900,
                    color: i < 3 ? COLORS.gold : COLORS.body,
                    opacity: i < 3 ? 1 : 0.6,
                  }}>
                    {medal || `#${fan.rank}`}
                  </div>
                  
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: COLORS.bg,
                    border: `1px solid ${COLORS.hairline}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900,
                    color: COLORS.body,
                    flexShrink: 0,
                  }}>
                    {fanInitials}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#F2F5EE", fontSize: 14, fontWeight: 500 }}>
                      {fan.display_name}
                    </div>
                    <div style={{
                      fontSize: 10,
                      fontFamily: "'DM Mono', monospace",
                      color: getLevelColor(fan.level),
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      opacity: 0.8,
                    }}>
                      {fan.level}
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: 16,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900,
                    color: i < 3 ? COLORS.gold : "#F2F5EE",
                  }}>
                    {Math.round(fan.total_score).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* External Links */}
      <div style={{
        background: COLORS.bgSoft,
        border: `1px solid ${COLORS.hairline}`,
        borderRadius: 4,
        padding: 24,
        marginBottom: 24,
      }}>
        <div style={{
          fontSize: 11,
          fontFamily: "'DM Mono', monospace",
          color: COLORS.gold,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: 16,
        }}>
          Official Links
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {club.website && (
            <a href={club.website} target="_blank" rel="noopener" style={linkBtnStyle}>
              🌐 Website
            </a>
          )}
          {club.social?.twitter && (
            <a href={club.social.twitter.startsWith("http") ? club.social.twitter : `https://twitter.com/${club.social.twitter.replace("@", "")}`} target="_blank" rel="noopener" style={linkBtnStyle}>
              𝕏 Twitter
            </a>
          )}
          {club.social?.instagram && (
            <a href={club.social.instagram.startsWith("http") ? club.social.instagram : `https://instagram.com/${club.social.instagram.replace("@", "")}`} target="_blank" rel="noopener" style={linkBtnStyle}>
              📸 Instagram
            </a>
          )}
          {club.social?.facebook && (
            <a href={club.social.facebook.startsWith("http") ? club.social.facebook : `https://facebook.com/${club.social.facebook}`} target="_blank" rel="noopener" style={linkBtnStyle}>
              👥 Facebook
            </a>
          )}
        </div>
      </div>
      
      {/* CTA */}
      <div style={{
        marginTop: 40,
        padding: 32,
        background: `linear-gradient(135deg, ${COLORS.bgCard} 0%, ${COLORS.bgSoft} 100%)`,
        border: `1px solid ${COLORS.green}`,
        borderRadius: 8,
        textAlign: "center",
        boxShadow: `0 0 40px ${COLORS.greenGlow}`,
      }}>
        <h3 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 28,
          fontWeight: 900,
          color: "#F2F5EE",
          margin: "0 0 12px",
        }}>
          Support <span style={{ color: COLORS.green }}>{club.name}</span>
        </h3>
        <p style={{ color: COLORS.body, opacity: 0.7, margin: "0 0 24px" }}>
          Join FOFA, become a fan, climb the leaderboard.
        </p>
        <a href="#portal" style={{
          display: "inline-block",
          background: COLORS.green,
          color: COLORS.bg,
          padding: "16px 32px",
          textDecoration: "none",
          fontFamily: "'DM Mono', monospace",
          fontSize: 13,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontWeight: 700,
          borderRadius: 4,
        }}>
          Become a Fan →
        </a>
      </div>
    </div>
  );
}

const linkBtnStyle = {
  background: COLORS.bg,
  color: "#F2F5EE",
  border: `1px solid ${COLORS.hairlineStrong}`,
  padding: "10px 16px",
  borderRadius: 4,
  textDecoration: "none",
  fontSize: 12,
  fontFamily: "'DM Mono', monospace",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  transition: "all 0.2s",
};

// ============================================================================
// STATES
// ============================================================================

function LoadingState() {
  return (
    <div style={{ padding: "80px 20px", textAlign: "center" }}>
      <div style={{
        fontSize: 16,
        fontFamily: "'DM Mono', monospace",
        color: COLORS.body,
        opacity: 0.6,
        letterSpacing: "0.2em",
      }}>
        LOADING...
      </div>
    </div>
  );
}

function NotFoundView() {
  return (
    <div style={{
      textAlign: "center",
      padding: "100px 20px",
    }}>
      <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.5 }}>🤷</div>
      <h2 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 32,
        fontWeight: 900,
        color: "#F2F5EE",
        margin: "0 0 12px",
      }}>
        Club Not Found
      </h2>
      <p style={{ color: COLORS.body, opacity: 0.7, marginBottom: 24 }}>
        This club doesn't exist or hasn't been published yet.
      </p>
      <a href="#clubs" style={{
        display: "inline-block",
        background: COLORS.green,
        color: COLORS.bg,
        padding: "14px 28px",
        textDecoration: "none",
        fontFamily: "'DM Mono', monospace",
        fontSize: 12,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontWeight: 700,
        borderRadius: 4,
      }}>
        Browse All Clubs →
      </a>
    </div>
  );
}

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,500;1,400&family=DM+Mono:wght@400;500&display=swap');
      
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `}</style>
  );
}
