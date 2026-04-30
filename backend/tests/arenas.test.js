const express = require("express");
const request = require("supertest");

jest.mock("../config/db", () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(() => mockJwtUser),
}));

const pool = require("../config/db");
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

describe("Arenas / Palya-booking endpoints", () => {
  let app;
  let mockClient;

  beforeEach(() => {
    app = buildApp();
    process.env.JWT_SECRET = "test-secret";
    mockJwtUser = {
      felhasznalo_id: 1,
      email: "user1@example.com",
      szerepkor: "user",
    };

    // Mock client for transactions
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    pool.connect.mockResolvedValue(mockClient);

    jest.clearAllMocks();
  });

  // Teszt 1: Pálya foglalás létrehozása
  test("pálya foglalás létrehozása sikeres", async () => {
    // getUserLovardaId
    pool.query.mockResolvedValueOnce({
      rows: [{ lovarda_id: 10 }],
    });

    // Transaction queries
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rowCount: 0 }) // conflict check
      .mockResolvedValueOnce({ rows: [{ palya_id: 77 }] }) // INSERT palya
      .mockResolvedValueOnce({ rowCount: 1 }) // INSERT palya_tartozkodas
      .mockResolvedValueOnce({}); // COMMIT

    const response = await request(app)
      .post("/api/calendar/palya-booking")
      .set("Authorization", "Bearer mock-token")
      .send({
        start: "2026-05-10T09:00:00Z",
        end: "2026-05-10T10:00:00Z",
        ferohely: 3,
      });

    expect(response.status).toBe(201);
    expect(response.body.palya_id).toBe(77);
  });

  // Teszt 2: Hibás időszak (end < start)
  test("pálya foglalás hibás idővel - end < start → 400", async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ lovarda_id: 10 }] });

    const response = await request(app)
      .post("/api/calendar/palya-booking")
      .set("Authorization", "Bearer mock-token")
      .send({
        start: "2026-05-10T10:00:00Z",
        end: "2026-05-10T09:00:00Z", // Earlier than start!
      });

    expect(response.status).toBe(400);
  });

  // Teszt 3: Foglalás törlése
  test("pálya foglalás törlése sikeres", async () => {
    const palyaId = 77;

    // getUserLovardaId
    pool.query.mockResolvedValueOnce({ rows: [{ lovarda_id: 10 }] });

    // Transaction queries
    mockClient.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rowCount: 1 }) // own check
      .mockResolvedValueOnce({ rowCount: 1 }) // DELETE palya_tartozkodas
      .mockResolvedValueOnce({ rowCount: 0 }) // no more bookings
      .mockResolvedValueOnce({ rowCount: 1 }) // DELETE palya
      .mockResolvedValueOnce({}); // COMMIT

    const response = await request(app)
      .delete(`/api/calendar/palya-booking/${palyaId}`)
      .set("Authorization", "Bearer mock-token");

    expect(response.status).toBe(204);
  });
});
