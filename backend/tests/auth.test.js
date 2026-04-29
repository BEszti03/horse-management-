const express = require("express");
const request = require("supertest");

jest.mock("../config/db", () => ({
  query: jest.fn(),
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "mock-token"),
  verify: jest.fn(() => mockJwtUser),
}));

const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authRouter = require("../routes/auth");
const usersRouter = require("../routes/users");
const adminRouter = require("../routes/admin");
const competitionsRouter = require("../routes/competitions");

let mockJwtUser = {
  felhasznalo_id: 1,
  email: "test@example.com",
  szerepkor: "user",
};

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/competitions", competitionsRouter);
  return app;
}

describe("Auth endpoints", () => {
  let app;

  beforeEach(() => {
    app = buildApp();
    process.env.JWT_SECRET = "test-secret";
    mockJwtUser = {
      felhasznalo_id: 1,
      email: "test@example.com",
      szerepkor: "user",
    };
    jest.clearAllMocks();
  });

  test("regisztráció sikeres adatokkal", async () => {
    bcrypt.hash.mockResolvedValue("hashed-password");
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            felhasznalo_id: 1,
            nev: "Teszt Elek",
            email: "teszt@example.com",
            szerepkor: "user",
            lovarda_id: null,
          },
        ],
      });

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        nev: "Teszt Elek",
        email: "teszt@example.com",
        jelszo: "Secret123!",
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      user: {
        felhasznalo_id: 1,
        nev: "Teszt Elek",
        email: "teszt@example.com",
        szerepkor: "user",
        lovarda_id: null,
      },
      token: "mock-token",
    });
    expect(bcrypt.hash).toHaveBeenCalledWith("Secret123!", 12);
  });

  test("regisztráció hiányzó mezővel → 400", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        nev: "Teszt Elek",
        email: "teszt@example.com",
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: "Hiányzó mező(k)." });
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("regisztráció foglalt emaillel → 409", async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ felhasznalo_id: 99 }],
    });

    const response = await request(app)
      .post("/api/auth/register")
      .send({
        nev: "Teszt Elek",
        email: "teszt@example.com",
        jelszo: "Secret123!",
      });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: "Ezzel az emaillel már létezik felhasználó.",
    });
  });

  test("login jó adatokkal → token", async () => {
    bcrypt.compare.mockResolvedValue(true);
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          felhasznalo_id: 1,
          nev: "Teszt Elek",
          email: "teszt@example.com",
          szerepkor: "user",
          lovarda_id: null,
          jelszo_hash: "hashed-password",
          elso_belepes: false,
        },
      ],
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "teszt@example.com",
        jelszo: "Secret123!",
      });

    expect(response.status).toBe(200);
    expect(response.body.token).toBe("mock-token");
    expect(response.body.user).toMatchObject({
      felhasznalo_id: 1,
      nev: "Teszt Elek",
      email: "teszt@example.com",
      szerepkor: "user",
      lovarda_id: null,
      elso_belepes: true,
    });
  });

  test("login rossz jelszóval → 401", async () => {
    bcrypt.compare.mockResolvedValue(false);
    pool.query.mockResolvedValueOnce({
      rows: [
        {
          felhasznalo_id: 1,
          nev: "Teszt Elek",
          email: "teszt@example.com",
          szerepkor: "user",
          lovarda_id: null,
          jelszo_hash: "hashed-password",
          elso_belepes: false,
        },
      ],
    });

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "teszt@example.com",
        jelszo: "rossz-jelszo",
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Hibás email vagy jelszó." });
  });

  test("védett endpoint token nélkül → 401", async () => {
    const response = await request(app).get("/api/users/me");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Nincs token." });
  });

  test("nem admin nem éri el az admin endpointot → 403", async () => {
    mockJwtUser = {
      felhasznalo_id: 2,
      email: "user@example.com",
      szerepkor: "user",
    };

    const response = await request(app)
      .get("/api/admin/users")
      .set("Authorization", "Bearer mock-token");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: "Nincs admin jogosultság." });
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("admin eléri az admin endpointot", async () => {
    mockJwtUser = {
      felhasznalo_id: 1,
      email: "admin@example.com",
      szerepkor: "admin",
    };

    pool.query.mockResolvedValueOnce({
      rows: [
        {
          felhasznalo_id: 1,
          nev: "Admin Elek",
          email: "admin@example.com",
          szerepkor: "admin",
          lovarda_id: null,
          lovarda_nev: null,
        },
      ],
    });

    const response = await request(app)
      .get("/api/admin/users")
      .set("Authorization", "Bearer mock-token");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      users: [
        {
          felhasznalo_id: 1,
          nev: "Admin Elek",
          email: "admin@example.com",
          szerepkor: "admin",
          lovarda_id: null,
          lovarda_nev: null,
        },
      ],
    });
  });

  test("lovarda vezető eléri a saját versenykezelő oldalához tartozó endpointot", async () => {
    mockJwtUser = {
      felhasznalo_id: 3,
      email: "vezeto@example.com",
      szerepkor: "lovarda_vezeto",
      lovarda_id: 12,
    };

    pool.query.mockResolvedValueOnce({
      rows: [
        {
          verseny_id: 77,
          nev: "Tavaszi Kupa",
          datum: "2026-05-10",
          jelentkezheto: true,
          lovarda_id: 12,
          lovarda_nev: "Napfény Lovarda",
        },
      ],
    });

    const response = await request(app)
      .get("/api/competitions/managed")
      .set("Authorization", "Bearer mock-token");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        verseny_id: 77,
        nev: "Tavaszi Kupa",
        datum: "2026-05-10",
        jelentkezheto: true,
        lovarda_id: 12,
        lovarda_nev: "Napfény Lovarda",
      },
    ]);
  });

  test("sima felhasználó nem hozhat létre versenyt → 403", async () => {
    mockJwtUser = {
      felhasznalo_id: 4,
      email: "user2@example.com",
      szerepkor: "user",
    };

    const response = await request(app)
      .post("/api/competitions")
      .set("Authorization", "Bearer mock-token")
      .send({
        nev: "Nyári Verseny",
        datum: "2026-06-01",
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: "Nincs jogosultság" });
    expect(pool.query).not.toHaveBeenCalled();
  });
});
