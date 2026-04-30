const express = require("express");
const request = require("supertest");

jest.mock("../config/db", () => ({
  query: jest.fn(),
  connect: jest.fn(() => ({
    query: jest.fn(),
    release: jest.fn(),
  })),
}));

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(() => mockJwtUser),
}));

const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const calendarRouter = require("../routes/calendar");

let mockJwtUser = {
  felhasznalo_id: 1,
  email: "user1@example.com",
  szerepkor: "user",
};

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/calendar", calendarRouter);
  return app;
}

describe("Calendar / Teendő (Tasks) endpoints", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = buildApp();
    process.env.JWT_SECRET = "test-secret";
    mockJwtUser = {
      felhasznalo_id: 1,
      email: "user1@example.com",
      szerepkor: "user",
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    pool.query.mockImplementation(() => {
      throw new Error("Pool query called unexpectedly");
    });
  });

  // Teszt 1: Teendő létrehozása
  test("teendő létrehozása sikeres", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ lovarda_id: 10 }] })
      .mockResolvedValueOnce({ rows: [{ teendo_id: 42 }] });

    const response = await request(app)
      .post("/api/calendar/teendo")
      .set("Authorization", "Bearer mock-token")
      .send({
        leiras: "Patkolás elvégzése",
        tipus: "patkolas",
        start: "2026-05-01T10:00:00Z",
        end: "2026-05-01T11:00:00Z",
      });

    expect(response.status).toBe(201);
  });

  // Teszt 2: Teendő módosítása
  test("teendő sikeres módosítása", async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1 });

    const response = await request(app)
      .put("/api/calendar/teendo/42")
      .set("Authorization", "Bearer mock-token")
      .send({
        leiras: "Módosított leírás",
        tipus: "allatorvos",
        start: "2026-05-05T14:00:00Z",
        end: "2026-05-05T16:00:00Z",
      });

    expect(response.status).toBe(200);
  });

  // Teszt 3: Teendő elvegzett = true
  test("teendő elvegzett státusza beállítása true-ra", async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1 });

    const response = await request(app)
      .patch("/api/calendar/teendo/42/elvegzett")
      .set("Authorization", "Bearer mock-token")
      .send({ elvegzett: true });

    expect(response.status).toBe(200);
  });

  // Teszt 4: Teendő törlése
  test("teendő törlése sikeres", async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 1 });

    const response = await request(app)
      .delete("/api/calendar/teendo/42")
      .set("Authorization", "Bearer mock-token");

    expect(response.status).toBe(204);
  });
});
