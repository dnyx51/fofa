/**
 * Vercel Serverless Function - FOFA Backend API
 * This handles all API requests: auth, profiles, loyalty scoring, activities
 * Location: /api/server.js (or /api/index.js)
 */

import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || "fofa-prod-secret-key-change-this";
const DATA_DIR = "/tmp/fofa-data";

// In-memory database (persists during function execution)
let db = {
  users: {},
  activities: [],
  nextUserId: 1,
  nextActivityId: 1,
};

// ============================================================================
// DATABASE FUNCTIONS
// ============================================================================

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
    console.error("Database initialization error:", e.message);
  }
}

function saveDatabase() {
  try {
    const USERS_FILE = path.join(DATA_DIR, "users.json");
    const ACTIVITIES_FILE = path.join(DATA_DIR, "activities.json");

    fs.writeFileSync(
      USERS_FILE,
      JSON.stringify({ users: db.users, nextUserId: db.nextUserId }, null, 2)
    );

    fs.writeFileSync(
      ACTIVITIES_FILE,
      JSON.stringify({ activities: db.activities, nextActivityId: db.nextActivityId }, null, 2)
    );
  } catch (e) {
    console.error("Database save error:", e.message);
  }
}

function getUserLoyaltyScores(userId) {
  const userActivities = db.activities.filter(a => a.user_id === userId);

  const engagement = userActivities
    .filter(a => a.activity_type === "engagement")
    .reduce((sum, a) => sum + a.points, 0);
  const passion = userActivities
    .filter(a => a.activity_type === "passion")
    .reduce((sum, a) => sum + a.points, 0);
  const knowledge = userActivities
    .filter(a => a.activity_type === "knowledge")
    .reduce((sum, a) => sum + a.points, 0);
  const consistency = userActivities
    .filter(a => a.activity_type === "consistency")
    .reduce((sum, a) => sum + a.points, 0);
  const community = userActivities
    .filter(a => a.activity_type === "community")
    .reduce((sum, a) => sum + a.points, 0);
  const growth = userActivities
    .filter(a => a.activity_type === "growth")
    .reduce((sum, a) => sum + a.points, 0);

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

// ============================================================================
// MIDDLEWARE
// ============================================================================

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================

const app = express();
app.use(express.json());
app.use(cors());

// Initialize database on startup
initDatabase();

// ============================================================================
// AUTH ROUTES
// ============================================================================

app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, username, display_name, favorite_club } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: "Email, password, and username required" });
    }

    const exists = Object.values(db.users).find(
      u => u.email === email || u.username === username
    );

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

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: userId,
        email,
        username,
        display_name: display_name || username,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

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

    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// USER ROUTES
// ============================================================================

app.get("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const user = db.users[req.user.userId];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const scores = getUserLoyaltyScores(req.user.userId);

    res.json({
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const { display_name, bio, favorite_club, profile_pic } = req.body;
    const user = db.users[req.user.userId];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (display_name) user.display_name = display_name;
    if (bio !== undefined) user.bio = bio;
    if (favorite_club) user.favorite_club = favorite_club;
    if (profile_pic) user.profile_pic = profile_pic;

    user.updated_at = new Date().toISOString();
    saveDatabase();

    res.json({
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// LOYALTY ROUTES
// ============================================================================

app.post("/api/loyalty/activity", authenticateToken, async (req, res) => {
  try {
    const { activity_type, description, points } = req.body;

    if (!activity_type || !points) {
      return res.status(400).json({ error: "activity_type and points required" });
    }

    const activity = {
      id: db.nextActivityId++,
      user_id: req.user.userId,
      activity_type,
      description: description || "",
      points,
      created_at: new Date().toISOString(),
    };

    db.activities.push(activity);
    saveDatabase();

    const scores = getUserLoyaltyScores(req.user.userId);

    res.json({
      message: "Activity logged",
      loyalty: scores,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/loyalty/scores", authenticateToken, async (req, res) => {
  try {
    const scores = getUserLoyaltyScores(req.user.userId);
    const recent_activities = db.activities
      .filter(a => a.user_id === req.user.userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 20);

    res.json({
      scores,
      recent_activities,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/loyalty/activities", authenticateToken, async (req, res) => {
  try {
    const activities = db.activities
      .filter(a => a.user_id === req.user.userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ activities });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "FOFA API is running on Vercel",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// EXPORT FOR VERCEL
// ============================================================================

export default app;
