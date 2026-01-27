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
// GET /api/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD - naptár
router.get("/", requireAuth, async (req, res) => {
  const { from, to } = req.query;

  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 864e5);
  const toDate = to ? new Date(to) : new Date(Date.now() + 30 * 864e5);

  try {
    //Teendők (csak ahol van időpont)
    const teendok = await pool.query(
      `
      SELECT
        teendo_id,
        leiras,
        kezdeti_ido,
        hatarido,
        statusz,
        felhasznalo_id
      FROM teendo
      WHERE (kezdeti_ido IS NOT NULL OR hatarido IS NOT NULL)
        AND COALESCE(kezdeti_ido, hatarido) >= $1
        AND COALESCE(hatarido, kezdeti_ido) <= $2
      ORDER BY COALESCE(kezdeti_ido, hatarido) ASC
      `,
      [fromDate, toDate]
    );

    //Pálya időpontok
    const palyak = await pool.query(
      `
      SELECT palya_id, lovarda_id, idopont, ferohely
      FROM palya
      WHERE idopont >= $1 AND idopont <= $2
      ORDER BY idopont ASC
      `,
      [fromDate, toDate]
    );

    const events = [
      ...teendok.rows.map((t) => ({
        id: `teendo-${t.teendo_id}`,
        title: `Teendő: ${t.leiras}`,
        start: t.kezdeti_ido || t.hatarido,
        end: t.hatarido || null,
        allDay: false,
        extendedProps: {
          type: "teendo",
          teendo_id: t.teendo_id,
          statusz: t.statusz,
          felhasznalo_id: t.felhasznalo_id,
        },
      })),
      ...palyak.rows.map((p) => ({
        id: `palya-${p.palya_id}`,
        title: `Pálya időpont (férőhely: ${p.ferohely})`,
        start: p.idopont,
        end: null,
        allDay: false,
        extendedProps: {
          type: "palya",
          palya_id: p.palya_id,
          lovarda_id: p.lovarda_id,
          ferohely: p.ferohely,
        },
      })),
    ];

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Naptár betöltési hiba." });
  }
});

module.exports = router;
