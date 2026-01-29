const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const pool = require("../config/db");

const router = express.Router();

const ALLOWED_ROLES = new Set(["lovas", "lovarda_vezeto"]);

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

// PUT /api/users/me  (név + lovarda_id + szerepkor)
router.put("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user.felhasznalo_id;
    const { nev, lovarda_id, szerepkor } = req.body;

    if (!nev || !String(nev).trim()) {
      return res.status(400).json({ message: "A név megadása kötelező." });
    }

    if (!szerepkor || !ALLOWED_ROLES.has(String(szerepkor))) {
      return res.status(400).json({
        message: "Érvénytelen szerepkör. Csak: lovas, lovarda_vezeto",
      });
    }

    const lovardaIdValue =
      lovarda_id === null || lovarda_id === "" || typeof lovarda_id === "undefined"
        ? null
        : Number(lovarda_id);

    if (lovardaIdValue !== null && Number.isNaN(lovardaIdValue)) {
      return res.status(400).json({ message: "A lovarda_id nem érvényes." });
    }

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
       SET nev = $1, lovarda_id = $2, szerepkor = $3
       WHERE felhasznalo_id = $4`,
      [String(nev).trim(), lovardaIdValue, String(szerepkor), userId]
    );

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
