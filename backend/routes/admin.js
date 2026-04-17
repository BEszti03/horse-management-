const express = require("express");
const pool = require("../config/db");
const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.use(requireAuth, requireAdmin);

// összes felhasználó
router.get("/users", async (_req, res) => {
  try {
    const q = await pool.query(`
      SELECT 
        f.felhasznalo_id,
        f.nev,
        f.email,
        f.szerepkor,
        f.lovarda_id,
        l.nev AS lovarda_nev
      FROM felhasznalo f
      LEFT JOIN lovarda l ON l.lovarda_id = f.lovarda_id
      ORDER BY f.felhasznalo_id DESC
    `);

    res.json({ users: q.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Szerver hiba." });
  }
});

// felhasználó szerepkör módosítás
router.put("/users/:id/role", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { szerepkor } = req.body;

    const allowedRoles = ["admin", "lovas", "lovarda_vezeto", "user"];
    if (!allowedRoles.includes(szerepkor)) {
      return res.status(400).json({ message: "Érvénytelen szerepkör." });
    }

    const q = await pool.query(
      `UPDATE felhasznalo
       SET szerepkor = $1
       WHERE felhasznalo_id = $2
       RETURNING felhasznalo_id, nev, email, szerepkor, lovarda_id`,
      [szerepkor, userId]
    );

    if (!q.rows.length) {
      return res.status(404).json({ message: "Felhasználó nem található." });
    }

    res.json({ message: "Szerepkör frissítve.", user: q.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Szerver hiba." });
  }
});

// felhasználó törlése
router.delete("/users/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: "Érvénytelen felhasználó azonosító." });
    }

    if (req.user.felhasznalo_id === userId) {
      return res.status(400).json({ message: "A saját fiókodat nem törölheted innen." });
    }

    const existing = await pool.query(
      `SELECT felhasznalo_id, nev, email, szerepkor
       FROM felhasznalo
       WHERE felhasznalo_id = $1`,
      [userId]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ message: "Felhasználó nem található." });
    }

    const targetUser = existing.rows[0];

    if (targetUser.szerepkor === "admin") {
      const adminCountResult = await pool.query(
        `SELECT COUNT(*)::int AS admin_count
         FROM felhasznalo
         WHERE szerepkor = 'admin'`
      );

      const adminCount = adminCountResult.rows[0]?.admin_count ?? 0;
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Az utolsó admin felhasználó nem törölhető." });
      }
    }

    await pool.query("DELETE FROM felhasznalo WHERE felhasznalo_id = $1", [userId]);

    return res.json({
      message: "Felhasználó törölve.",
      deletedUser: targetUser,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Szerver hiba." });
  }
});

// lovardák listázása (vezető információval)
router.get("/stables", async (_req, res) => {
  try {
    const q = await pool.query(`
      SELECT 
        l.lovarda_id, 
        l.nev,
        f.felhasznalo_id AS owner_id,
        f.nev AS owner_nev
      FROM lovarda l
      LEFT JOIN felhasznalo f ON f.lovarda_id = l.lovarda_id AND f.szerepkor = 'lovarda_vezeto'
      ORDER BY l.nev ASC
    `);

    res.json({ stables: q.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Szerver hiba." });
  }
});

// felhasználók listázása (legördülő listához)
router.get("/users-list", async (_req, res) => {
  try {
    const q = await pool.query(`
      SELECT 
        felhasznalo_id,
        nev,
        email,
        szerepkor
      FROM felhasznalo
      ORDER BY nev ASC
    `);

    res.json({ users: q.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Szerver hiba." });
  }
});

//lovarda törlése
router.delete("/stables/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const stableId = Number(req.params.id);

    if (Number.isNaN(stableId)) {
      return res.status(400).json({ message: "Érvénytelen lovarda azonosító." });
    }

    const exists = await client.query(
      "SELECT lovarda_id, nev FROM lovarda WHERE lovarda_id = $1",
      [stableId]
    );

    if (!exists.rows.length) {
      return res.status(404).json({ message: "Lovarda nem található." });
    }

    await client.query("BEGIN");

    const leaders = await client.query(
      `SELECT felhasznalo_id, nev, email
       FROM felhasznalo
       WHERE lovarda_id = $1
         AND szerepkor = 'lovarda_vezeto'`,
      [stableId]
    );

    if (leaders.rows.length) {
      await client.query(
        `DELETE FROM felhasznalo
         WHERE lovarda_id = $1
           AND szerepkor = 'lovarda_vezeto'`,
        [stableId]
      );
    }

    await client.query("DELETE FROM lovarda WHERE lovarda_id = $1", [stableId]);

    await client.query("COMMIT");

    return res.json({
      message: "Lovarda törölve. A hozzátartozó vezető felhasználó(k) is törölve lettek, a lovasok megmaradtak.",
      deletedStable: exists.rows[0],
      deletedLeaders: leaders.rows,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({
      message: "Szerver hiba.",
      error: err.message,
    });
  } finally {
    client.release();
  }
});


// lovak listázása
router.get("/horses", async (_req, res) => {
  try {
    const q = await pool.query(`
      SELECT 
        l.lo_id,
        l.nev,
        l.fajta,
        l.szuletesi_ido::text AS szuletesi_ido,
        l.felhasznalo_id,
        f.nev AS tulajdonos_nev
      FROM lo l
      JOIN felhasznalo f ON f.felhasznalo_id = l.felhasznalo_id
      ORDER BY l.lo_id DESC
    `);

    res.json({ horses: q.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Szerver hiba." });
  }
});

// ló törlése
router.delete("/horses/:id", async (req, res) => {
  try {
    const horseId = Number(req.params.id);

    if (Number.isNaN(horseId)) {
      return res.status(400).json({ message: "Érvénytelen ló azonosító." });
    }

    const existing = await pool.query(
      `SELECT lo_id, nev, felhasznalo_id
       FROM lo
       WHERE lo_id = $1`,
      [horseId]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ message: "Ló nem található." });
    }

    await pool.query("DELETE FROM lo WHERE lo_id = $1", [horseId]);

    return res.json({
      message: "Ló törölve.",
      deletedHorse: existing.rows[0],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Szerver hiba." });
  }
});

// versenyek listázása
router.get("/competitions", async (_req, res) => {
  try {
    const q = await pool.query(`
      SELECT
        v.verseny_id,
        v.nev,
        v.datum::text AS datum,
        v.lovarda_id,
        l.nev AS lovarda_nev
      FROM verseny v
      LEFT JOIN lovarda l ON l.lovarda_id = v.lovarda_id
      ORDER BY v.datum DESC
    `);

    res.json({ competitions: q.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Szerver hiba." });
  }
});

// verseny törlése
router.delete("/competitions/:id", async (req, res) => {
  try {
    const competitionId = Number(req.params.id);

    if (Number.isNaN(competitionId)) {
      return res.status(400).json({ message: "Érvénytelen verseny azonosító." });
    }

    const existing = await pool.query(
      `SELECT verseny_id, nev, datum::text AS datum, lovarda_id
       FROM verseny
       WHERE verseny_id = $1`,
      [competitionId]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ message: "Verseny nem található." });
    }

    await pool.query("DELETE FROM verseny WHERE verseny_id = $1", [competitionId]);

    return res.json({
      message: "Verseny törölve.",
      deletedCompetition: existing.rows[0],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Szerver hiba." });
  }
});

// felhasználó szerkesztése
router.put("/users/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { nev, email, lovarda_id, szerepkor } = req.body;

    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: "Érvénytelen felhasználó azonosító." });
    }

    if (!nev || !email) {
      return res.status(400).json({ message: "Név és email szükséges." });
    }

    const allowedRoles = ["admin", "lovas", "lovarda_vezeto", "user"];
    if (szerepkor && !allowedRoles.includes(szerepkor)) {
      return res.status(400).json({ message: "Érvénytelen szerepkör." });
    }

    // email egyediség ellenőrzése
    const existingEmail = await pool.query(
      `SELECT felhasznalo_id FROM felhasznalo WHERE email = $1 AND felhasznalo_id != $2`,
      [email, userId]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ message: "Ez az email már regisztrálva van." });
    }

    const q = await pool.query(
      `UPDATE felhasznalo
       SET nev = $1, email = $2, lovarda_id = $3, szerepkor = COALESCE($4, szerepkor)
       WHERE felhasznalo_id = $5
       RETURNING felhasznalo_id, nev, email, szerepkor, lovarda_id`,
      [nev, email, lovarda_id || null, szerepkor || null, userId]
    );

    if (!q.rows.length) {
      return res.status(404).json({ message: "Felhasználó nem található." });
    }

    res.json({ message: "Felhasználó frissítve.", user: q.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Szerver hiba." });
  }
});

// lovarda szerkesztése
router.put("/stables/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const stableId = Number(req.params.id);
    const { nev, owner_user_id } = req.body;

    if (Number.isNaN(stableId)) {
      return res.status(400).json({ message: "Érvénytelen lovarda azonosító." });
    }

    if (!nev || nev.trim() === "") {
      return res.status(400).json({ message: "Lovarda neve szükséges." });
    }

    const parsedOwnerId =
      owner_user_id === null || owner_user_id === "" || owner_user_id === undefined
        ? null
        : Number(owner_user_id);

    if (parsedOwnerId !== null && Number.isNaN(parsedOwnerId)) {
      return res.status(400).json({ message: "Érvénytelen lovas azonosító." });
    }

    const stableExists = await client.query(
      `SELECT lovarda_id FROM lovarda WHERE lovarda_id = $1`,
      [stableId]
    );

    if (!stableExists.rows.length) {
      return res.status(404).json({ message: "Lovarda nem található." });
    }

    if (parsedOwnerId !== null) {
      const ownerCandidate = await client.query(
        `SELECT felhasznalo_id, szerepkor
         FROM felhasznalo
         WHERE felhasznalo_id = $1`,
        [parsedOwnerId]
      );

      if (!ownerCandidate.rows.length) {
        return res.status(404).json({ message: "A kiválasztott lovas nem található." });
      }

      const role = ownerCandidate.rows[0].szerepkor;
      if (!["lovas", "lovarda_vezeto"].includes(role)) {
        return res.status(400).json({ message: "Csak lovas jelölhető ki lovarda vezetőnek." });
      }
    }

    await client.query("BEGIN");

    const q = await client.query(
      `UPDATE lovarda
       SET nev = $1
       WHERE lovarda_id = $2
       RETURNING lovarda_id, nev`,
      [nev.trim(), stableId]
    );

    await client.query(
      `UPDATE felhasznalo
       SET szerepkor = 'lovas'
       WHERE lovarda_id = $1
         AND szerepkor = 'lovarda_vezeto'
         AND ($2::int IS NULL OR felhasznalo_id <> $2)`,
      [stableId, parsedOwnerId]
    );

    if (parsedOwnerId !== null) {
      await client.query(
        `UPDATE felhasznalo
         SET szerepkor = 'lovarda_vezeto', lovarda_id = $1
         WHERE felhasznalo_id = $2`,
        [stableId, parsedOwnerId]
      );
    }

    await client.query("COMMIT");

    if (!q.rows.length) {
      return res.status(404).json({ message: "Lovarda nem található." });
    }

    res.json({ message: "Lovarda frissítve.", stable: q.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Szerver hiba." });
  } finally {
    client.release();
  }
});

// ló szerkesztése
router.put("/horses/:id", async (req, res) => {
  try {
    const horseId = Number(req.params.id);
    const { nev, fajta, szuletesi_ido, felhasznalo_id } = req.body;

    if (Number.isNaN(horseId)) {
      return res.status(400).json({ message: "Érvénytelen ló azonosító." });
    }

    if (!nev || nev.trim() === "") {
      return res.status(400).json({ message: "Ló neve szükséges." });
    }

    // ellenőrzés, hogy a felhasznalo_id érvényes-e, ha meg van adva
    if (felhasznalo_id) {
      const userExists = await pool.query(
        `SELECT felhasznalo_id FROM felhasznalo WHERE felhasznalo_id = $1`,
        [felhasznalo_id]
      );

      if (!userExists.rows.length) {
        return res.status(400).json({ message: "Felhasználó nem található." });
      }
    }

    const q = await pool.query(
      `UPDATE lo
       SET nev = $1, fajta = $2, szuletesi_ido = $3, felhasznalo_id = $4
       WHERE lo_id = $5
       RETURNING lo_id, nev, fajta, szuletesi_ido::text AS szuletesi_ido, felhasznalo_id`,
      [nev.trim(), fajta || null, szuletesi_ido || null, felhasznalo_id, horseId]
    );

    if (!q.rows.length) {
      return res.status(404).json({ message: "Ló nem található." });
    }

    res.json({ message: "Ló frissítve.", horse: q.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Szerver hiba." });
  }
});

// verseny szerkesztése
router.put("/competitions/:id", async (req, res) => {
  try {
    const competitionId = Number(req.params.id);
    const { nev, datum, lovarda_id } = req.body;

    if (Number.isNaN(competitionId)) {
      return res.status(400).json({ message: "Érvénytelen verseny azonosító." });
    }

    if (!nev || nev.trim() === "") {
      return res.status(400).json({ message: "Verseny neve szükséges." });
    }

    if (!datum) {
      return res.status(400).json({ message: "Verseny dátuma szükséges." });
    }

    const q = await pool.query(
      `UPDATE verseny
       SET nev = $1, datum = $2, lovarda_id = $3
       WHERE verseny_id = $4
       RETURNING verseny_id, nev, datum::text AS datum, lovarda_id`,
      [nev.trim(), datum, lovarda_id || null, competitionId]
    );

    if (!q.rows.length) {
      return res.status(404).json({ message: "Verseny nem található." });
    }

    res.json({ message: "Verseny frissítve.", competition: q.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Szerver hiba." });
  }
});

module.exports = router;