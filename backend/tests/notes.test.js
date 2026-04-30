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
const notesRouter = require("../routes/notes");

let mockJwtUser = {
  felhasznalo_id: 1,
  email: "user1@example.com",
  szerepkor: "user",
};

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/notes", notesRouter);
  return app;
}

describe("Notes endpoints", () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    process.env.JWT_SECRET = "test-secret";
    mockJwtUser = {
      felhasznalo_id: 1,
      email: "user1@example.com",
      szerepkor: "user",
    };
    jest.clearAllMocks();
  });

  // Teszt 1: Jegyzet letrehozasa
  test("jegyzet sikeres létrehozása", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          jegyzet_id: 10,
          cim: "Kedvenc helyem az istálóban",
          szoveg: "A jobb oldali box a legnyugodtabb...",
          felhasznalo_id: 1,
        },
      ],
    });

    const response = await request(app)
      .post("/api/notes")
      .set("Authorization", "Bearer mock-token")
      .send({
        cim: "Kedvenc helyem az istálóban",
        szoveg: "A jobb oldali box a legnyugodtabb...",
      });

    expect(response.status).toBe(201);
    expect(response.body.jegyzet_id).toBe(10);
  });

  // Teszt 2: Mas user nem latja a jegyzetet
  test("másik felhasználó nem látja más user jegyzeteit", async () => {
    mockJwtUser.felhasznalo_id = 2; // User 2 bejelentkezett

    // User 1 jegyzeteit lekérdez az adatbázis (de nem a User 2 jegyzeteit)
    pool.query.mockResolvedValueOnce({
      rows: [], // User 2 nem kap User 1 jegyzeteit (WHERE felhasznalo_id = $1)
    });

    const response = await request(app)
      .get("/api/notes")
      .set("Authorization", "Bearer mock-token");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
    // Az API csak az adott user jegyzeteit adja vissza
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE felhasznalo_id = $1"),
      [2]
    );
  });

  // Teszt 3: Jegyzet torlese
  test("jegyzet sikeres törlése", async () => {
    const jegyzetId = 10;

    pool.query.mockResolvedValueOnce({
      rowCount: 1,
    });

    const response = await request(app)
      .delete(`/api/notes/${jegyzetId}`)
      .set("Authorization", "Bearer mock-token");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Jegyzet törölve" });
  });
});
