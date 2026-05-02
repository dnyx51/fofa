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
              { id: "articles", label: "📝 My Articles" },
              ...(expert.expert_type === "ambassador" ? [{ id: "moderation", label: "🎖️ Moderation" }] : []),
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
          {activeTab === "endorsements" && <MyEndorsements expertId={expert.id} expertSlug={expert.slug} token={token} onChanged={loadExpertProfile} />}
          {activeTab === "articles" && <MyArticles expert={expert} token={token} clubs={clubs} />}
          {activeTab === "moderation" && expert.expert_type === "ambassador" && <ModerationPanel expert={expert} token={token} />}
          {activeTab === "profile" && <ProfileEditor expert={expert} token={token} onSaved={loadExpertProfile} />}
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

function MyEndorsements({ expertId, expertSlug, token, onChanged }) {
  const [endorsements, setEndorsements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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

  async function handleEdit(endorsementId) {
    if (editText.trim().length < 20) {
      alert("Endorsement must be at least 20 characters");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/experts/endorsements/${endorsementId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ endorsement_text: editText.trim() }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Update failed");
      }
      setEditingId(null);
      setEditText("");
      fetchEndorsements();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(endorsementId) {
    try {
      const response = await fetch(`${API_URL}/experts/endorsements/${endorsementId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Delete failed");
      }
      setDeletingId(null);
      fetchEndorsements();
      onChanged();
    } catch (err) {
      alert(`Error: ${err.message}`);
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

          {/* Delete confirmation */}
          {deletingId === end.id ? (
            <div style={{
              background: COLORS.bg,
              border: `1px solid ${COLORS.red}40`,
              borderRadius: 4,
              padding: 16,
              marginTop: 8,
            }}>
              <p style={{ color: COLORS.body, fontSize: 13, margin: "0 0 12px" }}>
                Are you sure you want to delete this endorsement? This cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleDelete(end.id)}
                  style={{
                    background: COLORS.red,
                    color: "#fff",
                    border: "none",
                    padding: "8px 16px",
                    fontSize: 11,
                    fontFamily: "'DM Mono', monospace",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setDeletingId(null)}
                  style={{
                    background: "transparent",
                    color: COLORS.body,
                    border: `1px solid ${COLORS.hairlineStrong}`,
                    padding: "8px 16px",
                    fontSize: 11,
                    fontFamily: "'DM Mono', monospace",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : editingId === end.id ? (
            /* Edit mode */
            <div style={{ marginTop: 8 }}>
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  background: COLORS.bg,
                  border: `1px solid ${COLORS.green}40`,
                  color: "#F2F5EE",
                  padding: 14,
                  borderRadius: 4,
                  fontSize: 14,
                  fontFamily: "'Crimson Pro', serif",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
              <div style={{
                fontSize: 11,
                fontFamily: "'DM Mono', monospace",
                color: editText.trim().length < 20 ? COLORS.red : COLORS.body,
                opacity: 0.6,
                marginTop: 4,
                marginBottom: 12,
              }}>
                {editText.trim().length} / 20 chars minimum
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleEdit(end.id)}
                  disabled={saving || editText.trim().length < 20}
                  style={{
                    background: COLORS.green,
                    color: COLORS.bg,
                    border: "none",
                    padding: "8px 16px",
                    fontSize: 11,
                    fontFamily: "'DM Mono', monospace",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    borderRadius: 4,
                    cursor: (saving || editText.trim().length < 20) ? "not-allowed" : "pointer",
                    opacity: (saving || editText.trim().length < 20) ? 0.5 : 1,
                  }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => { setEditingId(null); setEditText(""); }}
                  style={{
                    background: "transparent",
                    color: COLORS.body,
                    border: `1px solid ${COLORS.hairlineStrong}`,
                    padding: "8px 16px",
                    fontSize: 11,
                    fontFamily: "'DM Mono', monospace",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Display mode */
            <>
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
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 12,
                flexWrap: "wrap",
                gap: 8,
              }}>
                <div style={{
                  fontSize: 10,
                  fontFamily: "'DM Mono', monospace",
                  color: COLORS.body,
                  opacity: 0.4,
                  letterSpacing: "0.1em",
                }}>
                  {new Date(end.created_at).toLocaleDateString()}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => { setEditingId(end.id); setEditText(end.endorsement_text); setDeletingId(null); }}
                    style={{
                      background: "transparent",
                      border: `1px solid ${COLORS.hairlineStrong}`,
                      color: COLORS.teal,
                      padding: "5px 12px",
                      fontSize: 10,
                      fontFamily: "'DM Mono', monospace",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      borderRadius: 3,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.teal; e.currentTarget.style.background = COLORS.teal + "15"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.hairlineStrong; e.currentTarget.style.background = "transparent"; }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { setDeletingId(end.id); setEditingId(null); }}
                    style={{
                      background: "transparent",
                      border: `1px solid ${COLORS.hairlineStrong}`,
                      color: COLORS.red,
                      padding: "5px 12px",
                      fontSize: 10,
                      fontFamily: "'DM Mono', monospace",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      borderRadius: 3,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.red; e.currentTarget.style.background = COLORS.red + "15"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.hairlineStrong; e.currentTarget.style.background = "transparent"; }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MY ARTICLES (Voice Publishing)
// ============================================================================

function MyArticles({ expert, token, clubs }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list | form
  const [editingArticle, setEditingArticle] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Form state
  const [form, setForm] = useState({ title: "", content: "", summary: "", tags: "", club_ids: [] });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => { fetchArticles(); }, []);

  async function fetchArticles() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/experts/articles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openNewForm() {
    setEditingArticle(null);
    setForm({ title: "", content: "", summary: "", tags: "", club_ids: [] });
    setFeedback(null);
    setView("form");
  }

  function openEditForm(article) {
    setEditingArticle(article);
    setForm({
      title: article.title,
      content: article.content,
      summary: article.summary || "",
      tags: (article.tags || []).join(", "),
      club_ids: article.club_ids || [],
    });
    setFeedback(null);
    setView("form");
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) {
      setFeedback({ type: "error", message: "Title and content are required" });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        summary: form.summary.trim(),
        tags: form.tags.split(",").map(s => s.trim()).filter(Boolean),
        club_ids: form.club_ids,
      };

      const url = editingArticle
        ? `${API_URL}/experts/articles/${editingArticle._id}`
        : `${API_URL}/experts/articles`;
      const method = editingArticle ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }

      setView("list");
      fetchArticles();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish(article) {
    try {
      const newStatus = article.status === "published" ? "draft" : "published";
      const res = await fetch(`${API_URL}/experts/articles/${article._id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Update failed");
      }
      fetchArticles();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  async function handleDelete(articleId) {
    try {
      const res = await fetch(`${API_URL}/experts/articles/${articleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      setDeletingId(null);
      fetchArticles();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  const inputStyle = {
    width: "100%",
    background: COLORS.bg,
    border: `1px solid ${COLORS.hairlineStrong}`,
    color: "#F2F5EE",
    padding: "12px 14px",
    borderRadius: 4,
    fontSize: 14,
    fontFamily: "'Crimson Pro', serif",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    display: "block",
    fontSize: 11,
    fontFamily: "'DM Mono', monospace",
    color: COLORS.body,
    opacity: 0.7,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: 6,
  };

  // ── Form View ──
  if (view === "form") {
    return (
      <div>
        <button
          onClick={() => setView("list")}
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
          ← Back to articles
        </button>

        <div style={{
          background: COLORS.bgSoft,
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 8,
          padding: 32,
        }}>
          <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.gold, letterSpacing: "0.2em", marginBottom: 24 }}>
            {editingArticle ? "EDIT ARTICLE" : "NEW ARTICLE"}
          </div>

          {feedback && (
            <div style={{
              background: feedback.type === "success" ? COLORS.green + "15" : COLORS.red + "15",
              border: `1px solid ${feedback.type === "success" ? COLORS.green : COLORS.red}40`,
              borderRadius: 4,
              padding: "12px 16px",
              marginBottom: 20,
              fontSize: 13,
              color: feedback.type === "success" ? COLORS.green : COLORS.red,
              fontFamily: "'DM Mono', monospace",
            }}>
              {feedback.type === "success" ? "✓" : "✕"} {feedback.message}
            </div>
          )}

          {/* Title */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Your article title"
              style={{ ...inputStyle, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 700, padding: "14px 16px" }}
              onFocus={e => e.target.style.borderColor = COLORS.green}
              onBlur={e => e.target.style.borderColor = COLORS.hairlineStrong}
            />
          </div>

          {/* Summary */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Summary</label>
            <input
              type="text"
              value={form.summary}
              onChange={e => setForm(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="A short summary shown in article previews"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = COLORS.green}
              onBlur={e => e.target.style.borderColor = COLORS.hairlineStrong}
            />
          </div>

          {/* Content */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Content *</label>
            <textarea
              value={form.content}
              onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write your article here..."
              rows={12}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }}
              onFocus={e => e.target.style.borderColor = COLORS.green}
              onBlur={e => e.target.style.borderColor = COLORS.hairlineStrong}
            />
            <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.4, marginTop: 4 }}>
              {form.content.length} characters
            </div>
          </div>

          {/* Tags */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Tags (comma-separated)</label>
            <input
              type="text"
              value={form.tags}
              onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="e.g., Tactics, Premier League, Match Analysis"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = COLORS.green}
              onBlur={e => e.target.style.borderColor = COLORS.hairlineStrong}
            />
          </div>

          {/* Linked Clubs */}
          {clubs.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Link to Clubs (optional)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                {clubs.slice(0, 20).map(club => {
                  const isSelected = form.club_ids.includes(club.id);
                  return (
                    <button
                      key={club.id}
                      onClick={() => {
                        setForm(prev => ({
                          ...prev,
                          club_ids: isSelected
                            ? prev.club_ids.filter(id => id !== club.id)
                            : [...prev.club_ids, club.id],
                        }));
                      }}
                      style={{
                        background: isSelected ? COLORS.green + "20" : "transparent",
                        border: `1px solid ${isSelected ? COLORS.green : COLORS.hairlineStrong}`,
                        color: isSelected ? COLORS.green : COLORS.body,
                        padding: "6px 12px",
                        fontSize: 11,
                        fontFamily: "'DM Mono', monospace",
                        borderRadius: 20,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {isSelected ? "✓ " : ""}{club.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
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
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Saving..." : editingArticle ? "Update Article" : "Save as Draft"}
          </button>
        </div>
      </div>
    );
  }

  // ── List View ──
  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: COLORS.body, opacity: 0.6 }}>Loading articles...</div>;
  }

  return (
    <div>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.6, letterSpacing: "0.1em" }}>
          {articles.length} ARTICLE{articles.length !== 1 ? "S" : ""}
        </div>
        <button
          onClick={openNewForm}
          style={{
            background: COLORS.green,
            color: COLORS.bg,
            border: "none",
            padding: "10px 20px",
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontWeight: 700,
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          + New Article
        </button>
      </div>

      {articles.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: 60,
          background: COLORS.bgSoft,
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 4,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>📝</div>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, color: "#F2F5EE", margin: "0 0 8px" }}>
            No articles yet
          </h3>
          <p style={{ color: COLORS.body, opacity: 0.6, margin: "0 0 20px", fontSize: 14 }}>
            Share your expertise with the FOFA community.
          </p>
          <button
            onClick={openNewForm}
            style={{
              background: COLORS.green,
              color: COLORS.bg,
              border: "none",
              padding: "12px 24px",
              fontSize: 12,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 700,
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Write Your First Article
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {articles.map(article => (
            <div
              key={article._id}
              style={{
                background: COLORS.bgSoft,
                border: `1px solid ${COLORS.hairline}`,
                borderRadius: 4,
                padding: 20,
              }}
            >
              {/* Status badge + title */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                <span style={{
                  display: "inline-block",
                  padding: "3px 10px",
                  borderRadius: 20,
                  fontSize: 10,
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: 4,
                  background: article.status === "published" ? COLORS.green + "20" : COLORS.gold + "20",
                  color: article.status === "published" ? COLORS.green : COLORS.gold,
                  border: `1px solid ${article.status === "published" ? COLORS.green : COLORS.gold}40`,
                }}>
                  {article.status === "published" ? "Live" : "Draft"}
                </span>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: 20,
                    fontWeight: 900,
                    color: "#F2F5EE",
                    margin: 0,
                    lineHeight: 1.2,
                  }}>
                    {article.title}
                  </h3>
                  {article.summary && (
                    <p style={{ color: COLORS.body, opacity: 0.7, fontSize: 13, margin: "6px 0 0", lineHeight: 1.5 }}>
                      {article.summary}
                    </p>
                  )}
                </div>
              </div>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {article.tags.map((tag, i) => (
                    <span key={i} style={{
                      fontSize: 10,
                      fontFamily: "'DM Mono', monospace",
                      color: COLORS.teal,
                      background: COLORS.teal + "10",
                      border: `1px solid ${COLORS.teal}30`,
                      padding: "2px 8px",
                      borderRadius: 12,
                      letterSpacing: "0.05em",
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Delete confirmation */}
              {deletingId === article._id ? (
                <div style={{
                  background: COLORS.bg,
                  border: `1px solid ${COLORS.red}40`,
                  borderRadius: 4,
                  padding: 16,
                  marginTop: 8,
                }}>
                  <p style={{ color: COLORS.body, fontSize: 13, margin: "0 0 12px" }}>
                    Delete this article? This cannot be undone.
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleDelete(article._id)}
                      style={{
                        background: COLORS.red,
                        color: "#fff",
                        border: "none",
                        padding: "8px 16px",
                        fontSize: 11,
                        fontFamily: "'DM Mono', monospace",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      style={{
                        background: "transparent",
                        color: COLORS.body,
                        border: `1px solid ${COLORS.hairlineStrong}`,
                        padding: "8px 16px",
                        fontSize: 11,
                        fontFamily: "'DM Mono', monospace",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Meta row + actions */
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 4,
                  flexWrap: "wrap",
                  gap: 8,
                }}>
                  <div style={{ display: "flex", gap: 16, fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.4, letterSpacing: "0.1em" }}>
                    <span>{new Date(article.created_at).toLocaleDateString()}</span>
                    {article.views > 0 && <span>{article.views} views</span>}
                    {article.slug && article.status === "published" && (
                      <a
                        href={`#articles/${article.slug}`}
                        style={{ color: COLORS.teal, textDecoration: "none" }}
                      >
                        View →
                      </a>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleTogglePublish(article)}
                      style={{
                        background: "transparent",
                        border: `1px solid ${article.status === "published" ? COLORS.gold : COLORS.green}40`,
                        color: article.status === "published" ? COLORS.gold : COLORS.green,
                        padding: "5px 12px",
                        fontSize: 10,
                        fontFamily: "'DM Mono', monospace",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        borderRadius: 3,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {article.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      onClick={() => openEditForm(article)}
                      style={{
                        background: "transparent",
                        border: `1px solid ${COLORS.hairlineStrong}`,
                        color: COLORS.teal,
                        padding: "5px 12px",
                        fontSize: 10,
                        fontFamily: "'DM Mono', monospace",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        borderRadius: 3,
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingId(article._id)}
                      style={{
                        background: "transparent",
                        border: `1px solid ${COLORS.hairlineStrong}`,
                        color: COLORS.red,
                        padding: "5px 12px",
                        fontSize: 10,
                        fontFamily: "'DM Mono', monospace",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        borderRadius: 3,
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MODERATION PANEL (Ambassador Tools)
// ============================================================================

function ModerationPanel({ expert, token }) {
  const [activeView, setActiveView] = useState("my_reports"); // my_reports | new_report | admin_queue
  const [reports, setReports] = useState([]);
  const [adminReports, setAdminReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // New report form
  const [reportForm, setReportForm] = useState({
    target_type: "activity",
    target_id: "",
    target_name: "",
    reason: "",
    details: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => { fetchReports(); }, []);

  async function fetchReports() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/experts/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAdminReports() {
    try {
      const res = await fetch(`${API_URL}/admin/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAdminReports(data.reports || []);
    } catch (err) {
      console.error("Admin reports:", err);
    }
  }

  async function submitReport() {
    if (!reportForm.target_id.trim() || !reportForm.reason.trim()) {
      setFeedback({ type: "error", message: "Target ID and reason are required" });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_URL}/experts/reports`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(reportForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Report failed");
      }
      setFeedback({ type: "success", message: "Report submitted successfully" });
      setReportForm({ target_type: "activity", target_id: "", target_name: "", reason: "", details: "" });
      fetchReports();
      setTimeout(() => setActiveView("my_reports"), 1500);
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolve(reportId, status, note) {
    try {
      const res = await fetch(`${API_URL}/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolution_note: note || "" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Update failed");
      }
      fetchAdminReports();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  const inputStyle = {
    width: "100%",
    background: COLORS.bg,
    border: `1px solid ${COLORS.hairlineStrong}`,
    color: "#F2F5EE",
    padding: "12px 14px",
    borderRadius: 4,
    fontSize: 14,
    fontFamily: "'Crimson Pro', serif",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    display: "block",
    fontSize: 11,
    fontFamily: "'DM Mono', monospace",
    color: COLORS.body,
    opacity: 0.7,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: 6,
  };

  const STATUS_COLORS = {
    pending: COLORS.gold,
    reviewing: COLORS.teal,
    resolved: COLORS.green,
    dismissed: COLORS.body,
  };

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[
          { id: "my_reports", label: "My Reports" },
          { id: "new_report", label: "+ File Report" },
          { id: "admin_queue", label: "Review Queue" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveView(tab.id);
              if (tab.id === "admin_queue") fetchAdminReports();
            }}
            style={{
              background: activeView === tab.id ? COLORS.green + "15" : "transparent",
              border: `1px solid ${activeView === tab.id ? COLORS.green + "60" : COLORS.hairlineStrong}`,
              color: activeView === tab.id ? COLORS.green : COLORS.body,
              padding: "8px 16px",
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              borderRadius: 4,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── New Report Form ── */}
      {activeView === "new_report" && (
        <div style={{
          background: COLORS.bgSoft,
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 8,
          padding: 32,
        }}>
          <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.gold, letterSpacing: "0.2em", marginBottom: 24 }}>
            FILE A MODERATION REPORT
          </div>

          {feedback && (
            <div style={{
              background: feedback.type === "success" ? COLORS.green + "15" : COLORS.red + "15",
              border: `1px solid ${feedback.type === "success" ? COLORS.green : COLORS.red}40`,
              borderRadius: 4,
              padding: "12px 16px",
              marginBottom: 20,
              fontSize: 13,
              color: feedback.type === "success" ? COLORS.green : COLORS.red,
              fontFamily: "'DM Mono', monospace",
            }}>
              {feedback.type === "success" ? "✓" : "✕"} {feedback.message}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Target Type *</label>
              <select
                value={reportForm.target_type}
                onChange={e => setReportForm(prev => ({ ...prev, target_type: e.target.value }))}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="activity">Activity</option>
                <option value="user">User</option>
                <option value="endorsement">Endorsement</option>
                <option value="article">Article</option>
                <option value="club">Club</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Target ID *</label>
              <input
                type="text"
                value={reportForm.target_id}
                onChange={e => setReportForm(prev => ({ ...prev, target_id: e.target.value }))}
                placeholder="ID of the reported item"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = COLORS.green}
                onBlur={e => e.target.style.borderColor = COLORS.hairlineStrong}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Target Name (optional)</label>
            <input
              type="text"
              value={reportForm.target_name}
              onChange={e => setReportForm(prev => ({ ...prev, target_name: e.target.value }))}
              placeholder="Name or description for reference"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = COLORS.green}
              onBlur={e => e.target.style.borderColor = COLORS.hairlineStrong}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Reason *</label>
            <input
              type="text"
              value={reportForm.reason}
              onChange={e => setReportForm(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g., Spam, Inappropriate content, Misinformation"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = COLORS.green}
              onBlur={e => e.target.style.borderColor = COLORS.hairlineStrong}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Additional Details</label>
            <textarea
              value={reportForm.details}
              onChange={e => setReportForm(prev => ({ ...prev, details: e.target.value }))}
              placeholder="Provide additional context..."
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={e => e.target.style.borderColor = COLORS.green}
              onBlur={e => e.target.style.borderColor = COLORS.hairlineStrong}
            />
          </div>

          <button
            onClick={submitReport}
            disabled={submitting}
            style={{
              width: "100%",
              background: COLORS.gold,
              color: COLORS.bg,
              border: "none",
              padding: "16px 28px",
              fontSize: 13,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 700,
              borderRadius: 4,
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      )}

      {/* ── My Reports ── */}
      {activeView === "my_reports" && (
        loading ? (
          <div style={{ padding: 40, textAlign: "center", color: COLORS.body, opacity: 0.6 }}>Loading reports...</div>
        ) : reports.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: 60,
            background: COLORS.bgSoft,
            border: `1px solid ${COLORS.hairline}`,
            borderRadius: 4,
          }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>🎖️</div>
            <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, color: "#F2F5EE", margin: "0 0 8px" }}>
              No reports filed
            </h3>
            <p style={{ color: COLORS.body, opacity: 0.6, margin: "0 0 20px", fontSize: 14 }}>
              As an Ambassador, you can flag content that needs attention.
            </p>
            <button
              onClick={() => setActiveView("new_report")}
              style={{
                background: COLORS.gold,
                color: COLORS.bg,
                border: "none",
                padding: "12px 24px",
                fontSize: 12,
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontWeight: 700,
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              File Your First Report
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reports.map(report => (
              <div
                key={report._id}
                style={{
                  background: COLORS.bgSoft,
                  border: `1px solid ${COLORS.hairline}`,
                  borderRadius: 4,
                  padding: 20,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: 10,
                        fontFamily: "'DM Mono', monospace",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        background: (STATUS_COLORS[report.status] || COLORS.body) + "20",
                        color: STATUS_COLORS[report.status] || COLORS.body,
                        border: `1px solid ${(STATUS_COLORS[report.status] || COLORS.body)}40`,
                      }}>
                        {report.status}
                      </span>
                      <span style={{
                        fontSize: 10,
                        fontFamily: "'DM Mono', monospace",
                        color: COLORS.body,
                        opacity: 0.5,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}>
                        {report.target_type}
                      </span>
                    </div>
                    <div style={{ color: "#F2F5EE", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                      {report.reason}
                    </div>
                    {report.target_name && (
                      <div style={{ fontSize: 12, color: COLORS.body, opacity: 0.6 }}>
                        Target: {report.target_name}
                      </div>
                    )}
                    {report.details && (
                      <p style={{ fontSize: 13, color: COLORS.body, opacity: 0.7, margin: "8px 0 0", lineHeight: 1.5 }}>
                        {report.details}
                      </p>
                    )}
                    {report.resolution_note && (
                      <div style={{
                        marginTop: 10,
                        padding: "8px 12px",
                        background: COLORS.bg,
                        border: `1px solid ${COLORS.green}30`,
                        borderRadius: 4,
                        fontSize: 12,
                        color: COLORS.green,
                        fontFamily: "'DM Mono', monospace",
                      }}>
                        Resolution: {report.resolution_note}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.4 }}>
                    {new Date(report.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Admin Review Queue ── */}
      {activeView === "admin_queue" && (
        <div>
          <div style={{
            background: COLORS.bg,
            border: `1px solid ${COLORS.teal}30`,
            borderRadius: 4,
            padding: "12px 16px",
            marginBottom: 20,
            fontSize: 12,
            color: COLORS.teal,
            fontFamily: "'DM Mono', monospace",
          }}>
            Admin review queue — resolve or dismiss community reports.
          </div>

          {adminReports.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: 60,
              background: COLORS.bgSoft,
              border: `1px solid ${COLORS.hairline}`,
              borderRadius: 4,
            }}>
              <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>✅</div>
              <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, color: "#F2F5EE", margin: "0 0 8px" }}>
                Queue is clear
              </h3>
              <p style={{ color: COLORS.body, opacity: 0.6, margin: 0, fontSize: 14 }}>
                No pending reports to review.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {adminReports.map(report => (
                <AdminReportCard key={report._id} report={report} onResolve={handleResolve} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdminReportCard({ report, onResolve }) {
  const [note, setNote] = useState("");
  const [expanded, setExpanded] = useState(false);

  const STATUS_COLORS = {
    pending: COLORS.gold,
    reviewing: COLORS.teal,
    resolved: COLORS.green,
    dismissed: COLORS.body,
  };

  return (
    <div style={{
      background: COLORS.bgSoft,
      border: `1px solid ${COLORS.hairline}`,
      borderRadius: 4,
      padding: 20,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <span style={{
              display: "inline-block",
              padding: "2px 8px",
              borderRadius: 12,
              fontSize: 10,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              background: (STATUS_COLORS[report.status] || COLORS.body) + "20",
              color: STATUS_COLORS[report.status] || COLORS.body,
              border: `1px solid ${(STATUS_COLORS[report.status] || COLORS.body)}40`,
            }}>
              {report.status}
            </span>
            <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {report.target_type} · {new Date(report.created_at).toLocaleDateString()}
            </span>
          </div>
          <div style={{ color: "#F2F5EE", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
            {report.reason}
          </div>
          {report.target_name && (
            <div style={{ fontSize: 12, color: COLORS.body, opacity: 0.6, marginBottom: 4 }}>
              Target: {report.target_name} ({report.target_id})
            </div>
          )}
          {report.details && (
            <p style={{ fontSize: 13, color: COLORS.body, opacity: 0.7, margin: "4px 0 0", lineHeight: 1.5 }}>
              {report.details}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons for pending/reviewing reports */}
      {(report.status === "pending" || report.status === "reviewing") && (
        <div style={{ marginTop: 12 }}>
          {!expanded ? (
            <button
              onClick={() => setExpanded(true)}
              style={{
                background: "transparent",
                border: `1px solid ${COLORS.hairlineStrong}`,
                color: COLORS.teal,
                padding: "6px 14px",
                fontSize: 10,
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                borderRadius: 3,
                cursor: "pointer",
              }}
            >
              Take Action
            </button>
          ) : (
            <div style={{
              background: COLORS.bg,
              border: `1px solid ${COLORS.hairline}`,
              borderRadius: 4,
              padding: 16,
              marginTop: 8,
            }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{
                  display: "block",
                  fontSize: 11,
                  fontFamily: "'DM Mono', monospace",
                  color: COLORS.body,
                  opacity: 0.7,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}>
                  Resolution Note
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Optional note about your decision"
                  style={{
                    width: "100%",
                    background: COLORS.bgSoft,
                    border: `1px solid ${COLORS.hairlineStrong}`,
                    color: "#F2F5EE",
                    padding: "10px 12px",
                    borderRadius: 4,
                    fontSize: 13,
                    fontFamily: "'Crimson Pro', serif",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => { onResolve(report._id, "resolved", note); setExpanded(false); }}
                  style={{
                    background: COLORS.green,
                    color: COLORS.bg,
                    border: "none",
                    padding: "8px 16px",
                    fontSize: 11,
                    fontFamily: "'DM Mono', monospace",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Resolve
                </button>
                <button
                  onClick={() => { onResolve(report._id, "dismissed", note); setExpanded(false); }}
                  style={{
                    background: "transparent",
                    color: COLORS.body,
                    border: `1px solid ${COLORS.hairlineStrong}`,
                    padding: "8px 16px",
                    fontSize: 11,
                    fontFamily: "'DM Mono', monospace",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Dismiss
                </button>
                <button
                  onClick={() => setExpanded(false)}
                  style={{
                    background: "transparent",
                    color: COLORS.body,
                    opacity: 0.6,
                    border: "none",
                    padding: "8px 12px",
                    fontSize: 11,
                    fontFamily: "'DM Mono', monospace",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PROFILE EDITOR
// ============================================================================

function ProfileEditor({ expert, token, onSaved }) {
  const [form, setForm] = useState({
    display_name: expert.display_name || "",
    bio: expert.bio || "",
    current_role: expert.current_role || "",
    country: expert.country || "",
    region_focus: expert.region_focus || "",
    website: expert.website || "",
    social_twitter: expert.social?.twitter || "",
    social_instagram: expert.social?.instagram || "",
    social_linkedin: expert.social?.linkedin || "",
    social_youtube: expert.social?.youtube || "",
    clubs_supported: (expert.clubs_supported || []).join(", "),
    expertise_areas: (expert.expertise_areas || []).join(", "),
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  function handleChange(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setFeedback(null);
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    try {
      const payload = { ...form };
      // Convert comma-separated strings to arrays
      payload.clubs_supported = form.clubs_supported.split(",").map(s => s.trim()).filter(Boolean);
      payload.expertise_areas = form.expertise_areas.split(",").map(s => s.trim()).filter(Boolean);

      const response = await fetch(`${API_URL}/experts/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Update failed");
      }

      setFeedback({ type: "success", message: "Profile updated successfully" });
      onSaved();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    background: COLORS.bg,
    border: `1px solid ${COLORS.hairlineStrong}`,
    color: "#F2F5EE",
    padding: "12px 14px",
    borderRadius: 4,
    fontSize: 14,
    fontFamily: "'Crimson Pro', serif",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    display: "block",
    fontSize: 11,
    fontFamily: "'DM Mono', monospace",
    color: COLORS.body,
    opacity: 0.7,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: 6,
  };

  return (
    <div>
      {/* Read-only info */}
      <div style={{
        background: COLORS.bgSoft,
        border: `1px solid ${COLORS.hairline}`,
        borderRadius: 4,
        padding: 24,
        marginBottom: 20,
      }}>
        <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.gold, letterSpacing: "0.2em", marginBottom: 16 }}>
          ACCOUNT INFO (READ-ONLY)
        </div>
        <PreviewField label="Full Name" value={expert.full_name} />
        <PreviewField label="Type" value={`${TYPE_LABELS[expert.expert_type]?.icon} ${TYPE_LABELS[expert.expert_type]?.label}`} />
        <PreviewField label="Tier" value={`${TIER_BADGES[expert.tier]?.icon} ${TIER_BADGES[expert.tier]?.label}`} />
        <PreviewField label="Endorsements" value={expert.endorsement_count || 0} />
      </div>

      {/* Editable form */}
      <div style={{
        background: COLORS.bgSoft,
        border: `1px solid ${COLORS.hairline}`,
        borderRadius: 4,
        padding: 24,
      }}>
        <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.green, letterSpacing: "0.2em", marginBottom: 24 }}>
          EDIT YOUR PROFILE
        </div>

        {/* Feedback banner */}
        {feedback && (
          <div style={{
            background: feedback.type === "success" ? COLORS.green + "15" : COLORS.red + "15",
            border: `1px solid ${feedback.type === "success" ? COLORS.green : COLORS.red}40`,
            borderRadius: 4,
            padding: "12px 16px",
            marginBottom: 20,
            fontSize: 13,
            color: feedback.type === "success" ? COLORS.green : COLORS.red,
            fontFamily: "'DM Mono', monospace",
          }}>
            {feedback.type === "success" ? "✓" : "✕"} {feedback.message}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Display Name */}
          <div>
            <label style={labelStyle}>Display Name</label>
            <input
              type="text"
              value={form.display_name}
              onChange={e => handleChange("display_name", e.target.value)}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = COLORS.green}
              onBlur={e => e.target.style.borderColor = COLORS.hairlineStrong}
            />
          </div>

          {/* Current Role */}
          <div>
            <label style={labelStyle}>Current Role</label>
            <input
              type="text"
              value={form.current_role}
              onChange={e => handleChange("current_role", e.target.value)}
              placeholder="e.g., Football Analyst at Sky Sports"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = COLORS.green}
              onBlur={e => e.target.style.borderColor = COLORS.hairlineStrong}
            />
          </div>

          {/* Country */}
          <div>
            <label style={labelStyle}>Country</label>
            <input
              type="text"
              value={form.country}
              onChange={e => handleChange("country", e.target.value)}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = COLORS.green}
              onBlur={e => e.target.style.borderColor = COLORS.hairlineStrong}
            />
          </div>

          {/* Region Focus */}
          <div>
            <label style={labelStyle}>Region Focus</label>
            <input
              type="text"
              value={form.region_focus}
              onChange={e => handleChange("region_focus", e.target.value)}
              placeholder="e.g., UK & Europe"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = COLORS.green}
              onBlur={e => e.target.style.borderColor = COLORS.hairlineStrong}
            />
          </div>
        </div>

        {/* Bio */}
        <div style={{ marginTop: 20 }}>
          <label style={labelStyle}>Bio</label>
          <textarea
            value={form.bio}
            onChange={e => handleChange("bio", e.target.value)}
            placeholder="Tell people about your background and expertise..."
            rows={4}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "'Crimson Pro', serif" }}
            onFocus={e => e.target.style.borderColor = COLORS.green}
            onBlur={e => e.target.style.borderColor = COLORS.hairlineStrong}
          />
        </div>

        {/* Expertise & Clubs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
          <div>
            <label style={labelStyle}>Expertise Areas (comma-separated)</label>
            <input
              type="text"
              value={form.expertise_areas}
              onChange={e => handleChange("expertise_areas", e.target.value)}
              placeholder="e.g., Refereeing, Tactics, Youth Development"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = COLORS.green}
              onBlur={e => e.target.style.borderColor = COLORS.hairlineStrong}
            />
          </div>
          <div>
            <label style={labelStyle}>Clubs Supported (comma-separated)</label>
            <input
              type="text"
              value={form.clubs_supported}
              onChange={e => handleChange("clubs_supported", e.target.value)}
              placeholder="e.g., Sheffield United, Barnsley"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = COLORS.green}
              onBlur={e => e.target.style.borderColor = COLORS.hairlineStrong}
            />
          </div>
        </div>

        {/* Social / Online */}
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.teal, letterSpacing: "0.2em", marginBottom: 16 }}>
            ONLINE PRESENCE
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <label style={labelStyle}>Website</label>
              <input
                type="url"
                value={form.website}
                onChange={e => handleChange("website", e.target.value)}
                placeholder="https://yoursite.com"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = COLORS.green}
                onBlur={e => e.target.style.borderColor = COLORS.hairlineStrong}
              />
            </div>
            <div>
              <label style={labelStyle}>Twitter / X</label>
              <input
                type="text"
                value={form.social_twitter}
                onChange={e => handleChange("social_twitter", e.target.value)}
                placeholder="@handle or full URL"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = COLORS.green}
                onBlur={e => e.target.style.borderColor = COLORS.hairlineStrong}
              />
            </div>
            <div>
              <label style={labelStyle}>Instagram</label>
              <input
                type="text"
                value={form.social_instagram}
                onChange={e => handleChange("social_instagram", e.target.value)}
                placeholder="@handle or full URL"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = COLORS.green}
                onBlur={e => e.target.style.borderColor = COLORS.hairlineStrong}
              />
            </div>
            <div>
              <label style={labelStyle}>LinkedIn</label>
              <input
                type="text"
                value={form.social_linkedin}
                onChange={e => handleChange("social_linkedin", e.target.value)}
                placeholder="Profile URL"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = COLORS.green}
                onBlur={e => e.target.style.borderColor = COLORS.hairlineStrong}
              />
            </div>
            <div>
              <label style={labelStyle}>YouTube</label>
              <input
                type="text"
                value={form.social_youtube}
                onChange={e => handleChange("social_youtube", e.target.value)}
                placeholder="Channel URL"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = COLORS.green}
                onBlur={e => e.target.style.borderColor = COLORS.hairlineStrong}
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            marginTop: 28,
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
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {saving ? "Saving..." : "Save Profile Changes"}
        </button>
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
      flexWrap: "wrap",
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
