import React, { useEffect, useState } from "react";

// ============================================================================
// FOFA EXPERTS PAGE - Directory + Individual Profiles
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

const API_URL = import.meta.env.VITE_API_URL || "https://fofa.lol/api";

const EXPERT_TYPE_LABELS = {
  verifier: { label: "Verifier", icon: "🛡️", description: "Validates clubs & maintains trust" },
  voice: { label: "Voice", icon: "📢", description: "Expert opinions & analysis" },
  ambassador: { label: "Ambassador", icon: "🎖️", description: "Community leader for clubs" },
};

const TIER_BADGES = {
  legend: { label: "Legend", color: "#FFD700", icon: "🌟" },
  authority: { label: "Authority", color: "#C8A84B", icon: "⭐" },
  ambassador: { label: "Ambassador", color: "#1AC8C8", icon: "🎖️" },
};

export default function ExpertsPage() {
  const [view, setView] = useState("loading");
  const [experts, setExperts] = useState([]);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [endorsements, setEndorsements] = useState([]);
  const [filterType, setFilterType] = useState("all");
  
  useEffect(() => {
    handleRoute();
    window.addEventListener("hashchange", handleRoute);
    return () => window.removeEventListener("hashchange", handleRoute);
  }, []);
  
  function handleRoute() {
    const hash = window.location.hash;
    const match = hash.match(/^#experts\/([a-z0-9-]+)$/);
    if (match && match[1] !== "apply") {
      loadExpertDetail(match[1]);
    } else {
      loadExpertsList();
    }
  }
  
  async function loadExpertsList() {
    setView("loading");
    try {
      const url = filterType === "all" ? `${API_URL}/experts` : `${API_URL}/experts?type=${filterType}`;
      const response = await fetch(url);
      const data = await response.json();
      setExperts(data.experts || []);
      setView("list");
    } catch (err) {
      console.error(err);
      setView("list");
    }
  }
  
  useEffect(() => {
    if (view === "list") loadExpertsList();
  }, [filterType]);
  
  async function loadExpertDetail(slug) {
    setView("loading");
    try {
      const response = await fetch(`${API_URL}/experts/${slug}`);
      if (!response.ok) {
        setView("not-found");
        return;
      }
      const data = await response.json();
      setSelectedExpert(data.expert);
      setEndorsements(data.endorsements || []);
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
          {view === "list" && <ExpertsListView experts={experts} filterType={filterType} setFilterType={setFilterType} />}
          {view === "detail" && selectedExpert && (
            <ExpertDetailView expert={selectedExpert} endorsements={endorsements} />
          )}
          {view === "not-found" && <NotFoundView />}
        </div>
      </div>
    </div>
  );
}

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
          EXPERTS
        </div>
      </a>
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <a href="#clubs" style={navLinkStyle}>Clubs</a>
        <a href="#leaders" style={navLinkStyle}>Leaderboard</a>
        <a href="#experts/apply" style={{
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
          Become an Expert →
        </a>
      </div>
    </div>
  );
}

const navLinkStyle = {
  color: COLORS.body,
  opacity: 0.7,
  fontSize: 11,
  fontFamily: "'DM Mono', monospace",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  textDecoration: "none",
};

function ExpertsListView({ experts, filterType, setFilterType }) {
  const featuredExperts = experts.filter(e => e.is_featured);
  const otherExperts = experts.filter(e => !e.is_featured);
  
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
          — THE TRUST LAYER
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
          The Voices<br/>
          <span style={{ color: COLORS.green }}>Behind FOFA</span>
        </h1>
        <p style={{
          color: COLORS.body,
          opacity: 0.7,
          maxWidth: 600,
          margin: "0 auto 24px",
          fontSize: 16,
          lineHeight: 1.6,
        }}>
          Verified industry experts who validate clubs, share insights, and lead fan communities. The human verification layer for football's middle tier.
        </p>
      </div>
      
      {/* Filter pills */}
      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 32,
        flexWrap: "wrap",
        justifyContent: "center",
      }}>
        {[
          { id: "all", label: "All Experts" },
          { id: "verifier", label: "🛡️ Verifiers" },
          { id: "voice", label: "📢 Voices" },
          { id: "ambassador", label: "🎖️ Ambassadors" },
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setFilterType(filter.id)}
            style={{
              padding: "10px 18px",
              background: filterType === filter.id ? COLORS.greenGlow : "transparent",
              border: `1px solid ${filterType === filter.id ? COLORS.green : COLORS.hairline}`,
              color: filterType === filter.id ? COLORS.green : COLORS.body,
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
              borderRadius: 100,
              cursor: "pointer",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>
      
      {/* Featured Section */}
      {featuredExperts.length > 0 && (
        <div style={{ marginBottom: 48 }}>
          <SectionHeader title="🌟 Featured Experts" subtitle="The legends of the platform" />
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}>
            {featuredExperts.map(expert => (
              <ExpertCard key={expert.id} expert={expert} featured />
            ))}
          </div>
        </div>
      )}
      
      {/* All Experts */}
      {otherExperts.length > 0 ? (
        <div>
          {featuredExperts.length > 0 && <SectionHeader title="All Experts" />}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
          }}>
            {otherExperts.map(expert => (
              <ExpertCard key={expert.id} expert={expert} />
            ))}
          </div>
        </div>
      ) : featuredExperts.length === 0 ? (
        <EmptyExpertsList />
      ) : null}
      
      {/* CTA */}
      <CTASection />
    </div>
  );
}

function ExpertCard({ expert, featured }) {
  const initials = expert.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const typeInfo = EXPERT_TYPE_LABELS[expert.expert_type] || EXPERT_TYPE_LABELS.verifier;
  const tierInfo = TIER_BADGES[expert.tier] || TIER_BADGES.authority;
  
  return (
    <a
      href={`#experts/${expert.slug}`}
      style={{
        background: featured ? `linear-gradient(135deg, ${COLORS.bgCard} 0%, ${COLORS.bgSoft} 100%)` : COLORS.bgSoft,
        border: `1px solid ${featured ? tierInfo.color : COLORS.hairline}`,
        borderRadius: 4,
        padding: featured ? 28 : 20,
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
        e.currentTarget.style.borderColor = featured ? tierInfo.color : COLORS.hairline;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex",
        gap: 16,
        alignItems: "center",
        marginBottom: 16,
      }}>
        <div style={{
          width: featured ? 64 : 48,
          height: featured ? 64 : 48,
          borderRadius: "50%",
          background: COLORS.bg,
          border: `2px solid ${tierInfo.color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900,
          fontSize: featured ? 22 : 16,
          color: tierInfo.color,
          flexShrink: 0,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: featured ? 22 : 18,
            fontWeight: 900,
            color: "#F2F5EE",
            margin: "0 0 4px",
            letterSpacing: "-0.01em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {expert.full_name}
          </h3>
          <div style={{
            fontSize: 10,
            fontFamily: "'DM Mono', monospace",
            color: tierInfo.color,
            opacity: 0.9,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
            {tierInfo.icon} {tierInfo.label} · {typeInfo.icon} {typeInfo.label}
          </div>
        </div>
      </div>
      
      {/* Role */}
      {expert.current_role && (
        <div style={{
          color: COLORS.body,
          fontSize: 13,
          marginBottom: 12,
          fontStyle: "italic",
        }}>
          {expert.current_role}
        </div>
      )}
      
      {/* Bio */}
      {expert.bio && (
        <p style={{
          color: COLORS.body,
          opacity: 0.8,
          fontSize: 13,
          lineHeight: 1.5,
          margin: "0 0 16px",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {expert.bio}
        </p>
      )}
      
      {/* Stats */}
      <div style={{
        display: "flex",
        gap: 16,
        paddingTop: 12,
        borderTop: `1px solid ${COLORS.hairline}`,
        fontSize: 11,
        fontFamily: "'DM Mono', monospace",
      }}>
        <div>
          <span style={{ color: COLORS.green, fontWeight: 700 }}>{expert.endorsement_count || 0}</span>
          <span style={{ color: COLORS.body, opacity: 0.5, marginLeft: 4 }}>endorsements</span>
        </div>
        <div>
          <span style={{ color: COLORS.gold, fontWeight: 700 }}>{expert.fans_referred || 0}</span>
          <span style={{ color: COLORS.body, opacity: 0.5, marginLeft: 4 }}>fans</span>
        </div>
      </div>
    </a>
  );
}

function ExpertDetailView({ expert, endorsements }) {
  const initials = expert.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const typeInfo = EXPERT_TYPE_LABELS[expert.expert_type] || EXPERT_TYPE_LABELS.verifier;
  const tierInfo = TIER_BADGES[expert.tier] || TIER_BADGES.authority;
  
  return (
    <div>
      <a href="#experts" style={{
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
        ← All experts
      </a>
      
      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.bgCard} 0%, ${COLORS.bgSoft} 100%)`,
        border: `1px solid ${tierInfo.color}40`,
        borderRadius: 8,
        padding: 40,
        marginBottom: 24,
        display: "flex",
        gap: 32,
        alignItems: "center",
        flexWrap: "wrap",
      }}>
        <div style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: COLORS.bg,
          border: `3px solid ${tierInfo.color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900,
          fontSize: 36,
          color: tierInfo.color,
          flexShrink: 0,
          boxShadow: `0 0 40px ${tierInfo.color}30`,
        }}>
          {initials}
        </div>
        
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            color: tierInfo.color,
            letterSpacing: "0.25em",
            marginBottom: 8,
          }}>
            {tierInfo.icon} {tierInfo.label.toUpperCase()} · {typeInfo.icon} {typeInfo.label.toUpperCase()}
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
            {expert.full_name}
          </h1>
          {expert.current_role && (
            <p style={{
              color: COLORS.body,
              opacity: 0.85,
              fontSize: 16,
              margin: "0 0 8px",
              fontStyle: "italic",
            }}>
              {expert.current_role}
            </p>
          )}
          {expert.country && (
            <p style={{
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
              color: COLORS.body,
              opacity: 0.5,
              letterSpacing: "0.15em",
              margin: 0,
            }}>
              {expert.country.toUpperCase()}
              {expert.region_focus && ` · FOCUS: ${expert.region_focus.toUpperCase()}`}
            </p>
          )}
        </div>
      </div>
      
      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12,
        marginBottom: 32,
      }}>
        <StatCard label="Endorsements" value={expert.endorsement_count || 0} color={COLORS.green} />
        <StatCard label="Fans Referred" value={expert.fans_referred || 0} color={COLORS.gold} />
        <StatCard label="Followers" value={(expert.follower_count || 0).toLocaleString()} color={COLORS.teal} />
      </div>
      
      {/* Background */}
      {expert.professional_background && (
        <Section title="Background">
          <p style={{ color: COLORS.body, fontSize: 15, lineHeight: 1.7, margin: 0 }}>
            {expert.professional_background}
          </p>
        </Section>
      )}
      
      {/* Bio */}
      {expert.bio && (
        <Section title="What They Offer">
          <p style={{ color: COLORS.body, fontSize: 15, lineHeight: 1.7, margin: 0 }}>
            {expert.bio}
          </p>
        </Section>
      )}
      
      {/* Expertise */}
      {expert.expertise_areas && expert.expertise_areas.length > 0 && (
        <Section title="Expertise">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {expert.expertise_areas.map(area => (
              <span key={area} style={tagStyle}>{area}</span>
            ))}
          </div>
        </Section>
      )}
      
      {/* Clubs */}
      {expert.clubs_supported && expert.clubs_supported.length > 0 && (
        <Section title="Clubs Supported">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {expert.clubs_supported.map(club => (
              <span key={club} style={tagStyle}>⚽ {club}</span>
            ))}
          </div>
        </Section>
      )}
      
      {/* Endorsements */}
      {endorsements.length > 0 && (
        <Section title={`🛡️ Club Endorsements (${endorsements.length})`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {endorsements.map(end => (
              <div
                key={end.id}
                style={{
                  background: COLORS.bg,
                  border: `1px solid ${COLORS.hairline}`,
                  borderRadius: 4,
                  padding: 16,
                }}
              >
                {end.club && (
                  <a
                    href={`#clubs/${end.club.slug}`}
                    style={{
                      color: COLORS.green,
                      fontSize: 13,
                      fontFamily: "'DM Mono', monospace",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      textDecoration: "none",
                      marginBottom: 8,
                      display: "inline-block",
                    }}
                  >
                    → {end.club.name}
                  </a>
                )}
                <p style={{
                  color: COLORS.body,
                  fontSize: 14,
                  lineHeight: 1.6,
                  margin: 0,
                  fontStyle: "italic",
                }}>
                  "{end.endorsement_text}"
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}
      
      {/* Social Links */}
      {(expert.website || expert.social?.twitter || expert.social?.linkedin || expert.social?.youtube) && (
        <Section title="Connect">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {expert.website && <SocialLink href={expert.website} icon="🌐" label="Website" />}
            {expert.social?.twitter && <SocialLink href={`https://twitter.com/${expert.social.twitter.replace("@", "")}`} icon="𝕏" label="Twitter" />}
            {expert.social?.instagram && <SocialLink href={`https://instagram.com/${expert.social.instagram.replace("@", "")}`} icon="📸" label="Instagram" />}
            {expert.social?.linkedin && <SocialLink href={expert.social.linkedin} icon="💼" label="LinkedIn" />}
            {expert.social?.youtube && <SocialLink href={expert.social.youtube} icon="▶️" label="YouTube" />}
          </div>
        </Section>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: COLORS.bgSoft,
      border: `1px solid ${COLORS.hairline}`,
      borderRadius: 4,
      padding: 20,
      textAlign: "center",
    }}>
      <div style={{
        fontSize: 32,
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 900,
        color: color || COLORS.green,
      }}>
        {value}
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
        {label}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{
      background: COLORS.bgSoft,
      border: `1px solid ${COLORS.hairline}`,
      borderRadius: 4,
      padding: 24,
      marginBottom: 16,
    }}>
      <div style={{
        fontSize: 11,
        fontFamily: "'DM Mono', monospace",
        color: COLORS.gold,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        marginBottom: 16,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: "clamp(24px, 5vw, 32px)",
        fontWeight: 900,
        color: "#F2F5EE",
        margin: "0 0 4px",
        letterSpacing: "-0.01em",
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ color: COLORS.body, opacity: 0.6, margin: 0, fontSize: 14 }}>{subtitle}</p>
      )}
    </div>
  );
}

const tagStyle = {
  background: COLORS.bg,
  border: `1px solid ${COLORS.hairlineStrong}`,
  color: "#F2F5EE",
  padding: "6px 12px",
  borderRadius: 100,
  fontSize: 12,
  fontFamily: "'DM Mono', monospace",
  letterSpacing: "0.05em",
};

function SocialLink({ href, icon, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      style={{
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
      }}
    >
      {icon} {label}
    </a>
  );
}

function CTASection() {
  return (
    <div style={{
      marginTop: 80,
      padding: 40,
      background: `linear-gradient(135deg, ${COLORS.bgCard} 0%, ${COLORS.bgSoft} 100%)`,
      border: `1px solid ${COLORS.green}`,
      borderRadius: 8,
      textAlign: "center",
      boxShadow: `0 0 40px ${COLORS.greenGlow}`,
    }}>
      <div style={{
        fontSize: 11,
        fontFamily: "'DM Mono', monospace",
        color: COLORS.gold,
        letterSpacing: "0.25em",
        marginBottom: 16,
      }}>
        — JOIN THE TRUST LAYER
      </div>
      <h2 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: "clamp(28px, 5vw, 40px)",
        fontWeight: 900,
        color: "#F2F5EE",
        margin: "0 0 12px",
      }}>
        Are you a <span style={{ color: COLORS.green }}>football expert?</span>
      </h2>
      <p style={{
        color: COLORS.body,
        opacity: 0.7,
        maxWidth: 480,
        margin: "0 auto 24px",
        fontSize: 15,
      }}>
        Whether you're a verifier, voice, or community ambassador — we'd love to have you on the platform.
      </p>
      <a href="#experts/apply" style={{
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
        Apply to Become an Expert →
      </a>
    </div>
  );
}

function EmptyExpertsList() {
  return (
    <div style={{
      textAlign: "center",
      padding: "80px 20px",
      background: COLORS.bgSoft,
      border: `1px solid ${COLORS.hairline}`,
      borderRadius: 4,
    }}>
      <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.4 }}>🎓</div>
      <h3 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 24,
        color: "#F2F5EE",
        margin: "0 0 8px",
      }}>
        No experts yet
      </h3>
      <p style={{ color: COLORS.body, opacity: 0.6, margin: "0 0 24px" }}>
        Be the first expert to join FOFA's trust layer.
      </p>
      <a href="#experts/apply" style={{
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
    <div style={{ textAlign: "center", padding: "100px 20px" }}>
      <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.5 }}>🤷</div>
      <h2 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 32,
        fontWeight: 900,
        color: "#F2F5EE",
        margin: "0 0 12px",
      }}>
        Expert Not Found
      </h2>
      <p style={{ color: COLORS.body, opacity: 0.7, marginBottom: 24 }}>
        This profile doesn't exist or hasn't been published yet.
      </p>
      <a href="#experts" style={{
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
        Browse All Experts →
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
