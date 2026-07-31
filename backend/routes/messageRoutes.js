// =========================================================
// MESSAGE + USER ROUTES
// Supports private 1-on-1 chat rooms, and a real /users
// route that lists everyone registered in Supabase Auth
// (using the admin/service_role client).
// =========================================================

const express = require("express");
const supabaseAdmin = require("../supabaseAdmin");

const router = express.Router();

// GET /api/users?exclude=you@example.com
// Returns every registered user's email except your own.
router.get("/users", async (req, res) => {
  const excludeEmail = req.query.exclude;

  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) return res.status(500).json({ error: error.message });

  const emails = data.users
    .map(u => u.email)
    .filter(email => email !== excludeEmail);

  res.json({ users: emails });
});

// GET /api/messages?room=general  (or room=alice@x.com__bob@x.com)
router.get("/messages", async (req, res) => {
  const room = req.query.room;
  if (!room) return res.status(400).json({ error: "room is required" });

  const { data, error } = await supabaseAdmin
    .from("messages")
    .select("*")
    .eq("room", room)
    .order("id", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ messages: data });
});

// POST /api/messages  { username, text, room }
router.post("/messages", async (req, res) => {
  const { username, text, room } = req.body;

  if (!username || !text || !text.trim() || !room) {
    return res.status(400).json({ error: "Username, message text, and room required" });
  }

  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const { data, error } = await supabaseAdmin
    .from("messages")
    .insert({ username, text: text.trim(), time, room })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: data });
});

module.exports = router;