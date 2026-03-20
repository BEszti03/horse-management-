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

// lovardák listázása
router.get("/stables", async (_req, res) => {
  try {
    const q = await pool.query(`
      SELECT lovarda_id, nev
      FROM lovarda
      ORDER BY nev ASC
    `);

    res.json({ stables: q.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Szerver hiba." });
  }
});

//lovarda törlése lovasokkal együtt
router.delete("/stables/:id", async (req, res) => {
  try {
    const stableId = Number(req.params.id);

    if (Number.isNaN(stableId)) {
      return res.status(400).json({ message: "Érvénytelen lovarda azonosító." });
    }

    const exists = await pool.query(
      "SELECT lovarda_id, nev FROM lovarda WHERE lovarda_id = $1",
      [stableId]
    );

    if (!exists.rows.length) {
      return res.status(404).json({ message: "Lovarda nem található." });
    }

    const adminInStable = await pool.query(
      `SELECT felhasznalo_id, nev, email
       FROM felhasznalo
       WHERE lovarda_id = $1 AND szerepkor = 'admin'`,
      [stableId]
    );

    if (adminInStable.rows.length) {
      return res.status(400).json({
        message: "A lovarda nem törölhető, mert admin felhasználó tartozik hozzá.",
      });
    }

    await pool.query("DELETE FROM lovarda WHERE lovarda_id = $1", [stableId]);

    return res.json({
      message: "Lovarda és a kapcsolódó adatok törölve.",
      deletedStable: exists.rows[0],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Szerver hiba.",
      error: err.message,
    });
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

module.exports = router;