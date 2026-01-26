const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { felhasznalo_id: user.felhasznalo_id, email: user.email, szerepkor: user.szerepkor },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    let { nev, email, jelszo } = req.body;

    if (!nev || !email || !jelszo) {
      return res.status(400).json({ message: "Hiányzó mező(k)." });
    }

    const emailLower = String(email).toLowerCase().trim();

    const exists = await pool.query(
      "SELECT felhasznalo_id FROM felhasznalo WHERE lower(email) = lower($1)",
      [emailLower]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({ message: "Ezzel az emaillel már létezik felhasználó." });
    }

    const jelszo_hash = await bcrypt.hash(jelszo, 12);

    const inserted = await pool.query(
      `INSERT INTO felhasznalo (nev, email, jelszo_hash, lovarda_id)
       VALUES ($1, $2, $3, $4)
       RETURNING felhasznalo_id, nev, email, szerepkor, lovarda_id`,
      [nev, emailLower, jelszo_hash, null]
    );

    const user = inserted.rows[0];
    const token = signToken(user);

    return res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Szerver hiba.", error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    let { email, jelszo } = req.body;

    if (!email || !jelszo) {
      return res.status(400).json({ message: "Email és jelszó kötelező." });
    }

    email = String(email).toLowerCase().trim();

    const found = await pool.query(
      `SELECT felhasznalo_id, nev, email, szerepkor, lovarda_id, jelszo_hash
       FROM felhasznalo
       WHERE lower(email) = lower($1)`,
      [email]
    );

    if (!found.rows.length) {
      return res.status(401).json({ message: "Hibás email vagy jelszó." });
    }

    const user = found.rows[0];
    const ok = await bcrypt.compare(jelszo, user.jelszo_hash);
    if (!ok) return res.status(401).json({ message: "Hibás email vagy jelszó." });

    const token = signToken(user);
    delete user.jelszo_hash;

    return res.json({ user, token });
  } catch (err) {
  console.error(err);
  return res.status(500).json({ message: "Szerver hiba.", error: err.message });
}
});

module.exports = router;
