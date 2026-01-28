const express = require("express");
const pool = require("../config/db");
const jwt = require("jsonwebtoken");

const router = express.Router();

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Nincs token." });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { felhasznalo_id, email, szerepkor, ... }
    next();
  } catch {
    return res.status(401).json({ message: "Érvénytelen vagy lejárt token." });
  }
}

async function getUserLovardaId(userId) {
  const r = await pool.query(
    "SELECT lovarda_id FROM felhasznalo WHERE felhasznalo_id = $1",
    [userId]
  );
  return r.rows[0]?.lovarda_id ?? null;
}

/**
 * GET /api/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD
 * -> csak a saját lovarda eseményei
 */
router.get("/", requireAuth, async (req, res) => {
  const userId = req.user.felhasznalo_id;
  const lovardaId = await getUserLovardaId(userId);

  if (!lovardaId) {
    return res.status(400).json({ message: "Nincs lovarda beállítva a felhasználónál." });
  }

  const { from, to } = req.query;
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 864e5);
  const toDate = to ? new Date(to) : new Date(Date.now() + 30 * 864e5);

  try {
    const bookings = await pool.query(
      `
      SELECT
        pt.palya_id,
        pt.felhasznalo_id,
        u.nev AS felhasznalo_nev,
        pt.mettol,
        pt.meddig,
        p.ferohely
      FROM palya_tartozkodas pt
      JOIN palya p ON p.palya_id = pt.palya_id
      JOIN felhasznalo u ON u.felhasznalo_id = pt.felhasznalo_id
      WHERE p.lovarda_id = $1
        AND pt.mettol < $3
        AND COALESCE(pt.meddig, pt.mettol) > $2
      ORDER BY pt.mettol ASC
      `,
      [lovardaId, fromDate, toDate]
    );

    const events = bookings.rows.map((b) => ({
      id: `palya-${b.palya_id}-${b.felhasznalo_id}-${new Date(b.mettol).getTime()}`,
      title: `Pálya: ${b.felhasznalo_nev}`,
      start: b.mettol,
      end: b.meddig || null,
      allDay: false,
      extendedProps: {
        type: "palya",
        palya_id: b.palya_id,
        felhasznalo_id: b.felhasznalo_id,
        ferohely: b.ferohely,
      },
    }));

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Naptár betöltési hiba." });
  }
});

/**
 * POST /api/calendar/palya-booking
 * body: { start, end, ferohely? }
 */
router.post("/palya-booking", requireAuth, async (req, res) => {
  const userId = req.user.felhasznalo_id;
  const lovardaId = await getUserLovardaId(userId);

  if (!lovardaId) {
    return res.status(400).json({ message: "Nincs lovarda beállítva a felhasználónál." });
  }

  const { start, end, ferohely } = req.body;

  if (!start || !end) {
    return res.status(400).json({ message: "Hiányzó start vagy end." });
  }

  const startDt = new Date(start);
  const endDt = new Date(end);

  if (!(startDt < endDt)) {
    return res.status(400).json({ message: "Az end legyen későbbi, mint a start." });
  }

  const cap = Number.isFinite(Number(ferohely)) && Number(ferohely) > 0 ? Number(ferohely) : 1;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    //Ütközés ellenőrzés ugyanabban a lovardában
    const conflict = await client.query(
      `
      SELECT 1
      FROM palya_tartozkodas pt
      JOIN palya p ON p.palya_id = pt.palya_id
      WHERE p.lovarda_id = $1
        AND pt.mettol < $3
        AND COALESCE(pt.meddig, pt.mettol) > $2
      LIMIT 1
      `,
      [lovardaId, startDt, endDt]
    );

    if (conflict.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Ez az idősáv már foglalt a lovardában." });
    }

    //Pálya sor (idopont = start)
    const palyaIns = await client.query(
      `
      INSERT INTO palya (lovarda_id, ferohely, idopont)
      VALUES ($1, $2, $3)
      RETURNING palya_id
      `,
      [lovardaId, cap, startDt]
    );

    const palyaId = palyaIns.rows[0].palya_id;

    //Pálya_tartózkodás
    await client.query(
      `
      INSERT INTO palya_tartozkodas (palya_id, felhasznalo_id, mettol, meddig)
      VALUES ($1, $2, $3, $4)
      `,
      [palyaId, userId, startDt, endDt]
    );

    await client.query("COMMIT");
    return res.status(201).json({ message: "Foglalás létrehozva.", palya_id: palyaId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ message: "Foglalás mentési hiba." });
  } finally {
    client.release();
  }
});

/**
 * DELETE /api/calendar/palya-booking/:palyaId
 * Csak a saját foglalását törölheti a user, vagy admin.
 */
router.delete("/palya-booking/:palyaId", requireAuth, async (req, res) => {
  const userId = req.user.felhasznalo_id;
  const role = req.user.szerepkor || req.user.role || "";
  const palyaId = Number(req.params.palyaId);

  if (!Number.isFinite(palyaId)) {
    return res.status(400).json({ message: "Hibás palyaId." });
  }

  const lovardaId = await getUserLovardaId(userId);
  if (!lovardaId) {
    return res.status(400).json({ message: "Nincs lovarda beállítva a felhasználónál." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    //Megnézzük: létezik-e a foglalás, és a user lovardájához tartozik-e
    const bookingRes = await client.query(
      `
      SELECT pt.felhasznalo_id, p.lovarda_id
      FROM palya_tartozkodas pt
      JOIN palya p ON p.palya_id = pt.palya_id
      WHERE pt.palya_id = $1
      LIMIT 1
      `,
      [palyaId]
    );

    if (bookingRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Foglalás nem található." });
    }

    const booking = bookingRes.rows[0];

    if (booking.lovarda_id !== lovardaId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Nincs jogosultság (más lovarda)." });
    }

    const isAdmin = String(role).toLowerCase() === "admin";
    const isOwner = booking.felhasznalo_id === userId;

    if (!isAdmin && !isOwner) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Csak a saját foglalásodat törölheted." });
    }

    //Töröljük a tartózkodást
    await client.query(`DELETE FROM palya_tartozkodas WHERE palya_id = $1`, [palyaId]);

    //Ha nincs több rekord erre a pályára, töröljük magát a pálya sort is
    const left = await client.query(
      `SELECT 1 FROM palya_tartozkodas WHERE palya_id = $1 LIMIT 1`,
      [palyaId]
    );

    if (left.rowCount === 0) {
      await client.query(`DELETE FROM palya WHERE palya_id = $1`, [palyaId]);
    }

    await client.query("COMMIT");
    return res.status(204).send();
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ message: "Törlési hiba." });
  } finally {
    client.release();
  }
});

/**
 * PUT /api/calendar/palya-booking/:palyaId
 * body: { start, end }
 * Csak a saját foglalását módosíthatja a user, vagy admin.
 */
router.put("/palya-booking/:palyaId", requireAuth, async (req, res) => {
  const userId = req.user.felhasznalo_id;
  const role = req.user.szerepkor || req.user.role || "";
  const palyaId = Number(req.params.palyaId);
  const { start, end } = req.body;

  if (!Number.isFinite(palyaId)) {
    return res.status(400).json({ message: "Hibás palyaId." });
  }
  if (!start || !end) {
    return res.status(400).json({ message: "Hiányzó start vagy end." });
  }

  const startDt = new Date(start);
  const endDt = new Date(end);
  if (!(startDt < endDt)) {
    return res.status(400).json({ message: "Az end legyen későbbi, mint a start." });
  }

  const lovardaId = await getUserLovardaId(userId);
  if (!lovardaId) {
    return res.status(400).json({ message: "Nincs lovarda beállítva a felhasználónál." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const bookingRes = await client.query(
      `
      SELECT pt.felhasznalo_id, p.lovarda_id
      FROM palya_tartozkodas pt
      JOIN palya p ON p.palya_id = pt.palya_id
      WHERE pt.palya_id = $1
      LIMIT 1
      `,
      [palyaId]
    );

    if (bookingRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Foglalás nem található." });
    }

    const booking = bookingRes.rows[0];

    if (booking.lovarda_id !== lovardaId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Nincs jogosultság (más lovarda)." });
    }

    const isAdmin = String(role).toLowerCase() === "admin";
    const isOwner = booking.felhasznalo_id === userId;

    if (!isAdmin && !isOwner) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Csak a saját foglalásodat módosíthatod." });
    }
    const conflict = await client.query(
      `
      SELECT 1
      FROM palya_tartozkodas pt
      JOIN palya p ON p.palya_id = pt.palya_id
      WHERE p.lovarda_id = $1
        AND pt.palya_id <> $4
        AND pt.mettol < $3
        AND COALESCE(pt.meddig, pt.mettol) > $2
      LIMIT 1
      `,
      [lovardaId, startDt, endDt, palyaId]
    );

    if (conflict.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Ez az idősáv már foglalt a lovardában." });
    }
    await client.query(
      `UPDATE palya_tartozkodas SET mettol = $2, meddig = $3 WHERE palya_id = $1`,
      [palyaId, startDt, endDt]
    );

    await client.query(`UPDATE palya SET idopont = $2 WHERE palya_id = $1`, [palyaId, startDt]);

    await client.query("COMMIT");
    return res.status(200).json({ message: "Foglalás módosítva." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ message: "Módosítási hiba." });
  } finally {
    client.release();
  }
});


module.exports = router;
