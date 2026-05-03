import React, { useEffect, useState } from "react";

// ============================================================================
// FOFA EXPERT DASHBOARD
// Private dashboard for approved experts
// ============================================================================

const COLORS = {
  bg: "#080C08", bgSoft: "#0E140E", bgCard: "#0A1109",
  green: "#1AFF6E", greenGlow: "rgba(26, 255, 110, 0.15)",
  body: "#C8D4C0", gold: "#C8A84B", teal: "#1AC8C8",
  red: "#FF4757", purple: "#9C88FF",
  hairline: "rgba(200, 212, 192, 0.08)",
  hairlineStrong: "rgba(200, 212, 192, 0.15)",
};

const API_URL = import.meta.env.VITE_API_URL || "https://fofa.lol/api";

const TIER_BADGES = {
  legend: { label: "Legend", color: "#FFD700", icon: "🌟" },
  authority: { label: "Authority", color: "#C8A84B", icon: "⭐" },
  ambassador: { label: "Ambassador", color: "#1AC8C8", icon: "🎖️" },
};

const TYPE_LABELS = {
  verifier: { label: "Verifier", icon: "🛡️" },
  voice: { label: "Voice", icon: "📢" },
  ambassador: { label: "Ambassador", icon: "🎖️" },
};

export default function ExpertDashboard() {
  const [token, setToken] = useState(localStorage.getItem("fofaToken"));
  const [loading, setLoading] = useState(true);
  const [expert, setExpert] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [activeTab, setActiveTab] = useState("clubs");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    loadExpertProfile();
  }, [token]);

  async function loadExpertProfile() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/experts/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (!data.is_expert) {
        setError("not_expert");
      } else {
        setExpert(data.expert);
        loadClubs();
      }
    } catch (err) {
      setError("load_failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadClubs() {
    try {
      const response = await fetch(`${API_URL}/clubs?limit=100`);
      const data = await response.json();
      setClubs(data.clubs || []);
    } catch (err) {
      console.error(err);
    }
  }

  // Not logged in
  if (!token) {
    return <NotLoggedIn />;
  }

  if (loading) {
    return (
      <div style={{ background: COLORS.bg, minHeight: "100vh", color: COLORS.body, fontFamily: "'Crimson Pro', Georgia, serif" }}>
        <GlobalStyles />
        <div style={{ padding: "100px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 14, fontFamily: "'DM Mono', monospace", opacity: 0.6, letterSpacing: "0.2em" }}>
            LOADING DASHBOARD...
          </div>
        </div>
      </div>
    );
  }

  if (error === "not_expert") {
    return <NotAnExpert />;
  }

  return (
    <div style={{ background: COLORS.bg, color: COLORS.body, fontFamily: "'Crimson Pro', Georgia, serif", minHeight: "100vh" }}>
      <GlobalStyles />
      
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 24px",
        borderBottom: `1px solid ${COLORS.hairline}`,
        flexWrap: "wrap",
        gap: 12,
      }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 24, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, color: COLORS.green, letterSpacing: "0.05em" }}>
            FOFA
          </div>
          <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.5, letterSpacing: "0.15em", borderLeft: `1px solid ${COLORS.hairline}`, paddingLeft: 12 }}>
            EXPERT DASHBOARD
          </div>
        </a>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <a href={`#experts/${expert.slug}`} style={{ color: COLORS.body, opacity: 0.7, fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none" }}>
            View Public Profile →
          </a>
        </div>
      </div>

      <div style={{ padding: "0 20px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          
          {/* Welcome Hero */}
          <div style={{ padding: "40px 0 24px" }}>
            <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.gold, letterSpacing: "0.25em", marginBottom: 12 }}>
              {TIER_BADGES[expert.tier]?.icon} {TIER_BADGES[expert.tier]?.label.toUpperCase()} · {TYPE_LABELS[expert.expert_type]?.icon} {TYPE_LABELS[expert.expert_type]?.label.toUpperCase()}
            </div>
            <h1 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "clamp(36px, 7vw, 56px)",
              fontWeight: 900,
              color: "#F2F5EE",
              margin: "0 0 8px",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}>
              Welcome, <span style={{ color: COLORS.green }}>{expert.full_name.split(" ")[0]}</span>
            </h1>
            <p style={{ color: COLORS.body, opacity: 0.7, fontSize: 16, margin: 0 }}>
              Your endorsements shape the trust layer of FOFA.
            </p>
          </div>

          {/* Stats */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 32,
          }}>
            <StatCard label="Endorsements" value={expert.endorsement_count || 0} color={COLORS.green} icon="🛡️" />
            <StatCard label="Tier" value={TIER_BADGES[expert.tier]?.label || "—"} color={TIER_BADGES[expert.tier]?.color || COLORS.gold} icon={TIER_BADGES[expert.tier]?.icon} />
            <StatCard label="Role" value={TYPE_LABELS[expert.expert_type]?.label || "—"} color={COLORS.teal} icon={TYPE_LABELS[expert.expert_type]?.icon} />
          </div>

          {/* Tabs */}
          <div style={{
            display: "flex",
            gap: 0,
            borderBottom: `1px solid ${COLORS.hairline}`,
            marginBottom: 32,
            flexWrap: "wrap",
          }}>
            {[
              { id: "clubs", label: "🏟️ Endorse Clubs" },
              { id: "endorsements", label: "📜 My Endorsements" },
              { id: "profile", label: "👤 My Profile" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: activeTab === tab.id ? COLORS.green : COLORS.body,
                  opacity: activeTab === tab.id ? 1 : 0.6,
                  padding: "12px 16px",
                  fontSize: 12,
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  borderBottom: `2px solid ${activeTab === tab.id ? COLORS.green : "transparent"}`,
                  transition: "all 0.2s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "clubs" && <ClubsToEndorse clubs={clubs} expert={expert} token={token} onEndorsed={loadExpertProfile} />}
          {activeTab === "endorsements" && <MyEndorsements expertId={expert.id} expertSlug={expert.slug} />}
          {activeTab === "profile" && <ProfilePreview expert={expert} />}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CLUBS TO ENDORSE
// ============================================================================

function ClubsToEndorse({ clubs, expert, token, onEndorsed }) {
  const [selectedClub, setSelectedClub] = useState(null);
  const [endorsementText, setEndorsementText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [endorsedClubIds, setEndorsedClubIds] = useState(new Set());

  useEffect(() => {
    // Fetch existing endorsements to disable already-endorsed clubs
    fetchMyEndorsements();
  }, [expert.id]);

  async function fetchMyEndorsements() {
    try {
      const response = await fetch(`${API_URL}/experts/${expert.slug}`);
      const data = await response.json();
      const ids = new Set((data.endorsements || []).map(e => e.club?.id).filter(Boolean));
      setEndorsedClubIds(ids);
    } catch (err) {
      console.error(err);
    }
  }

  async function submitEndorsement() {
    if (!selectedClub || endorsementText.length < 20) {
      alert("Endorsement must be at least 20 characters");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/experts/endorse`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          club_id: selectedClub.id,
          endorsement_text: endorsementText,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Endorsement failed");
      }

      alert(`✅ Endorsement of ${selectedClub.name} submitted!`);
      setSelectedClub(null);
      setEndorsementText("");
      onEndorsed();
      fetchMyEndorsements();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  const filteredClubs = clubs.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.country.toLowerCase().includes(search.toLowerCase()) ||
    c.league.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedClub) {
    return (
      <div>
        <button
          onClick={() => { setSelectedClub(null); setEndorsementText(""); }}
          style={{
            background: "transparent",
            border: `1px solid ${COLORS.hairline}`,
            color: COLORS.body,
            padding: "8px 14px",
            borderRadius: 4,
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
            marginBottom: 24,
          }}
        >
          ← Back to clubs
        </button>

        <div style={{
          background: COLORS.bgSoft,
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 8,
          padding: 32,
        }}>
          <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.gold, letterSpacing: "0.2em", marginBottom: 16 }}>
            ENDORSING:
          </div>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 36,
            fontWeight: 900,
            color: "#F2F5EE",
            margin: "0 0 8px",
            letterSpacing: "-0.01em",
          }}>
            {selectedClub.name}
          </h2>
          <p style={{ color: COLORS.body, opacity: 0.7, margin: "0 0 24px", fontSize: 14 }}>
            {selectedClub.country} · {selectedClub.league_tier || selectedClub.league}
          </p>

          <div style={{
            background: COLORS.bg,
            border: `1px solid ${COLORS.green}40`,
            borderRadius: 4,
            padding: 16,
            marginBottom: 24,
            fontSize: 13,
            color: COLORS.body,
            lineHeight: 1.6,
          }}>
            <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.green, letterSpacing: "0.2em", marginBottom: 8 }}>
              💡 ENDORSEMENT GUIDELINES
            </div>
            Your endorsement appears publicly on the club's profile. Speak from your professional experience. Be honest, specific, and concise. This is your name attached.
          </div>

          <label style={{
            display: "block",
            fontSize: 12,
            fontFamily: "'DM Mono', monospace",
            color: COLORS.body,
            opacity: 0.85,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}>
            Your Endorsement *
          </label>
          <textarea
            value={endorsementText}
            onChange={e => setEndorsementText(e.target.value)}
            placeholder="e.g., I've worked with this club for 8 years. Genuine community focus, run by good people. Highly recommended."
            rows={5}
            style={{
              width: "100%",
              background: COLORS.bg,
              border: `1px solid ${COLORS.hairlineStrong}`,
              color: "#F2F5EE",
              padding: 16,
              borderRadius: 4,
              fontSize: 14,
              fontFamily: "'Crimson Pro', serif",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
            onFocus={e => e.target.style.borderColor = COLORS.green}
            onBlur={e => e.target.style.borderColor = COLORS.hairlineStrong}
          />
          <div style={{
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            color: endorsementText.length < 20 ? COLORS.red : COLORS.body,
            opacity: 0.6,
            marginTop: 6,
          }}>
            {endorsementText.length} / 20 chars minimum
          </div>

          <button
            onClick={submitEndorsement}
            disabled={submitting || endorsementText.length < 20}
            style={{
              marginTop: 24,
              width: "100%",
              background: COLORS.green,
              color: COLORS.bg,
              border: "none",
              padding: "16px 28px",
              fontSize: 13,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 700,
              borderRadius: 4,
              cursor: (submitting || endorsementText.length < 20) ? "not-allowed" : "pointer",
              opacity: (submitting || endorsementText.length < 20) ? 0.5 : 1,
            }}
          >
            {submitting ? "Submitting..." : "🛡️ Submit Endorsement"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search clubs by name, country, or league..."
          style={{
            width: "100%",
            background: COLORS.bgSoft,
            border: `1px solid ${COLORS.hairlineStrong}`,
            color: "#F2F5EE",
            padding: "14px 18px",
            borderRadius: 4,
            fontSize: 14,
            fontFamily: "'Crimson Pro', serif",
            outline: "none",
            boxSizing: "border-box",
          }}
          onFocus={e => e.target.style.borderColor = COLORS.green}
          onBlur={e => e.target.style.borderColor = COLORS.hairlineStrong}
        />
      </div>

      {filteredClubs.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: 60,
          background: COLORS.bgSoft,
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 4,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>🏟️</div>
          <div style={{ color: COLORS.body, fontSize: 14 }}>
            {search ? "No clubs match your search" : "No approved clubs available yet"}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredClubs.map(club => {
            const alreadyEndorsed = endorsedClubIds.has(club.id);
            const initials = club.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
            
            return (
              <div
                key={club.id}
                style={{
                  background: COLORS.bgSoft,
                  border: `1px solid ${alreadyEndorsed ? COLORS.green + "40" : COLORS.hairline}`,
                  borderRadius: 4,
                  padding: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                  cursor: alreadyEndorsed ? "default" : "pointer",
                  opacity: alreadyEndorsed ? 0.7 : 1,
                  transition: "all 0.2s",
                }}
                onClick={() => !alreadyEndorsed && setSelectedClub(club)}
                onMouseEnter={e => {
                  if (!alreadyEndorsed) {
                    e.currentTarget.style.borderColor = COLORS.green;
                    e.currentTarget.style.background = COLORS.bgCard;
                  }
                }}
                onMouseLeave={e => {
                  if (!alreadyEndorsed) {
                    e.currentTarget.style.borderColor = COLORS.hairline;
                    e.currentTarget.style.background = COLORS.bgSoft;
                  }
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: COLORS.bg,
                  border: `2px solid ${COLORS.green}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900,
                  fontSize: 13,
                  color: COLORS.green,
                  flexShrink: 0,
                }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ color: "#F2F5EE", fontSize: 15, fontWeight: 500 }}>{club.name}</div>
                  <div style={{
                    fontSize: 11,
                    fontFamily: "'DM Mono', monospace",
                    color: COLORS.body,
                    opacity: 0.6,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginTop: 2,
                  }}>
                    {club.country} · {club.league_tier || club.league}
                  </div>
                </div>
                {alreadyEndorsed ? (
                  <div style={{
                    fontSize: 11,
                    fontFamily: "'DM Mono', monospace",
                    color: COLORS.green,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}>
                    ✓ Endorsed
                  </div>
                ) : (
                  <div style={{
                    fontSize: 11,
                    fontFamily: "'DM Mono', monospace",
                    color: COLORS.gold,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}>
                    Endorse →
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MY ENDORSEMENTS
// ============================================================================

function MyEndorsements({ expertId, expertSlug }) {
  const [endorsements, setEndorsements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEndorsements();
  }, [expertId]);

  async function fetchEndorsements() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/experts/${expertSlug}`);
      const data = await response.json();
      setEndorsements(data.endorsements || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: COLORS.body, opacity: 0.6 }}>Loading...</div>;
  }

  if (endorsements.length === 0) {
    return (
      <div style={{
        textAlign: "center",
        padding: 60,
        background: COLORS.bgSoft,
        border: `1px solid ${COLORS.hairline}`,
        borderRadius: 4,
      }}>
        <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>📜</div>
        <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, color: "#F2F5EE", margin: "0 0 8px" }}>
          No endorsements yet
        </h3>
        <p style={{ color: COLORS.body, opacity: 0.6, margin: 0, fontSize: 14 }}>
          Switch to "Endorse Clubs" to get started.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {endorsements.map(end => (
        <div
          key={end.id}
          style={{
            background: COLORS.bgSoft,
            border: `1px solid ${COLORS.hairline}`,
            borderRadius: 4,
            padding: 20,
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
          <div style={{
            fontSize: 10,
            fontFamily: "'DM Mono', monospace",
            color: COLORS.body,
            opacity: 0.4,
            marginTop: 12,
            letterSpacing: "0.1em",
          }}>
            {new Date(end.created_at).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// PROFILE PREVIEW
// ============================================================================

function ProfilePreview({ expert }) {
  return (
    <div>
      <div style={{
        background: COLORS.bgSoft,
        border: `1px solid ${COLORS.hairline}`,
        borderRadius: 4,
        padding: 24,
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.gold, letterSpacing: "0.2em", marginBottom: 16 }}>
          PROFILE INFO
        </div>
        <PreviewField label="Full Name" value={expert.full_name} />
        <PreviewField label="Display Name" value={expert.display_name || expert.full_name} />
        <PreviewField label="Type" value={`${TYPE_LABELS[expert.expert_type]?.icon} ${TYPE_LABELS[expert.expert_type]?.label}`} />
        <PreviewField label="Tier" value={`${TIER_BADGES[expert.tier]?.icon} ${TIER_BADGES[expert.tier]?.label}`} />
        <PreviewField label="Endorsements" value={expert.endorsement_count || 0} />
      </div>

      <div style={{
        background: COLORS.bgSoft,
        border: `1px dashed ${COLORS.hairlineStrong}`,
        borderRadius: 4,
        padding: 24,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✏️</div>
        <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, color: "#F2F5EE", margin: "0 0 8px" }}>
          Profile Editing
        </h3>
        <p style={{ color: COLORS.body, opacity: 0.7, fontSize: 13, margin: "0 0 16px" }}>
          Need to update your bio, links, or details?
        </p>
        <p style={{ color: COLORS.body, opacity: 0.5, fontSize: 12, margin: 0 }}>
          Contact admin@fofa.lol to update your profile.
        </p>
      </div>
    </div>
  );
}

function PreviewField({ label, value }) {
  return (
    <div style={{
      display: "flex",
      gap: 16,
      paddingBottom: 12,
      marginBottom: 12,
      borderBottom: `1px solid ${COLORS.hairline}`,
    }}>
      <div style={{
        flex: "0 0 140px",
        fontSize: 11,
        fontFamily: "'DM Mono', monospace",
        color: COLORS.body,
        opacity: 0.6,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}>
        {label}
      </div>
      <div style={{ color: "#F2F5EE", fontSize: 14, flex: 1 }}>{value}</div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{
      background: COLORS.bgSoft,
      border: `1px solid ${COLORS.hairline}`,
      borderRadius: 4,
      padding: 20,
    }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{
        fontSize: 28,
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 900,
        color: color || COLORS.green,
        lineHeight: 1,
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

function NotLoggedIn() {
  return (
    <div style={{ background: COLORS.bg, color: COLORS.body, fontFamily: "'Crimson Pro', Georgia, serif", minHeight: "100vh" }}>
      <GlobalStyles />
      <div style={{ padding: "100px 20px", textAlign: "center", maxWidth: 500, margin: "0 auto" }}>
        <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.5 }}>🔒</div>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, color: "#F2F5EE", margin: "0 0 12px" }}>
          Login Required
        </h2>
        <p style={{ color: COLORS.body, opacity: 0.7, marginBottom: 24, fontSize: 15 }}>
          You need to be logged in as an approved expert to access this dashboard.
        </p>
        <a href="#portal" style={{
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
          Login to FOFA →
        </a>
      </div>
    </div>
  );
}

function NotAnExpert() {
  return (
    <div style={{ background: COLORS.bg, color: COLORS.body, fontFamily: "'Crimson Pro', Georgia, serif", minHeight: "100vh" }}>
      <GlobalStyles />
      <div style={{ padding: "100px 20px", textAlign: "center", maxWidth: 500, margin: "0 auto" }}>
        <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.5 }}>🎓</div>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 32, fontWeight: 900, color: "#F2F5EE", margin: "0 0 12px" }}>
          Not an Expert Yet
        </h2>
        <p style={{ color: COLORS.body, opacity: 0.7, marginBottom: 24, fontSize: 15, lineHeight: 1.6 }}>
          You're logged in, but you haven't been approved as an expert yet. Apply to join FOFA's trust layer.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
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
            Apply to Be an Expert →
          </a>
          <a href="/" style={{
            display: "inline-block",
            background: "transparent",
            color: COLORS.body,
            border: `1px solid ${COLORS.hairlineStrong}`,
            padding: "14px 28px",
            textDecoration: "none",
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            borderRadius: 4,
          }}>
            Back to Site
          </a>
        </div>
      </div>
    </div>
  );
}

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,500;1,400&family=DM+Mono:wght@400;500&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    `}</style>
  );
}
