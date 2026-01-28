const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ROUTES
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/horses", require("./routes/horses"));
app.use("/api/calendar", require("./routes/calendar"));
app.use("/api/competitions", require("./routes/competitions"));
app.use("/api/stables", require("./routes/stables"));

app.listen(PORT, () => {
  console.log(`Backend fut: http://localhost:${PORT}`);
});
