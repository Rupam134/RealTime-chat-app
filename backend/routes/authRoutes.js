// =========================================================
// AUTH ROUTES
// Grouped together using Express's Router, separate from
// server.js. Mounted back in server.js with:
//   app.use("/api", authRoutes)
// =========================================================

const express = require("express");
const bcrypt = require("bcryptjs");

const router = express.Router();

// In-memory "database" — resets when the server restarts
let users = [];

// POST /api/register
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  const existing = users.find(u => u.username === username);
  if (existing) {
    return res.status(409).json({ error: "Username already taken" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  users.push({ username, passwordHash });

  res.json({ message: "Registration successful" });
});

// POST /api/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  req.session.username = username;
  res.json({ message: "Login successful", username });
});

// POST /api/logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

// GET /api/me — lets the frontend check "am I logged in?"
router.get("/me", (req, res) => {
  if (req.session.username) {
    res.json({ loggedIn: true, username: req.session.username });
  } else {
    res.json({ loggedIn: false });
  }
});

module.exports = router;
