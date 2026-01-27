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
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Érvénytelen token." });
  }
}

// GET /api/horses - saját lovak (DATE -> text)
router.get("/", requireAuth, async (req, res) => {
  const felhasznaloId = req.user.felhasznalo_id;

  try {
    const result = await pool.query(
      `SELECT 
         lo_id, nev, fajta,
         szuletesi_ido::text AS szuletesi_ido,
         felhasznalo_id
       FROM lo
       WHERE felhasznalo_id = $1
       ORDER BY lo_id DESC`,
      [felhasznaloId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Hiba a lovak lekérésekor." });
  }
});

// POST /api/horses - ló felvétele (mentés DATE, visszaadás text)
router.post("/", requireAuth, async (req, res) => {
  const { nev, fajta, szuletesi_ido } = req.body;
  const felhasznaloId = req.user.felhasznalo_id;

  if (!nev) {
    return res.status(400).json({ message: "A ló neve kötelező." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO lo (nev, fajta, szuletesi_ido, felhasznalo_id)
       VALUES ($1, $2, $3::date, $4)
       RETURNING 
         lo_id, nev, fajta,
         szuletesi_ido::text AS szuletesi_ido,
         felhasznalo_id`,
      [nev, fajta || null, szuletesi_ido || null, felhasznaloId]
    );

    res.status(201).json({
      message: "Ló sikeresen hozzáadva",
      lo: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Hiba a ló felvételekor." });
  }
});

// PUT /api/horses/:id - szerkesztés (mentés DATE, visszaadás text)
router.put("/:id", requireAuth, async (req, res) => {
  const loId = Number(req.params.id);
  const felhasznaloId = req.user.felhasznalo_id;
  const { nev, fajta, szuletesi_ido } = req.body;

  if (!nev) {
    return res.status(400).json({ message: "A ló neve kötelező." });
  }

  try {
    const result = await pool.query(
      `UPDATE lo
       SET nev = $1,
           fajta = $2,
           szuletesi_ido = $3::date
       WHERE lo_id = $4 AND felhasznalo_id = $5
       RETURNING
         lo_id, nev, fajta,
         szuletesi_ido::text AS szuletesi_ido,
         felhasznalo_id`,
      [nev, fajta || null, szuletesi_ido || null, loId, felhasznaloId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Nincs ilyen ló, vagy nincs jogosultságod." });
    }

    res.json({ message: "Ló sikeresen frissítve", lo: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Hiba a ló frissítésekor." });
  }
});

// DELETE /api/horses/:id - törlés
router.delete("/:id", requireAuth, async (req, res) => {
  const loId = Number(req.params.id);
  const felhasznaloId = req.user.felhasznalo_id;

  try {
    const result = await pool.query(
      `DELETE FROM lo
       WHERE lo_id = $1 AND felhasznalo_id = $2
       RETURNING lo_id`,
      [loId, felhasznaloId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Nincs ilyen ló, vagy nincs jogosultságod." });
    }

    res.json({ message: "Ló törölve", lo_id: result.rows[0].lo_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Hiba a ló törlésekor." });
  }
});

module.exports = router;
