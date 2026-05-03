import React, { useEffect, useRef, useState } from "react";

// ============================================================================
// FOFA PERSONAL PORTAL - POLISHED EDITION
// ============================================================================

const COLORS = {
  bg: "#080C08",
  bgSoft: "#0E140E",
  bgCard: "#0A1109",
  green: "#1AFF6E",
  greenDeep: "#0D8F3C",
  greenGlow: "rgba(26, 255, 110, 0.15)",
  body: "#C8D4C0",
  gold: "#C8A84B",
  teal: "#1AC8C8",
  red: "#FF4757",
  hairline: "rgba(200, 212, 192, 0.08)",
  hairlineStrong: "rgba(200, 212, 192, 0.15)",
};

const API_URL = import.meta.env.VITE_API_URL || "https://fofa-xi.vercel.app/api";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PersonalPortal() {
  const [currentView, setCurrentView] = useState("landing");
  const [token, setToken] = useState(localStorage.getItem("fofaToken") || null);
  const [user, setUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);

  useEffect(() => {
    // Check for social_token in URL (returned from OAuth callback)
    const hash = window.location.hash;
    const queryStart = hash.indexOf("?");
    if (queryStart !== -1) {
      const params = new URLSearchParams(hash.slice(queryStart + 1));
      const socialToken = params.get("social_token");
      const isNew = params.get("is_new");
      const error = params.get("error");

      if (error) {
        const messages = {
          google_cancelled: "Google login was cancelled",
          google_failed: "Google login failed. Please try again.",
          twitter_cancelled: "X login was cancelled",
          twitter_failed: "X login failed. Please try again.",
        };
        setInitialLoading(false);
        setCurrentView("login");
        setTimeout(() => showToast(messages[error] || "Social login failed", "error"), 300);
        // Clean URL
        window.history.replaceState(null, "", window.location.pathname + "#portal");
        return;
      }

      if (socialToken) {
        // Store token and load profile
        localStorage.setItem("fofaToken", socialToken);
        setToken(socialToken);
        // Clean URL
        window.history.replaceState(null, "", window.location.pathname + "#portal");
        if (isNew === "1") {
          // New social user - needs to complete profile
          setShowCompleteProfile(true);
          setInitialLoading(false);
          setCurrentView("portal"); // Will be covered by modal
        } else {
          // Existing user - load profile normally
          setTimeout(() => fetchUserProfile(), 100);
        }
        return;
      }
    }

    if (token) {
      fetchUserProfile();
    } else {
      setInitialLoading(false);
      // If they came via referral link, show register view directly
      if (hash.startsWith("#join") && hash.includes("ref=")) {
        setCurrentView("register");
      } else {
        setCurrentView("landing");
      }
    }
  }, []);

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function fetchUserProfile() {
    try {
      const currentToken = localStorage.getItem("fofaToken") || token;
      const response = await fetch(`${API_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (!response.ok) throw new Error("Session expired");
      const data = await response.json();
      setUser(data.user);
      // If needs_username - they're social user who hasn't completed profile
      if (data.user.needs_username) {
        setShowCompleteProfile(true);
      }
      setCurrentView("portal");
    } catch (err) {
      console.error(err);
      logout();
      showToast("Session expired. Please log in again.", "error");
    } finally {
      setInitialLoading(false);
    }
  }

  function handleCompleteProfile(newToken, newUser) {
    localStorage.setItem("fofaToken", newToken);
    setToken(newToken);
    setUser(newUser);
    setShowCompleteProfile(false);
    showToast(`Welcome to FOFA, @${newUser.username}! 🎉`, "success");
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("fofaToken");
    setCurrentView("landing");
    showToast("Signed out successfully", "success");
  }

  function handleAuthSuccess(newToken, newUser, message, isNewUser = false) {
    setToken(newToken);
    localStorage.setItem("fofaToken", newToken);
    setUser(newUser);
    if (isNewUser) {
      setCurrentView("onboarding");
    } else {
      setCurrentView("portal");
      showToast(message, "success");
    }
  }

  // Initial loading screen
  if (initialLoading) {
    return (
      <div style={{
        background: COLORS.bg,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 24,
      }}>
        <GlobalStyles />
        <div style={{
          fontSize: 48,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900,
          color: COLORS.green,
          letterSpacing: "0.05em",
          animation: "pulse 2s ease-in-out infinite",
        }}>
          FOFA
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div style={{
      background: COLORS.bg,
      color: COLORS.body,
      fontFamily: "'Crimson Pro', Georgia, serif",
      minHeight: "100vh",
      position: "relative",
    }}>
      <GlobalStyles />
      
      {/* Ambient background effect */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(circle at 20% 30%, ${COLORS.greenGlow} 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(26, 200, 200, 0.05) 0%, transparent 50%)`,
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Toast notifications */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Complete Profile Modal (social login new users) */}
      {showCompleteProfile && (
        <CompleteProfileModal
          token={localStorage.getItem("fofaToken") || token}
          onComplete={handleCompleteProfile}
        />
      )}

      {/* Header */}
      <Header token={token} onLogout={logout} />

      {/* Main content */}
      <div style={{ position: "relative", zIndex: 1, padding: "0 20px 80px" }}>
        {currentView === "landing" && (
          <LandingView setCurrentView={setCurrentView} />
        )}
        {currentView === "login" && (
          <AuthForm
            type="login"
            onSuccess={(token, user) => handleAuthSuccess(token, user, `Welcome back, ${user.display_name}! ⚽`)}
            onError={(msg) => showToast(msg, "error")}
            onSwitchView={() => setCurrentView("register")}
          />
        )}
        {currentView === "register" && (
          <AuthForm
            type="register"
            onSuccess={(token, user, isNew) => handleAuthSuccess(token, user, `Welcome to FOFA, ${user.display_name}! 🎉`, isNew)}
            onError={(msg) => showToast(msg, "error")}
            onSwitchView={() => setCurrentView("login")}
          />
        )}
        {currentView === "onboarding" && user && (
          <OnboardingFlow
            user={user}
            token={token}
            onComplete={() => {
              setCurrentView("portal");
              fetchUserProfile();
            }}
            showToast={showToast}
          />
        )}
        {currentView === "portal" && user && (
          <Dashboard
            user={user}
            token={token}
            onProfileUpdate={fetchUserProfile}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// GLOBAL STYLES
// ============================================================================

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
      
      @keyframes slideInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(30px); }
        to { opacity: 1; transform: translateX(0); }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      @keyframes shimmer {
        0% { background-position: -1000px 0; }
        100% { background-position: 1000px 0; }
      }
      
      @keyframes slideInDown {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .fade-in { animation: fadeIn 0.4s ease-out forwards; }
      .slide-up { animation: slideInUp 0.5s ease-out forwards; }
      .slide-right { animation: slideInRight 0.4s ease-out forwards; }
      
      input, textarea, select {
        font-family: 'Crimson Pro', Georgia, serif;
        background: ${COLORS.bgSoft};
        border: 1px solid ${COLORS.hairline};
        color: ${COLORS.body};
        padding: 14px 16px;
        border-radius: 4px;
        font-size: 16px;
        transition: all 0.2s ease;
        width: 100%;
      }
      
      input:focus, textarea:focus, select:focus {
        outline: none;
        border-color: ${COLORS.green};
        box-shadow: 0 0 0 3px ${COLORS.greenGlow};
        background: ${COLORS.bgCard};
      }
      
      input:hover:not(:focus):not(:disabled),
      textarea:hover:not(:focus):not(:disabled),
      select:hover:not(:focus):not(:disabled) {
        border-color: ${COLORS.hairlineStrong};
      }
      
      input.error, textarea.error {
        border-color: ${COLORS.red};
        box-shadow: 0 0 0 3px rgba(255, 71, 87, 0.1);
      }
      
      input.success, textarea.success {
        border-color: ${COLORS.green};
      }
      
      button {
        font-family: 'DM Mono', monospace;
        font-size: 12px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        padding: 14px 28px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 500;
        position: relative;
        overflow: hidden;
      }
      
      button:active:not(:disabled) {
        transform: scale(0.97);
      }
      
      .btn-primary {
        background: ${COLORS.green};
        color: ${COLORS.bg};
        font-weight: 700;
      }
      
      .btn-primary:hover:not(:disabled) {
        background: #2dff82;
        transform: translateY(-2px);
        box-shadow: 0 8px 24px ${COLORS.greenGlow};
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
      
      .btn-ghost:hover:not(:disabled) {
        background: ${COLORS.greenGlow};
        transform: translateY(-1px);
      }
      
      .btn-danger {
        background: transparent;
        border: 1px solid ${COLORS.red};
        color: ${COLORS.red};
      }
      
      .btn-danger:hover:not(:disabled) {
        background: rgba(255, 71, 87, 0.1);
      }
      
      .btn-text {
        background: none;
        border: none;
        color: ${COLORS.green};
        padding: 8px 0;
      }
      
      .btn-text:hover {
        color: #2dff82;
      }
      
      /* Mobile responsive */
      @media (max-width: 768px) {
        h1 { font-size: clamp(32px, 10vw, 48px) !important; }
        h2 { font-size: clamp(24px, 7vw, 32px) !important; }
        .grid-responsive {
          grid-template-columns: 1fr !important;
        }
        .dashboard-header {
          flex-direction: column !important;
          text-align: center !important;
        }
        .dashboard-avatar {
          margin: 0 auto !important;
        }
        .tabs-container {
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
          scrollbar-width: none !important;
        }
        .tabs-container::-webkit-scrollbar {
          display: none !important;
        }
      }
      
      /* Scrollbar styling */
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
      ::-webkit-scrollbar-thumb { background: ${COLORS.hairlineStrong}; border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: ${COLORS.green}; }
      
      /* Skeleton loading */
      .skeleton {
        background: linear-gradient(90deg, ${COLORS.bgSoft} 0%, ${COLORS.bgCard} 50%, ${COLORS.bgSoft} 100%);
        background-size: 1000px 100%;
        animation: shimmer 2s infinite linear;
        border-radius: 4px;
      }
    `}</style>
  );
}

// ============================================================================
// TOAST NOTIFICATION
// ============================================================================

function Toast({ message, type }) {
  const colors = {
    success: { bg: COLORS.greenGlow, border: COLORS.green, text: COLORS.green },
    error: { bg: "rgba(255, 71, 87, 0.15)", border: COLORS.red, text: "#FF9AAD" },
    info: { bg: "rgba(26, 200, 200, 0.15)", border: COLORS.teal, text: COLORS.teal },
  };
  const c = colors[type] || colors.info;

  return (
    <div style={{
      position: "fixed",
      top: 24,
      right: 24,
      zIndex: 1000,
      background: COLORS.bgCard,
      border: `1px solid ${c.border}`,
      borderLeft: `4px solid ${c.border}`,
      color: c.text,
      padding: "16px 24px",
      borderRadius: 4,
      minWidth: 280,
      maxWidth: "calc(100vw - 48px)",
      boxShadow: "0 16px 48px rgba(0, 0, 0, 0.4)",
      animation: "slideInRight 0.3s ease-out forwards",
      fontFamily: "'DM Mono', monospace",
      fontSize: 13,
      letterSpacing: "0.03em",
    }}>
      {message}
    </div>
  );
}

// ============================================================================
// LOADING SPINNER
// ============================================================================

function LoadingSpinner({ size = 24, color = COLORS.green }) {
  return (
    <div style={{
      width: size,
      height: size,
      border: `2px solid ${COLORS.hairline}`,
      borderTopColor: color,
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
      display: "inline-block",
    }} />
  );
}

// ============================================================================
// SKELETON LOADER
// ============================================================================

function Skeleton({ width = "100%", height = 20, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, ...style }}
    />
  );
}

// ============================================================================
// HEADER
// ============================================================================

function Header({ token, onLogout }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 24px",
      borderBottom: `1px solid ${COLORS.hairline}`,
      position: "relative",
      zIndex: 10,
      backdropFilter: "blur(10px)",
    }}>
      <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
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
          PASSPORT
        </div>
      </a>
      
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <a href="/" style={{
          color: COLORS.body,
          opacity: 0.7,
          textDecoration: "none",
          fontSize: 12,
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          transition: "opacity 0.2s",
        }}
          onMouseEnter={e => e.target.style.opacity = "1"}
          onMouseLeave={e => e.target.style.opacity = "0.7"}
        >
          ← Back to Site
        </a>
        {token && (
          <button className="btn-ghost" onClick={onLogout}>
            Logout
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// LANDING VIEW
// ============================================================================

function LandingView({ setCurrentView }) {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 0" }}>
      <div style={{ textAlign: "center", marginBottom: 80 }} className="slide-up">
        <div style={{
          fontSize: 12,
          fontFamily: "'DM Mono', monospace",
          color: COLORS.gold,
          letterSpacing: "0.2em",
          marginBottom: 24,
          opacity: 0,
          animation: "fadeIn 0.6s ease-out 0.1s forwards",
        }}>
          — YOUR DIGITAL IDENTITY
        </div>
        
        <h1 style={{
          fontSize: "clamp(42px, 8vw, 96px)",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900,
          margin: "0 0 24px",
          color: "#F2F5EE",
          lineHeight: 0.95,
          letterSpacing: "-0.02em",
          opacity: 0,
          animation: "fadeIn 0.8s ease-out 0.2s forwards",
        }}>
          Your Personal<br/>
          <span style={{ color: COLORS.green }}>Passport</span>
        </h1>
        
        <p style={{
          fontSize: "clamp(16px, 2vw, 20px)",
          color: COLORS.body,
          marginBottom: 48,
          maxWidth: 600,
          margin: "0 auto 48px",
          lineHeight: 1.6,
          opacity: 0,
          animation: "fadeIn 0.8s ease-out 0.4s forwards",
        }}>
          Join the FOFA ecosystem. Prove your loyalty.<br/>
          Unlock your status as a true fan.
        </p>
        
        <div style={{
          display: "flex",
          gap: 16,
          justifyContent: "center",
          flexWrap: "wrap",
          opacity: 0,
          animation: "fadeIn 0.8s ease-out 0.6s forwards",
        }}>
          <button className="btn-primary" onClick={() => setCurrentView("register")}>
            Create Account
          </button>
          <button className="btn-ghost" onClick={() => setCurrentView("login")}>
            Already a member?
          </button>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid-responsive" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 24,
        marginTop: 100,
      }}>
        {[
          {
            title: "Proof of Loyalty",
            description: "Score across 6 dimensions: engagement, passion, knowledge, consistency, community, and growth.",
            icon: "⚽",
            delay: 0.8,
          },
          {
            title: "Fan Levels",
            description: "From Apprentice to Legend. Track your journey and unlock exclusive benefits as you rise.",
            icon: "🏆",
            delay: 1.0,
          },
          {
            title: "Club Partnerships",
            description: "Connected with clubs worldwide. Your loyalty data travels with you across the ecosystem.",
            icon: "🌍",
            delay: 1.2,
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
              transition: "all 0.3s ease",
              cursor: "default",
              opacity: 0,
              animation: `fadeIn 0.6s ease-out ${card.delay}s forwards`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.borderColor = COLORS.green;
              e.currentTarget.style.boxShadow = `0 16px 48px ${COLORS.greenGlow}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = COLORS.hairline;
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontSize: 56, marginBottom: 20 }}>{card.icon}</div>
            <h3 style={{
              color: "#F2F5EE",
              marginBottom: 12,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}>
              {card.title}
            </h3>
            <p style={{
              color: COLORS.body,
              opacity: 0.75,
              lineHeight: 1.6,
              fontSize: 15,
            }}>
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// AUTH FORM (LOGIN / REGISTER)
// ============================================================================

function AuthForm({ type, onSuccess, onError, onSwitchView }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    display_name: "",
    favorite_club: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referrer, setReferrer] = useState(null);

  // Read referral code from URL on mount (and validate it)
  useEffect(() => {
    if (type !== "register") return;
    const hash = window.location.hash;
    const queryStart = hash.indexOf("?");
    if (queryStart === -1) return;
    const params = new URLSearchParams(hash.slice(queryStart + 1));
    const ref = params.get("ref");
    if (!ref) return;
    
    setReferralCode(ref.toUpperCase());
    
    // Validate the code
    fetch(`${API_URL}/referrals/validate?code=${encodeURIComponent(ref)}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid && data.referrer) {
          setReferrer(data.referrer);
        }
      })
      .catch(() => {});
  }, [type]);

  // Validation
  function validate(field, value) {
    const newErrors = { ...errors };
    
    if (field === "email" || (field === "all" && type === "login")) {
      const val = field === "all" ? formData.email : value;
      if (!val) newErrors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) newErrors.email = "Invalid email format";
      else delete newErrors.email;
    }
    
    if (field === "password" || field === "all") {
      const val = field === "all" ? formData.password : value;
      if (!val) newErrors.password = "Password is required";
      else if (type === "register" && val.length < 6) newErrors.password = "Minimum 6 characters";
      else delete newErrors.password;
    }
    
    if (type === "register") {
      if (field === "username" || field === "all") {
        const val = field === "all" ? formData.username : value;
        if (!val) newErrors.username = "Username is required";
        else if (val.length < 3) newErrors.username = "Minimum 3 characters";
        else if (!/^[a-zA-Z0-9_]+$/.test(val)) newErrors.username = "Letters, numbers, underscores only";
        else delete newErrors.username;
      }
      
      if (field === "display_name" || field === "all") {
        const val = field === "all" ? formData.display_name : value;
        if (!val) newErrors.display_name = "Display name is required";
        else delete newErrors.display_name;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleChange(field, value) {
    setFormData({ ...formData, [field]: value });
    if (touched[field]) {
      validate(field, value);
    }
  }

  function handleBlur(field) {
    setTouched({ ...touched, [field]: true });
    validate(field, formData[field]);
  }

  // Password strength
  function getPasswordStrength(password) {
    if (!password) return { level: 0, label: "" };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    const levels = [
      { level: 1, label: "Weak", color: COLORS.red },
      { level: 2, label: "Fair", color: "#FF9F43" },
      { level: 3, label: "Good", color: COLORS.gold },
      { level: 4, label: "Strong", color: COLORS.green },
      { level: 5, label: "Excellent", color: COLORS.green },
    ];
    return levels[Math.min(score - 1, 4)] || levels[0];
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Mark all as touched
    const allTouched = {};
    Object.keys(formData).forEach(k => { allTouched[k] = true; });
    setTouched(allTouched);
    
    if (!validate("all")) {
      onError("Please fix the errors above");
      return;
    }

    setLoading(true);

    try {
      const endpoint = type === "login" ? "/auth/login" : "/auth/register";
      const body = type === "login"
        ? { email: formData.email, password: formData.password }
        : { ...formData, ...(referralCode ? { referral_code: referralCode } : {}) };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      onSuccess(data.token, data.user, data.is_new_user || false);
    } catch (err) {
      let message = err.message;
      if (message.includes("already exists")) {
        message = "This email or username is already taken. Try logging in instead?";
      } else if (message.includes("Invalid")) {
        message = "Incorrect email or password. Please try again.";
      }
      onError(message);
    } finally {
      setLoading(false);
    }
  }

  const passwordStrength = type === "register" ? getPasswordStrength(formData.password) : null;

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", padding: "40px 0" }} className="slide-up">
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{
          fontSize: 11,
          fontFamily: "'DM Mono', monospace",
          color: COLORS.gold,
          letterSpacing: "0.25em",
          marginBottom: 16,
        }}>
          — {type === "login" ? "WELCOME BACK" : "JOIN THE ECOSYSTEM"}
        </div>
        <h2 style={{
          color: "#F2F5EE",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "clamp(36px, 7vw, 56px)",
          fontWeight: 900,
          margin: 0,
          letterSpacing: "-0.02em",
        }}>
          {type === "login" ? "Sign In" : <>Join <span style={{color: COLORS.green}}>FOFA</span></>}
        </h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Social login buttons */}
        <SocialLoginButtons />
        
        {/* Divider */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <div style={{ flex: 1, height: 1, background: COLORS.hairline }} />
          <span style={{
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            color: COLORS.body,
            opacity: 0.5,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}>
            or
          </span>
          <div style={{ flex: 1, height: 1, background: COLORS.hairline }} />
        </div>

        {type === "register" && referrer && (
          <div style={{
            background: COLORS.greenGlow,
            border: `1px solid ${COLORS.green}`,
            borderRadius: 4,
            padding: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            <div style={{ fontSize: 28 }}>🎁</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 11,
                fontFamily: "'DM Mono', monospace",
                color: COLORS.green,
                letterSpacing: "0.15em",
                marginBottom: 4,
              }}>
                — REFERRED BY @{referrer.username.toUpperCase()}
              </div>
              <div style={{ color: "#F2F5EE", fontSize: 14 }}>
                {referrer.display_name} invited you to FOFA. You'll get <strong style={{ color: COLORS.green }}>+25 bonus points</strong> on signup!
              </div>
            </div>
          </div>
        )}
        {type === "register" && (
          <>
            <FormField
              label="Display Name"
              name="display_name"
              value={formData.display_name}
              onChange={(v) => handleChange("display_name", v)}
              onBlur={() => handleBlur("display_name")}
              error={touched.display_name && errors.display_name}
              placeholder="Your name"
              autoFocus
            />
            
            <FormField
              label="Username"
              name="username"
              value={formData.username}
              onChange={(v) => handleChange("username", v.toLowerCase())}
              onBlur={() => handleBlur("username")}
              error={touched.username && errors.username}
              placeholder="footy_fan_2024"
              hint="Letters, numbers, and underscores only"
            />
            
            <FormField
              label="Favorite Club"
              name="favorite_club"
              value={formData.favorite_club}
              onChange={(v) => handleChange("favorite_club", v)}
              placeholder="Manchester United"
              hint="Optional"
            />
          </>
        )}

        <FormField
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={(v) => handleChange("email", v)}
          onBlur={() => handleBlur("email")}
          error={touched.email && errors.email}
          placeholder="you@example.com"
          autoFocus={type === "login"}
        />

        <div>
          <FormField
            label="Password"
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={(v) => handleChange("password", v)}
            onBlur={() => handleBlur("password")}
            error={touched.password && errors.password}
            placeholder="••••••••"
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: "none",
                  border: "none",
                  color: COLORS.body,
                  opacity: 0.6,
                  cursor: "pointer",
                  padding: 8,
                  fontSize: 12,
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            }
          />
          
          {/* Password strength indicator */}
          {type === "register" && formData.password && (
            <div style={{ marginTop: 8, opacity: 0, animation: "fadeIn 0.3s forwards" }}>
              <div style={{
                display: "flex",
                gap: 4,
                marginBottom: 6,
              }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{
                    flex: 1,
                    height: 3,
                    background: passwordStrength.level >= i ? passwordStrength.color : COLORS.hairline,
                    borderRadius: 2,
                    transition: "background 0.3s",
                  }} />
                ))}
              </div>
              <div style={{
                fontSize: 11,
                fontFamily: "'DM Mono', monospace",
                color: passwordStrength.color,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>
                {passwordStrength.label}
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px",
            marginTop: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          {loading ? (
            <>
              <LoadingSpinner size={16} color={COLORS.bg} />
              <span>{type === "login" ? "Signing in..." : "Creating account..."}</span>
            </>
          ) : (
            type === "login" ? "Sign In" : "Create Account"
          )}
        </button>
      </form>

      <div style={{ textAlign: "center", marginTop: 32, paddingTop: 24, borderTop: `1px solid ${COLORS.hairline}` }}>
        <button className="btn-text" onClick={onSwitchView}>
          {type === "login"
            ? "Don't have an account? Sign up →"
            : "Already have an account? Sign in →"}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// FORM FIELD
// ============================================================================

// ============================================================================
// SOCIAL LOGIN BUTTONS
// ============================================================================

const API_URL_SOCIAL = import.meta.env.VITE_API_URL || "https://fofa.lol/api";

function SocialLoginButtons() {
  const googleConfigured = true; // Always show - backend handles missing config gracefully

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Google */}
      <a
        href={`${API_URL_SOCIAL}/auth/google`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          background: "#FFFFFF",
          color: "#1F1F1F",
          border: "1px solid #DADCE0",
          borderRadius: 4,
          padding: "12px 20px",
          fontFamily: "'DM Mono', monospace",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.05em",
          textDecoration: "none",
          transition: "all 0.2s",
          cursor: "pointer",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#F8F8F8"}
        onMouseLeave={e => e.currentTarget.style.background = "#FFFFFF"}
      >
        {/* Google icon SVG */}
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </a>

      {/* X / Twitter */}
      <a
        href={`${API_URL_SOCIAL}/auth/twitter`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          background: "#000000",
          color: "#FFFFFF",
          border: "1px solid #333",
          borderRadius: 4,
          padding: "12px 20px",
          fontFamily: "'DM Mono', monospace",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.05em",
          textDecoration: "none",
          transition: "all 0.2s",
          cursor: "pointer",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#1a1a1a"}
        onMouseLeave={e => e.currentTarget.style.background = "#000000"}
      >
        {/* X icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        Continue with X
      </a>
    </div>
  );
}

// ============================================================================
// COMPLETE PROFILE MODAL (shown after first social login)
// ============================================================================

function CompleteProfileModal({ token, onComplete }) {
  const [username, setUsername] = useState("");
  const [favoriteClub, setFavoriteClub] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Debounce username check
  useEffect(() => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        // We'll use the register endpoint error to check availability
        // Simple check: just show green if valid format
        const isValid = /^[a-z0-9_]{3,20}$/.test(username.toLowerCase());
        setUsernameAvailable(isValid ? "valid_format" : "invalid_format");
      } catch (e) {}
      finally { setCheckingUsername(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [username]);

  async function handleComplete(e) {
    e.preventDefault();
    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(username.toLowerCase())) {
      setError("Letters, numbers, and underscores only");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const API_URL = import.meta.env.VITE_API_URL || "https://fofa.lol/api";
      const response = await fetch(`${API_URL}/auth/social/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: username.toLowerCase(),
          favorite_club: favoriteClub,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to complete profile");
      }

      onComplete(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(8, 12, 8, 0.95)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: 20,
    }}>
      <div style={{
        background: "#0E140E",
        border: `1px solid ${COLORS.green}`,
        borderRadius: 8,
        padding: 40,
        maxWidth: 440,
        width: "100%",
        boxShadow: `0 0 60px rgba(26, 255, 110, 0.15)`,
        animation: "fadeIn 0.3s ease-out",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚽</div>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 32,
            fontWeight: 900,
            color: "#F2F5EE",
            margin: "0 0 8px",
            letterSpacing: "-0.01em",
          }}>
            Almost there!
          </h2>
          <p style={{ color: COLORS.body, opacity: 0.7, margin: 0, fontSize: 14 }}>
            Pick a username to complete your FOFA profile
          </p>
        </div>

        <form onSubmit={handleComplete} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Username */}
          <div>
            <label style={{
              display: "block",
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
              color: COLORS.body,
              opacity: 0.85,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}>
              Username *
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase())}
                placeholder="footy_fan_2026"
                maxLength={20}
                autoFocus
                style={{
                  width: "100%",
                  background: COLORS.bg,
                  border: `1px solid ${error ? COLORS.red : username.length >= 3 ? COLORS.green : COLORS.hairlineStrong}`,
                  color: "#F2F5EE",
                  padding: "12px 40px 12px 14px",
                  borderRadius: 4,
                  fontSize: 14,
                  fontFamily: "'Crimson Pro', serif",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              {username.length >= 3 && (
                <div style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 14,
                }}>
                  {checkingUsername ? "..." : "✓"}
                </div>
              )}
            </div>
            <div style={{
              fontSize: 11,
              color: COLORS.body,
              opacity: 0.5,
              marginTop: 4,
              fontStyle: "italic",
            }}>
              Letters, numbers, underscores only
            </div>
          </div>

          {/* Favorite Club */}
          <div>
            <label style={{
              display: "block",
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
              color: COLORS.body,
              opacity: 0.85,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}>
              Favorite Club (optional)
            </label>
            <input
              type="text"
              value={favoriteClub}
              onChange={e => setFavoriteClub(e.target.value)}
              placeholder="e.g., Arsenal, Stocksbridge Park Steels..."
              style={{
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
              }}
              onFocus={e => e.target.style.borderColor = COLORS.green}
              onBlur={e => e.target.style.borderColor = COLORS.hairlineStrong}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: "rgba(255, 71, 87, 0.1)",
              border: `1px solid ${COLORS.red}`,
              color: COLORS.red,
              padding: 12,
              borderRadius: 4,
              fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || username.length < 3}
            style={{
              marginTop: 8,
              background: COLORS.green,
              color: COLORS.bg,
              border: "none",
              padding: "14px 28px",
              fontSize: 13,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 700,
              borderRadius: 4,
              cursor: (loading || username.length < 3) ? "not-allowed" : "pointer",
              opacity: (loading || username.length < 3) ? 0.5 : 1,
            }}
          >
            {loading ? "Saving..." : "Let's Go →"}
          </button>
        </form>
      </div>
    </div>
  );
}

function FormField({ label, name, value, onChange, onBlur, error, placeholder, type = "text", hint, autoFocus, suffix }) {
  return (
    <div>
      <label style={{
        display: "block",
        marginBottom: 8,
        fontSize: 11,
        fontFamily: "'DM Mono', monospace",
        color: COLORS.body,
        opacity: 0.7,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={type}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={error ? "error" : ""}
          style={{ paddingRight: suffix ? 80 : 16 }}
        />
        {suffix && (
          <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}>
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <div style={{
          marginTop: 6,
          fontSize: 12,
          color: COLORS.red,
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.03em",
          opacity: 0,
          animation: "fadeIn 0.2s forwards",
        }}>
          ⚠ {error}
        </div>
      )}
      {hint && !error && (
        <div style={{
          marginTop: 6,
          fontSize: 12,
          color: COLORS.body,
          opacity: 0.5,
          fontFamily: "'DM Mono', monospace",
        }}>
          {hint}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// DASHBOARD
// ============================================================================

function Dashboard({ user, token, onProfileUpdate, showToast }) {
  const [activeTab, setActiveTab] = useState("passport");
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  async function fetchLoyaltyData() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/loyalty/scores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setLoyaltyData(data.scores);
      setActivities(data.recent_activities || []);
    } catch (err) {
      console.error(err);
      showToast("Could not load loyalty data", "error");
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: "passport", label: "Passport" },
    { id: "leaderboard", label: "🏆 Leaderboard" },
    { id: "referrals", label: "🎁 Refer Friends" },
    { id: "activities", label: "Record Activity" },
    { id: "history", label: "History" },
    { id: "profile", label: "Profile" },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 0" }}>
      {/* Tabs */}
      <div className="tabs-container" style={{
        display: "flex",
        gap: 8,
        marginBottom: 40,
        borderBottom: `1px solid ${COLORS.hairline}`,
        paddingBottom: 0,
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: "transparent",
              border: "none",
              color: activeTab === tab.id ? COLORS.green : COLORS.body,
              opacity: activeTab === tab.id ? 1 : 0.6,
              padding: "12px 20px",
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              borderBottom: `2px solid ${activeTab === tab.id ? COLORS.green : "transparent"}`,
              marginBottom: "-1px",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content with fade */}
      <div key={activeTab} className="fade-in">
        {activeTab === "passport" && (
          <PassportTab user={user} loyaltyData={loyaltyData} loading={loading} />
        )}
        {activeTab === "leaderboard" && (
          <LeaderboardTab token={token} user={user} showToast={showToast} />
        )}
        {activeTab === "referrals" && (
          <ReferralsTab token={token} user={user} showToast={showToast} />
        )}
        {activeTab === "activities" && (
          <ActivitiesTab
            token={token}
            onActivityLogged={() => { fetchLoyaltyData(); onProfileUpdate(); }}
            showToast={showToast}
          />
        )}
        {activeTab === "history" && (
          <HistoryTab token={token} activities={activities} showToast={showToast} />
        )}
        {activeTab === "profile" && (
          <ProfileTab user={user} token={token} onUpdate={onProfileUpdate} showToast={showToast} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PASSPORT TAB
// ============================================================================

function PassportTab({ user, loyaltyData, loading }) {
  if (loading || !loyaltyData) {
    return <PassportSkeleton />;
  }

  const totalScore = loyaltyData.total_score;
  const levels = [
    { name: "apprentice", label: "Apprentice", min: 0, max: 99 },
    { name: "supporter", label: "Supporter", min: 100, max: 499 },
    { name: "devotee", label: "Devotee", min: 500, max: 1499 },
    { name: "veteran", label: "Veteran", min: 1500, max: 2999 },
    { name: "master", label: "Master", min: 3000, max: 4999 },
    { name: "legend", label: "Legend", min: 5000, max: 999999 },
  ];
  const currentLevel = levels.find(l => totalScore >= l.min && totalScore <= l.max) || levels[0];
  const nextLevel = levels[levels.indexOf(currentLevel) + 1];
  const progressInLevel = nextLevel
    ? ((totalScore - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100
    : 100;

  const initials = user.display_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* PASSPORT CARD */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.bgCard} 0%, ${COLORS.bgSoft} 100%)`,
        border: `1px solid ${COLORS.green}`,
        boxShadow: `0 0 60px ${COLORS.greenGlow}, inset 0 1px 0 rgba(26, 255, 110, 0.1)`,
        borderRadius: 8,
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Grain overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
          opacity: 0.03,
          pointerEvents: "none",
        }} />

        {/* Header strip */}
        <div style={{
          padding: "24px 32px",
          borderBottom: `1px solid ${COLORS.green}30`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
        }}>
          <div>
            <div style={{
              fontSize: 24,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              color: COLORS.green,
              letterSpacing: "0.1em",
            }}>
              FOFA PASSPORT
            </div>
            <div style={{
              fontSize: 10,
              fontFamily: "'DM Mono', monospace",
              color: COLORS.body,
              opacity: 0.6,
              letterSpacing: "0.2em",
              marginTop: 4,
            }}>
              DECENTRALISED FAN IDENTITY
            </div>
          </div>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: COLORS.greenGlow,
            border: `2px solid ${COLORS.green}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            color: COLORS.green,
          }}>
            {initials}
          </div>
        </div>

        {/* Main content */}
        <div className="dashboard-header" style={{ padding: "32px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 32,
            marginBottom: 32,
          }} className="grid-responsive">
            <div>
              <div style={{
                fontSize: 10,
                fontFamily: "'DM Mono', monospace",
                color: COLORS.body,
                opacity: 0.6,
                letterSpacing: "0.2em",
                marginBottom: 6,
              }}>
                HOLDER
              </div>
              <div style={{
                fontSize: 28,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                color: "#F2F5EE",
                letterSpacing: "-0.01em",
              }}>
                {user.display_name}
              </div>
            </div>
            <div>
              <div style={{
                fontSize: 10,
                fontFamily: "'DM Mono', monospace",
                color: COLORS.body,
                opacity: 0.6,
                letterSpacing: "0.2em",
                marginBottom: 6,
              }}>
                CLUB ALLEGIANCE
              </div>
              <div style={{
                fontSize: 24,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                color: COLORS.gold,
                letterSpacing: "0.02em",
              }}>
                {user.favorite_club || "—"}
              </div>
            </div>
          </div>

          {/* Level and progress */}
          <div style={{
            background: COLORS.bg,
            border: `1px solid ${COLORS.hairline}`,
            borderRadius: 4,
            padding: 24,
            marginBottom: 24,
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 8,
            }}>
              <div>
                <div style={{
                  fontSize: 10,
                  fontFamily: "'DM Mono', monospace",
                  color: COLORS.body,
                  opacity: 0.6,
                  letterSpacing: "0.2em",
                  marginBottom: 4,
                }}>
                  CURRENT LEVEL
                </div>
                <div style={{
                  fontSize: 32,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900,
                  color: COLORS.green,
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                }}>
                  {currentLevel.label}
                </div>
              </div>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 14,
                color: COLORS.body,
                opacity: 0.8,
              }}>
                {Math.round(totalScore)} {nextLevel && `/ ${nextLevel.min}`}
              </div>
            </div>
            
            <div style={{
              height: 6,
              background: COLORS.bgCard,
              borderRadius: 3,
              overflow: "hidden",
              border: `1px solid ${COLORS.hairline}`,
            }}>
              <div style={{
                height: "100%",
                width: `${progressInLevel}%`,
                background: `linear-gradient(90deg, ${COLORS.green}, ${COLORS.teal})`,
                transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: `0 0 12px ${COLORS.green}`,
              }} />
            </div>
            
            {nextLevel && (
              <div style={{
                marginTop: 12,
                fontSize: 11,
                fontFamily: "'DM Mono', monospace",
                color: COLORS.body,
                opacity: 0.5,
                letterSpacing: "0.1em",
              }}>
                {nextLevel.min - totalScore} POINTS TO {nextLevel.label.toUpperCase()}
              </div>
            )}
          </div>

          {/* Dimension scores */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
          }}>
            {[
              { label: "Engagement", value: loyaltyData.engagement_score, icon: "◆" },
              { label: "Passion", value: loyaltyData.passion_score, icon: "♦" },
              { label: "Knowledge", value: loyaltyData.knowledge_score, icon: "◇" },
              { label: "Consistency", value: loyaltyData.consistency_score, icon: "◈" },
              { label: "Community", value: loyaltyData.community_score, icon: "⬡" },
              { label: "Growth", value: loyaltyData.growth_score, icon: "△" },
            ].map((dim, i) => (
              <div
                key={i}
                style={{
                  background: COLORS.bg,
                  padding: "16px 14px",
                  borderRadius: 4,
                  border: `1px solid ${COLORS.hairline}`,
                  textAlign: "center",
                  transition: "all 0.2s",
                  opacity: 0,
                  animation: `fadeIn 0.4s ease-out ${i * 0.08}s forwards`,
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
                <div style={{ fontSize: 14, color: COLORS.green, marginBottom: 4 }}>{dim.icon}</div>
                <div style={{
                  fontSize: 10,
                  fontFamily: "'DM Mono', monospace",
                  opacity: 0.6,
                  marginBottom: 6,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}>
                  {dim.label}
                </div>
                <div style={{
                  fontSize: 22,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  color: "#F2F5EE",
                  fontWeight: 700,
                }}>
                  {Math.round(dim.value)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer strip */}
        <div style={{
          padding: "16px 32px",
          borderTop: `1px solid ${COLORS.green}30`,
          background: COLORS.bg,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          fontFamily: "'DM Mono', monospace",
          color: COLORS.body,
          opacity: 0.6,
          letterSpacing: "0.15em",
          flexWrap: "wrap",
          gap: 8,
        }}>
          <div>MEMBER SINCE {new Date(user.created_at).toLocaleDateString("en-GB")}</div>
          <div>@{user.username}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PASSPORT SKELETON
// ============================================================================

function PassportSkeleton() {
  return (
    <div style={{
      background: COLORS.bgCard,
      border: `1px solid ${COLORS.hairline}`,
      borderRadius: 8,
      padding: 32,
    }}>
      <div style={{ marginBottom: 32 }}>
        <Skeleton width={200} height={24} style={{ marginBottom: 12 }} />
        <Skeleton width={150} height={12} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
        <div>
          <Skeleton width={80} height={10} style={{ marginBottom: 8 }} />
          <Skeleton width="80%" height={28} />
        </div>
        <div>
          <Skeleton width={100} height={10} style={{ marginBottom: 8 }} />
          <Skeleton width="60%" height={24} />
        </div>
      </div>
      <Skeleton height={80} style={{ marginBottom: 24 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        {[1,2,3,4,5,6].map(i => <Skeleton key={i} height={80} />)}
      </div>
    </div>
  );
}

// ============================================================================
// ACTIVITIES TAB (LOG NEW ACTIVITY)
// ============================================================================

function ActivitiesTab({ token, onActivityLogged, showToast }) {
  const [activityType, setActivityType] = useState("engagement");
  const [points, setPoints] = useState(10);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const activityTypes = [
    { value: "engagement", label: "Engagement", desc: "Watched a match, attended a game" },
    { value: "passion", label: "Passion", desc: "Expressed support, wore club colors" },
    { value: "knowledge", label: "Knowledge", desc: "Quiz, trivia, match analysis" },
    { value: "consistency", label: "Consistency", desc: "Regular check-ins, daily engagement" },
    { value: "community", label: "Community", desc: "Helped fellow fans, moderated discussions" },
    { value: "growth", label: "Growth", desc: "Brought new fans, expanded the community" },
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!description.trim()) {
      showToast("Please describe your activity", "error");
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/loyalty/activity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activity_type: activityType, description, points: parseInt(points) }),
      });

      if (!response.ok) throw new Error("Failed to log activity");

      setDescription("");
      setPoints(10);
      onActivityLogged();
      showToast(`+${points} points added to ${activityType}! 🎉`, "success");
    } catch (err) {
      showToast("Failed to log activity. Try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{
          color: "#F2F5EE",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "clamp(28px, 5vw, 40px)",
          fontWeight: 900,
          margin: "0 0 8px",
          letterSpacing: "-0.01em",
        }}>
          Record Activity
        </h2>
        <p style={{ color: COLORS.body, opacity: 0.7, margin: 0 }}>
          Log your fan activities and earn loyalty points
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{
        background: COLORS.bgSoft,
        border: `1px solid ${COLORS.hairline}`,
        borderRadius: 4,
        padding: 32,
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}>
        {/* Activity Type - visual selector */}
        <div>
          <label style={{
            display: "block",
            marginBottom: 12,
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            color: COLORS.body,
            opacity: 0.7,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
            Activity Type
          </label>
          <div className="grid-responsive" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 8,
          }}>
            {activityTypes.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setActivityType(t.value)}
                style={{
                  padding: "14px 16px",
                  background: activityType === t.value ? COLORS.greenGlow : COLORS.bg,
                  border: `1px solid ${activityType === t.value ? COLORS.green : COLORS.hairline}`,
                  borderRadius: 4,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  color: COLORS.body,
                }}
              >
                <div style={{
                  fontSize: 13,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  color: activityType === t.value ? COLORS.green : "#F2F5EE",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  marginBottom: 2,
                }}>
                  {t.label}
                </div>
                <div style={{
                  fontSize: 11,
                  opacity: 0.6,
                  textTransform: "none",
                  letterSpacing: 0,
                  fontFamily: "'Crimson Pro', serif",
                }}>
                  {t.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        <FormField
          label="Description"
          name="description"
          value={description}
          onChange={setDescription}
          placeholder="What did you do?"
        />

        {/* Points slider */}
        <div>
          <label style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 12,
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            color: COLORS.body,
            opacity: 0.7,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
            <span>Points</span>
            <span style={{ color: COLORS.green, opacity: 1 }}>{points}</span>
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            style={{
              width: "100%",
              accentColor: COLORS.green,
            }}
          />
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 4,
            fontSize: 10,
            fontFamily: "'DM Mono', monospace",
            opacity: 0.5,
          }}>
            <span>1</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              <LoadingSpinner size={14} color={COLORS.bg} />
              Logging...
            </span>
          ) : (
            `Log Activity (+${points})`
          )}
        </button>
      </form>
    </div>
  );
}

// ============================================================================
// HISTORY TAB
// ============================================================================

function HistoryTab({ token, showToast }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchAllActivities();
  }, []);

  async function fetchAllActivities() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/loyalty/activities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setActivities(data.activities || []);
    } catch (err) {
      showToast("Could not load history", "error");
    } finally {
      setLoading(false);
    }
  }

  const filtered = filter === "all"
    ? activities
    : activities.filter(a => a.activity_type === filter);

  const filterTypes = ["all", "engagement", "passion", "knowledge", "consistency", "community", "growth"];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{
          color: "#F2F5EE",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "clamp(28px, 5vw, 40px)",
          fontWeight: 900,
          margin: "0 0 8px",
        }}>
          Activity History
        </h2>
        <p style={{ color: COLORS.body, opacity: 0.7, margin: 0 }}>
          {activities.length} total {activities.length === 1 ? "activity" : "activities"}
        </p>
      </div>

      {/* Filter chips */}
      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 24,
        flexWrap: "wrap",
      }}>
        {filterTypes.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{
              padding: "8px 14px",
              background: filter === t ? COLORS.greenGlow : "transparent",
              border: `1px solid ${filter === t ? COLORS.green : COLORS.hairline}`,
              color: filter === t ? COLORS.green : COLORS.body,
              fontSize: 11,
              borderRadius: 100,
              textTransform: "capitalize",
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.05em",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1,2,3,4,5].map(i => <Skeleton key={i} height={72} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "80px 20px",
          background: COLORS.bgSoft,
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 4,
        }}>
          <div style={{ fontSize: 48, opacity: 0.3, marginBottom: 16 }}>⚡</div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 20,
            color: "#F2F5EE",
            marginBottom: 8,
          }}>
            {filter === "all" ? "No activities yet" : `No ${filter} activities`}
          </div>
          <div style={{ color: COLORS.body, opacity: 0.6, fontSize: 14 }}>
            {filter === "all" ? "Log your first activity to start earning loyalty points" : "Try a different filter"}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((activity, i) => (
            <div
              key={activity.id || i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                padding: "18px 20px",
                background: COLORS.bgSoft,
                borderRadius: 4,
                border: `1px solid ${COLORS.hairline}`,
                transition: "all 0.2s",
                opacity: 0,
                animation: `fadeIn 0.3s ease-out ${i * 0.03}s forwards`,
                gap: 16,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = COLORS.green;
                e.currentTarget.style.background = COLORS.bgCard;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = COLORS.hairline;
                e.currentTarget.style.background = COLORS.bgSoft;
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 10,
                  color: COLORS.green,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}>
                  {activity.activity_type}
                </div>
                {activity.description && (
                  <div style={{ color: "#F2F5EE", marginBottom: 4, fontSize: 15 }}>
                    {activity.description}
                  </div>
                )}
                <div style={{
                  fontSize: 11,
                  opacity: 0.5,
                  fontFamily: "'DM Mono', monospace",
                }}>
                  {new Date(activity.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <div style={{
                color: COLORS.green,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                fontSize: 20,
                flexShrink: 0,
                letterSpacing: "0.02em",
              }}>
                +{activity.points}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PROFILE TAB
// ============================================================================

function ProfileTab({ user, token, onUpdate, showToast }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    display_name: user.display_name,
    favorite_club: user.favorite_club || "",
    bio: user.bio || "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update");
      
      showToast("Profile updated ✓", "success");
      setEditing(false);
      onUpdate();
    } catch (err) {
      showToast("Could not update profile", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setFormData({
      display_name: user.display_name,
      favorite_club: user.favorite_club || "",
      bio: user.bio || "",
    });
    setEditing(false);
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{
          color: "#F2F5EE",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "clamp(28px, 5vw, 40px)",
          fontWeight: 900,
          margin: "0 0 8px",
        }}>
          My Profile
        </h2>
        <p style={{ color: COLORS.body, opacity: 0.7, margin: 0 }}>
          Manage your account information
        </p>
      </div>

      <div style={{
        background: COLORS.bgSoft,
        border: `1px solid ${COLORS.hairline}`,
        borderRadius: 4,
        padding: 32,
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}>
        <FormField
          label="Email"
          value={user.email}
          onChange={() => {}}
          type="email"
        />
        {/* Disable email */}
        <style>{`input[value="${user.email}"] { opacity: 0.5; cursor: not-allowed; pointer-events: none; }`}</style>

        <FormField
          label="Username"
          value={user.username}
          onChange={() => {}}
        />

        <FormField
          label="Display Name"
          value={formData.display_name}
          onChange={editing ? (v) => setFormData({...formData, display_name: v}) : () => {}}
        />

        <FormField
          label="Favorite Club"
          value={formData.favorite_club}
          onChange={editing ? (v) => setFormData({...formData, favorite_club: v}) : () => {}}
          placeholder="e.g., Barcelona"
        />

        <div>
          <label style={{
            display: "block",
            marginBottom: 8,
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            color: COLORS.body,
            opacity: 0.7,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={editing ? (e) => setFormData({...formData, bio: e.target.value}) : () => {}}
            disabled={!editing}
            placeholder="Tell us about yourself..."
            style={{ minHeight: 100, resize: "vertical", opacity: editing ? 1 : 0.6 }}
          />
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          {!editing ? (
            <button className="btn-primary" onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          ) : (
            <>
              <button className="btn-primary" onClick={handleSave} disabled={loading} style={{ flex: 1 }}>
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                    <LoadingSpinner size={14} color={COLORS.bg} />
                    Saving...
                  </span>
                ) : "Save Changes"}
              </button>
              <button className="btn-ghost" onClick={handleCancel}>Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LEADERBOARD TAB
// ============================================================================

function LeaderboardTab({ token, user, showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterClub, setFilterClub] = useState("");
  const [showOnlyMyClub, setShowOnlyMyClub] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [showOnlyMyClub, filterClub]);

  async function fetchLeaderboard() {
    setLoading(true);
    try {
      let url = `${API_URL}/leaderboard?limit=100`;
      const club = showOnlyMyClub ? user.favorite_club : filterClub;
      if (club) {
        url += `&club=${encodeURIComponent(club)}`;
      }

      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Failed to load leaderboard");
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error(err);
      showToast("Could not load leaderboard", "error");
    } finally {
      setLoading(false);
    }
  }

  function getMedal(rank) {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  }

  function getLevelColor(level) {
    const map = {
      legend: "#FF4757",
      master: "#9C88FF",
      veteran: COLORS.gold,
      devotee: COLORS.teal,
      supporter: COLORS.green,
      apprentice: COLORS.body,
    };
    return map[level] || COLORS.body;
  }

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 11,
          fontFamily: "'DM Mono', monospace",
          color: COLORS.gold,
          letterSpacing: "0.25em",
          marginBottom: 12,
        }}>
          — GLOBAL RANKINGS
        </div>
        <h2 style={{
          color: "#F2F5EE",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "clamp(28px, 5vw, 40px)",
          fontWeight: 900,
          margin: "0 0 8px",
          letterSpacing: "-0.01em",
        }}>
          Leaderboard
        </h2>
        <p style={{ color: COLORS.body, opacity: 0.7, margin: 0 }}>
          {data ? `${data.meta.total_users} fans competing for the top spot` : "Loading..."}
        </p>
      </div>

      {/* Your rank card */}
      {data && data.you && (
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.bgCard} 0%, ${COLORS.bgSoft} 100%)`,
          border: `1px solid ${COLORS.green}`,
          borderRadius: 8,
          padding: 24,
          marginBottom: 24,
          boxShadow: `0 0 40px ${COLORS.greenGlow}`,
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            right: 0,
            background: COLORS.green,
            color: COLORS.bg,
            padding: "4px 12px",
            fontSize: 10,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.15em",
            fontWeight: 700,
          }}>
            YOU
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
          }}>
            <div style={{
              fontSize: 48,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              color: COLORS.green,
              minWidth: 80,
            }}>
              #{data.you.rank}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{
                fontSize: 22,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                color: "#F2F5EE",
                marginBottom: 4,
              }}>
                {data.you.display_name}
              </div>
              <div style={{
                fontSize: 11,
                fontFamily: "'DM Mono', monospace",
                color: getLevelColor(data.you.level),
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}>
                {data.you.level} · @{data.you.username}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{
                fontSize: 32,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900,
                color: COLORS.green,
              }}>
                {Math.round(data.you.total_score)}
              </div>
              <div style={{
                fontSize: 10,
                fontFamily: "'DM Mono', monospace",
                color: COLORS.body,
                opacity: 0.6,
                letterSpacing: "0.15em",
              }}>
                POINTS
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 24,
        flexWrap: "wrap",
      }}>
        <button
          onClick={() => { setShowOnlyMyClub(false); setFilterClub(""); }}
          style={{
            padding: "10px 16px",
            background: !showOnlyMyClub && !filterClub ? COLORS.greenGlow : "transparent",
            border: `1px solid ${!showOnlyMyClub && !filterClub ? COLORS.green : COLORS.hairline}`,
            color: !showOnlyMyClub && !filterClub ? COLORS.green : COLORS.body,
            fontSize: 11,
            borderRadius: 100,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          🌍 Global
        </button>
        {user.favorite_club && (
          <button
            onClick={() => { setShowOnlyMyClub(true); setFilterClub(""); }}
            style={{
              padding: "10px 16px",
              background: showOnlyMyClub ? COLORS.greenGlow : "transparent",
              border: `1px solid ${showOnlyMyClub ? COLORS.green : COLORS.hairline}`,
              color: showOnlyMyClub ? COLORS.green : COLORS.body,
              fontSize: 11,
              borderRadius: 100,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            ⚽ My Club ({user.favorite_club})
          </button>
        )}
      </div>

      {/* Leaderboard list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} height={64} />)}
        </div>
      ) : data && data.leaderboard.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "80px 20px",
          background: COLORS.bgSoft,
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 4,
        }}>
          <div style={{ fontSize: 48, opacity: 0.3, marginBottom: 16 }}>🏆</div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 20,
            color: "#F2F5EE",
            marginBottom: 8,
          }}>
            No rankings yet
          </div>
          <div style={{ color: COLORS.body, opacity: 0.6, fontSize: 14 }}>
            {showOnlyMyClub ? "No fans of this club yet. Be the first!" : "Be the first to log activity and claim #1!"}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {data.leaderboard.map((entry, i) => {
            const isMe = data.you && entry.username === data.you.username;
            const medal = getMedal(entry.rank);
            const isTop3 = entry.rank <= 3;

            return (
              <div
                key={entry.username}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 20px",
                  background: isMe ? COLORS.greenGlow : (isTop3 ? COLORS.bgCard : COLORS.bgSoft),
                  borderRadius: 4,
                  border: `1px solid ${isMe ? COLORS.green : (isTop3 ? COLORS.gold + "30" : COLORS.hairline)}`,
                  transition: "all 0.2s",
                  opacity: 0,
                  animation: `fadeIn 0.3s ease-out ${Math.min(i * 0.02, 0.5)}s forwards`,
                  position: "relative",
                }}
                onMouseEnter={e => {
                  if (!isMe) {
                    e.currentTarget.style.borderColor = COLORS.green;
                    e.currentTarget.style.background = COLORS.bgCard;
                  }
                }}
                onMouseLeave={e => {
                  if (!isMe) {
                    e.currentTarget.style.borderColor = isTop3 ? COLORS.gold + "30" : COLORS.hairline;
                    e.currentTarget.style.background = isTop3 ? COLORS.bgCard : COLORS.bgSoft;
                  }
                }}
              >
                {/* Rank */}
                <div style={{
                  minWidth: 50,
                  textAlign: "center",
                  fontSize: medal ? 28 : 18,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900,
                  color: isTop3 ? COLORS.gold : COLORS.body,
                  opacity: isTop3 ? 1 : 0.7,
                }}>
                  {medal || `#${entry.rank}`}
                </div>

                {/* Avatar */}
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: isMe ? COLORS.greenGlow : COLORS.bg,
                  border: `1px solid ${isMe ? COLORS.green : COLORS.hairline}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900,
                  color: isMe ? COLORS.green : COLORS.body,
                  flexShrink: 0,
                }}>
                  {entry.display_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 16,
                    color: "#F2F5EE",
                    fontWeight: isMe ? 700 : 500,
                    marginBottom: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {entry.display_name} {isMe && <span style={{ color: COLORS.green, fontSize: 11 }}>(YOU)</span>}
                  </div>
                  <div style={{
                    fontSize: 11,
                    fontFamily: "'DM Mono', monospace",
                    color: getLevelColor(entry.level),
                    opacity: 0.85,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {entry.level}
                    {entry.favorite_club && (
                      <span style={{ color: COLORS.body, opacity: 0.5 }}> · {entry.favorite_club}</span>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{
                    fontSize: 22,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900,
                    color: isMe ? COLORS.green : (isTop3 ? COLORS.gold : "#F2F5EE"),
                  }}>
                    {Math.round(entry.total_score).toLocaleString()}
                  </div>
                  <div style={{
                    fontSize: 9,
                    fontFamily: "'DM Mono', monospace",
                    color: COLORS.body,
                    opacity: 0.5,
                    letterSpacing: "0.15em",
                  }}>
                    PTS
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer info */}
      {data && data.leaderboard.length > 0 && (
        <div style={{
          marginTop: 32,
          padding: 20,
          background: COLORS.bgSoft,
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 4,
          textAlign: "center",
        }}>
          <div style={{
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            color: COLORS.gold,
            letterSpacing: "0.15em",
            marginBottom: 8,
          }}>
            🏆 CAMPAIGN PRIZE
          </div>
          <div style={{ fontSize: 14, color: "#F2F5EE", marginBottom: 6 }}>
            Top fan wins the <strong style={{ color: COLORS.green }}>Ultimate Football Experience</strong>
          </div>
          <div style={{ fontSize: 12, color: COLORS.body, opacity: 0.6 }}>
            Including 424pass package, partner club VIP weekend, and exclusive memorabilia
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ONBOARDING FLOW
// ============================================================================

function OnboardingFlow({ user, token, onComplete, showToast }) {
  const [step, setStep] = useState(0); // 0: welcome, 1: tour-1, 2: tour-2, 3: tour-3, 4: first-activity, 5: complete
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (step === 0) {
      setShowConfetti(true);
      // Auto-advance from welcome screen after 3.5 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
        setStep(1);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  async function handleSubmitReason() {
    if (!reason.trim()) {
      showToast("Tell us a bit about yourself!", "error");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/loyalty/activity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          activity_type: "passion",
          description: `Why I joined FOFA: ${reason.trim()}`,
          points: 25,
        }),
      });

      if (!response.ok) throw new Error("Failed to log");
      
      setStep(5);
      setTimeout(() => {
        onComplete();
        showToast("Welcome to FOFA! +75 points earned 🎉", "success");
      }, 2000);
    } catch (err) {
      showToast("Something went wrong. Try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function skipOnboarding() {
    onComplete();
    showToast("You can complete your profile anytime", "info");
  }

  // Confetti pieces
  const confettiColors = [COLORS.green, COLORS.gold, COLORS.teal, "#FFFFFF"];
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: confettiColors[i % confettiColors.length],
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    size: 6 + Math.random() * 8,
  }));

  return (
    <div style={{
      maxWidth: 600,
      margin: "0 auto",
      padding: "60px 20px",
      minHeight: "70vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      position: "relative",
    }}>
      {/* Confetti */}
      {showConfetti && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 100,
        }}>
          <style>{`
            @keyframes confettiFall {
              0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
          `}</style>
          {confettiPieces.map(piece => (
            <div
              key={piece.id}
              style={{
                position: "absolute",
                top: 0,
                left: `${piece.left}%`,
                width: piece.size,
                height: piece.size,
                background: piece.color,
                borderRadius: piece.id % 3 === 0 ? "50%" : "2px",
                animation: `confettiFall ${piece.duration}s ease-in ${piece.delay}s forwards`,
              }}
            />
          ))}
        </div>
      )}

      {/* Step Indicator (except for welcome) */}
      {step > 0 && step < 5 && (
        <div style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          marginBottom: 40,
        }}>
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              style={{
                width: 32,
                height: 4,
                borderRadius: 2,
                background: step >= s ? COLORS.green : COLORS.hairline,
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>
      )}

      {/* Step 0: Welcome Splash */}
      {step === 0 && (
        <div style={{
          textAlign: "center",
          opacity: 0,
          animation: "fadeIn 0.6s ease-out forwards",
        }}>
          <div style={{
            fontSize: 80,
            marginBottom: 24,
            animation: "pulse 2s ease-in-out infinite",
          }}>
            🎉
          </div>
          <div style={{
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            color: COLORS.gold,
            letterSpacing: "0.25em",
            marginBottom: 16,
          }}>
            — WELCOME TO FOFA
          </div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "clamp(40px, 9vw, 72px)",
            fontWeight: 900,
            color: "#F2F5EE",
            margin: "0 0 16px",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
          }}>
            Hey<br/>
            <span style={{ color: COLORS.green }}>{user.display_name}!</span>
          </h1>
          <div style={{
            display: "inline-block",
            padding: "12px 24px",
            background: COLORS.greenGlow,
            border: `1px solid ${COLORS.green}`,
            borderRadius: 4,
            marginTop: 16,
            marginBottom: 24,
          }}>
            <div style={{
              fontSize: 32,
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              color: COLORS.green,
              lineHeight: 1,
            }}>
              +50 POINTS
            </div>
            <div style={{
              fontSize: 10,
              fontFamily: "'DM Mono', monospace",
              color: COLORS.body,
              letterSpacing: "0.2em",
              marginTop: 4,
            }}>
              WELCOME BONUS
            </div>
          </div>
          <p style={{
            color: COLORS.body,
            opacity: 0.7,
            margin: 0,
            fontSize: 16,
          }}>
            Your FOFA Passport is ready...
          </p>
        </div>
      )}

      {/* Step 1: Tour - Passport */}
      {step === 1 && (
        <OnboardingCard
          icon="🛂"
          subtitle="STEP 1 OF 4"
          title="This is your Passport"
          description="Your FOFA Passport is your decentralised identity in the football world. It travels with you, recording your loyalty across clubs and time."
          highlight="No registration fees. No barriers. Built for true fans."
          onNext={() => setStep(2)}
          onSkip={skipOnboarding}
        />
      )}

      {/* Step 2: Tour - Earn Points */}
      {step === 2 && (
        <OnboardingCard
          icon="⚽"
          subtitle="STEP 2 OF 4"
          title="Earn points 6 ways"
          description="Score loyalty points across six dimensions: engagement, passion, knowledge, consistency, community, and growth."
          customContent={
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              marginTop: 20,
              marginBottom: 20,
            }}>
              {[
                { label: "Engagement", icon: "◆" },
                { label: "Passion", icon: "♦" },
                { label: "Knowledge", icon: "◇" },
                { label: "Consistency", icon: "◈" },
                { label: "Community", icon: "⬡" },
                { label: "Growth", icon: "△" },
              ].map(d => (
                <div key={d.label} style={{
                  background: COLORS.bg,
                  padding: 12,
                  borderRadius: 4,
                  border: `1px solid ${COLORS.hairline}`,
                  textAlign: "center",
                }}>
                  <div style={{ color: COLORS.green, fontSize: 16, marginBottom: 4 }}>{d.icon}</div>
                  <div style={{
                    fontSize: 10,
                    fontFamily: "'DM Mono', monospace",
                    color: COLORS.body,
                    opacity: 0.8,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}>
                    {d.label}
                  </div>
                </div>
              ))}
            </div>
          }
          onNext={() => setStep(3)}
          onSkip={skipOnboarding}
        />
      )}

      {/* Step 3: Tour - Compete */}
      {step === 3 && (
        <OnboardingCard
          icon="🏆"
          subtitle="STEP 3 OF 4"
          title="Climb the leaderboard"
          description="The most loyal fan wins the Ultimate Football Experience — including a 424pass package, partner club VIP weekend, and exclusive memorabilia."
          customContent={
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginTop: 20,
            }}>
              {[
                { rank: "🥇", label: "Grand Prize: 424pass Experience", color: COLORS.gold },
                { rank: "🥈", label: "Partner Club VIP Weekend", color: "#C0C0C0" },
                { rank: "🥉", label: "Signed Memorabilia Bundle", color: "#CD7F32" },
              ].map((p, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 10,
                  background: COLORS.bg,
                  borderRadius: 4,
                  border: `1px solid ${COLORS.hairline}`,
                }}>
                  <span style={{ fontSize: 18 }}>{p.rank}</span>
                  <span style={{ fontSize: 13, color: "#F2F5EE", flex: 1 }}>{p.label}</span>
                </div>
              ))}
            </div>
          }
          onNext={() => setStep(4)}
          onSkip={skipOnboarding}
        />
      )}

      {/* Step 4: First Activity */}
      {step === 4 && (
        <div style={{
          opacity: 0,
          animation: "fadeIn 0.4s ease-out forwards",
        }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>💚</div>
            <div style={{
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
              color: COLORS.gold,
              letterSpacing: "0.25em",
              marginBottom: 12,
            }}>
              STEP 4 OF 4
            </div>
            <h2 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "clamp(28px, 6vw, 40px)",
              fontWeight: 900,
              color: "#F2F5EE",
              margin: "0 0 12px",
              letterSpacing: "-0.01em",
            }}>
              Why did you join <span style={{ color: COLORS.green }}>FOFA</span>?
            </h2>
            <p style={{
              color: COLORS.body,
              opacity: 0.7,
              margin: 0,
              fontSize: 15,
            }}>
              Tell us your story. Earn <span style={{ color: COLORS.green, fontWeight: 700 }}>+25 points</span>.
            </p>
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="My grandfather took me to my first match when I was 8..."
            autoFocus
            style={{
              width: "100%",
              minHeight: 120,
              padding: 16,
              fontSize: 16,
              resize: "vertical",
              marginBottom: 16,
            }}
          />

          <div style={{
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            color: COLORS.body,
            opacity: 0.5,
            marginBottom: 24,
            textAlign: "right",
            letterSpacing: "0.05em",
          }}>
            {reason.length}/500
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              className="btn-primary"
              onClick={handleSubmitReason}
              disabled={submitting || !reason.trim()}
              style={{ flex: 1, minWidth: 200 }}
            >
              {submitting ? (
                <span style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
                  <LoadingSpinner size={14} color={COLORS.bg} />
                  Saving...
                </span>
              ) : (
                "Complete Setup (+25)"
              )}
            </button>
            <button
              className="btn-ghost"
              onClick={skipOnboarding}
              style={{ minWidth: 100 }}
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Complete */}
      {step === 5 && (
        <div style={{
          textAlign: "center",
          opacity: 0,
          animation: "fadeIn 0.4s ease-out forwards",
        }}>
          <div style={{
            fontSize: 80,
            marginBottom: 24,
            animation: "pulse 1s ease-in-out 2",
          }}>
            🚀
          </div>
          <h2 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "clamp(32px, 7vw, 48px)",
            fontWeight: 900,
            color: COLORS.green,
            margin: "0 0 16px",
          }}>
            You're all set!
          </h2>
          <div style={{
            fontSize: 36,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            color: "#F2F5EE",
            marginBottom: 8,
          }}>
            75 POINTS EARNED
          </div>
          <p style={{
            color: COLORS.body,
            opacity: 0.7,
            margin: 0,
            fontSize: 14,
          }}>
            Loading your dashboard...
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ONBOARDING CARD
// ============================================================================

function OnboardingCard({ icon, subtitle, title, description, highlight, customContent, onNext, onSkip }) {
  return (
    <div style={{
      opacity: 0,
      animation: "fadeIn 0.4s ease-out forwards",
    }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{
          fontSize: 56,
          marginBottom: 16,
        }}>
          {icon}
        </div>
        <div style={{
          fontSize: 11,
          fontFamily: "'DM Mono', monospace",
          color: COLORS.gold,
          letterSpacing: "0.25em",
          marginBottom: 12,
        }}>
          — {subtitle}
        </div>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "clamp(28px, 6vw, 40px)",
          fontWeight: 900,
          color: "#F2F5EE",
          margin: "0 0 16px",
          letterSpacing: "-0.01em",
        }}>
          {title}
        </h2>
      </div>

      <div style={{
        background: COLORS.bgSoft,
        border: `1px solid ${COLORS.hairline}`,
        borderRadius: 4,
        padding: 24,
        marginBottom: 24,
      }}>
        <p style={{
          color: COLORS.body,
          fontSize: 16,
          lineHeight: 1.6,
          margin: 0,
          textAlign: "center",
        }}>
          {description}
        </p>
        {customContent}
        {highlight && (
          <div style={{
            marginTop: 20,
            paddingTop: 20,
            borderTop: `1px solid ${COLORS.hairline}`,
            textAlign: "center",
            color: COLORS.green,
            fontSize: 13,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.05em",
          }}>
            {highlight}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          className="btn-primary"
          onClick={onNext}
          style={{ flex: 1, minWidth: 200 }}
        >
          Continue →
        </button>
        <button
          className="btn-ghost"
          onClick={onSkip}
          style={{ minWidth: 100 }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// REFERRALS TAB
// ============================================================================

function ReferralsTab({ token, user, showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  async function fetchReferralData() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/referrals/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to load");
      const result = await response.json();
      setData(result);
    } catch (err) {
      showToast("Could not load referral data", "error");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text, type) {
    navigator.clipboard.writeText(text).then(() => {
      if (type === "link") {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
      showToast("Copied to clipboard! 📋", "success");
    }).catch(() => {
      showToast("Could not copy. Try long-press to copy.", "error");
    });
  }

  function shareNative() {
    if (!data) return;
    if (navigator.share) {
      navigator.share({
        title: "Join me on FOFA",
        text: `I'm competing on FOFA — the football fan loyalty platform. Join me and let's compete for the Ultimate Football Experience!`,
        url: data.referral_link,
      }).catch(() => {});
    } else {
      copyToClipboard(data.referral_link, "link");
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {[1, 2, 3].map(i => <Skeleton key={i} height={120} />)}
      </div>
    );
  }

  if (!data) {
    return <div style={{ color: COLORS.body, opacity: 0.6 }}>Could not load referral data.</div>;
  }

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 11,
          fontFamily: "'DM Mono', monospace",
          color: COLORS.gold,
          letterSpacing: "0.25em",
          marginBottom: 12,
        }}>
          — REFER FRIENDS, EARN POINTS
        </div>
        <h2 style={{
          color: "#F2F5EE",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "clamp(28px, 5vw, 40px)",
          fontWeight: 900,
          margin: "0 0 8px",
          letterSpacing: "-0.01em",
        }}>
          Your Referral Hub
        </h2>
        <p style={{ color: COLORS.body, opacity: 0.7, margin: 0 }}>
          Earn <strong style={{ color: COLORS.green }}>+50 growth points</strong> for every fan you bring in. They get +25 bonus points too.
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12,
        marginBottom: 32,
      }} className="referral-stats">
        <style>{`
          @media (max-width: 600px) {
            .referral-stats { grid-template-columns: 1fr !important; }
          }
        `}</style>
        <div style={{
          background: COLORS.bgSoft,
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 4,
          padding: 20,
          textAlign: "center",
        }}>
          <div style={{
            fontSize: 36,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            color: COLORS.green,
            lineHeight: 1,
            marginBottom: 6,
          }}>
            {data.referral_count}
          </div>
          <div style={{
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            color: COLORS.body,
            opacity: 0.7,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}>
            Friends Referred
          </div>
        </div>
        <div style={{
          background: COLORS.bgSoft,
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 4,
          padding: 20,
          textAlign: "center",
        }}>
          <div style={{
            fontSize: 36,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            color: COLORS.gold,
            lineHeight: 1,
            marginBottom: 6,
          }}>
            {data.points_earned}
          </div>
          <div style={{
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            color: COLORS.body,
            opacity: 0.7,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}>
            Points Earned
          </div>
        </div>
        <div style={{
          background: COLORS.bgSoft,
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 4,
          padding: 20,
          textAlign: "center",
        }}>
          <div style={{
            fontSize: 36,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900,
            color: "#F2F5EE",
            lineHeight: 1,
            marginBottom: 6,
          }}>
            #{data.recruiter_rank}
          </div>
          <div style={{
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            color: COLORS.body,
            opacity: 0.7,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}>
            Recruiter Rank
          </div>
        </div>
      </div>

      {/* Share Section */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.bgCard} 0%, ${COLORS.bgSoft} 100%)`,
        border: `1px solid ${COLORS.green}`,
        borderRadius: 8,
        padding: 24,
        marginBottom: 32,
        boxShadow: `0 0 40px ${COLORS.greenGlow}`,
      }}>
        <div style={{
          fontSize: 11,
          fontFamily: "'DM Mono', monospace",
          color: COLORS.green,
          letterSpacing: "0.2em",
          marginBottom: 16,
        }}>
          ⚡ YOUR REFERRAL LINK
        </div>

        {/* Referral Code */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 10,
            fontFamily: "'DM Mono', monospace",
            color: COLORS.body,
            opacity: 0.6,
            letterSpacing: "0.15em",
            marginBottom: 6,
          }}>
            CODE
          </div>
          <div
            onClick={() => copyToClipboard(data.referral_code, "code")}
            style={{
              background: COLORS.bg,
              border: `1px solid ${COLORS.hairline}`,
              borderRadius: 4,
              padding: "12px 16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.green}
            onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.hairline}
          >
            <code style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 14,
              color: COLORS.green,
              letterSpacing: "0.05em",
              wordBreak: "break-all",
              flex: 1,
            }}>
              {data.referral_code}
            </code>
            <span style={{
              fontSize: 10,
              fontFamily: "'DM Mono', monospace",
              color: copiedCode ? COLORS.green : COLORS.body,
              opacity: copiedCode ? 1 : 0.6,
              letterSpacing: "0.15em",
              flexShrink: 0,
            }}>
              {copiedCode ? "✓ COPIED" : "TAP TO COPY"}
            </span>
          </div>
        </div>

        {/* Referral Link */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 10,
            fontFamily: "'DM Mono', monospace",
            color: COLORS.body,
            opacity: 0.6,
            letterSpacing: "0.15em",
            marginBottom: 6,
          }}>
            SHARE LINK
          </div>
          <div
            onClick={() => copyToClipboard(data.referral_link, "link")}
            style={{
              background: COLORS.bg,
              border: `1px solid ${COLORS.hairline}`,
              borderRadius: 4,
              padding: "12px 16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.green}
            onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.hairline}
          >
            <code style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              color: "#F2F5EE",
              letterSpacing: "0.02em",
              wordBreak: "break-all",
              flex: 1,
            }}>
              {data.referral_link}
            </code>
            <span style={{
              fontSize: 10,
              fontFamily: "'DM Mono', monospace",
              color: copiedLink ? COLORS.green : COLORS.body,
              opacity: copiedLink ? 1 : 0.6,
              letterSpacing: "0.15em",
              flexShrink: 0,
            }}>
              {copiedLink ? "✓ COPIED" : "TAP TO COPY"}
            </span>
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={shareNative}
          style={{
            width: "100%",
            background: COLORS.green,
            color: COLORS.bg,
            border: "none",
            padding: "14px 24px",
            fontFamily: "'DM Mono', monospace",
            fontSize: 13,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontWeight: 700,
            borderRadius: 4,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => e.target.style.background = "#2dff82"}
          onMouseLeave={(e) => e.target.style.background = COLORS.green}
        >
          🚀 Share with Friends
        </button>
      </div>

      {/* Referred Users List */}
      {data.referred_users && data.referred_users.length > 0 ? (
        <div>
          <div style={{
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            color: COLORS.gold,
            letterSpacing: "0.2em",
            marginBottom: 16,
          }}>
            👥 FANS YOU BROUGHT IN ({data.referred_users.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.referred_users.map((u, i) => {
              const initials = u.display_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div
                  key={u.username}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    background: COLORS.bgSoft,
                    border: `1px solid ${COLORS.hairline}`,
                    borderRadius: 4,
                    opacity: 0,
                    animation: `fadeIn 0.3s ease-out ${i * 0.05}s forwards`,
                  }}
                >
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
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#F2F5EE", fontSize: 14, marginBottom: 2 }}>
                      {u.display_name}
                    </div>
                    <div style={{
                      fontSize: 10,
                      fontFamily: "'DM Mono', monospace",
                      color: COLORS.body,
                      opacity: 0.6,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}>
                      {u.level} {u.favorite_club && `· ${u.favorite_club}`}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 14,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    color: COLORS.green,
                  }}>
                    +50
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{
          textAlign: "center",
          padding: "40px 20px",
          background: COLORS.bgSoft,
          border: `1px dashed ${COLORS.hairline}`,
          borderRadius: 4,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>🎁</div>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 18,
            color: "#F2F5EE",
            marginBottom: 6,
          }}>
            No referrals yet
          </div>
          <div style={{ color: COLORS.body, opacity: 0.6, fontSize: 13 }}>
            Share your link to start earning growth points!
          </div>
        </div>
      )}
    </div>
  );
}
