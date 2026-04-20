import React, { useEffect, useRef, useState } from "react";

// ============================================================================
// PERSONAL PORTAL COMPONENT
// ============================================================================

const COLORS = {
  bg: "#080C08",
  bgSoft: "#0E140E",
  green: "#1AFF6E",
  greenDeep: "#0D8F3C",
  body: "#C8D4C0",
  gold: "#C8A84B",
  teal: "#1AC8C8",
  red: "#FF4757",
  hairline: "rgba(200, 212, 192, 0.08)",
};

const API_URL = import.meta.env.VITE_API_URL || "https://fofa-xi.vercel.app/api";

// ============================================================================
// PERSONAL PORTAL
// ============================================================================

export default function PersonalPortal() {
  const [currentView, setCurrentView] = useState("landing"); // landing, login, register, portal
  const [token, setToken] = useState(localStorage.getItem("fofaToken") || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch user profile if token exists
  useEffect(() => {
    if (token) {
      fetchUserProfile();
      setCurrentView("portal");
    } else {
      setCurrentView("landing");
    }
  }, [token]);

  async function fetchUserProfile() {
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      console.error(err);
      setError("Session expired. Please log in again.");
      logout();
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");
    const username = formData.get("username");
    const display_name = formData.get("display_name");
    const favorite_club = formData.get("favorite_club");

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username, display_name, favorite_club }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setToken(data.token);
      localStorage.setItem("fofaToken", data.token);
      setSuccess("Welcome to FOFA! 🎉");
      setCurrentView("portal");
      e.target.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      setToken(data.token);
      localStorage.setItem("fofaToken", data.token);
      setSuccess("Welcome back! ⚽");
      setCurrentView("portal");
      e.target.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("fofaToken");
    setCurrentView("landing");
  }

  return (
    <div
      style={{
        background: COLORS.bg,
        color: COLORS.body,
        fontFamily: "'Crimson Pro', Georgia, serif",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,500;1,400&family=DM+Mono:wght@400;500&display=swap');
        
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
        
        input, textarea, select {
          font-family: 'Crimson Pro', Georgia, serif;
          background: ${COLORS.bgSoft};
          border: 1px solid ${COLORS.hairline};
          color: ${COLORS.body};
          padding: 12px 16px;
          border-radius: 4px;
          font-size: 16px;
          transition: all 0.2s;
        }
        
        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: ${COLORS.green};
          box-shadow: 0 0 0 3px rgba(26, 255, 110, 0.1);
        }
        
        button {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }
        
        .btn-primary {
          background: ${COLORS.green};
          color: ${COLORS.bg};
        }
        
        .btn-primary:hover:not(:disabled) {
          background: #2cff7f;
          transform: translateY(-2px);
        }
        
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn-ghost {
          background: transparent;
          border: 1px solid ${COLORS.green};
          color: ${COLORS.green};
        }
        
        .btn-ghost:hover {
          background: rgba(26, 255, 110, 0.1);
        }
        
        .btn-danger {
          background: ${COLORS.red};
          color: white;
        }
        
        .btn-danger:hover {
          background: #ff6a7f;
        }
      `}</style>

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 40,
          paddingBottom: 20,
          borderBottom: `1px solid ${COLORS.hairline}`,
        }}
      >
        <div
          style={{
            fontSize: 24,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            color: COLORS.green,
          }}
        >
          FOFA
        </div>
        {token && (
          <button className="btn-ghost" onClick={logout}>
            Logout
          </button>
        )}
      </div>

      {/* ERROR / SUCCESS MESSAGES */}
      {error && (
        <div
          style={{
            background: `${COLORS.red}20`,
            border: `1px solid ${COLORS.red}`,
            color: "#FF9AAD",
            padding: "16px",
            borderRadius: "4px",
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            background: `${COLORS.green}20`,
            border: `1px solid ${COLORS.green}`,
            color: COLORS.green,
            padding: "16px",
            borderRadius: "4px",
            marginBottom: 20,
          }}
        >
          {success}
        </div>
      )}

      {/* LANDING VIEW */}
      {currentView === "landing" && <LandingView setCurrentView={setCurrentView} />}

      {/* LOGIN VIEW */}
      {currentView === "login" && (
        <AuthForm
          type="login"
          onSubmit={handleLogin}
          loading={loading}
          onSwitchView={() => setCurrentView("register")}
        />
      )}

      {/* REGISTER VIEW */}
      {currentView === "register" && (
        <AuthForm
          type="register"
          onSubmit={handleRegister}
          loading={loading}
          onSwitchView={() => setCurrentView("login")}
        />
      )}

      {/* PORTAL VIEW */}
      {currentView === "portal" && user && (
        <PersonalPortalDashboard
          user={user}
          token={token}
          onProfileUpdate={fetchUserProfile}
        />
      )}
    </div>
  );
}

// ============================================================================
// LANDING VIEW
// ============================================================================

function LandingView({ setCurrentView }) {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 80 }}>
        <h1
          style={{
            fontSize: "clamp(42px, 8vw, 96px)",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            margin: "0 0 24px",
            color: "#F2F5EE",
          }}
        >
          Your Personal Passport
        </h1>
        <p
          style={{
            fontSize: 20,
            color: COLORS.body,
            marginBottom: 48,
            maxWidth: 600,
            margin: "0 auto 48px",
          }}
        >
          Join the FOFA ecosystem. Prove your loyalty. Unlock your status as a true fan.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            className="btn-primary"
            onClick={() => setCurrentView("register")}
          >
            Create Account
          </button>
          <button
            className="btn-ghost"
            onClick={() => setCurrentView("login")}
          >
            Already a member?
          </button>
        </div>
      </div>

      {/* FEATURE CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 32,
          marginTop: 80,
        }}
      >
        {[
          {
            title: "Proof of Loyalty",
            description:
              "Score across 6 dimensions: engagement, passion, knowledge, consistency, community, and growth.",
            icon: "⚽",
          },
          {
            title: "Fan Levels",
            description:
              "From Apprentice to Legend. Track your journey and unlock exclusive benefits.",
            icon: "🏆",
          },
          {
            title: "Club Partnerships",
            description:
              "Connected with clubs worldwide. Your loyalty data travels with you.",
            icon: "🌍",
          },
        ].map((card, i) => (
          <div
            key={i}
            style={{
              background: COLORS.bgSoft,
              border: `1px solid ${COLORS.hairline}`,
              padding: 32,
              borderRadius: 4,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>{card.icon}</div>
            <h3 style={{ color: "#F2F5EE", marginBottom: 12 }}>{card.title}</h3>
            <p style={{ color: COLORS.body, opacity: 0.8, lineHeight: 1.6 }}>
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// AUTH FORM
// ============================================================================

function AuthForm({ type, onSubmit, loading, onSwitchView }) {
  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <h2
        style={{
          textAlign: "center",
          marginBottom: 40,
          color: COLORS.green,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 36,
          fontWeight: 900,
        }}
      >
        {type === "login" ? "Sign In" : "Join FOFA"}
      </h2>

      <form onSubmit={onSubmit}>
        {type === "register" && (
          <>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, opacity: 0.8 }}>
                Display Name
              </label>
              <input type="text" name="display_name" placeholder="Your name" required />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, opacity: 0.8 }}>
                Username
              </label>
              <input type="text" name="username" placeholder="footy_fan_2024" required />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 14, opacity: 0.8 }}>
                Favorite Club
              </label>
              <input type="text" name="favorite_club" placeholder="Manchester United" />
            </div>
          </>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 14, opacity: 0.8 }}>
            Email
          </label>
          <input type="email" name="email" placeholder="you@example.com" required />
        </div>

        <div style={{ marginBottom: 32 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 14, opacity: 0.8 }}>
            Password
          </label>
          <input type="password" name="password" placeholder="••••••••" required />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ width: "100%", marginBottom: 16 }}
        >
          {loading ? "Loading..." : type === "login" ? "Sign In" : "Create Account"}
        </button>
      </form>

      <div style={{ textAlign: "center" }}>
        <button
          className="btn-ghost"
          onClick={onSwitchView}
          style={{ background: "none", border: "none", color: COLORS.green, cursor: "pointer" }}
        >
          {type === "login"
            ? "Don't have an account? Register here"
            : "Already have an account? Sign in here"}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// DASHBOARD
// ============================================================================

function PersonalPortalDashboard({ user, token, onProfileUpdate }) {
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, profile, activities
  const [profileEditing, setProfileEditing] = useState(false);
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  async function fetchLoyaltyData() {
    try {
      const response = await fetch(`${API_URL}/api/loyalty/scores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setLoyaltyData(data.scores);
      setActivities(data.recent_activities || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* TABS */}
      <div style={{ display: "flex", gap: 24, marginBottom: 40, borderBottom: `1px solid ${COLORS.hairline}`, paddingBottom: 16 }}>
        {["dashboard", "profile", "activities"].map((tab) => (
          <button
            key={tab}
            className="btn-ghost"
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? `${COLORS.green}20` : "transparent",
              borderColor: activeTab === tab ? COLORS.green : "transparent",
              borderBottom: activeTab === tab ? `2px solid ${COLORS.green}` : "none",
              borderLeft: "none",
              borderRight: "none",
              borderTop: "none",
              textTransform: "capitalize",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* DASHBOARD TAB */}
      {activeTab === "dashboard" && loyaltyData && (
        <DashboardTab user={user} loyaltyData={loyaltyData} activities={activities} />
      )}

      {/* PROFILE TAB */}
      {activeTab === "profile" && (
        <ProfileTab
          user={user}
          token={token}
          editing={profileEditing}
          setEditing={setProfileEditing}
          onUpdate={onProfileUpdate}
        />
      )}

      {/* ACTIVITIES TAB */}
      {activeTab === "activities" && (
        <ActivitiesTab activities={activities} token={token} onActivityLogged={fetchLoyaltyData} />
      )}
    </div>
  );
}

// ============================================================================
// DASHBOARD TAB
// ============================================================================

function DashboardTab({ user, loyaltyData, activities }) {
  const totalScore = loyaltyData.total_score;
  const maxScore = 5000;
  const progressPercent = Math.min((totalScore / maxScore) * 100, 100);

  const levels = [
    { name: "apprentice", label: "Apprentice", min: 0, max: 99 },
    { name: "supporter", label: "Supporter", min: 100, max: 499 },
    { name: "devotee", label: "Devotee", min: 500, max: 1499 },
    { name: "veteran", label: "Veteran", min: 1500, max: 2999 },
    { name: "master", label: "Master", min: 3000, max: 4999 },
    { name: "legend", label: "Legend", min: 5000, max: 99999 },
  ];

  const currentLevel = levels.find((l) => totalScore >= l.min && totalScore < l.max + 1);

  return (
    <div>
      {/* PROFILE HEADER */}
      <div
        style={{
          display: "flex",
          gap: 32,
          marginBottom: 60,
          padding: 32,
          background: COLORS.bgSoft,
          borderRadius: 4,
          border: `1px solid ${COLORS.hairline}`,
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            background: `${COLORS.green}20`,
            border: `2px solid ${COLORS.green}`,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
            flexShrink: 0,
          }}
        >
          {user.display_name.split(" ").map((n) => n[0]).join("")}
        </div>

        <div style={{ flex: 1 }}>
          <h1
            style={{
              margin: "0 0 8px",
              color: "#F2F5EE",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 32,
              fontWeight: 900,
            }}
          >
            {user.display_name}
          </h1>
          <p style={{ margin: "0 0 16px", color: COLORS.gold, fontFamily: "'DM Mono', monospace" }}>
            @{user.username}
          </p>
          {user.favorite_club && (
            <p style={{ margin: "0 0 8px", color: COLORS.body }}>
              ⚽ {user.favorite_club}
            </p>
          )}
          <p style={{ margin: 0, color: COLORS.body, opacity: 0.7, fontSize: 14 }}>
            Member since {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* LOYALTY STATUS */}
      <div
        style={{
          padding: 32,
          background: COLORS.bgSoft,
          borderRadius: 4,
          border: `1px solid ${COLORS.hairline}`,
          marginBottom: 40,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 24,
              color: "#F2F5EE",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
            }}
          >
            Proof of Loyalty
          </h2>
          <div
            style={{
              fontSize: 32,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              color: COLORS.green,
              textTransform: "uppercase",
            }}
          >
            {currentLevel?.label}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ opacity: 0.7 }}>Total Score</span>
            <span style={{ color: COLORS.green, fontWeight: 500 }}>
              {Math.round(totalScore)} / {maxScore}
            </span>
          </div>
          <div
            style={{
              height: 8,
              background: COLORS.bgSoft,
              borderRadius: 4,
              overflow: "hidden",
              border: `1px solid ${COLORS.hairline}`,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPercent}%`,
                background: `linear-gradient(90deg, ${COLORS.green}, ${COLORS.teal})`,
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>

        {/* DIMENSION SCORES */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
          }}
        >
          {[
            { label: "Engagement", value: loyaltyData.engagement_score },
            { label: "Passion", value: loyaltyData.passion_score },
            { label: "Knowledge", value: loyaltyData.knowledge_score },
            { label: "Consistency", value: loyaltyData.consistency_score },
            { label: "Community", value: loyaltyData.community_score },
            { label: "Growth", value: loyaltyData.growth_score },
          ].map((dim, i) => (
            <div
              key={i}
              style={{
                background: COLORS.bg,
                padding: 16,
                borderRadius: 4,
                border: `1px solid ${COLORS.hairline}`,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>{dim.label}</div>
              <div
                style={{
                  fontSize: 20,
                  fontFamily: "'DM Mono', monospace",
                  color: COLORS.green,
                  fontWeight: 500,
                }}
              >
                {Math.round(dim.value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT ACTIVITIES */}
      {activities.length > 0 && (
        <div
          style={{
            padding: 32,
            background: COLORS.bgSoft,
            borderRadius: 4,
            border: `1px solid ${COLORS.hairline}`,
          }}
        >
          <h3 style={{ margin: "0 0 24px", color: "#F2F5EE" }}>Recent Activity</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {activities.slice(0, 5).map((activity, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  background: COLORS.bg,
                  borderRadius: 4,
                  border: `1px solid ${COLORS.hairline}`,
                }}
              >
                <div>
                  <div style={{ color: "#F2F5EE", marginBottom: 4 }}>
                    {activity.description || activity.activity_type}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>
                    {new Date(activity.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div
                  style={{
                    color: COLORS.green,
                    fontFamily: "'DM Mono', monospace",
                    fontWeight: 500,
                    fontSize: 14,
                  }}
                >
                  +{activity.points}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PROFILE TAB
// ============================================================================

function ProfileTab({ user, token, editing, setEditing, onUpdate }) {
  const [formData, setFormData] = useState({
    display_name: user.display_name,
    favorite_club: user.favorite_club || "",
    bio: user.bio || "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      setMessage("Profile updated! ✓");
      setEditing(false);
      onUpdate();
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("Error updating profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ marginBottom: 32, color: "#F2F5EE" }}>My Profile</h2>

      {message && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: 24,
            background: `${COLORS.green}20`,
            border: `1px solid ${COLORS.green}`,
            color: COLORS.green,
            borderRadius: 4,
            fontSize: 14,
          }}
        >
          {message}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={{ display: "block", marginBottom: 8, opacity: 0.8 }}>Email</label>
          <input
            type="email"
            value={user.email}
            disabled
            style={{ width: "100%", opacity: 0.6, cursor: "not-allowed" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, opacity: 0.8 }}>Username</label>
          <input
            type="text"
            value={user.username}
            disabled
            style={{ width: "100%", opacity: 0.6, cursor: "not-allowed" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, opacity: 0.8 }}>Display Name</label>
          <input
            type="text"
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            disabled={!editing}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, opacity: 0.8 }}>Favorite Club</label>
          <input
            type="text"
            value={formData.favorite_club}
            onChange={(e) => setFormData({ ...formData, favorite_club: e.target.value })}
            disabled={!editing}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, opacity: 0.8 }}>Bio</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            disabled={!editing}
            style={{ width: "100%", minHeight: 100, resize: "vertical" }}
            placeholder="Tell us about yourself..."
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {!editing ? (
            <button className="btn-primary" onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          ) : (
            <>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                className="btn-ghost"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ACTIVITIES TAB
// ============================================================================

function ActivitiesTab({ activities, token, onActivityLogged }) {
  const [activityType, setActivityType] = useState("engagement");
  const [points, setPoints] = useState(10);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [allActivities, setAllActivities] = useState(activities);

  async function handleLogActivity(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/loyalty/activity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          activity_type: activityType,
          description,
          points: parseInt(points),
        }),
      });

      if (!response.ok) throw new Error("Failed to log activity");

      setActivityType("engagement");
      setPoints(10);
      setDescription("");
      onActivityLogged();

      // Refetch activities
      const listResponse = await fetch(`${API_URL}/api/loyalty/activities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await listResponse.json();
      setAllActivities(data.activities);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <h2 style={{ marginBottom: 32, color: "#F2F5EE" }}>Activity Log</h2>

      {/* LOG ACTIVITY FORM */}
      <div
        style={{
          padding: 32,
          background: COLORS.bgSoft,
          borderRadius: 4,
          border: `1px solid ${COLORS.hairline}`,
          marginBottom: 40,
        }}
      >
        <h3 style={{ margin: "0 0 24px", color: "#F2F5EE" }}>Log New Activity</h3>

        <form onSubmit={handleLogActivity} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, opacity: 0.8 }}>Activity Type</label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              style={{ width: "100%" }}
            >
              <option value="engagement">Engagement</option>
              <option value="passion">Passion</option>
              <option value="knowledge">Knowledge</option>
              <option value="consistency">Consistency</option>
              <option value="community">Community</option>
              <option value="growth">Growth</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, opacity: 0.8 }}>Points</label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              min="1"
              max="1000"
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 8, opacity: 0.8 }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you do?"
              style={{ width: "100%", minHeight: 80, resize: "vertical" }}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Logging..." : "Log Activity"}
          </button>
        </form>
      </div>

      {/* ACTIVITY HISTORY */}
      <div
        style={{
          padding: 32,
          background: COLORS.bgSoft,
          borderRadius: 4,
          border: `1px solid ${COLORS.hairline}`,
        }}
      >
        <h3 style={{ margin: "0 0 24px", color: "#F2F5EE" }}>All Activities</h3>

        {allActivities.length === 0 ? (
          <p style={{ opacity: 0.6, textAlign: "center", padding: 40 }}>
            No activities yet. Log your first one above!
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {allActivities.map((activity, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  padding: "16px",
                  background: COLORS.bg,
                  borderRadius: 4,
                  border: `1px solid ${COLORS.hairline}`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      color: "#F2F5EE",
                      marginBottom: 4,
                      fontWeight: 500,
                      textTransform: "capitalize",
                    }}
                  >
                    {activity.activity_type}
                  </div>
                  {activity.description && (
                    <div style={{ color: COLORS.body, marginBottom: 4, fontSize: 14 }}>
                      {activity.description}
                    </div>
                  )}
                  <div style={{ fontSize: 12, opacity: 0.6 }}>
                    {new Date(activity.created_at).toLocaleDateString()}{" "}
                    {new Date(activity.created_at).toLocaleTimeString()}
                  </div>
                </div>
                <div
                  style={{
                    color: COLORS.green,
                    fontFamily: "'DM Mono', monospace",
                    fontWeight: 500,
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  +{activity.points}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
