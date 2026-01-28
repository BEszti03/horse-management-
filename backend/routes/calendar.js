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
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Érvénytelen token." });
  }
}

async function getUserLovardaId(userId) {
  const r = await pool.query(
    "SELECT lovarda_id FROM felhasznalo WHERE felhasznalo_id = $1",
    [userId]
  );
  return r.rows[0]?.lovarda_id ?? null;
}

async function ensureHorseOwnedByUser(loId, userId) {
  if (loId == null) return true;
  const r = await pool.query(
    "SELECT 1 FROM lo WHERE lo_id = $1 AND felhasznalo_id = $2",
    [loId, userId]
  );
  return r.rowCount > 0;
}

function labelTipus(tipus) {
  const x = String(tipus || "egyeb").toLowerCase();
  if (x === "patkolas") return "Patkolás";
  if (x === "allatorvos") return "Állatorvos";
  if (x === "verseny") return "Verseny";
  return "Egyéb";
}

/**
 * GET /api/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD
 * -> pályafoglalások + teendők (patkolas/allatorvos/verseny/egyeb)
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
    //PÁLYAFOGLALÁSOK (ló + foglaló neve)
    const bookings = await pool.query(
      `
      SELECT
        pt.palya_id,
        pt.felhasznalo_id,
        u.nev AS felhasznalo_nev,
        pt.mettol,
        pt.meddig,
        p.ferohely,
        pt.lo_id,
        l.nev AS lo_nev
      FROM palya_tartozkodas pt
      JOIN palya p ON p.palya_id = pt.palya_id
      JOIN felhasznalo u ON u.felhasznalo_id = pt.felhasznalo_id
      LEFT JOIN lo l ON l.lo_id = pt.lo_id
      WHERE p.lovarda_id = $1
        AND pt.mettol < $3
        AND COALESCE(pt.meddig, pt.mettol) > $2
      ORDER BY pt.mettol ASC
      `,
      [lovardaId, fromDate, toDate]
    );

    const palyaEvents = bookings.rows.map((b) => {
      const horsePart = b.lo_nev ? `: ${b.lo_nev}` : "";
      const whoPart = b.felhasznalo_nev ? ` (${b.felhasznalo_nev})` : "";

      return {
        id: `palya-${b.palya_id}-${b.felhasznalo_id}-${new Date(b.mettol).getTime()}`,
        title: `Pálya${horsePart}${whoPart}`,
        start: b.mettol,
        end: b.meddig || null,
        allDay: false,
        extendedProps: {
          category: "palya",
          type: "palya",
          palya_id: b.palya_id,
          felhasznalo_id: b.felhasznalo_id,
          felhasznalo_nev: b.felhasznalo_nev,
          ferohely: b.ferohely,
          lo_id: b.lo_id,
          lo_nev: b.lo_nev,
        },
      };
    });

    //TEENDŐK (tipus + leiras + ló + foglaló neve)
    const teendok = await pool.query(
      `
      SELECT
        t.teendo_id,
        t.leiras,
        t.statusz,
        t.kezdeti_ido,
        t.hatarido,
        t.tipus,
        t.felhasznalo_id,
        u.nev AS felhasznalo_nev,
        t.lo_id,
        l.nev AS lo_nev
      FROM teendo t
      JOIN felhasznalo u ON u.felhasznalo_id = t.felhasznalo_id
      LEFT JOIN lo l ON l.lo_id = t.lo_id
      WHERE u.lovarda_id = $1
        AND t.kezdeti_ido IS NOT NULL
        AND t.hatarido IS NOT NULL
        AND t.kezdeti_ido < $3
        AND t.hatarido > $2
      ORDER BY t.kezdeti_ido ASC
      `,
      [lovardaId, fromDate, toDate]
    );

    const teendoEvents = teendok.rows.map((t) => {
      const prefix = labelTipus(t.tipus);
      const details = t.lo_nev ? `${t.leiras} – ${t.lo_nev}` : t.leiras;
      const whoPart = t.felhasznalo_nev ? ` (${t.felhasznalo_nev})` : "";

      return {
        id: `teendo-${t.teendo_id}`,
        title: `${prefix}: ${details}${whoPart}`,
        start: t.kezdeti_ido,
        end: t.hatarido,
        allDay: false,
        extendedProps: {
          category: "teendo",
          type: t.tipus || "egyeb",
          teendo_id: t.teendo_id,
          statusz: t.statusz,
          felhasznalo_id: t.felhasznalo_id,
          felhasznalo_nev: t.felhasznalo_nev,
          lo_id: t.lo_id,
          lo_nev: t.lo_nev,
          raw_leiras: t.leiras,
        },
      };
    });

    res.json([...palyaEvents, ...teendoEvents]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Naptár betöltési hiba." });
  }
});

/**
 * POST /api/calendar/palya-booking
 * body: { start, end, ferohely?, lo_id? }
 */
router.post("/palya-booking", requireAuth, async (req, res) => {
  const userId = req.user.felhasznalo_id;
  const lovardaId = await getUserLovardaId(userId);

  if (!lovardaId) return res.status(400).json({ message: "Nincs lovarda beállítva." });

  const { start, end, ferohely, lo_id } = req.body;

  if (!start || !end) return res.status(400).json({ message: "Hiányzó start vagy end." });

  const startDt = new Date(start);
  const endDt = new Date(end);

  if (!(startDt < endDt)) return res.status(400).json({ message: "Az end legyen későbbi, mint a start." });

  const cap = Number.isFinite(Number(ferohely)) && Number(ferohely) > 0 ? Number(ferohely) : 1;
  const horseId = lo_id == null || lo_id === "" ? null : Number(lo_id);

  if (horseId != null && !Number.isFinite(horseId)) {
    return res.status(400).json({ message: "Hibás lo_id." });
  }

  if (horseId != null) {
    const ok = await ensureHorseOwnedByUser(horseId, userId);
    if (!ok) return res.status(403).json({ message: "Ez a ló nem a te lovad." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

  
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

    // palya
    const palyaIns = await client.query(
      `
      INSERT INTO palya (lovarda_id, ferohely, idopont)
      VALUES ($1, $2, $3)
      RETURNING palya_id
      `,
      [lovardaId, cap, startDt]
    );

    const palyaId = palyaIns.rows[0].palya_id;

    // palya_tartozkodas (+ lo_id)
    await client.query(
      `
      INSERT INTO palya_tartozkodas (palya_id, felhasznalo_id, mettol, meddig, lo_id)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [palyaId, userId, startDt, endDt, horseId]
    );

    await client.query("COMMIT");
    res.status(201).json({ message: "Foglalás létrehozva.", palya_id: palyaId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Foglalás mentési hiba." });
  } finally {
    client.release();
  }
});

/**
 * PUT /api/calendar/palya-booking/:palyaId
 * body: { start, end, lo_id? }
 */
router.put("/palya-booking/:palyaId", requireAuth, async (req, res) => {
  const userId = req.user.felhasznalo_id;
  const lovardaId = await getUserLovardaId(userId);

  if (!lovardaId) return res.status(400).json({ message: "Nincs lovarda beállítva." });

  const palyaId = Number(req.params.palyaId);
  const { start, end, lo_id } = req.body;

  if (!Number.isFinite(palyaId)) return res.status(400).json({ message: "Hibás palyaId." });
  if (!start || !end) return res.status(400).json({ message: "Hiányzó start vagy end." });

  const startDt = new Date(start);
  const endDt = new Date(end);
  if (!(startDt < endDt)) return res.status(400).json({ message: "Az end legyen későbbi, mint a start." });

  const horseId = lo_id == null || lo_id === "" ? null : Number(lo_id);
  if (horseId != null && !Number.isFinite(horseId)) {
    return res.status(400).json({ message: "Hibás lo_id." });
  }
  if (horseId != null) {
    const ok = await ensureHorseOwnedByUser(horseId, userId);
    if (!ok) return res.status(403).json({ message: "Ez a ló nem a te lovad." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

  
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
      `UPDATE palya_tartozkodas
       SET mettol = $2, meddig = $3, lo_id = $4
       WHERE palya_id = $1 AND felhasznalo_id = $5`,
      [palyaId, startDt, endDt, horseId, userId]
    );

    await client.query(`UPDATE palya SET idopont = $2 WHERE palya_id = $1`, [palyaId, startDt]);

    await client.query("COMMIT");
    res.json({ message: "Foglalás módosítva." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Módosítási hiba." });
  } finally {
    client.release();
  }
});

/**
 * DELETE /api/calendar/palya-booking/:palyaId
 */
router.delete("/palya-booking/:palyaId", requireAuth, async (req, res) => {
  const userId = req.user.felhasznalo_id;
  const lovardaId = await getUserLovardaId(userId);

  if (!lovardaId) return res.status(400).json({ message: "Nincs lovarda beállítva." });

  const palyaId = Number(req.params.palyaId);
  if (!Number.isFinite(palyaId)) return res.status(400).json({ message: "Hibás palyaId." });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const own = await client.query(
      `SELECT 1
       FROM palya_tartozkodas pt
       JOIN palya p ON p.palya_id = pt.palya_id
       WHERE pt.palya_id = $1 AND pt.felhasznalo_id = $2 AND p.lovarda_id = $3
       LIMIT 1`,
      [palyaId, userId, lovardaId]
    );

    if (own.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Foglalás nem található / nem a tiéd." });
    }

    await client.query(
      `DELETE FROM palya_tartozkodas WHERE palya_id = $1 AND felhasznalo_id = $2`,
      [palyaId, userId]
    );

    const left = await client.query(
      `SELECT 1 FROM palya_tartozkodas WHERE palya_id = $1 LIMIT 1`,
      [palyaId]
    );

    if (left.rowCount === 0) {
      await client.query(`DELETE FROM palya WHERE palya_id = $1`, [palyaId]);
    }

    await client.query("COMMIT");
    res.status(204).send();
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Törlési hiba." });
  } finally {
    client.release();
  }
});

/**
 * TEENDŐ naptár CRUD
 */

router.post("/teendo", requireAuth, async (req, res) => {
  const userId = req.user.felhasznalo_id;
  const { leiras, tipus, start, end, lo_id } = req.body;

  if (!leiras || !start || !end) {
    return res.status(400).json({ message: "leiras, start, end kötelező." });
  }

  const startDt = new Date(start);
  const endDt = new Date(end);
  if (!(startDt < endDt)) {
    return res.status(400).json({ message: "Az end legyen későbbi, mint a start." });
  }

  const horseId = lo_id == null || lo_id === "" ? null : Number(lo_id);
  if (horseId != null && !Number.isFinite(horseId)) {
    return res.status(400).json({ message: "Hibás lo_id." });
  }
  if (horseId != null) {
    const ok = await ensureHorseOwnedByUser(horseId, userId);
    if (!ok) return res.status(403).json({ message: "Ez a ló nem a te lovad." });
  }

  const t = String(tipus || "egyeb").toLowerCase();
  const allowed = new Set(["patkolas", "allatorvos", "verseny", "egyeb"]);
  if (!allowed.has(t)) return res.status(400).json({ message: "Hibás tipus." });

  try {
    const ins = await pool.query(
      `
      INSERT INTO teendo (leiras, statusz, kezdeti_ido, hatarido, felhasznalo_id, tipus, lo_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING teendo_id
      `,
      [leiras, "tervezett", startDt, endDt, userId, t, horseId]
    );

    res.status(201).json({ message: "Teendő létrehozva.", teendo_id: ins.rows[0].teendo_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Teendő mentési hiba." });
  }
});

router.put("/teendo/:id", requireAuth, async (req, res) => {
  const userId = req.user.felhasznalo_id;
  const id = Number(req.params.id);
  const { leiras, tipus, start, end, lo_id } = req.body;

  if (!Number.isFinite(id)) return res.status(400).json({ message: "Hibás id." });
  if (!start || !end) return res.status(400).json({ message: "start és end kötelező." });

  const startDt = new Date(start);
  const endDt = new Date(end);
  if (!(startDt < endDt)) return res.status(400).json({ message: "Az end legyen későbbi, mint a start." });

  const horseId = lo_id == null || lo_id === "" ? null : Number(lo_id);
  if (horseId != null && !Number.isFinite(horseId)) {
    return res.status(400).json({ message: "Hibás lo_id." });
  }
  if (horseId != null) {
    const ok = await ensureHorseOwnedByUser(horseId, userId);
    if (!ok) return res.status(403).json({ message: "Ez a ló nem a te lovad." });
  }

  const t = String(tipus || "egyeb").toLowerCase();
  const allowed = new Set(["patkolas", "allatorvos", "verseny", "egyeb"]);
  if (!allowed.has(t)) return res.status(400).json({ message: "Hibás tipus." });

  try {
    const up = await pool.query(
      `
      UPDATE teendo
      SET leiras = COALESCE($3, leiras),
          tipus = COALESCE($4, tipus),
          kezdeti_ido = $5,
          hatarido = $6,
          lo_id = $7
      WHERE teendo_id = $1 AND felhasznalo_id = $2
      `,
      [id, userId, leiras || null, t, startDt, endDt, horseId]
    );

    if (up.rowCount === 0) {
      return res.status(404).json({ message: "Teendő nem található / nem a tiéd." });
    }

    res.json({ message: "Teendő módosítva." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Teendő módosítási hiba." });
  }
});

router.delete("/teendo/:id", requireAuth, async (req, res) => {
  const userId = req.user.felhasznalo_id;
  const id = Number(req.params.id);

  if (!Number.isFinite(id)) return res.status(400).json({ message: "Hibás id." });

  try {
    const del = await pool.query(
      `DELETE FROM teendo WHERE teendo_id = $1 AND felhasznalo_id = $2`,
      [id, userId]
    );

    if (del.rowCount === 0) {
      return res.status(404).json({ message: "Teendő nem található / nem a tiéd." });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Teendő törlési hiba." });
  }
});

module.exports = router;
