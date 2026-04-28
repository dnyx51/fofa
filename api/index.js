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

const User = mongoose.models.User || mongoose.model("User", userSchema);
const Activity = mongoose.models.Activity || mongoose.model("Activity", activitySchema);

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
        referral_link: `https://fofa-xi.vercel.app/#join?ref=${user.referral_code}`,
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

    return res.status(404).json({ error: "Endpoint not found", path: pathname });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: error.message, type: error.name });
  }
}
