const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const requireAuth = require("../middleware/requireAuth");

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
        v.lovarda_id,
        l.nev AS lovarda_nev,
        COALESCE(szervezo.nev, lovardaSzervezo.nev) AS rendezo_nev,
        COALESCE(szervezo.profilkep_url, lovardaSzervezo.profilkep_url) AS rendezo_profilkep_url,
        EXISTS (
          SELECT 1 
          FROM verseny_felhasznalo vf 
          WHERE vf.verseny_id = v.verseny_id 
            AND vf.felhasznalo_id = $1
        ) AS jelentkezett
      FROM verseny v
      JOIN lovarda l ON l.lovarda_id = v.lovarda_id
      LEFT JOIN felhasznalo szervezo ON szervezo.felhasznalo_id = v.letrehozo_felhasznalo_id
      LEFT JOIN LATERAL (
        SELECT f.nev, f.profilkep_url
        FROM felhasznalo f
        WHERE f.lovarda_id = v.lovarda_id
          AND f.szerepkor = 'lovarda_vezeto'
        ORDER BY f.felhasznalo_id ASC
        LIMIT 1
      ) AS lovardaSzervezo ON TRUE
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
   GET – saját rendezésű versenyek
========================= */
router.get("/managed", requireAuth, async (req, res) => {
  try {
    const userId = req.user.felhasznalo_id;

    const result = await pool.query(
      `
      SELECT
        v.verseny_id,
        v.nev,
        v.datum::text AS datum,
        v.lovarda_id,
        l.nev AS lovarda_nev
      FROM verseny v
      JOIN lovarda l ON l.lovarda_id = v.lovarda_id
      WHERE v.letrehozo_felhasznalo_id = $1
         OR (
           v.letrehozo_felhasznalo_id IS NULL
           AND v.lovarda_id = (
             SELECT f.lovarda_id
             FROM felhasznalo f
             WHERE f.felhasznalo_id = $1
           )
         )
      ORDER BY v.datum
      `,
      [userId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Hiba a saját versenyek lekérésekor" });
  }
});

/* =========================
   GET – saját versenyek jelentkezői
========================= */
router.get("/managed/entries", requireAuth, async (req, res) => {
  try {
    const userId = req.user.felhasznalo_id;

    const result = await pool.query(
      `
      SELECT
        v.verseny_id,
        v.nev AS verseny_nev,
        v.datum::text AS datum,
        f.felhasznalo_id,
        f.nev AS felhasznalo_nev,
        f.email,
        l.lo_id,
        l.nev AS lo_nev,
        lv.nev AS lovarda_nev
      FROM verseny v
      JOIN lovarda lv ON lv.lovarda_id = v.lovarda_id
      JOIN verseny_felhasznalo vf ON vf.verseny_id = v.verseny_id
      LEFT JOIN lo l
        ON l.felhasznalo_id = vf.felhasznalo_id
       AND l.lo_id IN (
         SELECT vl.lo_id
         FROM verseny_lo vl
         WHERE vl.verseny_id = v.verseny_id
       )
      JOIN felhasznalo f ON f.felhasznalo_id = vf.felhasznalo_id
      WHERE v.letrehozo_felhasznalo_id = $1
         OR (
           v.letrehozo_felhasznalo_id IS NULL
           AND v.lovarda_id = (
             SELECT fu.lovarda_id
             FROM felhasznalo fu
             WHERE fu.felhasznalo_id = $1
           )
         )
      ORDER BY v.datum, v.nev, f.nev, l.nev
      `,
      [userId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Hiba a saját versenyek jelentkezőinek lekérésekor" });
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
      return res.status(400).json({
        error: "A felhasználó nincs lovardához rendelve",
      });
    }

    await pool.query(
      `
      INSERT INTO verseny (nev, datum, lovarda_id, letrehozo_felhasznalo_id)
      VALUES ($1, $2, $3, $4)
      `,
      [nev, datum, lovardaId, userId]
    );

    return res.status(201).json({ message: "Verseny létrehozva" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Verseny létrehozása sikertelen" });
  }
});

/* =========================
   POST – jelentkezés versenyre
  (bármely bejelentkezett felhasználó)
========================= */
router.post("/:id/signup", requireAuth, async (req, res) => {
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

      //duplikáció-védelem
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
  (bármely bejelentkezett felhasználó)
========================= */
router.delete("/:id/signup", requireAuth, async (req, res) => {
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
    return res
      .status(500)
      .json({ error: "Jelentkezés visszavonása sikertelen" });
  }
});

/* =========================
   DELETE – verseny törlése
   (admin: bármelyik, lovarda_vezeto: csak saját)
========================= */
router.delete("/:id", requireAuth, async (req, res) => {
  const role = req.user.szerepkor;

  if (role !== "admin" && role !== "lovarda_vezeto") {
    return res.status(403).json({ error: "Nincs jogosultság" });
  }

  const versenyId = req.params.id;

  try {
    if (role === "lovarda_vezeto") {
      const userId = req.user.felhasznalo_id;

      const userRes = await pool.query(
        "SELECT lovarda_id FROM felhasznalo WHERE felhasznalo_id = $1",
        [userId]
      );
      const lovardaId = userRes.rows[0]?.lovarda_id;

      if (!lovardaId) {
        return res.status(400).json({
          error: "A felhasználó nincs lovardához rendelve",
        });
      }

      // Lovarda vezető csak saját versenyt törölhet
      const ownRes = await pool.query(
        "SELECT verseny_id FROM verseny WHERE verseny_id = $1 AND lovarda_id = $2",
        [versenyId, lovardaId]
      );

      if (ownRes.rowCount === 0) {
        return res
          .status(404)
          .json({ error: "Nincs ilyen verseny, vagy nem a te lovardádé" });
      }
    } else {
      const existsRes = await pool.query("SELECT verseny_id FROM verseny WHERE verseny_id = $1", [
        versenyId,
      ]);

      if (existsRes.rowCount === 0) {
        return res.status(404).json({ error: "Nincs ilyen verseny" });
      }
    }

    // Kapcsolótáblák törlése
    await pool.query("DELETE FROM verseny_felhasznalo WHERE verseny_id = $1", [
      versenyId,
    ]);
    await pool.query("DELETE FROM verseny_lo WHERE verseny_id = $1", [versenyId]);

    // Verseny törlése
    await pool.query("DELETE FROM verseny WHERE verseny_id = $1", [versenyId]);

    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Verseny törlése sikertelen" });
  }
});

/* =========================
   GET – versenyre jelentkezők listája
   (admin: összes, lovarda_vezeto: saját lovarda)
========================= */
router.get("/entries", requireAuth, async (req, res) => {
  const { szerepkor, felhasznalo_id } = req.user;

  if (szerepkor !== "admin" && szerepkor !== "lovarda_vezeto") {
    return res.status(403).json({ error: "Nincs jogosultság" });
  }

  try {
    let query = `
      SELECT
        v.verseny_id,
        v.nev AS verseny_nev,
        v.datum::text AS datum,
        f.felhasznalo_id,
        f.nev AS felhasznalo_nev,
        f.email,
        l.lo_id,
        l.nev AS lo_nev,
        lv.nev AS lovarda_nev
      FROM verseny v
      JOIN lovarda lv ON lv.lovarda_id = v.lovarda_id
      JOIN verseny_felhasznalo vf ON vf.verseny_id = v.verseny_id
      LEFT JOIN lo l 
        ON l.felhasznalo_id = vf.felhasznalo_id
       AND l.lo_id IN (
         SELECT vl.lo_id
         FROM verseny_lo vl
         WHERE vl.verseny_id = v.verseny_id
       )
      JOIN felhasznalo f ON f.felhasznalo_id = vf.felhasznalo_id
    `;

    const params = [];

    if (szerepkor === "lovarda_vezeto") {
      query += `
        WHERE v.lovarda_id = (
          SELECT lovarda_id
          FROM felhasznalo
          WHERE felhasznalo_id = $1
        )
      `;
      params.push(felhasznalo_id);
    }

    query += `
      ORDER BY v.datum, v.nev, f.nev, l.nev
    `;

    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Hiba a jelentkezők lekérésekor" });
  }
});

module.exports = router;
