import React, { useState } from "react";

// ============================================================================
// FOFA CLUB APPLICATION FORM
// Public-facing form for clubs to apply to join the platform
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
  hairline: "rgba(200, 212, 192, 0.08)",
  hairlineStrong: "rgba(200, 212, 192, 0.15)",
};

const API_URL = import.meta.env.VITE_API_URL || "https://fofa-xi.vercel.app/api";

const LEAGUE_TIERS = [
  "Premier League", "Championship", "League One", "League Two",
  "National League", "Non-League",
  "Bundesliga", "2. Bundesliga",
  "La Liga", "Segunda División",
  "Serie A", "Serie B",
  "Ligue 1",
  "MLS",
  "Other",
];

export default function ClubApplyForm() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const [data, setData] = useState({
    club_name: "",
    country: "",
    league: "",
    league_tier: "",
    founded_year: "",
    stadium: "",
    website: "",
    description: "",
    contact_name: "",
    contact_email: "",
    contact_role: "",
    contact_phone: "",
    social_twitter: "",
    social_instagram: "",
    social_facebook: "",
    funding_amount: "",
    funding_currency: "GBP",
    funding_purpose: "",
    funding_duration_months: 12,
    what_club_offers: "",
    why_fofa: "",
  });
  
  function update(field, value) {
    setData(d => ({ ...d, [field]: value }));
  }
  
  function validateStep(stepNum) {
    if (stepNum === 1) {
      return data.club_name && data.country && data.league && data.league_tier && data.website;
    }
    if (stepNum === 2) {
      return data.contact_name && data.contact_email && data.contact_role &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact_email);
    }
    if (stepNum === 3) {
      return data.funding_amount && parseFloat(data.funding_amount) > 0 &&
        data.funding_purpose && data.what_club_offers && data.why_fofa;
    }
    return true;
  }
  
  async function submit() {
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/clubs/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          funding_amount: parseFloat(data.funding_amount),
          founded_year: data.founded_year ? parseInt(data.founded_year) : null,
        }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || "Submission failed");
      }
      
      setResult(responseData);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
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
      
      {/* Header */}
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
            FOR CLUBS
          </div>
        </a>
        <a href="/" style={{
          color: COLORS.body,
          opacity: 0.7,
          fontSize: 11,
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          textDecoration: "none",
        }}>
          ← Back
        </a>
      </div>
      
      <div style={{ padding: "0 20px 80px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          
          {/* Title */}
          <div style={{ textAlign: "center", padding: "60px 0 32px" }}>
            <div style={{
              fontSize: 11,
              fontFamily: "'DM Mono', monospace",
              color: COLORS.gold,
              letterSpacing: "0.25em",
              marginBottom: 16,
            }}>
              — CLUB APPLICATION
            </div>
            <h1 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "clamp(36px, 7vw, 64px)",
              fontWeight: 900,
              color: "#F2F5EE",
              margin: "0 0 16px",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}>
              Join <span style={{ color: COLORS.green }}>FOFA</span>
            </h1>
            <p style={{
              color: COLORS.body,
              opacity: 0.7,
              maxWidth: 520,
              margin: "0 auto",
              fontSize: 16,
              lineHeight: 1.6,
            }}>
              Connect directly with your most loyal supporters. Run fan-funded campaigns.
              Build a deeper community through verified engagement.
            </p>
          </div>
          
          {/* Result View */}
          {result && (
            <ResultView result={result} />
          )}
          
          {/* Form */}
          {!result && (
            <>
              {/* Progress */}
              <ProgressBar step={step} totalSteps={3} />
              
              {/* Error */}
              {error && (
                <div style={{
                  background: "rgba(255, 71, 87, 0.1)",
                  border: `1px solid ${COLORS.red}`,
                  color: COLORS.red,
                  padding: 16,
                  borderRadius: 4,
                  marginBottom: 24,
                  fontSize: 14,
                }}>
                  {error}
                </div>
              )}
              
              {/* Step 1: Club Info */}
              {step === 1 && (
                <FormStep
                  title="Club Information"
                  subtitle="Tell us about your club"
                  onNext={() => validateStep(1) && setStep(2)}
                  canProgress={validateStep(1)}
                >
                  <Field label="Club Name *" hint="Official registered name">
                    <Input value={data.club_name} onChange={v => update("club_name", v)} placeholder="e.g., Stocksbridge Park Steels" />
                  </Field>
                  
                  <Row>
                    <Field label="Country *">
                      <Input value={data.country} onChange={v => update("country", v)} placeholder="e.g., England" />
                    </Field>
                    <Field label="Founded Year">
                      <Input type="number" value={data.founded_year} onChange={v => update("founded_year", v)} placeholder="e.g., 1986" />
                    </Field>
                  </Row>
                  
                  <Row>
                    <Field label="League *">
                      <Input value={data.league} onChange={v => update("league", v)} placeholder="e.g., Northern Premier League" />
                    </Field>
                    <Field label="League Tier *" hint="Closest equivalent">
                      <Select value={data.league_tier} onChange={v => update("league_tier", v)}>
                        <option value="">Select tier...</option>
                        {LEAGUE_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                      </Select>
                    </Field>
                  </Row>
                  
                  <Field label="Stadium / Home Ground">
                    <Input value={data.stadium} onChange={v => update("stadium", v)} placeholder="e.g., Bracken Moor" />
                  </Field>
                  
                  <Field label="Official Website *" hint="Must be your verified club website">
                    <Input type="url" value={data.website} onChange={v => update("website", v)} placeholder="https://www.yourclub.com" />
                  </Field>
                  
                  <Field label="Brief Club Description">
                    <Textarea value={data.description} onChange={v => update("description", v)} placeholder="Tell us about your club, history, community..." rows={3} />
                  </Field>
                </FormStep>
              )}
              
              {/* Step 2: Contact + Social */}
              {step === 2 && (
                <FormStep
                  title="Contact & Social"
                  subtitle="Who should we talk to?"
                  onPrev={() => setStep(1)}
                  onNext={() => validateStep(2) && setStep(3)}
                  canProgress={validateStep(2)}
                >
                  <Row>
                    <Field label="Your Name *">
                      <Input value={data.contact_name} onChange={v => update("contact_name", v)} placeholder="John Smith" />
                    </Field>
                    <Field label="Your Role *">
                      <Input value={data.contact_role} onChange={v => update("contact_role", v)} placeholder="e.g., Marketing Director" />
                    </Field>
                  </Row>
                  
                  <Field label="Email *" hint="Should match your club's domain (e.g., john@yourclub.com)">
                    <Input type="email" value={data.contact_email} onChange={v => update("contact_email", v)} placeholder="you@yourclub.com" />
                  </Field>
                  
                  <Field label="Phone">
                    <Input type="tel" value={data.contact_phone} onChange={v => update("contact_phone", v)} placeholder="+44 ..." />
                  </Field>
                  
                  <div style={{
                    marginTop: 32,
                    paddingTop: 24,
                    borderTop: `1px solid ${COLORS.hairline}`,
                  }}>
                    <div style={{
                      fontSize: 11,
                      fontFamily: "'DM Mono', monospace",
                      color: COLORS.gold,
                      letterSpacing: "0.2em",
                      marginBottom: 16,
                    }}>
                      SOCIAL MEDIA (OPTIONAL)
                    </div>
                    
                    <Field label="Twitter / X">
                      <Input value={data.social_twitter} onChange={v => update("social_twitter", v)} placeholder="@yourclub or full URL" />
                    </Field>
                    <Field label="Instagram">
                      <Input value={data.social_instagram} onChange={v => update("social_instagram", v)} placeholder="@yourclub or full URL" />
                    </Field>
                    <Field label="Facebook">
                      <Input value={data.social_facebook} onChange={v => update("social_facebook", v)} placeholder="Facebook page URL" />
                    </Field>
                  </div>
                </FormStep>
              )}
              
              {/* Step 3: The Ask */}
              {step === 3 && (
                <FormStep
                  title="Your Funding Request"
                  subtitle="What are you raising for, and why?"
                  onPrev={() => setStep(2)}
                  onSubmit={submit}
                  canProgress={validateStep(3)}
                  submitting={submitting}
                  isFinal={true}
                >
                  <Row>
                    <Field label="Currency" style={{ maxWidth: 120 }}>
                      <Select value={data.funding_currency} onChange={v => update("funding_currency", v)}>
                        <option value="GBP">GBP £</option>
                        <option value="USD">USD $</option>
                        <option value="EUR">EUR €</option>
                      </Select>
                    </Field>
                    <Field label="Funding Amount *" hint="For the season">
                      <Input type="number" value={data.funding_amount} onChange={v => update("funding_amount", v)} placeholder="e.g., 50000" />
                    </Field>
                  </Row>
                  
                  <Field label="Duration (months)" hint="How long is the partnership?">
                    <Input type="number" value={data.funding_duration_months} onChange={v => update("funding_duration_months", v)} placeholder="12" />
                  </Field>
                  
                  <Field label="What is the funding for? *" hint="Be specific. What will the money be used for?">
                    <Textarea value={data.funding_purpose} onChange={v => update("funding_purpose", v)} placeholder="e.g., New training equipment, youth academy expansion, stadium repairs..." rows={3} />
                  </Field>
                  
                  <Field label="What does your club offer in return? *" hint="Recognition, content, events, perks...">
                    <Textarea value={data.what_club_offers} onChange={v => update("what_club_offers", v)} placeholder="e.g., Sponsor mentions on jersey, social media features, VIP match-day experiences for top supporters..." rows={3} />
                  </Field>
                  
                  <Field label="Why FOFA? *" hint="Why is this platform a good fit for your club?">
                    <Textarea value={data.why_fofa} onChange={v => update("why_fofa", v)} placeholder="e.g., We want to engage our digital fans, build a global community, reward our most loyal supporters..." rows={3} />
                  </Field>
                  
                  <div style={{
                    marginTop: 24,
                    padding: 16,
                    background: COLORS.bgSoft,
                    border: `1px solid ${COLORS.hairline}`,
                    borderRadius: 4,
                    fontSize: 13,
                    color: COLORS.body,
                    opacity: 0.8,
                    lineHeight: 1.6,
                  }}>
                    <div style={{
                      fontSize: 10,
                      fontFamily: "'DM Mono', monospace",
                      color: COLORS.gold,
                      letterSpacing: "0.2em",
                      marginBottom: 8,
                    }}>
                      ⚡ AI VERIFICATION
                    </div>
                    Your application will be automatically reviewed by our AI agent which checks club authenticity, verifies your funding ask against league norms, and detects red flags. Decisions are typically returned within minutes.
                  </div>
                </FormStep>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTS
// ============================================================================

function ProgressBar({ step, totalSteps }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 8,
      }}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: i < step ? COLORS.green : COLORS.hairline,
              transition: "background 0.3s",
            }}
          />
        ))}
      </div>
      <div style={{
        fontSize: 11,
        fontFamily: "'DM Mono', monospace",
        color: COLORS.body,
        opacity: 0.6,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
      }}>
        Step {step} of {totalSteps}
      </div>
    </div>
  );
}

function FormStep({ title, subtitle, children, onPrev, onNext, onSubmit, canProgress, submitting, isFinal }) {
  return (
    <div style={{
      background: COLORS.bgSoft,
      border: `1px solid ${COLORS.hairline}`,
      borderRadius: 8,
      padding: "32px 24px",
      opacity: 0,
      animation: "fadeIn 0.3s ease-out forwards",
    }}>
      <h2 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 28,
        fontWeight: 900,
        color: "#F2F5EE",
        margin: "0 0 4px",
        letterSpacing: "-0.01em",
      }}>
        {title}
      </h2>
      <p style={{
        color: COLORS.body,
        opacity: 0.7,
        fontSize: 14,
        margin: "0 0 28px",
      }}>
        {subtitle}
      </p>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {children}
      </div>
      
      <div style={{
        marginTop: 32,
        paddingTop: 24,
        borderTop: `1px solid ${COLORS.hairline}`,
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
      }}>
        {onPrev ? (
          <button onClick={onPrev} style={btnGhost}>
            ← Back
          </button>
        ) : <div />}
        
        {isFinal ? (
          <button
            onClick={onSubmit}
            disabled={!canProgress || submitting}
            style={{ ...btnPrimary, opacity: (!canProgress || submitting) ? 0.5 : 1, cursor: (!canProgress || submitting) ? "not-allowed" : "pointer" }}
          >
            {submitting ? "Submitting..." : "Submit Application →"}
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={!canProgress}
            style={{ ...btnPrimary, opacity: !canProgress ? 0.5 : 1, cursor: !canProgress ? "not-allowed" : "pointer" }}
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}

function ResultView({ result }) {
  const isApproved = result.ai_decision === "approved";
  const isRejected = result.status === "rejected";
  const needsReview = result.status === "needs_human_review";
  
  return (
    <div style={{
      background: COLORS.bgSoft,
      border: `1px solid ${isApproved ? COLORS.green : isRejected ? COLORS.red : COLORS.gold}`,
      borderRadius: 8,
      padding: 40,
      textAlign: "center",
      opacity: 0,
      animation: "fadeIn 0.4s ease-out forwards",
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>
        {isApproved ? "✅" : isRejected ? "❌" : "⏳"}
      </div>
      <h2 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 32,
        fontWeight: 900,
        color: isApproved ? COLORS.green : isRejected ? COLORS.red : COLORS.gold,
        margin: "0 0 16px",
      }}>
        {isApproved ? "Looking Good!" : isRejected ? "Application Not Approved" : "Under Review"}
      </h2>
      <p style={{
        color: COLORS.body,
        fontSize: 16,
        lineHeight: 1.6,
        margin: "0 auto 24px",
        maxWidth: 480,
      }}>
        {result.ai_response || result.next_steps}
      </p>
      
      <div style={{
        background: COLORS.bg,
        border: `1px solid ${COLORS.hairline}`,
        borderRadius: 4,
        padding: 16,
        marginBottom: 24,
        fontFamily: "'DM Mono', monospace",
        fontSize: 12,
        color: COLORS.body,
        textAlign: "left",
      }}>
        <div style={{ marginBottom: 4 }}>
          <span style={{ opacity: 0.6 }}>APPLICATION ID:</span> {result.application_id}
        </div>
        <div style={{ marginBottom: 4 }}>
          <span style={{ opacity: 0.6 }}>STATUS:</span> <span style={{ color: COLORS.gold }}>{result.status.toUpperCase()}</span>
        </div>
        {result.ai_decision && (
          <div>
            <span style={{ opacity: 0.6 }}>AI DECISION:</span> <span style={{ color: isApproved ? COLORS.green : isRejected ? COLORS.red : COLORS.gold }}>{result.ai_decision.toUpperCase()}</span>
          </div>
        )}
      </div>
      
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <a href="/" style={btnPrimary}>
          Back to Site
        </a>
        {isRejected && (
          <a href="/#clubs/apply" onClick={() => window.location.reload()} style={btnGhost}>
            Try Again
          </a>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children, style = {} }) {
  return (
    <div style={style}>
      <label style={{
        display: "block",
        fontSize: 12,
        fontFamily: "'DM Mono', monospace",
        color: COLORS.body,
        opacity: 0.85,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginBottom: 6,
      }}>
        {label}
      </label>
      {children}
      {hint && (
        <div style={{
          fontSize: 11,
          color: COLORS.body,
          opacity: 0.5,
          marginTop: 4,
          fontStyle: "italic",
        }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function Row({ children }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16,
    }} className="form-row">
      <style>{`
        @media (max-width: 600px) {
          .form-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={inputStyle}
      onFocus={(e) => e.target.style.borderColor = COLORS.green}
      onBlur={(e) => e.target.style.borderColor = COLORS.hairlineStrong}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
      onFocus={(e) => e.target.style.borderColor = COLORS.green}
      onBlur={(e) => e.target.style.borderColor = COLORS.hairlineStrong}
    />
  );
}

function Select({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...inputStyle, cursor: "pointer" }}
      onFocus={(e) => e.target.style.borderColor = COLORS.green}
      onBlur={(e) => e.target.style.borderColor = COLORS.hairlineStrong}
    >
      {children}
    </select>
  );
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
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};

const btnPrimary = {
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
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
  transition: "all 0.2s",
};

const btnGhost = {
  background: "transparent",
  color: COLORS.body,
  border: `1px solid ${COLORS.hairlineStrong}`,
  padding: "14px 28px",
  fontSize: 13,
  fontFamily: "'DM Mono', monospace",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  borderRadius: 4,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
  transition: "all 0.2s",
};

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
