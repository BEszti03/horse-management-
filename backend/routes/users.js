const express = require("express");
const bcrypt = require("bcrypt");
const requireAuth = require("../middleware/requireAuth");
const pool = require("../config/db");
const upload = require("../middleware/upload");
const fs = require("fs/promises");
const path = require("path");

const router = express.Router();

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
         f.profilkep_url,
         l.nev AS lovarda_nev
       FROM felhasznalo f
       LEFT JOIN lovarda l ON l.lovarda_id = f.lovarda_id
       WHERE f.felhasznalo_id = $1`,
      [userId]
    );

    if (!q.rows.length) {
      return res.status(404).json({ message: "Felhasználó nem található." });
    }

    res.json({ user: q.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Szerver hiba.", error: err.message });
  }
});

// PUT /api/users/me
router.put("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user.felhasznalo_id;
    const { nev, email, lovarda_id, current_password, new_password } = req.body;

    if (!nev || !String(nev).trim()) {
      return res.status(400).json({ message: "A név megadása kötelező." });
    }

    if (!email || !String(email).trim()) {
      return res.status(400).json({ message: "Az email megadása kötelező." });
    }

    const emailLower = String(email).toLowerCase().trim();
    if (!emailLower.includes("@")) {
      return res.status(400).json({ message: "Az email formátuma nem megfelelő." });
    }

    const lovardaIdValue =
      lovarda_id === null || lovarda_id === "" || typeof lovarda_id === "undefined"
        ? null
        : Number(lovarda_id);

    if (lovardaIdValue !== null && Number.isNaN(lovardaIdValue)) {
      return res.status(400).json({ message: "A lovarda_id nem érvényes." });
    }

    if (lovardaIdValue !== null) {
      const exists = await pool.query(
        "SELECT lovarda_id FROM lovarda WHERE lovarda_id = $1",
        [lovardaIdValue]
      );
      if (!exists.rows.length) {
        return res.status(400).json({ message: "A kiválasztott lovarda nem létezik." });
      }
    }

    const currentUserQ = await pool.query(
      `SELECT felhasznalo_id, email, jelszo_hash
       FROM felhasznalo
       WHERE felhasznalo_id = $1`,
      [userId]
    );

    if (!currentUserQ.rows.length) {
      return res.status(404).json({ message: "Felhasználó nem található." });
    }

    const currentUser = currentUserQ.rows[0];

    if (emailLower !== String(currentUser.email || "").toLowerCase()) {
      const emailExists = await pool.query(
        `SELECT felhasznalo_id
         FROM felhasznalo
         WHERE lower(email) = lower($1)
           AND felhasznalo_id <> $2`,
        [emailLower, userId]
      );

      if (emailExists.rows.length > 0) {
        return res.status(409).json({ message: "Ezzel az emaillel már létezik felhasználó." });
      }
    }

    let newPasswordHash = null;
    const wantsPasswordChange = Boolean(new_password && String(new_password).trim());
    const hasCurrentPassword = Boolean(current_password && String(current_password).trim());

    if (wantsPasswordChange) {
      if (!hasCurrentPassword) {
        return res.status(400).json({ message: "A jelenlegi jelszó megadása kötelező." });
      }

      if (String(new_password).length < 6) {
        return res.status(400).json({ message: "Az új jelszónak legalább 6 karakternek kell lennie." });
      }

      const ok = await bcrypt.compare(String(current_password), currentUser.jelszo_hash);
      if (!ok) {
        return res.status(401).json({ message: "A jelenlegi jelszó hibás." });
      }

      newPasswordHash = await bcrypt.hash(String(new_password), 12);
    } else if (hasCurrentPassword) {
      return res.status(400).json({ message: "Új jelszó nélkül nem lehet jelszót módosítani." });
    }

    if (newPasswordHash) {
      await pool.query(
        `UPDATE felhasznalo
         SET nev = $1,
             email = $2,
             lovarda_id = $3,
             jelszo_hash = $4
         WHERE felhasznalo_id = $5`,
        [String(nev).trim(), emailLower, lovardaIdValue, newPasswordHash, userId]
      );
    } else {
      await pool.query(
        `UPDATE felhasznalo
         SET nev = $1,
             email = $2,
             lovarda_id = $3
         WHERE felhasznalo_id = $4`,
        [String(nev).trim(), emailLower, lovardaIdValue, userId]
      );
    }

    const q = await pool.query(
      `SELECT 
         f.felhasznalo_id,
         f.nev,
         f.email,
         f.szerepkor,
         f.lovarda_id,
         f.profilkep_url,
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

// POST /api/users/profile/image
router.post(
  "/profile/image",
  requireAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      const userId = req.user.felhasznalo_id;

      if (!req.file) {
        return res.status(400).json({ message: "Nem érkezett kép." });
      }

      const imagePath = `/uploads/users/${req.file.filename}`;

      await pool.query(
        `UPDATE felhasznalo
         SET profilkep_url = $1
         WHERE felhasznalo_id = $2`,
        [imagePath, userId]
      );

      return res.json({
        message: "Profilkép feltöltve.",
        profilkep_url: imagePath,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        message: "Hiba történt a profilkép feltöltésekor.",
        error: err.message,
      });
    }
  }
);

// DELETE /api/users/profile/image
router.delete("/profile/image", requireAuth, async (req, res) => {
  try {
    const userId = req.user.felhasznalo_id;

    const currentImageQ = await pool.query(
      `SELECT profilkep_url
       FROM felhasznalo
       WHERE felhasznalo_id = $1`,
      [userId]
    );

    if (!currentImageQ.rows.length) {
      return res.status(404).json({ message: "Felhasználó nem található." });
    }

    const currentImageUrl = currentImageQ.rows[0].profilkep_url;

    await pool.query(
      `UPDATE felhasznalo
       SET profilkep_url = NULL
       WHERE felhasznalo_id = $1`,
      [userId]
    );

    if (currentImageUrl && String(currentImageUrl).startsWith("/uploads/users/")) {
      const fileName = path.basename(currentImageUrl);
      const filePath = path.join(__dirname, "..", "uploads", "users", fileName);

      try {
        await fs.unlink(filePath);
      } catch (fileErr) {
        if (fileErr.code !== "ENOENT") {
          console.warn("Profilkép fájl törlés sikertelen:", fileErr.message);
        }
      }
    }

    return res.json({
      message: "Profilkép törölve.",
      profilkep_url: null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Hiba történt a profilkép törlésekor.",
      error: err.message,
    });
  }
});

// DELETE /api/users/me
router.delete("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user.felhasznalo_id;

    // Profilkép törlése az adatbázisból
    const userQ = await pool.query(
      `SELECT profilkep_url FROM felhasznalo WHERE felhasznalo_id = $1`,
      [userId]
    );

    if (!userQ.rows.length) {
      return res.status(404).json({ message: "Felhasználó nem található." });
    }

    const profilkepUrl = userQ.rows[0].profilkep_url;

    // Felhasználó törlése
    await pool.query(
      `DELETE FROM felhasznalo WHERE felhasznalo_id = $1`,
      [userId]
    );

    // Profilkép fájl törlése
    if (profilkepUrl && String(profilkepUrl).startsWith("/uploads/users/")) {
      const fileName = path.basename(profilkepUrl);
      const filePath = path.join(__dirname, "..", "uploads", "users", fileName);

      try {
        await fs.unlink(filePath);
      } catch (fileErr) {
        if (fileErr.code !== "ENOENT") {
          console.warn("Profilkép fájl törlés sikertelen:", fileErr.message);
        }
      }
    }

    return res.json({
      message: "Fiók sikeresen törölve.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Hiba történt a fiók törlés során.",
      error: err.message,
    });
  }
});

// GET /api/users/stable-members
router.get("/stable-members", requireAuth, async (req, res) => {
  try {
    const requesterId = req.user.felhasznalo_id;
    const requesterRole = req.user.szerepkor;

    const requesterQ = await pool.query(
      `SELECT lovarda_id
       FROM felhasznalo
       WHERE felhasznalo_id = $1`,
      [requesterId]
    );

    if (!requesterQ.rows.length) {
      return res.status(404).json({ message: "Felhasználó nem található." });
    }

    const requesterStableId = requesterQ.rows[0].lovarda_id;

    // Adminoknál, ha nincs megadott lovarda, listázzuk az összes felhasználót.
    if (requesterRole === "admin" && (requesterStableId === null || typeof requesterStableId === "undefined")) {
      const allUsersQ = await pool.query(
        `SELECT
           f.felhasznalo_id,
           f.nev,
           f.szerepkor,
           f.profilkep_url,
           f.lovarda_id,
           l.nev AS lovarda_nev
         FROM felhasznalo f
         LEFT JOIN lovarda l ON l.lovarda_id = f.lovarda_id
         ORDER BY
           CASE f.szerepkor
             WHEN 'admin' THEN 0
             WHEN 'lovarda_vezeto' THEN 1
             WHEN 'lovas' THEN 2
             ELSE 3
           END,
           lower(f.nev) ASC`
      );

      return res.json({
        stableName: "Összes lovarda",
        members: allUsersQ.rows,
      });
    }

    if (requesterStableId === null || typeof requesterStableId === "undefined") {
      return res.json({ stableName: null, members: [] });
    }

    const stableQ = await pool.query(
      `SELECT nev
       FROM lovarda
       WHERE lovarda_id = $1`,
      [requesterStableId]
    );

    const stableName = stableQ.rows[0]?.nev || null;

    const membersQ = await pool.query(
      `SELECT
         f.felhasznalo_id,
         f.nev,
         f.szerepkor,
         f.profilkep_url,
         f.lovarda_id,
         l.nev AS lovarda_nev
       FROM felhasznalo f
       LEFT JOIN lovarda l ON l.lovarda_id = f.lovarda_id
       WHERE f.lovarda_id = $1
       ORDER BY
         CASE f.szerepkor
           WHEN 'admin' THEN 0
           WHEN 'lovarda_vezeto' THEN 1
           WHEN 'lovas' THEN 2
           ELSE 3
         END,
         lower(f.nev) ASC`,
      [requesterStableId]
    );

    return res.json({
      stableName,
      members: membersQ.rows,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Szerver hiba.", error: err.message });
  }
});

module.exports = router;