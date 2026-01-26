const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello a backendből 👋" });
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
