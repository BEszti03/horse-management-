const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) return res.status(401).json({ message: "Nincs token." });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // pl: { felhasznalo_id, email, szerepkor }
    next();
  } catch {
    return res.status(401).json({ message: "Érvénytelen vagy lejárt token." });
  }
}

router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user.felhasznalo_id;

    const q = await pool.query(
      `SELECT 
         f.felhasznalo_id,
         f.nev,
         f.email,
         f.szerepkor,
         f.lovarda_id
       FROM felhasznalo f
       WHERE f.felhasznalo_id = $1`,
      [userId]
    );

    if (!q.rows.length) return res.status(404).json({ message: "Felhasználó nem található." });

    res.json({ user: q.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Szerver hiba.", error: err.message });
  }
});

module.exports = router;
