import React, { useEffect, useState } from "react";

// ============================================================================
// FOFA ADMIN DASHBOARD
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

export default function AdminDashboard() {
  const [token] = useState(localStorage.getItem("fofaToken") || null);
  const [view, setView] = useState("loading"); // loading, login, denied, dashboard
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    checkAccess();
  }, [token]);

  useEffect(() => {
    if (view !== "dashboard" || !autoRefresh) return;
    const interval = setInterval(() => {
      fetchData();
    }, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [view, autoRefresh]);

  async function checkAccess() {
    if (!token) {
      setView("login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/check`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (!result.is_admin) {
        setView("denied");
        return;
      }

      await fetchData();
      setView("dashboard");
    } catch (err) {
      console.error(err);
      setView("denied");
    }
  }

  async function fetchData() {
    try {
      const response = await fetch(`${API_URL}/admin/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to load admin data");
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div style={{
      background: COLORS.bg,
      color: COLORS.body,
      fontFamily: "'Crimson Pro', Georgia, serif",
      minHeight: "100vh",
      padding: "0 20px 80px",
    }}>
      <GlobalStyles />

      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 0",
        borderBottom: `1px solid ${COLORS.hairline}`,
        marginBottom: 32,
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
            color: COLORS.gold,
            opacity: 0.8,
            letterSpacing: "0.2em",
            borderLeft: `1px solid ${COLORS.hairline}`,
            paddingLeft: 12,
          }}>
            ADMIN
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {view === "dashboard" && (
            <>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                style={{
                  background: autoRefresh ? COLORS.greenGlow : "transparent",
                  border: `1px solid ${autoRefresh ? COLORS.green : COLORS.hairline}`,
                  color: autoRefresh ? COLORS.green : COLORS.body,
                  fontSize: 11,
                  fontFamily: "'DM Mono', monospace",
                  padding: "8px 14px",
                  borderRadius: 4,
                  cursor: "pointer",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  transition: "all 0.2s",
                }}
              >
                {autoRefresh ? "● LIVE" : "○ PAUSED"}
              </button>
              <button
                onClick={() => fetchData()}
                style={{
                  background: "transparent",
                  border: `1px solid ${COLORS.hairline}`,
                  color: COLORS.body,
                  fontSize: 11,
                  fontFamily: "'DM Mono', monospace",
                  padding: "8px 14px",
                  borderRadius: 4,
                  cursor: "pointer",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  transition: "all 0.2s",
                }}
              >
                Refresh
              </button>
            </>
          )}
          <a href="/" style={{
            color: COLORS.body,
            opacity: 0.7,
            textDecoration: "none",
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
            ← Back to Site
          </a>
        </div>
      </div>

      {view === "loading" && <LoadingState />}
      {view === "login" && <NotLoggedIn />}
      {view === "denied" && <AccessDenied />}
      {view === "dashboard" && data && (
        <Dashboard data={data} activeTab={activeTab} setActiveTab={setActiveTab} token={token} />
      )}
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
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      @keyframes shimmer {
        0% { background-position: -1000px 0; }
        100% { background-position: 1000px 0; }
      }
      
      .fade-in { animation: fadeIn 0.4s ease-out forwards; }
      
      .skeleton {
        background: linear-gradient(90deg, ${COLORS.bgSoft} 0%, ${COLORS.bgCard} 50%, ${COLORS.bgSoft} 100%);
        background-size: 1000px 100%;
        animation: shimmer 2s infinite linear;
        border-radius: 4px;
      }
      
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
      ::-webkit-scrollbar-thumb { background: ${COLORS.hairlineStrong}; border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: ${COLORS.green}; }
      
      @media (max-width: 768px) {
        .grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
        .grid-2 { grid-template-columns: 1fr !important; }
      }
    `}</style>
  );
}

// ============================================================================
// STATES
// ============================================================================

function LoadingState() {
  return (
    <div style={{ textAlign: "center", padding: "80px 0" }}>
      <div style={{
        fontSize: 36,
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 900,
        color: COLORS.green,
        animation: "pulse 2s ease-in-out infinite",
      }}>
        VERIFYING ACCESS...
      </div>
    </div>
  );
}

function NotLoggedIn() {
  return (
    <div style={{ maxWidth: 500, margin: "80px auto", textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 24, opacity: 0.5 }}>🔐</div>
      <h2 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 36,
        fontWeight: 900,
        color: "#F2F5EE",
        marginBottom: 12,
      }}>
        Admin Access Required
      </h2>
      <p style={{ color: COLORS.body, opacity: 0.7, marginBottom: 24 }}>
        You need to log in with an admin account to view this dashboard.
      </p>
      <a href="/#portal" style={{
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
        Sign In →
      </a>
    </div>
  );
}

function AccessDenied() {
  return (
    <div style={{ maxWidth: 500, margin: "80px auto", textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 24, opacity: 0.5 }}>🚫</div>
      <h2 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 36,
        fontWeight: 900,
        color: COLORS.red,
        marginBottom: 12,
      }}>
        Access Denied
      </h2>
      <p style={{ color: COLORS.body, opacity: 0.7, marginBottom: 8 }}>
        Your account doesn't have admin privileges.
      </p>
      <p style={{ color: COLORS.body, opacity: 0.5, fontSize: 13, marginBottom: 24 }}>
        If you should have access, ensure your email is in the ADMIN_EMAILS configuration.
      </p>
      <a href="/" style={{
        color: COLORS.green,
        textDecoration: "none",
        fontFamily: "'DM Mono', monospace",
        fontSize: 12,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}>
        ← Back to Site
      </a>
    </div>
  );
}

// ============================================================================
// DASHBOARD
// ============================================================================

function Dashboard({ data, activeTab, setActiveTab, token }) {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users" },
    { id: "clubs", label: "🏟️ Club Applications" },
    { id: "experts", label: "🎓 Expert Applications" },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }} className="fade-in">
      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 32,
        borderBottom: `1px solid ${COLORS.hairline}`,
      }}>
        {tabs.map(tab => (
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
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <OverviewTab data={data} />}
      {activeTab === "users" && <UsersTab token={token} />}
      {activeTab === "clubs" && <ClubsApplicationsTab token={token} />}
      {activeTab === "experts" && <ExpertsApplicationsTab token={token} />}
    </div>
  );
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================

function OverviewTab({ data }) {
  const { stats, top_fans, clubs, activities, recent_signups } = data;

  function timeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now - date) / 1000;
    if (diff < 60) return `${Math.round(diff)}s ago`;
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.round(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stats grid */}
      <div className="grid-4" style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12,
      }}>
        <StatCard
          label="Total Fans"
          value={stats.total_users}
          subtitle={stats.signups_today > 0 ? `+${stats.signups_today} today` : "No signups today"}
          highlight={stats.signups_today > 0}
        />
        <StatCard
          label="Activities"
          value={stats.total_activities.toLocaleString()}
          subtitle={`avg ${stats.avg_activities_per_user} per user`}
        />
        <StatCard
          label="Active Today"
          value={stats.active_today}
          subtitle={`${stats.dau_percent}% DAU`}
          highlight={stats.dau_percent >= 30}
        />
        <StatCard
          label="Clubs"
          value={clubs.length}
          subtitle={clubs.slice(0, 2).map(c => c.name).join(", ") || "No clubs yet"}
        />
      </div>

      {/* Top Fans + Sidebar */}
      <div className="grid-2" style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
      }}>
        {/* Top Fans */}
        <Card title="Top Fans — Campaign Leaders">
          {top_fans.length === 0 ? (
            <EmptyState message="No fans yet. Waiting for first signups." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {top_fans.map((fan, i) => (
                <FanRow key={fan.username} fan={fan} index={i} />
              ))}
            </div>
          )}
        </Card>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Club breakdown */}
          <Card title="Club Breakdown">
            {clubs.length === 0 ? (
              <EmptyState message="No clubs yet. Users haven't selected favorites." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {clubs.slice(0, 5).map((club, i) => {
                  const totalFans = clubs.reduce((sum, c) => sum + c.fans, 0);
                  const percent = (club.fans / totalFans) * 100;
                  const colors = [COLORS.green, COLORS.teal, COLORS.gold, COLORS.purple, COLORS.body];
                  const color = colors[i] || COLORS.body;
                  return (
                    <div key={club.name}>
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}>
                        <span style={{ color: "#F2F5EE", fontSize: 13 }}>{club.name}</span>
                        <span style={{ color, fontSize: 13, fontWeight: 500 }}>
                          {club.fans} {club.fans === 1 ? "fan" : "fans"}
                        </span>
                      </div>
                      <div style={{
                        height: 4,
                        background: COLORS.bg,
                        borderRadius: 2,
                        overflow: "hidden",
                      }}>
                        <div style={{
                          height: "100%",
                          width: `${percent}%`,
                          background: color,
                          transition: "width 1s ease",
                        }} />
                      </div>
                      <div style={{
                        fontSize: 10,
                        color: COLORS.body,
                        opacity: 0.5,
                        marginTop: 4,
                        fontFamily: "'DM Mono', monospace",
                        letterSpacing: "0.1em",
                      }}>
                        {Math.round(club.total_score).toLocaleString()} TOTAL POINTS
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Activity types */}
          <Card title="Activity Types">
            {activities.length === 0 ? (
              <EmptyState message="No activities logged yet." />
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
              }}>
                {["engagement", "passion", "knowledge", "consistency", "community", "growth"].map(type => {
                  const stat = activities.find(a => a.type === type);
                  return (
                    <div key={type} style={{
                      textAlign: "center",
                      padding: 10,
                      background: COLORS.bg,
                      borderRadius: 4,
                      border: `1px solid ${COLORS.hairline}`,
                    }}>
                      <div style={{
                        fontSize: 18,
                        fontWeight: 500,
                        color: stat ? COLORS.green : COLORS.body,
                        opacity: stat ? 1 : 0.4,
                      }}>
                        {stat ? stat.count : 0}
                      </div>
                      <div style={{
                        fontSize: 9,
                        color: COLORS.body,
                        opacity: 0.6,
                        fontFamily: "'DM Mono', monospace",
                        marginTop: 2,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}>
                        {type.slice(0, 7)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Recent signups */}
      <Card title="Recent Signups">
        {recent_signups.length === 0 ? (
          <EmptyState message="No signups yet. Share your portal link!" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {recent_signups.map((user, i) => {
              const isToday = (new Date() - new Date(user.created_at)) < 24 * 60 * 60 * 1000;
              return (
                <div
                  key={user.username}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: COLORS.bg,
                    borderRadius: 4,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderLeft = `2px solid ${COLORS.green}`}
                  onMouseLeave={e => e.currentTarget.style.borderLeft = "2px solid transparent"}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0, flex: 1 }}>
                    <div style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: isToday ? COLORS.green : COLORS.body,
                      opacity: isToday ? 1 : 0.4,
                      flexShrink: 0,
                    }} />
                    <span style={{ color: "#F2F5EE", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.display_name}
                    </span>
                    {user.favorite_club && (
                      <span style={{
                        color: COLORS.gold,
                        fontSize: 11,
                        fontFamily: "'DM Mono', monospace",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        opacity: 0.8,
                      }}>
                        {user.favorite_club}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {user.total_score > 0 && (
                      <span style={{
                        color: COLORS.green,
                        fontSize: 11,
                        fontFamily: "'DM Mono', monospace",
                      }}>
                        {Math.round(user.total_score)} pts
                      </span>
                    )}
                    <span style={{
                      color: COLORS.body,
                      opacity: 0.5,
                      fontSize: 11,
                      fontFamily: "'DM Mono', monospace",
                    }}>
                      {timeAgo(user.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================================================
// USERS TAB
// ============================================================================

function UsersTab({ token }) {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, total_pages: 0 });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, search]);

  async function fetchUsers() {
    setLoading(true);
    try {
      let url = `${API_URL}/admin/users?page=${pagination.page}&limit=50`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setUsers(data.users || []);
      setPagination(p => ({ ...p, total: data.pagination.total, total_pages: data.pagination.total_pages }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    const headers = ["Display Name", "Username", "Email", "Favorite Club", "Total Score", "Level", "Joined"];
    const rows = users.map(u => [
      u.display_name,
      u.username,
      u.email,
      u.favorite_club,
      u.total_score,
      u.level,
      new Date(u.created_at).toISOString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fofa-users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  return (
    <div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 24,
        gap: 12,
        flexWrap: "wrap",
      }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 28,
          fontWeight: 900,
          color: "#F2F5EE",
          margin: 0,
        }}>
          All Users <span style={{ color: COLORS.body, opacity: 0.5, fontSize: 16 }}>({pagination.total})</span>
        </h2>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                setSearch(searchInput);
                setPagination(p => ({ ...p, page: 1 }));
              }
            }}
            placeholder="Search by name, email..."
            style={{
              background: COLORS.bgSoft,
              border: `1px solid ${COLORS.hairline}`,
              color: COLORS.body,
              padding: "8px 14px",
              borderRadius: 4,
              fontSize: 13,
              fontFamily: "'Crimson Pro', serif",
              width: 240,
            }}
          />
          <button
            onClick={exportCSV}
            style={{
              background: "transparent",
              border: `1px solid ${COLORS.green}`,
              color: COLORS.green,
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
              padding: "8px 14px",
              borderRadius: 4,
              cursor: "pointer",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="skeleton" style={{ height: 56 }} />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState message="No users found" />
      ) : (
        <>
          <div style={{
            background: COLORS.bgSoft,
            border: `1px solid ${COLORS.hairline}`,
            borderRadius: 4,
            overflow: "auto",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.hairline}` }}>
                  <th style={tableHeaderStyle}>Name</th>
                  <th style={tableHeaderStyle}>Email</th>
                  <th style={tableHeaderStyle}>Club</th>
                  <th style={tableHeaderStyle}>Score</th>
                  <th style={tableHeaderStyle}>Level</th>
                  <th style={tableHeaderStyle}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${COLORS.hairline}` }}>
                    <td style={tableCellStyle}>
                      <div style={{ color: "#F2F5EE", fontWeight: 500 }}>{u.display_name}</div>
                      <div style={{
                        fontSize: 11,
                        color: COLORS.body,
                        opacity: 0.6,
                        fontFamily: "'DM Mono', monospace",
                      }}>
                        @{u.username}
                      </div>
                    </td>
                    <td style={{ ...tableCellStyle, fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                      {u.email}
                    </td>
                    <td style={tableCellStyle}>
                      {u.favorite_club ? (
                        <span style={{ color: COLORS.gold }}>{u.favorite_club}</span>
                      ) : (
                        <span style={{ opacity: 0.4 }}>—</span>
                      )}
                    </td>
                    <td style={{ ...tableCellStyle, color: COLORS.green, fontWeight: 500 }}>
                      {Math.round(u.total_score).toLocaleString()}
                    </td>
                    <td style={{ ...tableCellStyle, fontFamily: "'DM Mono', monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      {u.level}
                    </td>
                    <td style={{ ...tableCellStyle, fontSize: 11, opacity: 0.7, fontFamily: "'DM Mono', monospace" }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              marginTop: 16,
            }}>
              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page === 1}
                style={paginationButtonStyle(pagination.page === 1)}
              >
                ← Prev
              </button>
              <div style={{
                padding: "8px 14px",
                fontFamily: "'DM Mono', monospace",
                fontSize: 12,
                color: COLORS.body,
              }}>
                Page {pagination.page} of {pagination.total_pages}
              </div>
              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.min(p.total_pages, p.page + 1) }))}
                disabled={pagination.page === pagination.total_pages}
                style={paginationButtonStyle(pagination.page === pagination.total_pages)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StatCard({ label, value, subtitle, highlight }) {
  return (
    <div style={{
      background: COLORS.bgSoft,
      border: `1px solid ${COLORS.hairline}`,
      borderRadius: 4,
      padding: 16,
    }}>
      <div style={{
        fontSize: 11,
        color: COLORS.body,
        opacity: 0.6,
        fontFamily: "'DM Mono', monospace",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 32,
        fontWeight: 500,
        color: highlight ? COLORS.green : "#F2F5EE",
        fontFamily: "'Barlow Condensed', sans-serif",
        lineHeight: 1,
      }}>
        {value}
      </div>
      {subtitle && (
        <div style={{
          fontSize: 11,
          color: highlight ? COLORS.green : COLORS.body,
          opacity: highlight ? 1 : 0.6,
          marginTop: 6,
          fontFamily: "'DM Mono', monospace",
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div style={{
      background: COLORS.bgSoft,
      border: `1px solid ${COLORS.hairline}`,
      borderRadius: 4,
      padding: 20,
    }}>
      <div style={{
        fontSize: 11,
        color: COLORS.gold,
        fontFamily: "'DM Mono', monospace",
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

function FanRow({ fan, index }) {
  const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null;
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: 10,
      background: index < 3 ? COLORS.bgCard : "transparent",
      borderRadius: 4,
      border: `1px solid ${index < 3 ? COLORS.gold + "20" : "transparent"}`,
    }}>
      <div style={{
        minWidth: 32,
        textAlign: "center",
        fontSize: medal ? 18 : 13,
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 900,
        color: index < 3 ? COLORS.gold : COLORS.body,
        opacity: index < 3 ? 1 : 0.6,
      }}>
        {medal || `#${fan.rank}`}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          color: "#F2F5EE",
          fontSize: 13,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {fan.display_name}
        </div>
        <div style={{
          fontSize: 10,
          color: COLORS.body,
          opacity: 0.6,
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {fan.favorite_club || "No club"} · {fan.level}
        </div>
      </div>
      <div style={{
        color: COLORS.green,
        fontWeight: 500,
        fontSize: 14,
        fontFamily: "'Barlow Condensed', sans-serif",
        flexShrink: 0,
      }}>
        {Math.round(fan.total_score)} pts
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div style={{
      textAlign: "center",
      padding: "32px 20px",
      color: COLORS.body,
      opacity: 0.5,
      fontSize: 13,
    }}>
      {message}
    </div>
  );
}

const tableHeaderStyle = {
  textAlign: "left",
  padding: "12px 14px",
  fontSize: 10,
  fontFamily: "'DM Mono', monospace",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: COLORS.body,
  opacity: 0.7,
  fontWeight: 500,
};

const tableCellStyle = {
  padding: "12px 14px",
  color: COLORS.body,
};

function paginationButtonStyle(disabled) {
  return {
    background: "transparent",
    border: `1px solid ${COLORS.hairline}`,
    color: disabled ? COLORS.body : COLORS.green,
    opacity: disabled ? 0.3 : 1,
    fontSize: 12,
    fontFamily: "'DM Mono', monospace",
    padding: "8px 14px",
    borderRadius: 4,
    cursor: disabled ? "not-allowed" : "pointer",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  };
}

// ============================================================================
// CLUB APPLICATIONS TAB
// ============================================================================

function ClubsApplicationsTab({ token }) {
  const [applications, setApplications] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, [filterStatus]);

  async function fetchApplications() {
    setLoading(true);
    try {
      const url = filterStatus === "all"
        ? `${API_URL}/admin/clubs/applications`
        : `${API_URL}/admin/clubs/applications?status=${filterStatus}`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setApplications(data.applications || []);
      setCounts(data.counts || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function viewApplication(id) {
    try {
      const response = await fetch(`${API_URL}/admin/clubs/applications/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setSelectedApp(data.application);
    } catch (err) {
      console.error(err);
    }
  }

  async function approveApplication(id, notes = "") {
    if (!confirm("Approve this club? They will be published immediately.")) return;
    
    try {
      const response = await fetch(`${API_URL}/admin/clubs/applications/${id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes }),
      });
      
      if (!response.ok) throw new Error("Approval failed");
      const data = await response.json();
      
      alert(`✅ Approved! Club is now live at: ${data.club.public_url}`);
      setSelectedApp(null);
      fetchApplications();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  async function rejectApplication(id, notes) {
    const reason = notes || prompt("Reason for rejection (will be visible internally):");
    if (!reason) return;
    
    try {
      const response = await fetch(`${API_URL}/admin/clubs/applications/${id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: reason }),
      });
      
      if (!response.ok) throw new Error("Rejection failed");
      
      alert("Application rejected");
      setSelectedApp(null);
      fetchApplications();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  function timeAgo(dateStr) {
    const date = new Date(dateStr);
    const diff = (new Date() - date) / 1000;
    if (diff < 60) return `${Math.round(diff)}s ago`;
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
    return `${Math.round(diff / 86400)}d ago`;
  }

  function statusColor(status) {
    const map = {
      pending: COLORS.body,
      ai_reviewing: COLORS.gold,
      needs_human_review: COLORS.gold,
      approved: COLORS.green,
      rejected: COLORS.red,
    };
    return map[status] || COLORS.body;
  }

  function statusEmoji(status) {
    const map = {
      pending: "⏳",
      ai_reviewing: "🤖",
      needs_human_review: "⚠️",
      approved: "✅",
      rejected: "❌",
    };
    return map[status] || "❓";
  }

  // Detail modal
  if (selectedApp) {
    return (
      <ApplicationDetail
        application={selectedApp}
        onClose={() => setSelectedApp(null)}
        onApprove={() => approveApplication(selectedApp._id)}
        onReject={(notes) => rejectApplication(selectedApp._id, notes)}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        gap: 12,
        flexWrap: "wrap",
      }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 28,
          fontWeight: 900,
          color: "#F2F5EE",
          margin: 0,
        }}>
          Club Applications
        </h2>
      </div>

      {/* Filter pills */}
      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 24,
        flexWrap: "wrap",
      }}>
        {[
          { id: "all", label: "All", count: Object.values(counts).reduce((s, n) => s + n, 0) },
          { id: "needs_human_review", label: "Needs Review", count: counts.needs_human_review || 0 },
          { id: "approved", label: "Approved", count: counts.approved || 0 },
          { id: "rejected", label: "Rejected", count: counts.rejected || 0 },
          { id: "ai_reviewing", label: "AI Reviewing", count: counts.ai_reviewing || 0 },
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setFilterStatus(filter.id)}
            style={{
              padding: "10px 14px",
              background: filterStatus === filter.id ? COLORS.greenGlow : "transparent",
              border: `1px solid ${filterStatus === filter.id ? COLORS.green : COLORS.hairline}`,
              color: filterStatus === filter.id ? COLORS.green : COLORS.body,
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
              borderRadius: 100,
              cursor: "pointer",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              transition: "all 0.2s",
            }}
          >
            {filter.label} {filter.count > 0 && <span style={{ opacity: 0.7 }}>({filter.count})</span>}
          </button>
        ))}
      </div>

      {/* Applications list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}
        </div>
      ) : applications.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: 60,
          background: COLORS.bgSoft,
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 4,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>📭</div>
          <div style={{ color: COLORS.body, fontSize: 14 }}>No applications in this category yet.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {applications.map(app => (
            <div
              key={app.id}
              onClick={() => viewApplication(app.id)}
              style={{
                background: COLORS.bgSoft,
                border: `1px solid ${COLORS.hairline}`,
                borderRadius: 4,
                padding: 20,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                gap: 16,
                alignItems: "center",
                flexWrap: "wrap",
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
              <div style={{ fontSize: 24 }}>{statusEmoji(app.status)}</div>
              
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{
                  fontSize: 16,
                  color: "#F2F5EE",
                  fontWeight: 500,
                  marginBottom: 4,
                }}>
                  {app.club_name}
                </div>
                <div style={{
                  fontSize: 11,
                  fontFamily: "'DM Mono', monospace",
                  color: COLORS.body,
                  opacity: 0.6,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}>
                  {app.country} · {app.league}
                </div>
              </div>
              
              <div style={{ minWidth: 140, textAlign: "right" }}>
                <div style={{
                  fontSize: 14,
                  color: COLORS.gold,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                }}>
                  {app.funding_currency} {app.funding_amount.toLocaleString()}
                </div>
                <div style={{
                  fontSize: 10,
                  color: COLORS.body,
                  opacity: 0.5,
                  fontFamily: "'DM Mono', monospace",
                }}>
                  REQUESTED
                </div>
              </div>
              
              <div style={{ minWidth: 120, textAlign: "right" }}>
                <div style={{
                  fontSize: 11,
                  fontFamily: "'DM Mono', monospace",
                  color: statusColor(app.status),
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}>
                  {app.status.replace(/_/g, " ")}
                </div>
                {app.ai_decision && (
                  <div style={{
                    fontSize: 10,
                    color: COLORS.body,
                    opacity: 0.5,
                    fontFamily: "'DM Mono', monospace",
                    marginTop: 4,
                  }}>
                    AI: {app.ai_decision} ({Math.round((app.ai_confidence || 0) * 100)}%)
                  </div>
                )}
                <div style={{
                  fontSize: 10,
                  color: COLORS.body,
                  opacity: 0.4,
                  fontFamily: "'DM Mono', monospace",
                  marginTop: 4,
                }}>
                  {timeAgo(app.submitted_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// APPLICATION DETAIL VIEW
// ============================================================================

function ApplicationDetail({ application, onClose, onApprove, onReject }) {
  const ai = application.ai_verification || {};
  
  return (
    <div>
      {/* Back button */}
      <button
        onClick={onClose}
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
        ← Back to list
      </button>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 36,
          fontWeight: 900,
          color: "#F2F5EE",
          margin: "0 0 8px",
        }}>
          {application.club_name}
        </h2>
        <p style={{ color: COLORS.body, opacity: 0.7, margin: 0, fontSize: 14 }}>
          {application.country} · {application.league_tier || application.league}
          {application.founded_year && ` · Founded ${application.founded_year}`}
        </p>
      </div>

      {/* AI Verification Result */}
      {ai.decision && (
        <div style={{
          background: COLORS.bgSoft,
          border: `1px solid ${ai.decision === "approved" ? COLORS.green : ai.decision === "rejected" ? COLORS.red : COLORS.gold}`,
          borderRadius: 4,
          padding: 20,
          marginBottom: 24,
        }}>
          <div style={{
            fontSize: 11,
            fontFamily: "'DM Mono', monospace",
            color: ai.decision === "approved" ? COLORS.green : ai.decision === "rejected" ? COLORS.red : COLORS.gold,
            letterSpacing: "0.2em",
            marginBottom: 12,
          }}>
            🤖 AI VERIFICATION · {ai.decision.toUpperCase()} · {Math.round((ai.confidence || 0) * 100)}% CONFIDENCE
          </div>
          
          <p style={{ color: "#F2F5EE", fontSize: 14, margin: "0 0 16px", lineHeight: 1.6 }}>
            {ai.reasoning}
          </p>
          
          {/* AI checks */}
          {ai.checks && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 8,
              marginTop: 16,
              fontSize: 12,
              fontFamily: "'DM Mono', monospace",
            }}>
              <CheckPill label="Club Exists" value={ai.checks.club_exists} />
              <CheckPill label="Email Legit" value={ai.checks.email_legitimate} />
              <CheckPill label="Ask Reasonable" value={ai.checks.ask_reasonable} />
            </div>
          )}
          
          {/* Red flags */}
          {ai.checks?.red_flags && ai.checks.red_flags.length > 0 && (
            <div style={{
              marginTop: 12,
              padding: 12,
              background: "rgba(255, 71, 87, 0.1)",
              borderRadius: 4,
              fontSize: 12,
              color: COLORS.red,
              fontFamily: "'DM Mono', monospace",
            }}>
              🚩 RED FLAGS: {ai.checks.red_flags.join(", ")}
            </div>
          )}
          
          {/* Funding context */}
          {ai.checks?.league_average_funding && (
            <div style={{
              marginTop: 12,
              fontSize: 11,
              color: COLORS.body,
              opacity: 0.7,
              fontFamily: "'DM Mono', monospace",
            }}>
              LEAGUE NORMS: AVG £{ai.checks.league_average_funding.toLocaleString()} · MAX TYPICAL £{ai.checks.league_max_typical?.toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Sections */}
      <DetailSection title="Funding Request">
        <DetailField label="Amount">
          {application.funding_currency} {application.funding_amount?.toLocaleString()}
        </DetailField>
        <DetailField label="Duration">{application.funding_duration_months} months</DetailField>
        <DetailField label="Purpose" full>
          {application.funding_purpose}
        </DetailField>
        <DetailField label="What Club Offers" full>
          {application.what_club_offers}
        </DetailField>
        <DetailField label="Why FOFA" full>
          {application.why_fofa}
        </DetailField>
      </DetailSection>

      <DetailSection title="Club Information">
        <DetailField label="Website">
          <a href={application.website} target="_blank" rel="noopener" style={{ color: COLORS.green }}>
            {application.website}
          </a>
        </DetailField>
        {application.stadium && <DetailField label="Stadium">{application.stadium}</DetailField>}
        {application.description && <DetailField label="Description" full>{application.description}</DetailField>}
      </DetailSection>

      <DetailSection title="Contact">
        <DetailField label="Name">{application.contact_name}</DetailField>
        <DetailField label="Role">{application.contact_role}</DetailField>
        <DetailField label="Email">
          <a href={`mailto:${application.contact_email}`} style={{ color: COLORS.green }}>
            {application.contact_email}
          </a>
        </DetailField>
        {application.contact_phone && <DetailField label="Phone">{application.contact_phone}</DetailField>}
      </DetailSection>

      {(application.social_twitter || application.social_instagram || application.social_facebook) && (
        <DetailSection title="Social Media">
          {application.social_twitter && <DetailField label="Twitter">{application.social_twitter}</DetailField>}
          {application.social_instagram && <DetailField label="Instagram">{application.social_instagram}</DetailField>}
          {application.social_facebook && <DetailField label="Facebook">{application.social_facebook}</DetailField>}
        </DetailSection>
      )}

      {/* Action buttons */}
      {(application.status === "needs_human_review" || application.status === "ai_reviewing") && (
        <div style={{
          marginTop: 32,
          padding: 20,
          background: COLORS.bgSoft,
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 4,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
        }}>
          <button
            onClick={onApprove}
            style={{
              flex: 1,
              minWidth: 200,
              background: COLORS.green,
              color: COLORS.bg,
              border: "none",
              padding: "14px 24px",
              fontSize: 13,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 700,
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            ✅ Approve & Publish
          </button>
          <button
            onClick={() => onReject()}
            style={{
              flex: 1,
              minWidth: 200,
              background: "transparent",
              color: COLORS.red,
              border: `1px solid ${COLORS.red}`,
              padding: "14px 24px",
              fontSize: 13,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 700,
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            ❌ Reject
          </button>
        </div>
      )}
      
      {application.status === "approved" && (
        <div style={{
          marginTop: 32,
          padding: 20,
          background: COLORS.greenGlow,
          border: `1px solid ${COLORS.green}`,
          borderRadius: 4,
          textAlign: "center",
        }}>
          <div style={{ color: COLORS.green, fontSize: 14, marginBottom: 8 }}>
            ✅ This club has been approved and is live
          </div>
          {application.approved_club_id && (
            <a
              href={`/#clubs/view`}
              style={{
                color: COLORS.green,
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              View public page →
            </a>
          )}
        </div>
      )}

      {application.status === "rejected" && (
        <div style={{
          marginTop: 32,
          padding: 20,
          background: "rgba(255, 71, 87, 0.1)",
          border: `1px solid ${COLORS.red}`,
          borderRadius: 4,
          textAlign: "center",
        }}>
          <div style={{ color: COLORS.red, fontSize: 14 }}>
            ❌ This application was rejected
            {application.human_decision?.notes && (
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8, fontStyle: "italic" }}>
                Reason: {application.human_decision.notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <div style={{
      background: COLORS.bgSoft,
      border: `1px solid ${COLORS.hairline}`,
      borderRadius: 4,
      padding: 20,
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
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 16,
      }}>
        {children}
      </div>
    </div>
  );
}

function DetailField({ label, children, full }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : "auto" }}>
      <div style={{
        fontSize: 10,
        fontFamily: "'DM Mono', monospace",
        color: COLORS.body,
        opacity: 0.6,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        marginBottom: 6,
      }}>
        {label}
      </div>
      <div style={{ color: "#F2F5EE", fontSize: 14, lineHeight: 1.5, wordBreak: "break-word" }}>
        {children}
      </div>
    </div>
  );
}

function CheckPill({ label, value }) {
  const color = value === true ? COLORS.green : value === false ? COLORS.red : COLORS.body;
  const symbol = value === true ? "✓" : value === false ? "✗" : "?";
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px",
      background: COLORS.bg,
      borderRadius: 4,
    }}>
      <span style={{ color, fontSize: 14, fontWeight: 700 }}>{symbol}</span>
      <span style={{ color: COLORS.body, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {label}
      </span>
    </div>
  );
}

// ============================================================================
// EXPERTS APPLICATIONS TAB
// ============================================================================

function ExpertsApplicationsTab({ token }) {
  const [applications, setApplications] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedApp, setSelectedApp] = useState(null);
  const [tier, setTier] = useState("authority");
  const [isFeatured, setIsFeatured] = useState(false);

  useEffect(() => { fetchApplications(); }, [filterStatus]);

  async function fetchApplications() {
    setLoading(true);
    try {
      const url = filterStatus === "all" ? `${API_URL}/admin/experts/applications` : `${API_URL}/admin/experts/applications?status=${filterStatus}`;
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      setApplications(data.applications || []);
      setCounts(data.counts || {});
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function viewApplication(id) {
    try {
      const response = await fetch(`${API_URL}/admin/experts/applications/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      setSelectedApp(data.application);
    } catch (err) { console.error(err); }
  }

  async function approveApplication(id) {
    if (!confirm(`Approve as ${tier} expert${isFeatured ? " (FEATURED)" : ""}?`)) return;
    try {
      const response = await fetch(`${API_URL}/admin/experts/applications/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ tier, is_featured: isFeatured }),
      });
      if (!response.ok) throw new Error("Approval failed");
      const data = await response.json();
      alert(`✅ Expert approved! Profile: ${data.expert.public_url}`);
      setSelectedApp(null);
      setTier("authority");
      setIsFeatured(false);
      fetchApplications();
    } catch (err) { alert(`Error: ${err.message}`); }
  }

  async function rejectApplication(id) {
    const reason = prompt("Reason for rejection:");
    if (!reason) return;
    try {
      const response = await fetch(`${API_URL}/admin/experts/applications/${id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ notes: reason }),
      });
      if (!response.ok) throw new Error("Rejection failed");
      alert("Application rejected");
      setSelectedApp(null);
      fetchApplications();
    } catch (err) { alert(`Error: ${err.message}`); }
  }

  function timeAgo(dateStr) {
    const diff = (new Date() - new Date(dateStr)) / 1000;
    if (diff < 60) return `${Math.round(diff)}s ago`;
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
    return `${Math.round(diff / 86400)}d ago`;
  }

  function statusColor(s) {
    return { pending: COLORS.body, ai_reviewing: COLORS.gold, needs_human_review: COLORS.gold, approved: COLORS.green, rejected: COLORS.red }[s] || COLORS.body;
  }

  function statusEmoji(s) {
    return { pending: "⏳", ai_reviewing: "🤖", needs_human_review: "⚠️", approved: "✅", rejected: "❌" }[s] || "❓";
  }

  function typeIcon(t) {
    return { verifier: "🛡️", voice: "📢", ambassador: "🎖️" }[t] || "🎓";
  }

  if (selectedApp) {
    const ai = selectedApp.ai_verification || {};
    return (
      <div>
        <button onClick={() => setSelectedApp(null)} style={{ background: "transparent", border: `1px solid ${COLORS.hairline}`, color: COLORS.body, padding: "8px 14px", borderRadius: 4, fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", marginBottom: 24 }}>
          ← Back to list
        </button>
        
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 36, fontWeight: 900, color: "#F2F5EE", margin: "0 0 8px" }}>
            {typeIcon(selectedApp.expert_type)} {selectedApp.full_name}
          </h2>
          <p style={{ color: COLORS.body, opacity: 0.7, margin: 0, fontSize: 14 }}>
            {selectedApp.country} · {selectedApp.expert_type.toUpperCase()}
            {selectedApp.current_role && ` · ${selectedApp.current_role}`}
          </p>
        </div>

        {ai.decision && (
          <div style={{ background: COLORS.bgSoft, border: `1px solid ${ai.decision === "approved" ? COLORS.green : ai.decision === "rejected" ? COLORS.red : COLORS.gold}`, borderRadius: 4, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: ai.decision === "approved" ? COLORS.green : ai.decision === "rejected" ? COLORS.red : COLORS.gold, letterSpacing: "0.2em", marginBottom: 12 }}>
              🤖 AI VERIFICATION · {ai.decision.toUpperCase()} · {Math.round((ai.confidence || 0) * 100)}% CONFIDENCE
            </div>
            <p style={{ color: "#F2F5EE", fontSize: 14, margin: "0 0 16px", lineHeight: 1.6 }}>{ai.reasoning}</p>
            {ai.checks?.red_flags && ai.checks.red_flags.length > 0 && (
              <div style={{ padding: 12, background: "rgba(255, 71, 87, 0.1)", borderRadius: 4, fontSize: 12, color: COLORS.red, fontFamily: "'DM Mono', monospace" }}>
                🚩 RED FLAGS: {ai.checks.red_flags.join(", ")}
              </div>
            )}
          </div>
        )}

        <DetailSection title="Background">
          <DetailField label="Full Name">{selectedApp.full_name}</DetailField>
          <DetailField label="Display Name">{selectedApp.display_name}</DetailField>
          <DetailField label="Email">{selectedApp.email}</DetailField>
          <DetailField label="Phone">{selectedApp.phone || "—"}</DetailField>
          <DetailField label="Country">{selectedApp.country}</DetailField>
          <DetailField label="Region Focus">{selectedApp.region_focus || "—"}</DetailField>
          <DetailField label="Current Role">{selectedApp.current_role || "—"}</DetailField>
          <DetailField label="Years in Football">{selectedApp.years_in_football || "—"}</DetailField>
          <DetailField label="Professional Background" full>{selectedApp.professional_background}</DetailField>
        </DetailSection>

        <DetailSection title="Affiliations & Expertise">
          <DetailField label="Clubs Supported" full>{(selectedApp.clubs_supported || []).join(", ") || "—"}</DetailField>
          <DetailField label="Expertise Areas" full>{(selectedApp.expertise_areas || []).join(", ") || "—"}</DetailField>
        </DetailSection>

        <DetailSection title="Online Presence">
          <DetailField label="Website">{selectedApp.website ? <a href={selectedApp.website} target="_blank" rel="noopener" style={{ color: COLORS.green }}>{selectedApp.website}</a> : "—"}</DetailField>
          <DetailField label="Twitter">{selectedApp.social_twitter || "—"}</DetailField>
          <DetailField label="LinkedIn">{selectedApp.social_linkedin || "—"}</DetailField>
          <DetailField label="YouTube">{selectedApp.social_youtube || "—"}</DetailField>
          <DetailField label="Followers">{selectedApp.follower_count ? selectedApp.follower_count.toLocaleString() : "—"}</DetailField>
        </DetailSection>

        <DetailSection title="Vision">
          <DetailField label="Why FOFA?" full>{selectedApp.why_fofa}</DetailField>
          <DetailField label="What They Offer" full>{selectedApp.what_they_offer}</DetailField>
          {selectedApp.references && <DetailField label="References" full>{selectedApp.references}</DetailField>}
        </DetailSection>

        {(selectedApp.status === "needs_human_review" || selectedApp.status === "ai_reviewing") && (
          <div style={{ marginTop: 32, padding: 20, background: COLORS.bgSoft, border: `1px solid ${COLORS.hairline}`, borderRadius: 4 }}>
            <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.gold, letterSpacing: "0.2em", marginBottom: 16 }}>APPROVAL OPTIONS</div>
            <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.7, letterSpacing: "0.1em", marginBottom: 6 }}>TIER</label>
                <select value={tier} onChange={e => setTier(e.target.value)} style={{ background: COLORS.bg, border: `1px solid ${COLORS.hairlineStrong}`, color: "#F2F5EE", padding: "8px 12px", borderRadius: 4 }}>
                  <option value="legend">🌟 Legend</option>
                  <option value="authority">⭐ Authority</option>
                  <option value="ambassador">🎖️ Ambassador</option>
                </select>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 22 }}>
                <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} />
                <span style={{ fontSize: 12, color: COLORS.body, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase" }}>Feature on homepage</span>
              </label>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => approveApplication(selectedApp._id)} style={{ flex: 1, minWidth: 200, background: COLORS.green, color: COLORS.bg, border: "none", padding: "14px 24px", fontSize: 13, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, borderRadius: 4, cursor: "pointer" }}>
                ✅ Approve as Expert
              </button>
              <button onClick={() => rejectApplication(selectedApp._id)} style={{ flex: 1, minWidth: 200, background: "transparent", color: COLORS.red, border: `1px solid ${COLORS.red}`, padding: "14px 24px", fontSize: 13, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, borderRadius: 4, cursor: "pointer" }}>
                ❌ Reject
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 28, fontWeight: 900, color: "#F2F5EE", margin: "0 0 24px" }}>
        Expert Applications
      </h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { id: "all", label: "All", count: Object.values(counts).reduce((s, n) => s + n, 0) },
          { id: "needs_human_review", label: "Needs Review", count: counts.needs_human_review || 0 },
          { id: "approved", label: "Approved", count: counts.approved || 0 },
          { id: "rejected", label: "Rejected", count: counts.rejected || 0 },
        ].map(filter => (
          <button key={filter.id} onClick={() => setFilterStatus(filter.id)}
            style={{ padding: "10px 14px", background: filterStatus === filter.id ? COLORS.greenGlow : "transparent", border: `1px solid ${filterStatus === filter.id ? COLORS.green : COLORS.hairline}`, color: filterStatus === filter.id ? COLORS.green : COLORS.body, fontSize: 11, fontFamily: "'DM Mono', monospace", borderRadius: 100, cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {filter.label} {filter.count > 0 && <span style={{ opacity: 0.7 }}>({filter.count})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}
        </div>
      ) : applications.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: COLORS.bgSoft, border: `1px solid ${COLORS.hairline}`, borderRadius: 4 }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>🎓</div>
          <div style={{ color: COLORS.body, fontSize: 14 }}>No expert applications yet.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {applications.map(app => (
            <div key={app.id} onClick={() => viewApplication(app.id)}
              style={{ background: COLORS.bgSoft, border: `1px solid ${COLORS.hairline}`, borderRadius: 4, padding: 20, cursor: "pointer", transition: "all 0.2s", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.green; e.currentTarget.style.background = COLORS.bgCard; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.hairline; e.currentTarget.style.background = COLORS.bgSoft; }}>
              <div style={{ fontSize: 24 }}>{statusEmoji(app.status)}</div>
              <div style={{ fontSize: 28 }}>{typeIcon(app.expert_type)}</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 16, color: "#F2F5EE", fontWeight: 500, marginBottom: 4 }}>{app.full_name}</div>
                <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: COLORS.body, opacity: 0.6, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {app.expert_type} · {app.country}
                  {app.current_role && ` · ${app.current_role}`}
                </div>
              </div>
              <div style={{ minWidth: 120, textAlign: "right" }}>
                <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: statusColor(app.status), letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700 }}>
                  {app.status.replace(/_/g, " ")}
                </div>
                <div style={{ fontSize: 10, color: COLORS.body, opacity: 0.4, fontFamily: "'DM Mono', monospace", marginTop: 4 }}>
                  {timeAgo(app.submitted_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
