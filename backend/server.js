

const express = require("express");
const session = require("express-session");
const path = require("path");

const authRoutes = require("./routes/authRoutes"); // same folder, not "./routes/authRoutes"

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(session({
  secret: "chatwave-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 }
}));

app.use("/api", authRoutes);

// chat.html can only be opened if logged in
app.get("/chat.html", (req, res) => {
  if (req.session.username) {
     res.sendFile(path.join(__dirname, "../frontend/chat.html"));// same folder, not "public/chat.html"
  } else {
    res.redirect("/login.html");
  }
});

// Serve index.html, login.html, glass.css, style.css, authClient.js — all from this same folder
app.use(express.static(path.join(__dirname, "../frontend")));

app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});