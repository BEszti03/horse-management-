const express = require("express");
const request = require("supertest");

jest.mock("../config/db", () => ({
  query: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "mock-token"),
  verify: jest.fn(),
}));

const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const authRouter = require("../routes/auth");
const horsesRouter = require("../routes/horses");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRouter);
  app.use("/api/horses", horsesRouter);
  return app;
}

describe("Error Handling & Security", () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    process.env.JWT_SECRET = "test-secret";
    jest.clearAllMocks();
  });

  // Teszt 1: Token lejart (401)
  test("lejárt token → 401 Unauthorized", async () => {
    const jwtExpiredError = new Error("jwt expired");
    jwtExpiredError.name = "TokenExpiredError";

    jwt.verify.mockImplementation(() => {
      throw jwtExpiredError;
    });

    const response = await request(app)
      .get("/api/horses")
      .set("Authorization", "Bearer expired-mock-token");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Érvénytelen token.",
    });
  });

  // Teszt 2: Hibas token (401)
  test("hibás/malformed token → 401 Unauthorized", async () => {
    const jwtInvalidError = new Error("invalid token");
    jwtInvalidError.name = "JsonWebTokenError";

    jwt.verify.mockImplementation(() => {
      throw jwtInvalidError;
    });

    const response = await request(app)
      .get("/api/horses")
      .set("Authorization", "Bearer invalid-mock-token");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Érvénytelen token.",
    });
  });

  // Teszt 3: API fallback error (500)
  test("adatbázis hiba → 500 Internal Server Error", async () => {
    jwt.verify.mockReturnValue({
      felhasznalo_id: 1,
      email: "user@example.com",
      szerepkor: "user",
    });

    // Szuppressz console.error a DB error szimulálás alatt
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    // Adatbázis hiba szimulálása
    pool.query.mockRejectedValueOnce(
      new Error("connection refused")
    );

    const response = await request(app)
      .get("/api/horses")
      .set("Authorization", "Bearer mock-token");

    consoleErrorSpy.mockRestore();

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "Hiba a lovak lekérésekor.",
    });
  });

  // EXTRA Teszt 4: Nincs token header
  test("hiányzó Authorization header → 401", async () => {
    const response = await request(app).get("/api/horses");
    // Nincs Authorization header

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Nincs token.",
    });
  });

  // ✅ EXTRA Teszt 5: Helytelen token formátum (nem Bearer)
  test("helytelen Authorization formátum (nem Bearer) → 401", async () => {
    const response = await request(app)
      .get("/api/horses")
      .set("Authorization", "Basic dXNlcjpwYXNz"); // Basic auth helyett

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Nincs token.",
    });
  });
});
