const express = require("express");
const request = require("supertest");

jest.mock("../config/db", () => ({
  query: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "mock-new-token"),
  verify: jest.fn(() => mockJwtUser),
}));

const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const stablesRouter = require("../routes/stables");

let mockJwtUser = {
  felhasznalo_id: 1,
  email: "user1@example.com",
  szerepkor: "user",
};

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/stables", stablesRouter);
  return app;
}

describe("Stables endpoints", () => {
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

  // Teszt 1: Lovarda letrehozas ures nevvel (400)
  test("lovarda létrehozás üres névvel → 400 Bad Request", async () => {
    mockJwtUser.felhasznalo_id = 1;

    const response = await request(app)
      .post("/api/stables")
      .set("Authorization", "Bearer mock-token")
      .send({
        name: "", // Üres név
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "A lovarda neve kötelező.",
    });
  });

  // Teszt 2: User lovarda valtasa mukodik
  test("user lovarda váltása működik", async () => {
    mockJwtUser.felhasznalo_id = 1;

    // Lovarda beillesztése
    pool.query
      .mockResolvedValueOnce({
        rows: [
          {
            lovarda_id: 3,
            nev: "Új Lovarda",
          },
        ],
      })
      // User frissítése (új lovarda + szerepkör váltás)
      .mockResolvedValueOnce({
        rows: [
          {
            felhasznalo_id: 1,
            nev: "Teszt User",
            email: "user1@example.com",
            szerepkor: "lovarda_vezeto", // Szerepkör megváltozik
            lovarda_id: 3, // Új lovarda
          },
        ],
      });

    const response = await request(app)
      .post("/api/stables")
      .set("Authorization", "Bearer mock-token")
      .send({
        name: "Új Lovarda",
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: "Lovarda létrehozva.",
      stable: { stable_id: 3, name: "Új Lovarda" },
      user: {
        felhasznalo_id: 1,
        nev: "Teszt User",
        email: "user1@example.com",
        szerepkor: "lovarda_vezeto",
        lovarda_id: 3,
      },
      token: "mock-new-token",
    });

    // Ellenőrzés: a felhasználó új lovardát kapta
    expect(response.body.user.lovarda_id).toBe(3);
    expect(response.body.user.szerepkor).toBe("lovarda_vezeto");
  });

  // Teszt 3: Lovarda lista lekerdese
  test("lovarda lista lekérése - összes lovarda elérhető", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { lovarda_id: 1, nev: "Zöld pálya" },
        { lovarda_id: 2, nev: "Piros pálya" },
        { lovarda_id: 3, nev: "Kék pálya" },
      ],
    });

    const response = await request(app).get("/api/stables");

    expect(response.status).toBe(200);
    expect(response.body.stables.length).toBe(3);
    expect(response.body.stables[0]).toEqual({
      stable_id: 1,
      name: "Zöld pálya",
    });
  });

  // Teszt 4: Lovarda bejelentkezes utan szerephkor valtozik
  test("lovarda bejelentkezés után user szerepkör lovarda_vezeto lesz", async () => {
    mockJwtUser.felhasznalo_id = 3;

    // Lovarda beillesztése
    pool.query
      .mockResolvedValueOnce({
        rows: [
          {
            lovarda_id: 5,
            nev: "Új Lovarda",
          },
        ],
      })
      // User frissítése (új lovarda + szerepkör)
      .mockResolvedValueOnce({
        rows: [
          {
            felhasznalo_id: 3,
            nev: "Test User",
            email: "test@example.com",
            szerepkor: "lovarda_vezeto",
            lovarda_id: 5,
          },
        ],
      });

    const response = await request(app)
      .post("/api/stables")
      .set("Authorization", "Bearer mock-token")
      .send({
        name: "Új Lovarda",
      });

    expect(response.status).toBe(201);
    expect(response.body.user.szerepkor).toBe("lovarda_vezeto");
    expect(response.body.user.lovarda_id).toBe(5);
  });
});
