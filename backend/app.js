const express = require("express");
const cors = require("cors");
require("dotenv").config();
const pool = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ROUTES
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/horses", require("./routes/horses"));
app.use("/api/calendar", require("./routes/calendar"));
app.use("/api/competitions", require("./routes/competitions"));
app.use("/api/stables", require("./routes/stables"));
app.use("/api/notes", require("./routes/notes"));
app.use("/api/admin", require("./routes/admin"));

app.use((err, req, res, next) => {
  if (!err) {
    return next();
  }

  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "A feltöltött kép túl nagy (max 2MB)." });
    }
    return res.status(400).json({ message: "Fájl feltöltési hiba.", error: err.message });
  }

  if (err.message === "Csak képfájl tölthető fel." || err.message === "Ismeretlen feltöltési útvonal.") {
    return res.status(400).json({ message: err.message });
  }

  console.error("Kezelt szerverhiba:", err);
  return res.status(500).json({ message: "Szerver hiba." });
});

async function ensureProfileAndHorseImageColumns() {
  // Keep legacy databases compatible with the current profile/horse image features.
  await pool.query(
    "ALTER TABLE felhasznalo ADD COLUMN IF NOT EXISTS profilkep_url text"
  );
  await pool.query("ALTER TABLE lo ADD COLUMN IF NOT EXISTS kep_url text");
}

async function startServer() {
  try {
    await ensureProfileAndHorseImageColumns();

    app.listen(PORT, () => {
      console.log(`Backend fut: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Szerverindítási hiba:", err);
    process.exit(1);
  }
}

startServer();
