const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: "No token." });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

// GET /api/stables
router.get("/", async (_req, res) => {
  try {
    const q = await pool.query(`SELECT lovarda_id, nev FROM lovarda ORDER BY nev ASC`);
    res.json({
      stables: q.rows.map((r) => ({ stable_id: r.lovarda_id, name: r.nev })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// POST /api/stables
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Stable name is required." });
    }

    const inserted = await pool.query(
      `INSERT INTO lovarda (nev)
       VALUES ($1)
       RETURNING lovarda_id, nev`,
      [String(name).trim()]
    );

    res.status(201).json({
      message: "Stable created.",
      stable: { stable_id: inserted.rows[0].lovarda_id, name: inserted.rows[0].nev },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

module.exports = router;
