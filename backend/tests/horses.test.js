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
const horsesRouter = require("../routes/horses");

let mockJwtUser = {
  felhasznalo_id: 1,
  email: "user1@example.com",
  szerepkor: "user",
};

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/horses", horsesRouter);
  return app;
}

describe("Horses endpoints", () => {
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

  // Teszt 1: Masik user nem latja mas lovat
  test("másik user nem látja más felhasználó lovait", async () => {
    mockJwtUser.felhasznalo_id = 2;

    // User 2 meghívja a GET /api/horses endpoint-ot
    // Az adatbázis User 1-nek a lovait adja vissza (de az csak User 1-nek kellene)
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          lo_id: 1,
          nev: "Favorit",
          fajta: "Angol tisztavér",
          szuletesi_ido: "2015-05-10",
          felhasznalo_id: 1, // Ez más user-hez tartozik!
          kep_url: null,
        },
      ],
    });

    const response = await request(app)
      .get("/api/horses")
      .set("Authorization", "Bearer mock-token");

    // Az API-nak csak az adott user lovait kell visszaadnia
    // De tegyük fel, hogy a DB már szűrte (WHERE felhasznalo_id = $1)
    // Ez a teszt ellenőrzi, hogy az API nem adhat meg más user lovait
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE felhasznalo_id = $1"),
      [2]
    );
  });

  // Teszt 2: Lo modositas mas user altal (404)
  test("ló módosítás más user által → 404 Forbidden", async () => {
    const user1LoId = 5;
    mockJwtUser.felhasznalo_id = 2; // User 2 próbálja módosítani

    // User 2 módosítani akarja User 1 lovát → nem találja meg a saját lovaik között
    pool.query.mockResolvedValueOnce({ rows: [] }); // UPDATE nem talál semmit

    const response = await request(app)
      .put(`/api/horses/${user1LoId}`)
      .set("Authorization", "Bearer mock-token")
      .send({
        nev: "Új név",
        fajta: "Mészáros",
      });

    // Az API nem engedélyezi más user lovainak módosítását (404)
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: "Nincs ilyen ló, vagy nincs jogosultságod.",
    });
  });

  // Teszt 3: Nem letezik lo torlese (404)
  test("nem létező ló törlése → 404 Not Found", async () => {
    const nonExistentLoId = 9999;
    mockJwtUser.felhasznalo_id = 1;

    // Az adatbázis nem találja a lovat (rowCount: 0 miatt)
    pool.query.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .delete(`/api/horses/${nonExistentLoId}`)
      .set("Authorization", "Bearer mock-token");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: "Nincs ilyen ló, vagy nincs jogosultságod.",
    });
  });

  // Teszt 4: Lo letrehozas ures nevvel (400)
  test("ló létrehozás üres névvel → 400 Bad Request", async () => {
    mockJwtUser.felhasznalo_id = 1;

    const response = await request(app)
      .post("/api/horses")
      .set("Authorization", "Bearer mock-token")
      .send({
        nev: "", // Üres név
        fajta: "Angol tisztavér",
        szuletesi_ido: "2015-05-10",
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "A ló neve kötelező.",
    });
  });

  // Teszt 5: Lo letrehozas datum hibajal (500)
  test("ló létrehozás hibás dátummal → 500 Server Error", async () => {
    mockJwtUser.felhasznalo_id = 1;

    // Az adatbázis hibát dob a hibás dátum miatt
    pool.query.mockRejectedValueOnce(
      new Error("invalid input syntax for type date")
    );

    const response = await request(app)
      .post("/api/horses")
      .set("Authorization", "Bearer mock-token")
      .send({
        nev: "Szép ló",
        fajta: "Angol tisztavér",
        szuletesi_ido: "2015-13-45", // Hibás dátum
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "Hiba a ló felvételekor.",
    });
  });
});
