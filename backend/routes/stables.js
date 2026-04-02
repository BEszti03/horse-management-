const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const pool = require("../config/db");
const jwt = require("jsonwebtoken");

const router = express.Router();

// GET /api/stables
router.get("/", async (_req, res) => {
  try {
    const q = await pool.query(`SELECT lovarda_id, nev FROM lovarda ORDER BY nev ASC`);
    res.json({
      stables: q.rows.map((r) => ({ stable_id: r.lovarda_id, name: r.nev })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Szerver hiba.", error: err.message });
  }
});

// POST /api/stables
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "A lovarda neve kötelező." });
    }

    const inserted = await pool.query(
      `INSERT INTO lovarda (nev)
       VALUES ($1)
       RETURNING lovarda_id, nev`,
      [String(name).trim()]
    );

    const stableId = inserted.rows[0].lovarda_id;
    const userId = req.user.felhasznalo_id;

    const updatedUser = await pool.query(
      `UPDATE felhasznalo
       SET lovarda_id = $1,
           szerepkor = CASE
             WHEN szerepkor = 'admin' THEN szerepkor
             ELSE 'lovarda_vezeto'
           END
       WHERE felhasznalo_id = $2
       RETURNING felhasznalo_id, nev, email, szerepkor, lovarda_id`,
      [stableId, userId]
    );

    const user = updatedUser.rows[0];
    const token = jwt.sign(
      {
        felhasznalo_id: user.felhasznalo_id,
        email: user.email,
        szerepkor: user.szerepkor,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Lovarda létrehozva.",
      stable: { stable_id: inserted.rows[0].lovarda_id, name: inserted.rows[0].nev },
      user,
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Szerver hiba.", error: err.message });
  }
});

module.exports = router;
