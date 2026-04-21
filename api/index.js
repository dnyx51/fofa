// Vercel Serverless Function - Single API handler
// This handles all /api/* routes

import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import fs from "fs";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET || "fofa-prod-secret-key-change-this";
const DATA_DIR = "/tmp/fofa-data";

// Database (in-memory + file persistence)
let db = {
  users: {},
  activities: [],
  nextUserId: 1,
  nextActivityId: 1,
};

function initDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const USERS_FILE = path.join(DATA_DIR, "users.json");
    const ACTIVITIES_FILE = path.join(DATA_DIR, "activities.json");

    if (fs.existsSync(USERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
      db.users = data.users || {};
      db.nextUserId = data.nextUserId || Object.keys(db.users).length + 1;
    }
    if (fs.existsSync(ACTIVITIES_FILE)) {
      const data = JSON.parse(fs.readFileSync(ACTIVITIES_FILE, "utf-8"));
      db.activities = data.activities || [];
      db.nextActivityId = data.nextActivityId || db.activities.length + 1;
    }
  } catch (e) {
    console.error("DB init error:", e.message);
  }
}

function saveDatabase() {
  try {
    const USERS_FILE = path.join(DATA_DIR, "users.json");
    const ACTIVITIES_FILE = path.join(DATA_DIR, "activities.json");
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: db.users, nextUserId: db.nextUserId }, null, 2));
    fs.writeFileSync(ACTIVITIES_FILE, JSON.stringify({ activities: db.activities, nextActivityId: db.nextActivityId }, null, 2));
  } catch (e) {
    console.error("DB save error:", e.message);
  }
}

function getUserLoyaltyScores(userId) {
  const userActivities = db.activities.filter(a => a.user_id === userId);
  const engagement = userActivities.filter(a => a.activity_type === "engagement").reduce((s, a) => s + a.points, 0);
  const passion = userActivities.filter(a => a.activity_type === "passion").reduce((s, a) => s + a.points, 0);
  const knowledge = userActivities.filter(a => a.activity_type === "knowledge").reduce((s, a) => s + a.points, 0);
  const consistency = userActivities.filter(a => a.activity_type === "consistency").reduce((s, a) => s + a.points, 0);
  const community = userActivities.filter(a => a.activity_type === "community").reduce((s, a) => s + a.points, 0);
  const growth = userActivities.filter(a => a.activity_type === "growth").reduce((s, a) => s + a.points, 0);
  const total = engagement + passion + knowledge + consistency + community + growth;

  let level = "apprentice";
  if (total >= 5000) level = "legend";
  else if (total >= 3000) level = "master";
  else if (total >= 1500) level = "veteran";
  else if (total >= 500) level = "devotee";
  else if (total >= 100) level = "supporter";

  return {
    engagement_score: engagement,
    passion_score: passion,
    knowledge_score: knowledge,
    consistency_score: consistency,
    community_score: community,
    growth_score: growth,
    total_score: total,
    level,
    updated_at: new Date().toISOString(),
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

// Main Vercel handler
export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Initialize DB
  initDatabase();

  // Get path from URL
  const url = req.url || "";
  const pathname = url.split("?")[0];

  try {
    // ============ HEALTH CHECK ============
    if (pathname === "/api/health" || pathname.endsWith("/health")) {
      return res.status(200).json({
        status: "ok",
        message: "FOFA API is running on Vercel",
        timestamp: new Date().toISOString(),
      });
    }

    // ============ REGISTER ============
    if (pathname.endsWith("/auth/register") && req.method === "POST") {
      const { email, password, username, display_name, favorite_club } = req.body || {};

      if (!email || !password || !username) {
        return res.status(400).json({ error: "Email, password, and username required" });
      }

      const exists = Object.values(db.users).find(u => u.email === email || u.username === username);
      if (exists) {
        return res.status(409).json({ error: "Email or username already exists" });
      }

      const hashedPassword = await bcryptjs.hash(password, 10);
      const userId = db.nextUserId++;

      db.users[userId] = {
        id: userId,
        email,
        password: hashedPassword,
        username,
        display_name: display_name || username,
        favorite_club: favorite_club || "",
        profile_pic: null,
        bio: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      saveDatabase();

      const token = jwt.sign({ userId, email, username }, JWT_SECRET, { expiresIn: "30d" });

      return res.status(201).json({
        message: "User registered successfully",
        token,
        user: { id: userId, email, username, display_name: display_name || username },
      });
    }

    // ============ LOGIN ============
    if (pathname.endsWith("/auth/login") && req.method === "POST") {
      const { email, password } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const user = Object.values(db.users).find(u => u.email === email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const validPassword = await bcryptjs.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = jwt.sign({ userId: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: "30d" });

      return res.status(200).json({
        message: "Logged in successfully",
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          display_name: user.display_name,
          favorite_club: user.favorite_club,
        },
      });
    }

    // ============ GET PROFILE ============
    if (pathname.endsWith("/user/profile") && req.method === "GET") {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });

      const user = db.users[decoded.userId];
      if (!user) return res.status(404).json({ error: "User not found" });

      const scores = getUserLoyaltyScores(decoded.userId);

      return res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          display_name: user.display_name,
          favorite_club: user.favorite_club,
          bio: user.bio,
          profile_pic: user.profile_pic,
          created_at: user.created_at,
        },
        loyalty: scores,
      });
    }

    // ============ UPDATE PROFILE ============
    if (pathname.endsWith("/user/profile") && req.method === "PUT") {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });

      const { display_name, bio, favorite_club, profile_pic } = req.body || {};
      const user = db.users[decoded.userId];
      if (!user) return res.status(404).json({ error: "User not found" });

      if (display_name) user.display_name = display_name;
      if (bio !== undefined) user.bio = bio;
      if (favorite_club) user.favorite_club = favorite_club;
      if (profile_pic) user.profile_pic = profile_pic;
      user.updated_at = new Date().toISOString();

      saveDatabase();

      return res.status(200).json({
        message: "Profile updated",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          display_name: user.display_name,
          favorite_club: user.favorite_club,
          bio: user.bio,
          profile_pic: user.profile_pic,
        },
      });
    }

    // ============ LOG ACTIVITY ============
    if (pathname.endsWith("/loyalty/activity") && req.method === "POST") {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });

      const { activity_type, description, points } = req.body || {};
      if (!activity_type || !points) {
        return res.status(400).json({ error: "activity_type and points required" });
      }

      const activity = {
        id: db.nextActivityId++,
        user_id: decoded.userId,
        activity_type,
        description: description || "",
        points,
        created_at: new Date().toISOString(),
      };

      db.activities.push(activity);
      saveDatabase();

      const scores = getUserLoyaltyScores(decoded.userId);
      return res.status(200).json({ message: "Activity logged", loyalty: scores });
    }

    // ============ GET SCORES ============
    if (pathname.endsWith("/loyalty/scores") && req.method === "GET") {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });

      const scores = getUserLoyaltyScores(decoded.userId);
      const recent_activities = db.activities
        .filter(a => a.user_id === decoded.userId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 20);

      return res.status(200).json({ scores, recent_activities });
    }

    // ============ GET ACTIVITIES ============
    if (pathname.endsWith("/loyalty/activities") && req.method === "GET") {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });

      const activities = db.activities
        .filter(a => a.user_id === decoded.userId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return res.status(200).json({ activities });
    }

    // Not found
    return res.status(404).json({ error: "Endpoint not found", path: pathname });
  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: error.message });
  }
}
