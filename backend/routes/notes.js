const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const requireAuth = require("../middleware/requireAuth");

/* =========================
   GET – saját jegyzetek
========================= */
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT jegyzet_id, cim, szoveg, mikor_irta
      FROM jegyzet
      WHERE felhasznalo_id = $1
      ORDER BY mikor_irta DESC
      `,
      [req.user.felhasznalo_id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Jegyzetek lekérése sikertelen" });
  }
});

/* =========================
   POST – új jegyzet
========================= */
router.post("/", requireAuth, async (req, res) => {
  const { cim, szoveg } = req.body;

  if (!cim) {
    return res.status(400).json({ error: "A cím kötelező" });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO jegyzet (cim, szoveg, felhasznalo_id)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [cim, szoveg || "", req.user.felhasznalo_id]
    );

    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Jegyzet létrehozása sikertelen" });
  }
});

/* =========================
   PUT – jegyzet módosítás
========================= */
router.put("/:id", requireAuth, async (req, res) => {
  const { cim, szoveg } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE jegyzet
      SET cim = $1, szoveg = $2
      WHERE jegyzet_id = $3 AND felhasznalo_id = $4
      RETURNING *
      `,
      [cim, szoveg, req.params.id, req.user.felhasznalo_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Jegyzet nem található" });
    }

    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: "Jegyzet módosítása sikertelen" });
  }
});

/* =========================
   DELETE – jegyzet törlés
========================= */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      DELETE FROM jegyzet
      WHERE jegyzet_id = $1 AND felhasznalo_id = $2
      `,
      [req.params.id, req.user.felhasznalo_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Jegyzet nem található" });
    }

    res.json({ message: "Jegyzet törölve" });
  } catch {
    res.status(500).json({ error: "Jegyzet törlése sikertelen" });
  }
});

module.exports = router;
