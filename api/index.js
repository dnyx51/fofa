// ============================================================================
// FOFA API - DEBUG VERSION (shows MongoDB connection errors)
// ============================================================================

import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import mongoose from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET || "fofa-prod-secret-key-change-this";
const MONGODB_URI = process.env.MONGODB_URI;

let cachedConnection = null;
let lastError = null;

async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  if (!MONGODB_URI) {
    lastError = "MONGODB_URI environment variable is NOT SET";
    throw new Error(lastError);
  }

  try {
    cachedConnection = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    lastError = null;
    return cachedConnection;
  } catch (err) {
    lastError = `${err.name}: ${err.message}`;
    throw err;
  }
}

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  display_name: { type: String, required: true },
  favorite_club: { type: String, default: "" },
  bio: { type: String, default: "" },
  profile_pic: { type: String, default: null },
  total_score: { type: Number, default: 0, index: true },
  engagement_score: { type: Number, default: 0 },
  passion_score: { type: Number, default: 0 },
  knowledge_score: { type: Number, default: 0 },
  consistency_score: { type: Number, default: 0 },
  community_score: { type: Number, default: 0 },
  growth_score: { type: Number, default: 0 },
  level: { type: String, default: "apprentice" },
  // Referral system
  referral_code: { type: String, unique: true, sparse: true, index: true },
  referred_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  referral_count: { type: Number, default: 0, index: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const activitySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  activity_type: { type: String, required: true },
  description: { type: String, default: "" },
  points: { type: Number, required: true },
  created_at: { type: Date, default: Date.now, index: true },
});

// ============================================================================
// CLUB APPLICATION SCHEMA
// ============================================================================

const clubApplicationSchema = new mongoose.Schema({
  // Submitter (the user who applied on behalf of club)
  submitted_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  
  // Club basic info
  club_name: { type: String, required: true, trim: true },
  country: { type: String, required: true },
  league: { type: String, required: true },
  league_tier: { type: String }, // e.g., "Premier League", "Championship", "League One"
  founded_year: { type: Number },
  stadium: { type: String },
  website: { type: String, required: true },
  description: { type: String },
  
  // Contact details
  contact_name: { type: String, required: true },
  contact_email: { type: String, required: true },
  contact_role: { type: String, required: true },
  contact_phone: { type: String },
  
  // Social media
  social_twitter: { type: String },
  social_instagram: { type: String },
  social_facebook: { type: String },
  
  // The funding ask
  funding_amount: { type: Number, required: true },
  funding_currency: { type: String, default: "GBP", enum: ["GBP", "USD", "EUR"] },
  funding_purpose: { type: String, required: true },
  funding_duration_months: { type: Number, default: 12 },
  what_club_offers: { type: String, required: true },
  why_fofa: { type: String, required: true },
  
  // Verification status
  status: {
    type: String,
    enum: ["pending", "ai_reviewing", "needs_human_review", "approved", "rejected"],
    default: "pending",
    index: true,
  },
  
  // AI verification result
  ai_verification: {
    decision: { type: String, enum: ["approved", "needs_review", "rejected", null], default: null },
    confidence: { type: Number, min: 0, max: 1, default: null },
    reasoning: { type: String, default: "" },
    checks: {
      club_exists: { type: Boolean, default: null },
      email_legitimate: { type: Boolean, default: null },
      ask_reasonable: { type: Boolean, default: null },
      red_flags: { type: [String], default: [] },
      league_average_funding: { type: Number, default: null },
      league_max_typical: { type: Number, default: null },
    },
    response_to_club: { type: String, default: "" },
    verified_at: { type: Date, default: null },
    raw_response: { type: String, default: "" },
  },
  
  // Human review
  human_decision: {
    decided_by_email: { type: String, default: null },
    decided_at: { type: Date, default: null },
    decision: { type: String, enum: ["approved", "rejected", null], default: null },
    notes: { type: String, default: "" },
  },
  
  // Approval result (if approved)
  approved_club_id: { type: mongoose.Schema.Types.ObjectId, ref: "Club", default: null },
  
  submitted_at: { type: Date, default: Date.now, index: true },
  updated_at: { type: Date, default: Date.now },
});

// ============================================================================
// CLUB SCHEMA (approved clubs only - public-facing)
// ============================================================================

const clubSchema = new mongoose.Schema({
  application_id: { type: mongoose.Schema.Types.ObjectId, ref: "ClubApplication", required: true, unique: true },
  
  // Public profile
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  country: { type: String, required: true },
  league: { type: String, required: true },
  league_tier: { type: String },
  founded_year: { type: Number },
  stadium: { type: String },
  website: { type: String },
  description: { type: String },
  
  // Branding
  logo_url: { type: String, default: null },
  primary_color: { type: String, default: null },
  secondary_color: { type: String, default: null },
  
  // Social
  social_twitter: { type: String },
  social_instagram: { type: String },
  social_facebook: { type: String },
  
  // Stats (denormalized for performance)
  fan_count: { type: Number, default: 0, index: true },
  total_loyalty_score: { type: Number, default: 0, index: true },
  
  // Status
  status: {
    type: String,
    enum: ["active", "paused", "inactive"],
    default: "active",
    index: true,
  },
  
  // Admins (users who can manage this club)
  admin_user_ids: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  
  approved_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// ============================================================================
// EXPERT APPLICATION SCHEMA
// ============================================================================

const expertApplicationSchema = new mongoose.Schema({
  // Submitter (optional - if logged in)
  submitted_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  
  // Personal info
  full_name: { type: String, required: true, trim: true },
  display_name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String },
  country: { type: String, required: true },
  
  // Role they're applying for
  expert_type: {
    type: String,
    enum: ["verifier", "voice", "ambassador"],
    required: true,
  },
  
  // Their connection to football
  professional_background: { type: String, required: true }, // "Ex-PGMOL referee, 20 years"
  current_role: { type: String }, // "Sky Sports pundit"
  years_in_football: { type: Number },
  
  // Specialty / focus
  clubs_supported: { type: [String], default: [] }, // Clubs they support/follow
  expertise_areas: { type: [String], default: [] }, // ["Refereeing", "Tactics", "Youth Development"]
  region_focus: { type: String }, // "England" or "Europe" or "Global"
  
  // Their public presence
  website: { type: String },
  social_twitter: { type: String },
  social_instagram: { type: String },
  social_linkedin: { type: String },
  social_youtube: { type: String },
  follower_count: { type: Number, default: 0 },
  
  // Why FOFA / what they offer
  why_fofa: { type: String, required: true },
  what_they_offer: { type: String, required: true },
  references: { type: String }, // "Recommended by John Smith at FA"
  
  // Verification
  status: {
    type: String,
    enum: ["pending", "ai_reviewing", "needs_human_review", "approved", "rejected"],
    default: "pending",
    index: true,
  },
  
  // AI verification result
  ai_verification: {
    decision: { type: String, enum: ["approved", "needs_review", "rejected", null], default: null },
    confidence: { type: Number, min: 0, max: 1, default: null },
    reasoning: { type: String, default: "" },
    checks: {
      identity_verified: { type: Boolean, default: null },
      credentials_legitimate: { type: Boolean, default: null },
      online_presence_verified: { type: Boolean, default: null },
      red_flags: { type: [String], default: [] },
    },
    response_to_applicant: { type: String, default: "" },
    verified_at: { type: Date, default: null },
    raw_response: { type: String, default: "" },
  },
  
  // Human review
  human_decision: {
    decided_by_email: { type: String, default: null },
    decided_at: { type: Date, default: null },
    decision: { type: String, enum: ["approved", "rejected", null], default: null },
    notes: { type: String, default: "" },
  },
  
  approved_expert_id: { type: mongoose.Schema.Types.ObjectId, ref: "Expert", default: null },
  
  submitted_at: { type: Date, default: Date.now, index: true },
  updated_at: { type: Date, default: Date.now },
});

// ============================================================================
// EXPERT SCHEMA (approved experts - public profiles)
// ============================================================================

const expertSchema = new mongoose.Schema({
  application_id: { type: mongoose.Schema.Types.ObjectId, ref: "ExpertApplication", required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // If they have a fan account
  
  // Public profile
  full_name: { type: String, required: true },
  display_name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  
  // Role
  expert_type: {
    type: String,
    enum: ["verifier", "voice", "ambassador"],
    required: true,
    index: true,
  },
  tier: {
    type: String,
    enum: ["legend", "authority", "ambassador"],
    default: "authority",
  },
  
  // Background
  professional_background: { type: String },
  current_role: { type: String },
  bio: { type: String },
  country: { type: String },
  region_focus: { type: String },
  
  // Affiliations
  clubs_supported: { type: [String], default: [] },
  affiliated_club_slugs: { type: [String], default: [] }, // For ambassadors
  expertise_areas: { type: [String], default: [] },
  
  // Branding
  profile_pic: { type: String, default: null },
  cover_image: { type: String, default: null },
  
  // Online presence
  website: { type: String },
  social_twitter: { type: String },
  social_instagram: { type: String },
  social_linkedin: { type: String },
  social_youtube: { type: String },
  follower_count: { type: Number, default: 0 },
  
  // Activity stats
  endorsement_count: { type: Number, default: 0, index: true },
  fans_referred: { type: Number, default: 0 },
  contribution_score: { type: Number, default: 0, index: true },
  
  // Status
  status: {
    type: String,
    enum: ["active", "paused", "inactive"],
    default: "active",
    index: true,
  },
  is_featured: { type: Boolean, default: false, index: true },
  
  approved_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// ============================================================================
// ENDORSEMENT SCHEMA (experts endorsing clubs)
// ============================================================================

const endorsementSchema = new mongoose.Schema({
  expert_id: { type: mongoose.Schema.Types.ObjectId, ref: "Expert", required: true, index: true },
  club_id: { type: mongoose.Schema.Types.ObjectId, ref: "Club", default: null },
  club_application_id: { type: mongoose.Schema.Types.ObjectId, ref: "ClubApplication", default: null },
  
  endorsement_text: { type: String, required: true },
  is_public: { type: Boolean, default: true },
  
  created_at: { type: Date, default: Date.now, index: true },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Activity = mongoose.models.Activity || mongoose.model("Activity", activitySchema);
const ClubApplication = mongoose.models.ClubApplication || mongoose.model("ClubApplication", clubApplicationSchema);
const Club = mongoose.models.Club || mongoose.model("Club", clubSchema);
const ExpertApplication = mongoose.models.ExpertApplication || mongoose.model("ExpertApplication", expertApplicationSchema);
const Expert = mongoose.models.Expert || mongoose.model("Expert", expertSchema);
const Endorsement = mongoose.models.Endorsement || mongoose.model("Endorsement", endorsementSchema);

// ============================================================================
// ARTICLE SCHEMA (Voice publishing - experts write content)
// ============================================================================

const articleSchema = new mongoose.Schema({
  expert_id: { type: mongoose.Schema.Types.ObjectId, ref: "Expert", required: true, index: true },

  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  content: { type: String, required: true },
  summary: { type: String, default: "" },
  tags: { type: [String], default: [] },

  // Linked clubs (optional)
  club_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Club" }],

  status: {
    type: String,
    enum: ["draft", "published"],
    default: "draft",
    index: true,
  },

  views: { type: Number, default: 0 },
  published_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const Article = mongoose.models.Article || mongoose.model("Article", articleSchema);

// ============================================================================
// REPORT SCHEMA (Ambassador moderation - community reporting)
// ============================================================================

const reportSchema = new mongoose.Schema({
  reporter_expert_id: { type: mongoose.Schema.Types.ObjectId, ref: "Expert", required: true, index: true },

  target_type: {
    type: String,
    enum: ["activity", "user", "endorsement", "article", "club"],
    required: true,
  },
  target_id: { type: String, required: true },
  target_name: { type: String, default: "" }, // Display name for reference

  reason: { type: String, required: true },
  details: { type: String, default: "" },

  status: {
    type: String,
    enum: ["pending", "reviewing", "resolved", "dismissed"],
    default: "pending",
    index: true,
  },

  resolved_by: { type: String, default: null }, // Admin email
  resolution_note: { type: String, default: "" },
  resolved_at: { type: Date, default: null },

  created_at: { type: Date, default: Date.now, index: true },
});

const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);

function calculateLevel(totalScore) {
  if (totalScore >= 5000) return "legend";
  if (totalScore >= 3000) return "master";
  if (totalScore >= 1500) return "veteran";
  if (totalScore >= 500) return "devotee";
  if (totalScore >= 100) return "supporter";
  return "apprentice";
}

function generateReferralCode(username) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No confusing chars (0/O, 1/I, etc.)
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  const cleanUsername = username.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  return `FOFA-${cleanUsername}-${code}`;
}

async function ensureUniqueReferralCode(username) {
  for (let i = 0; i < 5; i++) {
    const code = generateReferralCode(username);
    const exists = await User.findOne({ referral_code: code });
    if (!exists) return code;
  }
  // Fallback: use timestamp
  return `FOFA-${username.toUpperCase().slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`;
}

// ============================================================================
// AI VERIFICATION (MOCK - replace with real Anthropic API later)
// ============================================================================

// League funding norms (in GBP per season). Used by mock AI.
// Replace with real benchmarks or have AI fetch them.
const LEAGUE_FUNDING_NORMS = {
  "Premier League": { avg: 5000000, max_typical: 50000000 },
  "Championship": { avg: 1500000, max_typical: 10000000 },
  "League One": { avg: 500000, max_typical: 3000000 },
  "League Two": { avg: 200000, max_typical: 1000000 },
  "National League": { avg: 100000, max_typical: 500000 },
  "Non-League": { avg: 25000, max_typical: 200000 },
  // German
  "Bundesliga": { avg: 5000000, max_typical: 50000000 },
  "2. Bundesliga": { avg: 1500000, max_typical: 10000000 },
  // Spanish
  "La Liga": { avg: 5000000, max_typical: 50000000 },
  "Segunda División": { avg: 1500000, max_typical: 10000000 },
  // Italian
  "Serie A": { avg: 5000000, max_typical: 50000000 },
  "Serie B": { avg: 1500000, max_typical: 10000000 },
  // French
  "Ligue 1": { avg: 5000000, max_typical: 50000000 },
  // MLS / Other
  "MLS": { avg: 3000000, max_typical: 25000000 },
  // Default for unknown leagues
  "Other": { avg: 250000, max_typical: 2000000 },
};

function getLeagueNorms(leagueTier) {
  return LEAGUE_FUNDING_NORMS[leagueTier] || LEAGUE_FUNDING_NORMS["Other"];
}

/**
 * MOCK AI VERIFICATION
 * Returns a structured decision based on simple heuristics.
 * 
 * TO REPLACE WITH REAL AI:
 * 1. Add ANTHROPIC_API_KEY to env
 * 2. Replace this function body with a call to Anthropic API
 * 3. Construct a system prompt that asks Claude to:
 *    - Verify club existence (web search)
 *    - Check email domain matches website
 *    - Compare funding ask to league norms
 *    - Detect red flags
 *    - Return JSON in the same shape this returns
 * 4. Keep return shape identical so rest of system is unchanged
 */
async function verifyClubApplicationWithAI(application) {
  const norms = getLeagueNorms(application.league_tier);
  const askAmount = application.funding_amount;
  
  // Convert to GBP-equivalent for comparison (rough)
  const conversionRates = { GBP: 1, USD: 0.79, EUR: 0.85 };
  const askInGBP = askAmount * (conversionRates[application.funding_currency] || 1);
  
  const checks = {
    club_exists: null,
    email_legitimate: null,
    ask_reasonable: null,
    red_flags: [],
    league_average_funding: norms.avg,
    league_max_typical: norms.max_typical,
  };
  
  // Mock check 1: Email looks legit (basic check)
  const email = application.contact_email || "";
  const emailDomain = email.split("@")[1] || "";
  const websiteDomain = (application.website || "").replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
  
  if (emailDomain && (emailDomain === websiteDomain || emailDomain.includes(websiteDomain.split(".")[0]))) {
    checks.email_legitimate = true;
  } else if (emailDomain.match(/^(gmail|yahoo|hotmail|outlook|qq|163)\.(com|net)$/)) {
    checks.email_legitimate = false;
    checks.red_flags.push("personal_email_not_club_domain");
  } else {
    checks.email_legitimate = null; // Unknown
  }
  
  // Mock check 2: Club exists (placeholder - real AI would web search)
  // For mock: just check if name looks plausible (>3 chars, has at least one common football word)
  const clubNameLower = application.club_name.toLowerCase();
  const hasFootballWord = /\b(fc|football|club|united|city|town|athletic|rovers|wanderers|albion|villa|hotspur|st\.|saints|park)\b/.test(clubNameLower);
  if (application.club_name.length < 3) {
    checks.club_exists = false;
    checks.red_flags.push("club_name_too_short");
  } else if (!hasFootballWord && application.club_name.length < 10) {
    checks.club_exists = null;
    checks.red_flags.push("club_name_unusual_for_football");
  } else {
    checks.club_exists = true; // Optimistic without real verification
  }
  
  // Mock check 3: Funding ask reasonable
  const askVsAverage = askInGBP / norms.avg;
  const askVsMax = askInGBP / norms.max_typical;
  
  if (askVsMax > 5) {
    checks.ask_reasonable = false;
    checks.red_flags.push(`funding_ask_${Math.round(askVsMax)}x_typical_max`);
  } else if (askVsMax > 2) {
    checks.ask_reasonable = false;
    checks.red_flags.push("funding_ask_above_league_norm");
  } else {
    checks.ask_reasonable = true;
  }
  
  // Decision logic
  let decision, confidence, reasoning, response_to_club;
  
  const passedChecks = [checks.email_legitimate, checks.club_exists, checks.ask_reasonable].filter(c => c === true).length;
  const failedChecks = [checks.email_legitimate, checks.club_exists, checks.ask_reasonable].filter(c => c === false).length;
  
  if (failedChecks === 0 && passedChecks >= 2 && checks.red_flags.length === 0) {
    decision = "approved";
    confidence = 0.85;
    reasoning = `Club verified successfully. Funding ask of ${application.funding_currency} ${askAmount.toLocaleString()} is within reasonable range for ${application.league_tier} (typical max: GBP ${norms.max_typical.toLocaleString()}). Recommend approval.`;
    response_to_club = `Welcome to FOFA! Your club application has been approved. You'll receive setup instructions shortly.`;
  } else if (failedChecks >= 2 || checks.red_flags.length >= 2) {
    decision = "rejected";
    confidence = 0.75;
    reasoning = `Application rejected due to: ${checks.red_flags.join(", ")}. Funding ask (${application.funding_currency} ${askAmount.toLocaleString()}) is ${askVsMax.toFixed(1)}x the typical maximum for ${application.league_tier}.`;
    response_to_club = `Thank you for your interest in FOFA. Unfortunately we cannot approve this application at this time. Common reasons include: funding ask significantly above league norms, contact email not matching club domain, or unverifiable club details. You're welcome to revise and re-apply.`;
  } else {
    decision = "needs_review";
    confidence = 0.55;
    reasoning = `Application has some flags requiring human review. Red flags: ${checks.red_flags.join(", ") || "none"}. Recommend manual review.`;
    response_to_club = `Thank you for your application. We're reviewing your submission and will be in touch within 5-7 business days.`;
  }
  
  return {
    decision,
    confidence,
    reasoning,
    checks,
    response_to_club,
    verified_at: new Date(),
    raw_response: "MOCK_AI_RESPONSE - Replace with real Anthropic API call",
  };
}

function slugifyClubName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function ensureUniqueClubSlug(name) {
  let baseSlug = slugifyClubName(name);
  if (!baseSlug) baseSlug = "club";
  let slug = baseSlug;
  let i = 1;
  while (await Club.findOne({ slug })) {
    slug = `${baseSlug}-${i++}`;
  }
  return slug;
}

// ============================================================================
// EXPERT VERIFICATION (MOCK - replace with real Anthropic API later)
// ============================================================================

async function verifyExpertApplicationWithAI(application) {
  const checks = {
    identity_verified: null,
    credentials_legitimate: null,
    online_presence_verified: null,
    red_flags: [],
  };
  
  // Mock check 1: Online presence
  const hasOnlinePresence = !!(application.website || application.social_twitter || application.social_linkedin);
  if (hasOnlinePresence) {
    checks.online_presence_verified = true;
  } else {
    checks.online_presence_verified = false;
    checks.red_flags.push("no_online_presence");
  }
  
  // Mock check 2: Credentials
  const hasCredentials = application.professional_background && application.professional_background.length > 50;
  if (hasCredentials) {
    checks.credentials_legitimate = true;
  } else {
    checks.credentials_legitimate = false;
    checks.red_flags.push("insufficient_credentials_provided");
  }
  
  // Mock check 3: Email looks legit (not random)
  const email = (application.email || "").toLowerCase();
  if (email.match(/^(test|fake|spam|admin)\d*@/)) {
    checks.identity_verified = false;
    checks.red_flags.push("suspicious_email");
  } else {
    checks.identity_verified = true;
  }
  
  // Mock check 4: Years in football (sanity)
  if (application.years_in_football && application.years_in_football > 60) {
    checks.red_flags.push("unrealistic_years_in_football");
  }
  
  // Decision
  let decision, confidence, reasoning, response_to_applicant;
  
  const passedChecks = [checks.identity_verified, checks.credentials_legitimate, checks.online_presence_verified].filter(c => c === true).length;
  const failedChecks = [checks.identity_verified, checks.credentials_legitimate, checks.online_presence_verified].filter(c => c === false).length;
  
  if (failedChecks === 0 && passedChecks === 3 && checks.red_flags.length === 0) {
    decision = "needs_review"; // Always have human review for experts
    confidence = 0.8;
    reasoning = `Application looks promising. ${application.professional_background.slice(0, 100)}... Recommend human review for final approval.`;
    response_to_applicant = `Thank you for your application. Your background looks promising. Our team will review and be in touch within 5-7 business days.`;
  } else if (failedChecks >= 2 || checks.red_flags.length >= 2) {
    decision = "rejected";
    confidence = 0.7;
    reasoning = `Application has significant red flags: ${checks.red_flags.join(", ")}.`;
    response_to_applicant = `Thank you for your interest. Unfortunately, we cannot proceed with your application at this time. Common reasons include insufficient verifiable credentials or limited online presence.`;
  } else {
    decision = "needs_review";
    confidence = 0.55;
    reasoning = `Application requires human review. ${checks.red_flags.length} red flags noted.`;
    response_to_applicant = `Thank you for your application. We're reviewing your submission and will be in touch soon.`;
  }
  
  return {
    decision,
    confidence,
    reasoning,
    checks,
    response_to_applicant,
    verified_at: new Date(),
    raw_response: "MOCK_AI_RESPONSE - Replace with real Anthropic API call",
  };
}

function slugifyName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function ensureUniqueExpertSlug(name) {
  let baseSlug = slugifyName(name);
  if (!baseSlug) baseSlug = "expert";
  let slug = baseSlug;
  let i = 1;
  while (await Expert.findOne({ slug })) {
    slug = `${baseSlug}-${i++}`;
  }
  return slug;
}

async function recalculateUserScores(userId) {
  const activities = await Activity.find({ user_id: userId });
  const scores = {
    engagement_score: 0, passion_score: 0, knowledge_score: 0,
    consistency_score: 0, community_score: 0, growth_score: 0,
  };
  activities.forEach(a => {
    const key = `${a.activity_type}_score`;
    if (scores.hasOwnProperty(key)) scores[key] += a.points;
  });
  const total_score = Object.values(scores).reduce((sum, s) => sum + s, 0);
  const level = calculateLevel(total_score);
  await User.findByIdAndUpdate(userId, { ...scores, total_score, level, updated_at: new Date() });
  return { ...scores, total_score, level };
}

function userToPublic(user) {
  return {
    id: user._id.toString(), email: user.email, username: user.username,
    display_name: user.display_name, favorite_club: user.favorite_club,
    bio: user.bio, profile_pic: user.profile_pic, created_at: user.created_at,
    referral_code: user.referral_code,
    referral_count: user.referral_count || 0,
  };
}

function userToLeaderboard(user, rank) {
  return {
    rank, username: user.username, display_name: user.display_name,
    favorite_club: user.favorite_club, total_score: user.total_score, level: user.level,
  };
}

function verifyToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) return null;
  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  const url = req.url || "";
  const pathname = url.split("?")[0];

  // ============ HEALTH CHECK WITH DEBUG ============
  if (pathname === "/api/health" || pathname.endsWith("/health")) {
    // Try to connect to verify
    let connectionTest = "not attempted";
    let detailedError = null;
    
    try {
      await connectDB();
      connectionTest = "success";
    } catch (err) {
      connectionTest = "failed";
      detailedError = {
        name: err.name,
        message: err.message,
        // Don't include stack trace in response for security
      };
    }

    return res.status(200).json({
      status: "ok",
      message: "FOFA API health check",
      timestamp: new Date().toISOString(),
      mongodb: {
        readyState: mongoose.connection.readyState,
        readyStateText: ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState] || "unknown",
        uri_set: !!MONGODB_URI,
        uri_format: MONGODB_URI ? (MONGODB_URI.startsWith("mongodb+srv://") ? "srv (correct)" : MONGODB_URI.startsWith("mongodb://") ? "non-srv" : "INVALID") : "NOT SET",
        uri_length: MONGODB_URI ? MONGODB_URI.length : 0,
        connection_test: connectionTest,
        last_error: detailedError || lastError,
      },
    });
  }

  try {
    await connectDB();

    if (pathname.endsWith("/auth/register") && req.method === "POST") {
      const { email, password, username, display_name, favorite_club, referral_code } = req.body || {};
      if (!email || !password || !username) return res.status(400).json({ error: "Email, password, and username required" });
      const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] });
      if (exists) return res.status(409).json({ error: "Email or username already exists" });
      
      // Check referral code if provided
      let referrer = null;
      if (referral_code) {
        referrer = await User.findOne({ referral_code: referral_code.toUpperCase().trim() });
        if (!referrer) {
          return res.status(400).json({ error: "Invalid referral code" });
        }
      }
      
      const hashedPassword = await bcryptjs.hash(password, 10);
      const userReferralCode = await ensureUniqueReferralCode(username);
      
      const user = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        username: username.toLowerCase(),
        display_name: display_name || username,
        favorite_club: favorite_club || "",
        referral_code: userReferralCode,
        referred_by: referrer ? referrer._id : null,
      });
      
      // 🎉 Welcome bonus: +50 points to engagement
      await Activity.create({
        user_id: user._id,
        activity_type: "engagement",
        description: "Welcome to FOFA! 🎉",
        points: 50,
      });
      
      // 🎁 If referred, give bonus to both
      if (referrer) {
        // Referee bonus: +25 passion (welcomed via friend)
        await Activity.create({
          user_id: user._id,
          activity_type: "passion",
          description: `Joined via referral from @${referrer.username}`,
          points: 25,
        });
        
        // Referrer reward: +50 growth (brought a new fan!)
        await Activity.create({
          user_id: referrer._id,
          activity_type: "growth",
          description: `Referred new fan: ${user.display_name}`,
          points: 50,
        });
        
        // Increment referrer's count
        await User.findByIdAndUpdate(referrer._id, {
          $inc: { referral_count: 1 },
          updated_at: new Date(),
        });
        
        // Recalculate referrer's scores
        await recalculateUserScores(referrer._id);
      }
      
      await recalculateUserScores(user._id);
      
      const token = jwt.sign({ userId: user._id.toString(), email: user.email, username: user.username }, JWT_SECRET, { expiresIn: "30d" });
      const updatedUser = await User.findById(user._id);
      return res.status(201).json({
        message: "User registered successfully",
        token,
        user: userToPublic(updatedUser),
        is_new_user: true,
        referred_by: referrer ? { username: referrer.username, display_name: referrer.display_name } : null,
      });
    }

    if (pathname.endsWith("/auth/login") && req.method === "POST") {
      const { email, password } = req.body || {};
      if (!email || !password) return res.status(400).json({ error: "Email and password required" });
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) return res.status(401).json({ error: "Invalid email or password" });
      const validPassword = await bcryptjs.compare(password, user.password);
      if (!validPassword) return res.status(401).json({ error: "Invalid email or password" });
      const token = jwt.sign({ userId: user._id.toString(), email: user.email, username: user.username }, JWT_SECRET, { expiresIn: "30d" });
      return res.status(200).json({ message: "Logged in successfully", token, user: userToPublic(user) });
    }

    if (pathname.endsWith("/user/profile") && req.method === "GET") {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });
      const user = await User.findById(decoded.userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      const rank = await User.countDocuments({ total_score: { $gt: user.total_score } }) + 1;
      return res.status(200).json({
        user: userToPublic(user),
        loyalty: {
          engagement_score: user.engagement_score, passion_score: user.passion_score,
          knowledge_score: user.knowledge_score, consistency_score: user.consistency_score,
          community_score: user.community_score, growth_score: user.growth_score,
          total_score: user.total_score, level: user.level, rank, updated_at: user.updated_at,
        },
      });
    }

    if (pathname.endsWith("/user/profile") && req.method === "PUT") {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });
      const { display_name, bio, favorite_club, profile_pic } = req.body || {};
      const updates = { updated_at: new Date() };
      if (display_name) updates.display_name = display_name;
      if (bio !== undefined) updates.bio = bio;
      if (favorite_club !== undefined) updates.favorite_club = favorite_club;
      if (profile_pic) updates.profile_pic = profile_pic;
      const user = await User.findByIdAndUpdate(decoded.userId, updates, { new: true });
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.status(200).json({ message: "Profile updated", user: userToPublic(user) });
    }

    if (pathname.endsWith("/loyalty/activity") && req.method === "POST") {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });
      const { activity_type, description, points } = req.body || {};
      if (!activity_type || !points) return res.status(400).json({ error: "activity_type and points required" });
      const validTypes = ["engagement", "passion", "knowledge", "consistency", "community", "growth"];
      if (!validTypes.includes(activity_type)) return res.status(400).json({ error: "Invalid activity_type" });
      await Activity.create({ user_id: decoded.userId, activity_type, description: description || "", points: parseInt(points) });
      const scores = await recalculateUserScores(decoded.userId);
      return res.status(200).json({ message: "Activity logged", loyalty: scores });
    }

    if (pathname.endsWith("/loyalty/scores") && req.method === "GET") {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });
      const user = await User.findById(decoded.userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      const recent_activities = await Activity.find({ user_id: decoded.userId }).sort({ created_at: -1 }).limit(20);
      const rank = await User.countDocuments({ total_score: { $gt: user.total_score } }) + 1;
      return res.status(200).json({
        scores: {
          engagement_score: user.engagement_score, passion_score: user.passion_score,
          knowledge_score: user.knowledge_score, consistency_score: user.consistency_score,
          community_score: user.community_score, growth_score: user.growth_score,
          total_score: user.total_score, level: user.level, rank, updated_at: user.updated_at,
        },
        recent_activities: recent_activities.map(a => ({
          id: a._id.toString(), activity_type: a.activity_type,
          description: a.description, points: a.points, created_at: a.created_at,
        })),
      });
    }

    if (pathname.endsWith("/loyalty/activities") && req.method === "GET") {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });
      const activities = await Activity.find({ user_id: decoded.userId }).sort({ created_at: -1 });
      return res.status(200).json({
        activities: activities.map(a => ({
          id: a._id.toString(), activity_type: a.activity_type,
          description: a.description, points: a.points, created_at: a.created_at,
        })),
      });
    }

    if (pathname.endsWith("/leaderboard") && req.method === "GET") {
      const queryString = url.includes("?") ? url.split("?")[1] : "";
      const params = new URLSearchParams(queryString);
      const limit = Math.min(parseInt(params.get("limit") || "100"), 500);
      const filterClub = params.get("club");
      const query = filterClub ? { favorite_club: filterClub } : {};
      const users = await User.find(query).sort({ total_score: -1 }).limit(limit)
        .select("username display_name favorite_club total_score level created_at");
      const decoded = verifyToken(req);
      let myRank = null;
      let myUser = null;
      if (decoded) {
        myUser = await User.findById(decoded.userId);
        if (myUser) {
          myRank = await User.countDocuments({
            total_score: { $gt: myUser.total_score },
            ...(filterClub ? { favorite_club: filterClub } : {}),
          }) + 1;
        }
      }
      const totalUsers = await User.countDocuments(query);
      return res.status(200).json({
        leaderboard: users.map((user, i) => userToLeaderboard(user, i + 1)),
        meta: { total_users: totalUsers, showing: users.length, filter_club: filterClub || null },
        you: myUser ? {
          rank: myRank, username: myUser.username, display_name: myUser.display_name,
          total_score: myUser.total_score, level: myUser.level,
        } : null,
      });
    }

    if (pathname.endsWith("/stats") && req.method === "GET") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const [totalUsers, totalActivities, topUser, signupsToday, activitiesToday, clubCount] = await Promise.all([
        User.countDocuments(),
        Activity.countDocuments(),
        User.findOne().sort({ total_score: -1 }).select("display_name total_score level favorite_club"),
        User.countDocuments({ created_at: { $gte: today } }),
        Activity.countDocuments({ created_at: { $gte: today } }),
        User.distinct("favorite_club", { favorite_club: { $ne: "" } }).then(arr => arr.length),
      ]);
      
      return res.status(200).json({
        total_users: totalUsers,
        total_activities: totalActivities,
        signups_today: signupsToday,
        activities_today: activitiesToday,
        clubs_represented: clubCount,
        top_user: topUser ? {
          display_name: topUser.display_name,
          total_score: topUser.total_score,
          level: topUser.level,
          favorite_club: topUser.favorite_club,
        } : null,
      });
    }

    // ============ REFERRAL ENDPOINTS ============
    
    // Get my referral info
    if (pathname.endsWith("/referrals/me") && req.method === "GET") {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });
      
      const user = await User.findById(decoded.userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      
      // Generate code if missing (for old users created before referral system)
      if (!user.referral_code) {
        const newCode = await ensureUniqueReferralCode(user.username);
        user.referral_code = newCode;
        await user.save();
      }
      
      // Get list of users who used my code
      const referredUsers = await User.find({ referred_by: user._id })
        .sort({ created_at: -1 })
        .select("username display_name favorite_club total_score level created_at");
      
      // Get my rank among referrers
      const myRank = await User.countDocuments({
        referral_count: { $gt: user.referral_count }
      }) + 1;
      
      return res.status(200).json({
        referral_code: user.referral_code,
        referral_link: `${process.env.PUBLIC_URL || "https://fofa-xi.vercel.app"}/#join?ref=${user.referral_code}`,
        referral_count: user.referral_count || 0,
        recruiter_rank: myRank,
        referred_users: referredUsers.map(u => ({
          username: u.username,
          display_name: u.display_name,
          favorite_club: u.favorite_club,
          total_score: u.total_score,
          level: u.level,
          joined: u.created_at,
        })),
        points_earned: (user.referral_count || 0) * 50,
      });
    }
    
    // Top recruiters leaderboard
    if (pathname.endsWith("/referrals/leaderboard") && req.method === "GET") {
      const queryString = url.includes("?") ? url.split("?")[1] : "";
      const params = new URLSearchParams(queryString);
      const limit = Math.min(parseInt(params.get("limit") || "20"), 100);
      
      const recruiters = await User.find({ referral_count: { $gt: 0 } })
        .sort({ referral_count: -1, total_score: -1 })
        .limit(limit)
        .select("username display_name favorite_club referral_count total_score level");
      
      return res.status(200).json({
        recruiters: recruiters.map((u, i) => ({
          rank: i + 1,
          username: u.username,
          display_name: u.display_name,
          favorite_club: u.favorite_club,
          referral_count: u.referral_count,
          total_score: u.total_score,
          level: u.level,
        })),
      });
    }
    
    // Validate referral code (used by registration form to show "Referred by X")
    if (pathname.includes("/referrals/validate") && req.method === "GET") {
      const queryString = url.includes("?") ? url.split("?")[1] : "";
      const params = new URLSearchParams(queryString);
      const code = (params.get("code") || "").toUpperCase().trim();
      
      if (!code) return res.status(400).json({ valid: false, error: "Code required" });
      
      const referrer = await User.findOne({ referral_code: code });
      if (!referrer) {
        return res.status(404).json({ valid: false, error: "Invalid referral code" });
      }
      
      return res.status(200).json({
        valid: true,
        referrer: {
          username: referrer.username,
          display_name: referrer.display_name,
          favorite_club: referrer.favorite_club,
          level: referrer.level,
        },
      });
    }

    // ============ CLUB ENDPOINTS ============
    
    // Submit club application
    if (pathname.endsWith("/clubs/apply") && req.method === "POST") {
      const decoded = verifyToken(req);
      // Allow anonymous OR logged-in submissions
      
      const data = req.body || {};
      
      // Validate required fields
      const required = ["club_name", "country", "league", "website", "contact_name", "contact_email", "contact_role", "funding_amount", "funding_purpose", "what_club_offers", "why_fofa"];
      const missing = required.filter(f => !data[f] && data[f] !== 0);
      if (missing.length) {
        return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
      }
      
      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact_email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      
      // Validate website
      if (!/^https?:\/\//.test(data.website)) {
        return res.status(400).json({ error: "Website must start with http:// or https://" });
      }
      
      // Check for duplicate submissions (same club name + email recently)
      const recent = await ClubApplication.findOne({
        club_name: { $regex: new RegExp(`^${data.club_name.trim()}$`, "i") },
        contact_email: data.contact_email.toLowerCase(),
        submitted_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });
      if (recent) {
        return res.status(409).json({
          error: "We already received an application from this club in the last 24 hours.",
          existing_status: recent.status,
        });
      }
      
      // Create the application
      const application = await ClubApplication.create({
        submitted_by: decoded ? decoded.userId : null,
        club_name: data.club_name.trim(),
        country: data.country.trim(),
        league: data.league.trim(),
        league_tier: data.league_tier || data.league,
        founded_year: data.founded_year ? parseInt(data.founded_year) : null,
        stadium: data.stadium || "",
        website: data.website.trim(),
        description: data.description || "",
        contact_name: data.contact_name.trim(),
        contact_email: data.contact_email.toLowerCase().trim(),
        contact_role: data.contact_role.trim(),
        contact_phone: data.contact_phone || "",
        social_twitter: data.social_twitter || "",
        social_instagram: data.social_instagram || "",
        social_facebook: data.social_facebook || "",
        funding_amount: parseFloat(data.funding_amount),
        funding_currency: data.funding_currency || "GBP",
        funding_purpose: data.funding_purpose.trim(),
        funding_duration_months: parseInt(data.funding_duration_months) || 12,
        what_club_offers: data.what_club_offers.trim(),
        why_fofa: data.why_fofa.trim(),
        status: "ai_reviewing",
      });
      
      // Run AI verification (mock for now)
      try {
        const aiResult = await verifyClubApplicationWithAI(application);
        application.ai_verification = aiResult;
        
        // Auto-update status based on AI decision
        if (aiResult.decision === "approved") {
          application.status = "needs_human_review"; // Always need human approval to publish
        } else if (aiResult.decision === "rejected") {
          application.status = "rejected";
        } else {
          application.status = "needs_human_review";
        }
        
        await application.save();
      } catch (err) {
        console.error("AI verification error:", err);
        application.status = "needs_human_review";
        await application.save();
      }
      
      return res.status(201).json({
        message: "Application submitted successfully",
        application_id: application._id.toString(),
        status: application.status,
        ai_decision: application.ai_verification.decision,
        ai_response: application.ai_verification.response_to_club,
        next_steps: application.status === "rejected"
          ? "Your application was not approved. See AI feedback for details."
          : "Your application is being reviewed. We'll be in touch within 5-7 business days.",
      });
    }
    
    // Get application status (public, by ID) - excludes admin paths
    if (pathname.match(/\/clubs\/applications\/[^\/]+$/) && req.method === "GET" && !pathname.includes("/admin/")) {
      const id = pathname.split("/").pop();
      if (!id.match(/^[a-f0-9]{24}$/)) {
        return res.status(400).json({ error: "Invalid application ID" });
      }
      
      const application = await ClubApplication.findById(id)
        .select("club_name status ai_verification.decision ai_verification.response_to_club submitted_at");
      
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      
      return res.status(200).json({
        application_id: application._id.toString(),
        club_name: application.club_name,
        status: application.status,
        ai_decision: application.ai_verification?.decision || null,
        ai_response: application.ai_verification?.response_to_club || null,
        submitted_at: application.submitted_at,
      });
    }
    
    // List approved/active clubs (public)
    if (pathname.endsWith("/clubs") && req.method === "GET") {
      const queryString = url.includes("?") ? url.split("?")[1] : "";
      const params = new URLSearchParams(queryString);
      const limit = Math.min(parseInt(params.get("limit") || "50"), 200);
      const country = params.get("country");
      const league = params.get("league");
      
      const query = { status: "active" };
      if (country) query.country = country;
      if (league) query.league = league;
      
      const clubs = await Club.find(query)
        .sort({ fan_count: -1 })
        .limit(limit)
        .select("name slug country league league_tier stadium logo_url primary_color fan_count total_loyalty_score");
      
      return res.status(200).json({
        clubs: clubs.map(c => ({
          id: c._id.toString(),
          name: c.name,
          slug: c.slug,
          country: c.country,
          league: c.league,
          league_tier: c.league_tier,
          stadium: c.stadium,
          logo_url: c.logo_url,
          primary_color: c.primary_color,
          fan_count: c.fan_count,
          total_loyalty_score: c.total_loyalty_score,
        })),
        meta: { total: clubs.length },
      });
    }
    
    // Get individual club page (public, by slug)
    // Important: exclude /admin/ and /applications paths
    if (pathname.match(/\/clubs\/[a-z0-9-]+$/) && req.method === "GET" && !pathname.includes("/admin/") && !pathname.includes("/applications")) {
      const slug = pathname.split("/").pop();
      
      const club = await Club.findOne({ slug, status: "active" });
      if (!club) {
        return res.status(404).json({ error: "Club not found" });
      }
      
      // Get top fans of this club
      const topFans = await User.find({ favorite_club: club.name })
        .sort({ total_score: -1 })
        .limit(10)
        .select("username display_name total_score level");
      
      return res.status(200).json({
        club: {
          id: club._id.toString(),
          name: club.name,
          slug: club.slug,
          country: club.country,
          league: club.league,
          league_tier: club.league_tier,
          founded_year: club.founded_year,
          stadium: club.stadium,
          website: club.website,
          description: club.description,
          logo_url: club.logo_url,
          primary_color: club.primary_color,
          social: {
            twitter: club.social_twitter,
            instagram: club.social_instagram,
            facebook: club.social_facebook,
          },
          fan_count: club.fan_count,
          total_loyalty_score: club.total_loyalty_score,
          approved_at: club.approved_at,
        },
        top_fans: topFans.map((f, i) => ({
          rank: i + 1,
          username: f.username,
          display_name: f.display_name,
          total_score: f.total_score,
          level: f.level,
        })),
      });
    }
    
    // ============ ADMIN: CLUB MANAGEMENT ============
    
    // List pending club applications (admin only)
    if (pathname.endsWith("/admin/clubs/applications") && req.method === "GET") {
      const decoded = verifyToken(req);
      const ADMIN_EMAILS_LIST = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
      if (!decoded || !ADMIN_EMAILS_LIST.includes((decoded.email || "").toLowerCase())) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const queryString = url.includes("?") ? url.split("?")[1] : "";
      const params = new URLSearchParams(queryString);
      const status = params.get("status"); // optional filter
      
      const query = status ? { status } : {};
      const applications = await ClubApplication.find(query)
        .sort({ submitted_at: -1 })
        .limit(100);
      
      return res.status(200).json({
        applications: applications.map(a => ({
          id: a._id.toString(),
          club_name: a.club_name,
          country: a.country,
          league: a.league_tier || a.league,
          contact_name: a.contact_name,
          contact_email: a.contact_email,
          funding_amount: a.funding_amount,
          funding_currency: a.funding_currency,
          status: a.status,
          ai_decision: a.ai_verification?.decision || null,
          ai_confidence: a.ai_verification?.confidence || null,
          submitted_at: a.submitted_at,
        })),
        counts: {
          pending: await ClubApplication.countDocuments({ status: "pending" }),
          ai_reviewing: await ClubApplication.countDocuments({ status: "ai_reviewing" }),
          needs_human_review: await ClubApplication.countDocuments({ status: "needs_human_review" }),
          approved: await ClubApplication.countDocuments({ status: "approved" }),
          rejected: await ClubApplication.countDocuments({ status: "rejected" }),
        },
      });
    }
    
    // Get full application details (admin only)
    if (pathname.match(/\/admin\/clubs\/applications\/[^\/]+$/) && req.method === "GET") {
      const decoded = verifyToken(req);
      const ADMIN_EMAILS_LIST = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
      if (!decoded || !ADMIN_EMAILS_LIST.includes((decoded.email || "").toLowerCase())) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const id = pathname.split("/").pop();
      const application = await ClubApplication.findById(id);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      
      return res.status(200).json({ application });
    }
    
    // Approve a club application (admin only)
    if (pathname.match(/\/admin\/clubs\/applications\/[^\/]+\/approve$/) && req.method === "POST") {
      const decoded = verifyToken(req);
      const ADMIN_EMAILS_LIST = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
      if (!decoded || !ADMIN_EMAILS_LIST.includes((decoded.email || "").toLowerCase())) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const id = pathname.split("/")[pathname.split("/").length - 2];
      const { notes } = req.body || {};
      
      const application = await ClubApplication.findById(id);
      if (!application) return res.status(404).json({ error: "Application not found" });
      if (application.status === "approved") return res.status(400).json({ error: "Already approved" });
      
      // Create the public Club record
      const slug = await ensureUniqueClubSlug(application.club_name);
      const club = await Club.create({
        application_id: application._id,
        name: application.club_name,
        slug,
        country: application.country,
        league: application.league,
        league_tier: application.league_tier,
        founded_year: application.founded_year,
        stadium: application.stadium,
        website: application.website,
        description: application.description,
        social_twitter: application.social_twitter,
        social_instagram: application.social_instagram,
        social_facebook: application.social_facebook,
        admin_user_ids: application.submitted_by ? [application.submitted_by] : [],
      });
      
      // Update application
      application.status = "approved";
      application.approved_club_id = club._id;
      application.human_decision = {
        decided_by_email: decoded.email,
        decided_at: new Date(),
        decision: "approved",
        notes: notes || "",
      };
      application.updated_at = new Date();
      await application.save();
      
      return res.status(200).json({
        message: "Club approved and published",
        club: {
          id: club._id.toString(),
          name: club.name,
          slug: club.slug,
          public_url: `/clubs/${club.slug}`,
        },
      });
    }
    
    // Reject a club application (admin only)
    if (pathname.match(/\/admin\/clubs\/applications\/[^\/]+\/reject$/) && req.method === "POST") {
      const decoded = verifyToken(req);
      const ADMIN_EMAILS_LIST = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
      if (!decoded || !ADMIN_EMAILS_LIST.includes((decoded.email || "").toLowerCase())) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const id = pathname.split("/")[pathname.split("/").length - 2];
      const { notes } = req.body || {};
      
      const application = await ClubApplication.findById(id);
      if (!application) return res.status(404).json({ error: "Application not found" });
      
      application.status = "rejected";
      application.human_decision = {
        decided_by_email: decoded.email,
        decided_at: new Date(),
        decision: "rejected",
        notes: notes || "",
      };
      application.updated_at = new Date();
      await application.save();
      
      return res.status(200).json({ message: "Application rejected" });
    }

    // ============ EXPERT ENDPOINTS ============
    
    // Submit expert application
    if (pathname.endsWith("/experts/apply") && req.method === "POST") {
      const decoded = verifyToken(req);
      const data = req.body || {};
      
      // Validate required fields
      const required = ["full_name", "display_name", "email", "country", "expert_type", "professional_background", "why_fofa", "what_they_offer"];
      const missing = required.filter(f => !data[f]);
      if (missing.length) {
        return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
      }
      
      // Validate email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      
      // Check for duplicate
      const recent = await ExpertApplication.findOne({
        email: data.email.toLowerCase(),
        submitted_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });
      if (recent) {
        return res.status(409).json({
          error: "We already received an application from this email in the last 24 hours.",
          existing_status: recent.status,
        });
      }
      
      // Create application
      const application = await ExpertApplication.create({
        submitted_by: decoded ? decoded.userId : null,
        full_name: data.full_name.trim(),
        display_name: data.display_name.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone || "",
        country: data.country.trim(),
        expert_type: data.expert_type,
        professional_background: data.professional_background.trim(),
        current_role: data.current_role || "",
        years_in_football: data.years_in_football ? parseInt(data.years_in_football) : null,
        clubs_supported: Array.isArray(data.clubs_supported) ? data.clubs_supported : (data.clubs_supported ? data.clubs_supported.split(",").map(s => s.trim()) : []),
        expertise_areas: Array.isArray(data.expertise_areas) ? data.expertise_areas : (data.expertise_areas ? data.expertise_areas.split(",").map(s => s.trim()) : []),
        region_focus: data.region_focus || "",
        website: data.website || "",
        social_twitter: data.social_twitter || "",
        social_instagram: data.social_instagram || "",
        social_linkedin: data.social_linkedin || "",
        social_youtube: data.social_youtube || "",
        follower_count: data.follower_count ? parseInt(data.follower_count) : 0,
        why_fofa: data.why_fofa.trim(),
        what_they_offer: data.what_they_offer.trim(),
        references: data.references || "",
        status: "ai_reviewing",
      });
      
      // Run AI verification
      try {
        const aiResult = await verifyExpertApplicationWithAI(application);
        application.ai_verification = aiResult;
        application.status = aiResult.decision === "rejected" ? "rejected" : "needs_human_review";
        await application.save();
      } catch (err) {
        console.error("Expert AI verification error:", err);
        application.status = "needs_human_review";
        await application.save();
      }
      
      return res.status(201).json({
        message: "Application submitted successfully",
        application_id: application._id.toString(),
        status: application.status,
        ai_decision: application.ai_verification.decision,
        ai_response: application.ai_verification.response_to_applicant,
      });
    }
    
    // List public approved experts
    if (pathname.endsWith("/experts") && req.method === "GET" && !pathname.includes("/admin/")) {
      const queryString = url.includes("?") ? url.split("?")[1] : "";
      const params = new URLSearchParams(queryString);
      const limit = Math.min(parseInt(params.get("limit") || "100"), 200);
      const expert_type = params.get("type");
      const featured_only = params.get("featured") === "true";
      
      const query = { status: "active" };
      if (expert_type) query.expert_type = expert_type;
      if (featured_only) query.is_featured = true;
      
      const experts = await Expert.find(query)
        .sort({ is_featured: -1, contribution_score: -1, endorsement_count: -1 })
        .limit(limit)
        .select("full_name display_name slug expert_type tier current_role bio country profile_pic clubs_supported expertise_areas endorsement_count fans_referred is_featured");
      
      return res.status(200).json({
        experts: experts.map(e => ({
          id: e._id.toString(),
          full_name: e.full_name,
          display_name: e.display_name,
          slug: e.slug,
          expert_type: e.expert_type,
          tier: e.tier,
          current_role: e.current_role,
          bio: e.bio?.slice(0, 150) || "",
          country: e.country,
          profile_pic: e.profile_pic,
          clubs_supported: e.clubs_supported,
          expertise_areas: e.expertise_areas,
          endorsement_count: e.endorsement_count,
          fans_referred: e.fans_referred,
          is_featured: e.is_featured,
        })),
        meta: { total: experts.length },
      });
    }
    
    // Get individual expert profile (by slug) - exclude admin paths
    if (pathname.match(/\/experts\/[a-z0-9-]+$/) && req.method === "GET" && !pathname.includes("/admin/") && !pathname.endsWith("/apply")) {
      const slug = pathname.split("/").pop();
      
      const expert = await Expert.findOne({ slug, status: "active" });
      if (!expert) {
        return res.status(404).json({ error: "Expert not found" });
      }
      
      // Get their endorsements
      const endorsements = await Endorsement.find({
        expert_id: expert._id,
        is_public: true,
        club_id: { $ne: null },
      })
        .populate("club_id", "name slug logo_url")
        .sort({ created_at: -1 })
        .limit(20);
      
      return res.status(200).json({
        expert: {
          id: expert._id.toString(),
          full_name: expert.full_name,
          display_name: expert.display_name,
          slug: expert.slug,
          expert_type: expert.expert_type,
          tier: expert.tier,
          professional_background: expert.professional_background,
          current_role: expert.current_role,
          bio: expert.bio,
          country: expert.country,
          region_focus: expert.region_focus,
          clubs_supported: expert.clubs_supported,
          affiliated_club_slugs: expert.affiliated_club_slugs,
          expertise_areas: expert.expertise_areas,
          profile_pic: expert.profile_pic,
          cover_image: expert.cover_image,
          website: expert.website,
          social: {
            twitter: expert.social_twitter,
            instagram: expert.social_instagram,
            linkedin: expert.social_linkedin,
            youtube: expert.social_youtube,
          },
          follower_count: expert.follower_count,
          endorsement_count: expert.endorsement_count,
          fans_referred: expert.fans_referred,
          is_featured: expert.is_featured,
          approved_at: expert.approved_at,
        },
        endorsements: endorsements.map(e => ({
          id: e._id.toString(),
          club: e.club_id ? {
            id: e.club_id._id.toString(),
            name: e.club_id.name,
            slug: e.club_id.slug,
            logo_url: e.club_id.logo_url,
          } : null,
          endorsement_text: e.endorsement_text,
          created_at: e.created_at,
        })),
      });
    }
    
    // Get current user's expert profile (if they are one)
    if (pathname.endsWith("/experts/me") && req.method === "GET") {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });
      
      const user = await User.findById(decoded.userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      
      const expert = await Expert.findOne({
        $or: [
          { user_id: decoded.userId },
          // Match by email through application
        ],
        status: "active",
      });
      
      if (!expert) {
        // Try matching by email via application
        const application = await ExpertApplication.findOne({
          email: user.email.toLowerCase(),
          status: "approved",
        });
        if (application && application.approved_expert_id) {
          const expertViaApp = await Expert.findById(application.approved_expert_id);
          if (expertViaApp) {
            return res.status(200).json({
              is_expert: true,
              expert: {
                id: expertViaApp._id.toString(),
                slug: expertViaApp.slug,
                full_name: expertViaApp.full_name,
                display_name: expertViaApp.display_name,
                expert_type: expertViaApp.expert_type,
                tier: expertViaApp.tier,
                bio: expertViaApp.bio,
                current_role: expertViaApp.current_role,
                country: expertViaApp.country,
                region_focus: expertViaApp.region_focus,
                website: expertViaApp.website,
                social: {
                  twitter: expertViaApp.social_twitter,
                  instagram: expertViaApp.social_instagram,
                  linkedin: expertViaApp.social_linkedin,
                  youtube: expertViaApp.social_youtube,
                },
                clubs_supported: expertViaApp.clubs_supported,
                expertise_areas: expertViaApp.expertise_areas,
                profile_pic: expertViaApp.profile_pic,
                endorsement_count: expertViaApp.endorsement_count,
                is_featured: expertViaApp.is_featured,
              },
            });
          }
        }
        return res.status(200).json({ is_expert: false });
      }
      
      return res.status(200).json({
        is_expert: true,
        expert: {
          id: expert._id.toString(),
          slug: expert.slug,
          full_name: expert.full_name,
          display_name: expert.display_name,
          expert_type: expert.expert_type,
          tier: expert.tier,
          bio: expert.bio,
          current_role: expert.current_role,
          country: expert.country,
          region_focus: expert.region_focus,
          website: expert.website,
          social: {
            twitter: expert.social_twitter,
            instagram: expert.social_instagram,
            linkedin: expert.social_linkedin,
            youtube: expert.social_youtube,
          },
          clubs_supported: expert.clubs_supported,
          expertise_areas: expert.expertise_areas,
          profile_pic: expert.profile_pic,
          endorsement_count: expert.endorsement_count,
          is_featured: expert.is_featured,
        },
      });
    }

    // ========================================================================
    // UPDATE EXPERT PROFILE (expert edits own profile)
    // ========================================================================
    if (pathname.endsWith("/experts/me") && req.method === "PATCH") {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });

      const user = await User.findById(decoded.userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      // Find expert profile via application email match
      let expert = await Expert.findOne({ user_id: decoded.userId, status: "active" });
      if (!expert) {
        const application = await ExpertApplication.findOne({
          email: user.email.toLowerCase(),
          status: "approved",
        });
        if (application && application.approved_expert_id) {
          expert = await Expert.findById(application.approved_expert_id);
        }
      }
      if (!expert || expert.status !== "active") {
        return res.status(403).json({ error: "Active expert profile required" });
      }

      const data = req.body || {};
      const allowedFields = [
        "display_name", "bio", "current_role", "country", "region_focus",
        "website", "social_twitter", "social_instagram", "social_linkedin",
        "social_youtube", "clubs_supported", "expertise_areas", "profile_pic",
      ];

      let updated = false;
      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          if (field === "clubs_supported" || field === "expertise_areas") {
            expert[field] = Array.isArray(data[field])
              ? data[field].map(s => String(s).trim()).filter(Boolean)
              : String(data[field]).split(",").map(s => s.trim()).filter(Boolean);
          } else {
            expert[field] = String(data[field]).trim();
          }
          updated = true;
        }
      }

      if (!updated) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      expert.updated_at = new Date();
      await expert.save();

      return res.status(200).json({
        message: "Profile updated",
        expert: {
          id: expert._id.toString(),
          slug: expert.slug,
          full_name: expert.full_name,
          display_name: expert.display_name,
          bio: expert.bio,
          current_role: expert.current_role,
          country: expert.country,
          region_focus: expert.region_focus,
          website: expert.website,
          social: {
            twitter: expert.social_twitter,
            instagram: expert.social_instagram,
            linkedin: expert.social_linkedin,
            youtube: expert.social_youtube,
          },
          clubs_supported: expert.clubs_supported,
          expertise_areas: expert.expertise_areas,
          profile_pic: expert.profile_pic,
          expert_type: expert.expert_type,
          tier: expert.tier,
          endorsement_count: expert.endorsement_count,
        },
      });
    }

    // ========================================================================
    // EDIT ENDORSEMENT (expert edits own endorsement)
    // ========================================================================
    if (pathname.match(/\/experts\/endorsements\/[^\/]+$/) && req.method === "PATCH") {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });

      const user = await User.findById(decoded.userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      // Find expert
      let expert = await Expert.findOne({ user_id: decoded.userId, status: "active" });
      if (!expert) {
        const application = await ExpertApplication.findOne({
          email: user.email.toLowerCase(),
          status: "approved",
        });
        if (application && application.approved_expert_id) {
          expert = await Expert.findById(application.approved_expert_id);
        }
      }
      if (!expert) return res.status(403).json({ error: "Expert access required" });

      const endorsementId = pathname.split("/").pop();
      const endorsement = await Endorsement.findById(endorsementId);
      if (!endorsement) return res.status(404).json({ error: "Endorsement not found" });

      // Verify ownership
      if (endorsement.expert_id.toString() !== expert._id.toString()) {
        return res.status(403).json({ error: "You can only edit your own endorsements" });
      }

      const { endorsement_text } = req.body || {};
      if (!endorsement_text || endorsement_text.trim().length < 20) {
        return res.status(400).json({ error: "Endorsement text required (minimum 20 chars)" });
      }

      endorsement.endorsement_text = endorsement_text.trim();
      await endorsement.save();

      return res.status(200).json({
        message: "Endorsement updated",
        endorsement: {
          id: endorsement._id.toString(),
          endorsement_text: endorsement.endorsement_text,
        },
      });
    }

    // ========================================================================
    // DELETE ENDORSEMENT (expert deletes own endorsement)
    // ========================================================================
    if (pathname.match(/\/experts\/endorsements\/[^\/]+$/) && req.method === "DELETE") {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });

      const user = await User.findById(decoded.userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      // Find expert
      let expert = await Expert.findOne({ user_id: decoded.userId, status: "active" });
      if (!expert) {
        const application = await ExpertApplication.findOne({
          email: user.email.toLowerCase(),
          status: "approved",
        });
        if (application && application.approved_expert_id) {
          expert = await Expert.findById(application.approved_expert_id);
        }
      }
      if (!expert) return res.status(403).json({ error: "Expert access required" });

      const endorsementId = pathname.split("/").pop();
      const endorsement = await Endorsement.findById(endorsementId);
      if (!endorsement) return res.status(404).json({ error: "Endorsement not found" });

      // Verify ownership
      if (endorsement.expert_id.toString() !== expert._id.toString()) {
        return res.status(403).json({ error: "You can only delete your own endorsements" });
      }

      await Endorsement.findByIdAndDelete(endorsementId);

      // Decrement endorsement count
      if (expert.endorsement_count > 0) {
        expert.endorsement_count -= 1;
        expert.contribution_score = Math.max(0, expert.contribution_score - 100);
        await expert.save();
      }

      return res.status(200).json({ message: "Endorsement deleted" });
    }

    // Submit endorsement (expert endorses a club)
    if (pathname.endsWith("/experts/endorse") && req.method === "POST") {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });
      
      const user = await User.findById(decoded.userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      
      // Find the user's expert profile
      const application = await ExpertApplication.findOne({
        email: user.email.toLowerCase(),
        status: "approved",
      });
      if (!application || !application.approved_expert_id) {
        return res.status(403).json({ error: "Expert access required" });
      }
      const expert = await Expert.findById(application.approved_expert_id);
      if (!expert || expert.status !== "active") {
        return res.status(403).json({ error: "Active expert profile required" });
      }
      
      const { club_id, club_application_id, endorsement_text } = req.body || {};
      if (!endorsement_text || endorsement_text.length < 20) {
        return res.status(400).json({ error: "Endorsement text required (minimum 20 chars)" });
      }
      if (!club_id && !club_application_id) {
        return res.status(400).json({ error: "Either club_id or club_application_id required" });
      }
      
      // Check no duplicate endorsement
      const existing = await Endorsement.findOne({
        expert_id: expert._id,
        ...(club_id ? { club_id } : { club_application_id }),
      });
      if (existing) {
        return res.status(409).json({ error: "You've already endorsed this club" });
      }
      
      const endorsement = await Endorsement.create({
        expert_id: expert._id,
        club_id: club_id || null,
        club_application_id: club_application_id || null,
        endorsement_text: endorsement_text.trim(),
        is_public: true,
      });
      
      // Increment expert's endorsement count
      expert.endorsement_count += 1;
      expert.contribution_score += 100;
      await expert.save();
      
      return res.status(201).json({
        message: "Endorsement submitted",
        endorsement: {
          id: endorsement._id.toString(),
          created_at: endorsement.created_at,
        },
      });
    }
    
    // Get endorsements for a club
    if (pathname.match(/\/clubs\/[a-z0-9-]+\/endorsements$/) && req.method === "GET") {
      const slug = pathname.split("/")[pathname.split("/").length - 2];
      
      const club = await Club.findOne({ slug, status: "active" });
      if (!club) {
        return res.status(404).json({ error: "Club not found" });
      }
      
      const endorsements = await Endorsement.find({
        club_id: club._id,
        is_public: true,
      })
        .populate("expert_id", "full_name display_name slug expert_type tier profile_pic current_role")
        .sort({ created_at: -1 });
      
      return res.status(200).json({
        endorsements: endorsements.map(e => ({
          id: e._id.toString(),
          expert: e.expert_id ? {
            id: e.expert_id._id.toString(),
            full_name: e.expert_id.full_name,
            display_name: e.expert_id.display_name,
            slug: e.expert_id.slug,
            expert_type: e.expert_id.expert_type,
            tier: e.expert_id.tier,
            profile_pic: e.expert_id.profile_pic,
            current_role: e.expert_id.current_role,
          } : null,
          endorsement_text: e.endorsement_text,
          created_at: e.created_at,
        })),
      });
    }
    
    // ============ ADMIN: EXPERT MANAGEMENT ============
    
    // List expert applications (admin only)
    if (pathname.endsWith("/admin/experts/applications") && req.method === "GET") {
      const decoded = verifyToken(req);
      const ADMIN_EMAILS_LIST = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
      if (!decoded || !ADMIN_EMAILS_LIST.includes((decoded.email || "").toLowerCase())) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const queryString = url.includes("?") ? url.split("?")[1] : "";
      const params = new URLSearchParams(queryString);
      const status = params.get("status");
      
      const query = status ? { status } : {};
      const applications = await ExpertApplication.find(query)
        .sort({ submitted_at: -1 })
        .limit(100);
      
      return res.status(200).json({
        applications: applications.map(a => ({
          id: a._id.toString(),
          full_name: a.full_name,
          display_name: a.display_name,
          email: a.email,
          country: a.country,
          expert_type: a.expert_type,
          current_role: a.current_role,
          professional_background: a.professional_background.slice(0, 150),
          status: a.status,
          ai_decision: a.ai_verification?.decision || null,
          ai_confidence: a.ai_verification?.confidence || null,
          submitted_at: a.submitted_at,
        })),
        counts: {
          pending: await ExpertApplication.countDocuments({ status: "pending" }),
          ai_reviewing: await ExpertApplication.countDocuments({ status: "ai_reviewing" }),
          needs_human_review: await ExpertApplication.countDocuments({ status: "needs_human_review" }),
          approved: await ExpertApplication.countDocuments({ status: "approved" }),
          rejected: await ExpertApplication.countDocuments({ status: "rejected" }),
        },
      });
    }
    
    // Get expert application details (admin only)
    if (pathname.match(/\/admin\/experts\/applications\/[^\/]+$/) && req.method === "GET") {
      const decoded = verifyToken(req);
      const ADMIN_EMAILS_LIST = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
      if (!decoded || !ADMIN_EMAILS_LIST.includes((decoded.email || "").toLowerCase())) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const id = pathname.split("/").pop();
      const application = await ExpertApplication.findById(id);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      
      return res.status(200).json({ application });
    }
    
    // Approve expert application
    if (pathname.match(/\/admin\/experts\/applications\/[^\/]+\/approve$/) && req.method === "POST") {
      const decoded = verifyToken(req);
      const ADMIN_EMAILS_LIST = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
      if (!decoded || !ADMIN_EMAILS_LIST.includes((decoded.email || "").toLowerCase())) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const parts = pathname.split("/");
      const id = parts[parts.length - 2];
      const { notes, tier, is_featured } = req.body || {};
      
      const application = await ExpertApplication.findById(id);
      if (!application) return res.status(404).json({ error: "Application not found" });
      if (application.status === "approved") return res.status(400).json({ error: "Already approved" });
      
      // Try to link to existing user account by email
      const matchingUser = await User.findOne({ email: application.email.toLowerCase() });
      
      // Create the public Expert
      const slug = await ensureUniqueExpertSlug(application.full_name);
      const expert = await Expert.create({
        application_id: application._id,
        user_id: matchingUser ? matchingUser._id : null,
        full_name: application.full_name,
        display_name: application.display_name,
        slug,
        expert_type: application.expert_type,
        tier: tier || "authority",
        professional_background: application.professional_background,
        current_role: application.current_role,
        bio: application.what_they_offer,
        country: application.country,
        region_focus: application.region_focus,
        clubs_supported: application.clubs_supported,
        expertise_areas: application.expertise_areas,
        website: application.website,
        social_twitter: application.social_twitter,
        social_instagram: application.social_instagram,
        social_linkedin: application.social_linkedin,
        social_youtube: application.social_youtube,
        follower_count: application.follower_count,
        is_featured: is_featured || false,
      });
      
      application.status = "approved";
      application.approved_expert_id = expert._id;
      application.human_decision = {
        decided_by_email: decoded.email,
        decided_at: new Date(),
        decision: "approved",
        notes: notes || "",
      };
      application.updated_at = new Date();
      await application.save();
      
      return res.status(200).json({
        message: "Expert approved",
        expert: {
          id: expert._id.toString(),
          slug: expert.slug,
          public_url: `/#experts/${expert.slug}`,
        },
      });
    }
    
    // Reject expert application
    if (pathname.match(/\/admin\/experts\/applications\/[^\/]+\/reject$/) && req.method === "POST") {
      const decoded = verifyToken(req);
      const ADMIN_EMAILS_LIST = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
      if (!decoded || !ADMIN_EMAILS_LIST.includes((decoded.email || "").toLowerCase())) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const parts = pathname.split("/");
      const id = parts[parts.length - 2];
      const { notes } = req.body || {};
      
      const application = await ExpertApplication.findById(id);
      if (!application) return res.status(404).json({ error: "Application not found" });
      
      application.status = "rejected";
      application.human_decision = {
        decided_by_email: decoded.email,
        decided_at: new Date(),
        decision: "rejected",
        notes: notes || "",
      };
      application.updated_at = new Date();
      await application.save();
      
      return res.status(200).json({ message: "Application rejected" });
    }

    // ============ ADMIN ENDPOINTS ============
    // Admin emails - comma separated in env var ADMIN_EMAILS
    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
    
    function isAdmin(decoded) {
      if (!decoded || !decoded.email) return false;
      return ADMIN_EMAILS.includes(decoded.email.toLowerCase());
    }

    // Admin: Overview stats
    if (pathname.endsWith("/admin/overview") && req.method === "GET") {
      const decoded = verifyToken(req);
      if (!isAdmin(decoded)) return res.status(403).json({ error: "Forbidden - admin only" });

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        totalActivities,
        signupsToday,
        signupsYesterday,
        signupsWeek,
        activitiesToday,
        activeUsersToday,
      ] = await Promise.all([
        User.countDocuments(),
        Activity.countDocuments(),
        User.countDocuments({ created_at: { $gte: today } }),
        User.countDocuments({ created_at: { $gte: yesterday, $lt: today } }),
        User.countDocuments({ created_at: { $gte: weekAgo } }),
        Activity.countDocuments({ created_at: { $gte: today } }),
        Activity.distinct("user_id", { created_at: { $gte: today } }).then(arr => arr.length),
      ]);

      // Top fans
      const topFans = await User.find()
        .sort({ total_score: -1 })
        .limit(10)
        .select("display_name username favorite_club total_score level created_at");

      // Club breakdown
      const clubAggregation = await User.aggregate([
        { $match: { favorite_club: { $ne: "" } } },
        { $group: {
          _id: "$favorite_club",
          fans: { $sum: 1 },
          totalScore: { $sum: "$total_score" },
        }},
        { $sort: { fans: -1 } },
        { $limit: 20 },
      ]);

      // Activity type breakdown
      const activityAggregation = await Activity.aggregate([
        { $group: {
          _id: "$activity_type",
          count: { $sum: 1 },
          totalPoints: { $sum: "$points" },
        }},
        { $sort: { count: -1 } },
      ]);

      // Recent signups
      const recentSignups = await User.find()
        .sort({ created_at: -1 })
        .limit(15)
        .select("display_name username favorite_club created_at total_score level");

      return res.status(200).json({
        stats: {
          total_users: totalUsers,
          total_activities: totalActivities,
          signups_today: signupsToday,
          signups_yesterday: signupsYesterday,
          signups_week: signupsWeek,
          activities_today: activitiesToday,
          active_today: activeUsersToday,
          dau_percent: totalUsers > 0 ? Math.round((activeUsersToday / totalUsers) * 100) : 0,
          avg_activities_per_user: totalUsers > 0 ? (totalActivities / totalUsers).toFixed(1) : 0,
        },
        top_fans: topFans.map((u, i) => ({
          rank: i + 1,
          display_name: u.display_name,
          username: u.username,
          favorite_club: u.favorite_club,
          total_score: u.total_score,
          level: u.level,
          joined: u.created_at,
        })),
        clubs: clubAggregation.map(c => ({
          name: c._id,
          fans: c.fans,
          total_score: c.totalScore,
        })),
        activities: activityAggregation.map(a => ({
          type: a._id,
          count: a.count,
          total_points: a.totalPoints,
        })),
        recent_signups: recentSignups.map(u => ({
          display_name: u.display_name,
          username: u.username,
          favorite_club: u.favorite_club,
          created_at: u.created_at,
          total_score: u.total_score,
          level: u.level,
        })),
      });
    }

    // Admin: List all users (with pagination)
    if (pathname.endsWith("/admin/users") && req.method === "GET") {
      const decoded = verifyToken(req);
      if (!isAdmin(decoded)) return res.status(403).json({ error: "Forbidden - admin only" });

      const queryString = url.includes("?") ? url.split("?")[1] : "";
      const params = new URLSearchParams(queryString);
      const page = Math.max(1, parseInt(params.get("page") || "1"));
      const limit = Math.min(parseInt(params.get("limit") || "50"), 200);
      const search = params.get("search") || "";
      const club = params.get("club") || "";

      const query = {};
      if (search) {
        query.$or = [
          { display_name: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }
      if (club) query.favorite_club = club;

      const [users, total] = await Promise.all([
        User.find(query)
          .sort({ created_at: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .select("display_name username email favorite_club total_score level created_at"),
        User.countDocuments(query),
      ]);

      return res.status(200).json({
        users: users.map(u => ({
          id: u._id.toString(),
          display_name: u.display_name,
          username: u.username,
          email: u.email,
          favorite_club: u.favorite_club,
          total_score: u.total_score,
          level: u.level,
          created_at: u.created_at,
        })),
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      });
    }

    // Admin: Check if current user is admin (used by frontend)
    if (pathname.endsWith("/admin/check") && req.method === "GET") {
      const decoded = verifyToken(req);
      return res.status(200).json({
        is_admin: isAdmin(decoded),
        admin_emails_configured: ADMIN_EMAILS.length > 0,
      });
    }

    // ========================================================================
    // ARTICLE ENDPOINTS (Voice publishing)
    // ========================================================================

    // Helper: generate unique article slug
    async function ensureUniqueArticleSlug(title) {
      let baseSlug = slugifyName(title);
      if (!baseSlug) baseSlug = "article";
      let slug = baseSlug;
      let counter = 0;
      while (await Article.findOne({ slug })) {
        counter++;
        slug = `${baseSlug}-${counter}`;
      }
      return slug;
    }

    // Helper: find expert from token
    async function findExpertFromToken(decoded) {
      if (!decoded) return null;
      const user = await User.findById(decoded.userId);
      if (!user) return null;
      let expert = await Expert.findOne({ user_id: decoded.userId, status: "active" });
      if (!expert) {
        const application = await ExpertApplication.findOne({
          email: user.email.toLowerCase(),
          status: "approved",
        });
        if (application && application.approved_expert_id) {
          expert = await Expert.findById(application.approved_expert_id);
        }
      }
      return expert && expert.status === "active" ? expert : null;
    }

    // Create article (expert only)
    if (pathname.endsWith("/experts/articles") && req.method === "POST") {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });
      const expert = await findExpertFromToken(decoded);
      if (!expert) return res.status(403).json({ error: "Expert access required" });

      const { title, content, summary, tags, club_ids, status: articleStatus } = req.body || {};
      if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required" });
      }
      if (content.length < 50) {
        return res.status(400).json({ error: "Content must be at least 50 characters" });
      }

      const slug = await ensureUniqueArticleSlug(title);
      const now = new Date();
      const isPublished = articleStatus === "published";

      const article = await Article.create({
        expert_id: expert._id,
        title: title.trim(),
        slug,
        content: content.trim(),
        summary: (summary || "").trim(),
        tags: Array.isArray(tags) ? tags.map(t => t.trim()).filter(Boolean) : [],
        club_ids: Array.isArray(club_ids) ? club_ids.filter(Boolean) : [],
        status: isPublished ? "published" : "draft",
        published_at: isPublished ? now : null,
        created_at: now,
        updated_at: now,
      });

      return res.status(201).json({
        message: isPublished ? "Article published" : "Draft saved",
        article: {
          id: article._id.toString(),
          slug: article.slug,
          title: article.title,
          status: article.status,
        },
      });
    }

    // List own articles (expert only)
    if (pathname.endsWith("/experts/articles") && req.method === "GET") {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });
      const expert = await findExpertFromToken(decoded);
      if (!expert) return res.status(403).json({ error: "Expert access required" });

      const articles = await Article.find({ expert_id: expert._id })
        .sort({ updated_at: -1 })
        .select("title slug summary tags status views published_at created_at updated_at");

      return res.status(200).json({
        articles: articles.map(a => ({
          id: a._id.toString(),
          title: a.title,
          slug: a.slug,
          summary: a.summary,
          tags: a.tags,
          status: a.status,
          views: a.views,
          published_at: a.published_at,
          created_at: a.created_at,
          updated_at: a.updated_at,
        })),
      });
    }

    // Update article (expert only, own articles)
    if (pathname.match(/\/experts\/articles\/[^\/]+$/) && req.method === "PATCH") {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });
      const expert = await findExpertFromToken(decoded);
      if (!expert) return res.status(403).json({ error: "Expert access required" });

      const articleId = pathname.split("/").pop();
      const article = await Article.findById(articleId);
      if (!article) return res.status(404).json({ error: "Article not found" });
      if (article.expert_id.toString() !== expert._id.toString()) {
        return res.status(403).json({ error: "You can only edit your own articles" });
      }

      const data = req.body || {};
      const allowedFields = ["title", "content", "summary", "tags", "club_ids", "status"];
      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          if (field === "tags") {
            article.tags = Array.isArray(data.tags) ? data.tags.map(t => t.trim()).filter(Boolean) : [];
          } else if (field === "club_ids") {
            article.club_ids = Array.isArray(data.club_ids) ? data.club_ids.filter(Boolean) : [];
          } else if (field === "status") {
            if (data.status === "published" && article.status !== "published") {
              article.status = "published";
              article.published_at = new Date();
            } else if (data.status === "draft") {
              article.status = "draft";
            }
          } else {
            article[field] = String(data[field]).trim();
          }
        }
      }

      article.updated_at = new Date();
      await article.save();

      return res.status(200).json({
        message: "Article updated",
        article: {
          id: article._id.toString(),
          slug: article.slug,
          title: article.title,
          status: article.status,
        },
      });
    }

    // Delete article (expert only, own articles)
    if (pathname.match(/\/experts\/articles\/[^\/]+$/) && req.method === "DELETE") {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });
      const expert = await findExpertFromToken(decoded);
      if (!expert) return res.status(403).json({ error: "Expert access required" });

      const articleId = pathname.split("/").pop();
      const article = await Article.findById(articleId);
      if (!article) return res.status(404).json({ error: "Article not found" });
      if (article.expert_id.toString() !== expert._id.toString()) {
        return res.status(403).json({ error: "You can only delete your own articles" });
      }

      await Article.findByIdAndDelete(articleId);
      return res.status(200).json({ message: "Article deleted" });
    }

    // Public: List published articles
    if (pathname.endsWith("/articles") && req.method === "GET" && !pathname.includes("/experts/")) {
      const params = new URL(req.url, `http://${req.headers.host}`).searchParams;
      const limit = Math.min(parseInt(params.get("limit") || "20"), 50);
      const offset = parseInt(params.get("offset") || "0");
      const tag = params.get("tag");
      const expert_slug = params.get("expert");

      const query = { status: "published" };
      if (tag) query.tags = tag;
      if (expert_slug) {
        const exp = await Expert.findOne({ slug: expert_slug, status: "active" });
        if (exp) query.expert_id = exp._id;
      }

      const [articles, total] = await Promise.all([
        Article.find(query)
          .sort({ published_at: -1 })
          .skip(offset)
          .limit(limit)
          .populate("expert_id", "full_name display_name slug expert_type tier profile_pic"),
        Article.countDocuments(query),
      ]);

      return res.status(200).json({
        articles: articles.map(a => ({
          id: a._id.toString(),
          title: a.title,
          slug: a.slug,
          summary: a.summary,
          tags: a.tags,
          views: a.views,
          published_at: a.published_at,
          expert: a.expert_id ? {
            full_name: a.expert_id.full_name,
            display_name: a.expert_id.display_name,
            slug: a.expert_id.slug,
            expert_type: a.expert_id.expert_type,
            tier: a.expert_id.tier,
            profile_pic: a.expert_id.profile_pic,
          } : null,
        })),
        meta: { total, limit, offset },
      });
    }

    // Public: Get single article by slug
    if (pathname.match(/\/articles\/[a-z0-9-]+$/) && req.method === "GET" && !pathname.includes("/experts/")) {
      const slug = pathname.split("/").pop();
      const article = await Article.findOne({ slug, status: "published" })
        .populate("expert_id", "full_name display_name slug expert_type tier profile_pic current_role");

      if (!article) return res.status(404).json({ error: "Article not found" });

      // Increment views
      article.views += 1;
      await article.save();

      return res.status(200).json({
        article: {
          id: article._id.toString(),
          title: article.title,
          slug: article.slug,
          content: article.content,
          summary: article.summary,
          tags: article.tags,
          views: article.views,
          published_at: article.published_at,
          created_at: article.created_at,
          expert: article.expert_id ? {
            full_name: article.expert_id.full_name,
            display_name: article.expert_id.display_name,
            slug: article.expert_id.slug,
            expert_type: article.expert_id.expert_type,
            tier: article.expert_id.tier,
            profile_pic: article.expert_id.profile_pic,
            current_role: article.expert_id.current_role,
          } : null,
        },
      });
    }

    // ========================================================================
    // REPORT ENDPOINTS (Ambassador moderation)
    // ========================================================================

    // Submit report (ambassador experts only)
    if (pathname.endsWith("/experts/reports") && req.method === "POST") {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });
      const expert = await findExpertFromToken(decoded);
      if (!expert) return res.status(403).json({ error: "Expert access required" });
      if (expert.expert_type !== "ambassador") {
        return res.status(403).json({ error: "Ambassador role required for moderation" });
      }

      const { target_type, target_id, target_name, reason, details } = req.body || {};
      if (!target_type || !target_id || !reason) {
        return res.status(400).json({ error: "target_type, target_id, and reason are required" });
      }
      if (!["activity", "user", "endorsement", "article", "club"].includes(target_type)) {
        return res.status(400).json({ error: "Invalid target_type" });
      }
      if (reason.length < 10) {
        return res.status(400).json({ error: "Reason must be at least 10 characters" });
      }

      // Check for duplicate recent report
      const recentDupe = await Report.findOne({
        reporter_expert_id: expert._id,
        target_type,
        target_id,
        status: { $in: ["pending", "reviewing"] },
      });
      if (recentDupe) {
        return res.status(409).json({ error: "You already have an open report for this item" });
      }

      const report = await Report.create({
        reporter_expert_id: expert._id,
        target_type,
        target_id,
        target_name: (target_name || "").trim(),
        reason: reason.trim(),
        details: (details || "").trim(),
      });

      return res.status(201).json({
        message: "Report submitted",
        report: { id: report._id.toString(), status: report.status },
      });
    }

    // List own reports (ambassador only)
    if (pathname.endsWith("/experts/reports") && req.method === "GET") {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });
      const expert = await findExpertFromToken(decoded);
      if (!expert) return res.status(403).json({ error: "Expert access required" });

      const reports = await Report.find({ reporter_expert_id: expert._id })
        .sort({ created_at: -1 })
        .limit(50);

      return res.status(200).json({
        reports: reports.map(r => ({
          id: r._id.toString(),
          target_type: r.target_type,
          target_id: r.target_id,
          target_name: r.target_name,
          reason: r.reason,
          details: r.details,
          status: r.status,
          resolution_note: r.resolution_note,
          resolved_at: r.resolved_at,
          created_at: r.created_at,
        })),
      });
    }

    // Admin: list all reports
    if (pathname.endsWith("/admin/reports") && req.method === "GET") {
      const decoded = verifyToken(req);
      if (!isAdmin(decoded)) return res.status(403).json({ error: "Admin access required" });

      const params = new URL(req.url, `http://${req.headers.host}`).searchParams;
      const status = params.get("status");
      const query = {};
      if (status) query.status = status;

      const reports = await Report.find(query)
        .sort({ created_at: -1 })
        .limit(100)
        .populate("reporter_expert_id", "full_name display_name slug expert_type tier");

      return res.status(200).json({
        reports: reports.map(r => ({
          id: r._id.toString(),
          reporter: r.reporter_expert_id ? {
            full_name: r.reporter_expert_id.full_name,
            slug: r.reporter_expert_id.slug,
            tier: r.reporter_expert_id.tier,
          } : null,
          target_type: r.target_type,
          target_id: r.target_id,
          target_name: r.target_name,
          reason: r.reason,
          details: r.details,
          status: r.status,
          resolution_note: r.resolution_note,
          resolved_by: r.resolved_by,
          resolved_at: r.resolved_at,
          created_at: r.created_at,
        })),
        counts: {
          pending: await Report.countDocuments({ status: "pending" }),
          reviewing: await Report.countDocuments({ status: "reviewing" }),
          resolved: await Report.countDocuments({ status: "resolved" }),
          dismissed: await Report.countDocuments({ status: "dismissed" }),
        },
      });
    }

    // Admin: resolve/dismiss report
    if (pathname.match(/\/admin\/reports\/[^\/]+$/) && req.method === "PATCH") {
      const decoded = verifyToken(req);
      if (!isAdmin(decoded)) return res.status(403).json({ error: "Admin access required" });

      const reportId = pathname.split("/").pop();
      const report = await Report.findById(reportId);
      if (!report) return res.status(404).json({ error: "Report not found" });

      const { status: newStatus, resolution_note } = req.body || {};
      if (!["reviewing", "resolved", "dismissed"].includes(newStatus)) {
        return res.status(400).json({ error: "Status must be reviewing, resolved, or dismissed" });
      }

      report.status = newStatus;
      if (newStatus === "resolved" || newStatus === "dismissed") {
        report.resolved_by = decoded.email;
        report.resolution_note = (resolution_note || "").trim();
        report.resolved_at = new Date();
      }
      await report.save();

      return res.status(200).json({ message: `Report ${newStatus}` });
    }

    return res.status(404).json({ error: "Endpoint not found", path: pathname });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: error.message, type: error.name });
  }
}
