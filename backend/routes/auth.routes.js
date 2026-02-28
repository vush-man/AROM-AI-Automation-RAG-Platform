const express = require("express");
const router = express.Router();
const db = require("../db/sqlite");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validate required fields
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Passwords must match
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    // Check unique email
    const emailExists = await new Promise((resolve, reject) => {
      db.get(
        "SELECT id FROM users WHERE email = ?",
        [email.toLowerCase()],
        (err, row) => {
          if (err) return reject(err);
          resolve(!!row);
        }
      );
    });

    if (emailExists) {
      return res.status(409).json({ error: "Email already in use" });
    }

    // Hash password (never store plain passwords or confirmPassword)
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user (store password_hash only)
    const inserted = await new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
        [name, email.toLowerCase(), password_hash],
        function (err) {
          if (err) return reject(err);
          resolve({ id: this.lastID });
        }
      );
    });

    return res.status(201).json({ success: true, userId: inserted.id });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await new Promise((resolve, reject) => {
      db.get(
        "SELECT id, username, email, password_hash FROM users WHERE email = ?",
        [email.toLowerCase()],
        (err, row) => {
          if (err) return reject(err);
          resolve(row);
        }
      );
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
