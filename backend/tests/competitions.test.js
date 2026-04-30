const express = require("express");
const request = require("supertest");

jest.mock("../config/db", () => ({
  query: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(() => mockJwtUser),
}));

const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const competitionsRouter = require("../routes/competitions");

let mockJwtUser = {
  felhasznalo_id: 1,
  email: "user1@example.com",
  szerepkor: "lovarda_vezeto",
};

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/competitions", competitionsRouter);
  return app;
}

describe("Competitions endpoints", () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    process.env.JWT_SECRET = "test-secret";
    mockJwtUser = {
      felhasznalo_id: 1,
      email: "user1@example.com",
      szerepkor: "lovarda_vezeto",
    };
    jest.clearAllMocks();
  });

  // Teszt 1: Verseny létrehozása lovarda vezetőként
  test("verseny létrehozása lovarda vezetőként", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ lovarda_id: 10 }] })
      .mockResolvedValueOnce({ rowCount: 1 });

    const response = await request(app)
      .post("/api/competitions")
      .set("Authorization", "Bearer mock-token")
      .send({
        nev: "Nagydöntő 2026",
        datum: "2026-06-15",
      });

    expect(response.status).toBe(201);
  });

  // Teszt 2: Sima user nem hozhat létre versenyt (403)
  test("sima user nem hozhat létre versenyt → 403", async () => {
    mockJwtUser.szerepkor = "user";

    const response = await request(app)
      .post("/api/competitions")
      .set("Authorization", "Bearer mock-token")
      .send({
        nev: "Illegális verseny",
        datum: "2026-06-15",
      });

    expect(response.status).toBe(403);
  });

  // Teszt 3: Verseny jelentkezés
  test("verseny jelentkezés sikeres lóval", async () => {
    const versenyId = 5;

    pool.query
      .mockResolvedValueOnce({ rows: [{ datum: "2026-06-15" }] })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ lo_id: 7 }] })
      .mockResolvedValueOnce({ rowCount: 1 });

    const response = await request(app)
      .post(`/api/competitions/${versenyId}/signup`)
      .set("Authorization", "Bearer mock-token")
      .send({ lo_id: 7 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Sikeres jelentkezés" });
  });

  // Teszt 4: Verseny jelentkezés duplikált - nincs hiba
  test("verseny jelentkezés duplikált – nincs hiba, csak ignore", async () => {
    const versenyId = 5;

    pool.query
      .mockResolvedValueOnce({ rows: [{ datum: "2026-06-15" }] })
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rowCount: 0 });

    const response = await request(app)
      .post(`/api/competitions/${versenyId}/signup`)
      .set("Authorization", "Bearer mock-token")
      .send({ lo_id: 7 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Sikeres jelentkezés" });
  });

  // Teszt 5: Verseny törlés - kapcsolatok törlödik
  test("verseny törlése – összes kapcsolat törlödik", async () => {
    const versenyId = 5;

    pool.query
      .mockResolvedValueOnce({ rows: [{ lovarda_id: 10 }] })
      .mockResolvedValueOnce({ rows: [{ verseny_id: 5 }] })
      .mockResolvedValueOnce({ rowCount: 3 })
      .mockResolvedValueOnce({ rowCount: 3 })
      .mockResolvedValueOnce({ rowCount: 1 });

    const response = await request(app)
      .delete(`/api/competitions/${versenyId}`)
      .set("Authorization", "Bearer mock-token");

    expect(response.status).toBe(204);
  });
});
