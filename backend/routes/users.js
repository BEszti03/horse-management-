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
    req.user = payload; // { felhasznalo_id, email, szerepkor }
    next();
  } catch {
    return res.status(401).json({ message: "Érvénytelen vagy lejárt token." });
  }
}

// GET /api/users/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user.felhasznalo_id;

    const q = await pool.query(
      `SELECT 
         f.felhasznalo_id,
         f.nev,
         f.email,
         f.szerepkor,
         f.lovarda_id,
         l.nev AS lovarda_nev
       FROM felhasznalo f
       LEFT JOIN lovarda l ON l.lovarda_id = f.lovarda_id
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

// PUT /api/users/me  (név + lovarda_id)
router.put("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user.felhasznalo_id;
    const { nev, lovarda_id } = req.body;

    if (!nev || !String(nev).trim()) {
      return res.status(400).json({ message: "A név megadása kötelező." });
    }

    const lovardaIdValue =
      lovarda_id === null || lovarda_id === "" || typeof lovarda_id === "undefined"
        ? null
        : Number(lovarda_id);

    if (lovardaIdValue !== null && Number.isNaN(lovardaIdValue)) {
      return res.status(400).json({ message: "A lovarda_id nem érvényes." });
    }

    // ha nem null, ellenőrizzük létezik-e
    if (lovardaIdValue !== null) {
      const exists = await pool.query("SELECT lovarda_id FROM lovarda WHERE lovarda_id = $1", [
        lovardaIdValue,
      ]);
      if (!exists.rows.length) {
        return res.status(400).json({ message: "A kiválasztott lovarda nem létezik." });
      }
    }

    await pool.query(
      `UPDATE felhasznalo
       SET nev = $1, lovarda_id = $2
       WHERE felhasznalo_id = $3`,
      [String(nev).trim(), lovardaIdValue, userId]
    );

    // visszaadjuk a frissített profilt lovarda névvel
    const q = await pool.query(
      `SELECT 
         f.felhasznalo_id,
         f.nev,
         f.email,
         f.szerepkor,
         f.lovarda_id,
         l.nev AS lovarda_nev
       FROM felhasznalo f
       LEFT JOIN lovarda l ON l.lovarda_id = f.lovarda_id
       WHERE f.felhasznalo_id = $1`,
      [userId]
    );

    return res.json({ message: "Profil frissítve.", user: q.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Szerver hiba.", error: err.message });
  }
});

module.exports = router;
