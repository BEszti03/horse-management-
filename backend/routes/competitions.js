const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Nincs token" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { felhasznalo_id, email, szerepkor }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Érvénytelen token" });
  }
}

/* =========================
   GET – összes verseny
========================= */
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.felhasznalo_id;

    const result = await pool.query(
      `
      SELECT 
        v.verseny_id,
        v.nev,
        v.datum::text AS datum,
        l.nev AS lovarda_nev,
        EXISTS (
          SELECT 1 
          FROM verseny_felhasznalo vf 
          WHERE vf.verseny_id = v.verseny_id 
            AND vf.felhasznalo_id = $1
        ) AS jelentkezett
      FROM verseny v
      JOIN lovarda l ON l.lovarda_id = v.lovarda_id
      ORDER BY v.datum
      `,
      [userId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Hiba a versenyek lekérésekor" });
  }
});

/* =========================
   POST – verseny létrehozás
   (csak lovarda_vezeto)
========================= */
router.post("/", requireAuth, async (req, res) => {
  if (req.user.szerepkor !== "lovarda_vezeto") {
    return res.status(403).json({ error: "Nincs jogosultság" });
  }

  const { nev, datum } = req.body || {};
  if (!nev || !datum) {
    return res.status(400).json({ error: "Hiányzó mező(k): nev, datum" });
  }

  try {
    const userId = req.user.felhasznalo_id;

    const userRes = await pool.query(
      "SELECT lovarda_id FROM felhasznalo WHERE felhasznalo_id = $1",
      [userId]
    );

    const lovardaId = userRes.rows[0]?.lovarda_id;

    if (!lovardaId) {
      return res.status(400).json({ error: "A felhasználó nincs lovardához rendelve" });
    }

    await pool.query(
      `
      INSERT INTO verseny (nev, datum, lovarda_id)
      VALUES ($1, $2, $3)
      `,
      [nev, datum, lovardaId]
    );

    return res.status(201).json({ message: "Verseny létrehozva" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Verseny létrehozása sikertelen" });
  }
});

/* =========================
   POST – jelentkezés versenyre
   (csak lovas)
========================= */
router.post("/:id/signup", requireAuth, async (req, res) => {
  if (req.user.szerepkor !== "lovas") {
    return res.status(403).json({ error: "Csak lovas jelentkezhet" });
  }

  const versenyId = req.params.id;
  const { lo_id } = req.body || {};

  try {
    const userId = req.user.felhasznalo_id;

    // Jelentkezés a versenyre
    await pool.query(
      `
      INSERT INTO verseny_felhasznalo (verseny_id, felhasznalo_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      `,
      [versenyId, userId]
    );

    // Ló választása a felhasználó lovai közül
    if (lo_id) {
      const ownHorse = await pool.query(
        `SELECT lo_id FROM lo WHERE lo_id = $1 AND felhasznalo_id = $2`,
        [lo_id, userId]
      );

      if (ownHorse.rowCount === 0) {
        return res.status(400).json({ error: "Ez a ló nem a te lovad." });
      }

      // Constraint nélkül is biztonságos duplikáció-védelem
      await pool.query(
        `
        INSERT INTO verseny_lo (verseny_id, lo_id)
        SELECT $1, $2
        WHERE NOT EXISTS (
          SELECT 1 FROM verseny_lo WHERE verseny_id = $1 AND lo_id = $2
        )
        `,
        [versenyId, lo_id]
      );
    }

    return res.json({ message: "Sikeres jelentkezés" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Jelentkezés sikertelen" });
  }
});

/* =========================
   DELETE – jelentkezés visszavonása
   (csak lovas)
========================= */
router.delete("/:id/signup", requireAuth, async (req, res) => {
  if (req.user.szerepkor !== "lovas") {
    return res.status(403).json({ error: "Csak lovas vonhatja vissza a jelentkezést" });
  }

  const versenyId = req.params.id;

  try {
    const userId = req.user.felhasznalo_id;

    // jelentkezés törlése
    await pool.query(
      `DELETE FROM verseny_felhasznalo WHERE verseny_id = $1 AND felhasznalo_id = $2`,
      [versenyId, userId]
    );

    // a felhasználóhoz tartozó ló törlése a versenyből
    await pool.query(
      `
      DELETE FROM verseny_lo vl
      USING lo
      WHERE vl.verseny_id = $1
        AND vl.lo_id = lo.lo_id
        AND lo.felhasznalo_id = $2
      `,
      [versenyId, userId]
    );

    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Jelentkezés visszavonása sikertelen" });
  }
});

/* =========================
   DELETE – verseny törlése
   (csak lovarda_vezeto + csak saját lovarda)
========================= */
router.delete("/:id", requireAuth, async (req, res) => {
  if (req.user.szerepkor !== "lovarda_vezeto") {
    return res.status(403).json({ error: "Nincs jogosultság" });
  }

  const versenyId = req.params.id;

  try {
    const userId = req.user.felhasznalo_id;

    const userRes = await pool.query(
      "SELECT lovarda_id FROM felhasznalo WHERE felhasznalo_id = $1",
      [userId]
    );
    const lovardaId = userRes.rows[0]?.lovarda_id;

    if (!lovardaId) {
      return res.status(400).json({ error: "A felhasználó nincs lovardához rendelve" });
    }

    // Ellenőrizzük hogy a verseny tényleg a saját lovardájáé-e
    const ownRes = await pool.query(
      "SELECT verseny_id FROM verseny WHERE verseny_id = $1 AND lovarda_id = $2",
      [versenyId, lovardaId]
    );

    if (ownRes.rowCount === 0) {
      return res.status(404).json({ error: "Nincs ilyen verseny, vagy nem a te lovardádé" });
    }

    // Kapcsolótáblák törlése
    await pool.query("DELETE FROM verseny_felhasznalo WHERE verseny_id = $1", [versenyId]);
    await pool.query("DELETE FROM verseny_lo WHERE verseny_id = $1", [versenyId]);

    // Verseny törlése
    await pool.query("DELETE FROM verseny WHERE verseny_id = $1", [versenyId]);

    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Verseny törlése sikertelen" });
  }
});

module.exports = router;
