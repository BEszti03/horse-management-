const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const stablesRoutes = require("./routes/stables");
const horseRoutes = require("./routes/horses");
const calendarRoutes = require("./routes/calendar");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stables", stablesRoutes);
app.use("/api/horses", horseRoutes);
app.use("/api/calendar", calendarRoutes);

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello a backendből!" });
});

app.get("/api/dbtest", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS now, current_database() AS db;");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB kapcsolat hiba", error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend fut: http://localhost:${PORT}`);
});
