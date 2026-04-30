# Teszt stratégia

## 1. Teszt piramis

### Aktuális állapot (2026-04-30)

```
          /‾‾‾‾‾‾‾‾‾‾\
         /  HTTP Unit  \   9 teszt (23%)
        /‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
       /   Route Unit    \  30 teszt (77%)
      /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
```

| Szint | Darab | Arány | Jellemzők |
|-------|-------|-------|-----------|
| **Unit (Route + mock DB)** | 30 | 77% | Express route logika, jwt/bcrypt mock |
| **Controller (HTTP + mock DB)** | 9 | 23% | Supertest HTTP contract, middleware |
| **Összesen** | **39** | **100%** | — |

---

## 2. Mit tesztel melyik szint

### Unit tesztek (`*.test.js` – jest.mock DB-vel)

**AKTUÁLIS: 30 teszt már implementálva**

Tisztán route/middleware logikát tesztelnek, adatbázis nélkül. A `pool.query` és más externális
függőségek `jest.mock()` segítségével vannak helyettesítve.

**Lefedett modulok (aktuális):**
- `auth.test.js` – Regisztráció, login, logout, JWT validálás (bcrypt + jwt mockolva)
- `horses.test.js` – Ló CRUD, szűrés, lapozás logika (DB mock, multer mock)
- `calendar.test.js` – Naptár események szűrése, dátum validálás (DB mock)
- `competitions.test.js` – Verseny regisztráció logika, jogosultság check (DB mock)
- `notes.test.js` – Jegyzet CRUD, lekérés, szűrés (DB mock)
- `stables.test.js` – Stabil kezelés (DB mock)
- `arenas.test.js` – Arénák CRUD (DB mock)
- `error-handling.test.js` – 404, 500, validálási hibák (middleware mock)

**Tipikus tesztelt esetek:**
- ✅ Sikeres műveletek (happy path)
- ❌ Not found hibák (entitás nem létezik)
- ❌ Validálási hibák (pl. hiányzó adat, érvénytelen email)
- ❌ Jogosultság hibák (admin-only endpoint, user nem admin)
- ⚠ Edge case-ek (üres lista, duplikáció, null értékek)

**Jellemzők:** 
- Futási idő: <2 mp (szinkron, no I/O)
- Determinisztikus: azonos input → azonos output minden futáson

**A kész tesztkészlet lezárt:**
- A jelenlegi 39 teszt lefedi a backend számára kijelölt scope-ot.
- Új tesztfajta vagy további bővítés nem része ennek a verziónak.

### Controller tesztek (`*.test.js` – HTTP szint)

**AKTUÁLIS: 9 controller teszt a teljes 39 tesztből**

HTTP szintű API contract tesztek `supertest` segítségével. Valódi HTTP kérések mennek a teljes
Express middleware stack-en keresztül, de DB mock-olt.

**Lefedett terület (aktuális):**
- `auth.test.js` – POST /api/auth/register, login, logout – státuszkódok (200, 400, 409)
- `horses.test.js` – GET /api/horses, POST /api/horses – auth middleware, role-based access
- `competitions.test.js` – GET /api/competitions, POST /api/competitions/register
- `error-handling.test.js` – 404 (route nincs), 500 (szándékos error), 401 (no token)

**Jellemzők:**
- Futási idő: <500 ms per teszt
- Middleware sorrend tesztelése (auth → authZ → handler)
- Státuszkódok, header-ek, body szerkezete
- Request/response contract stabilitása

### Integrációs tesztek

Ebben a verzióban külön integration suite nincs. A jelenlegi tesztstratégia 30 unit és 9 controller
tesztre épül, vagyis a teljes 39 teszt mockolt DB-s és HTTP-szintű lefedést ad.

**Következmény:**
- Nincs külön test PostgreSQL adatbázisra épülő suite.
- Nincs BEGIN/ROLLBACK-alapú integration izoláció.
- A backend viselkedését a unit és controller tesztek rögzítik.

---

## 3. Legkritikusabb user flow-k

### 1. Autentikáció flow

**Szekvencia:** Regisztráció → Login → JWT token → Protected route elérése → Logout

**Lefedő tesztek (Unit + Integration + Controller):**

| Teszt | Fájl | Szint | Célja |
|-------|------|-------|-------|
| Register valid data → user created | `auth.test.js` | Unit | Regisztráció logika, bcrypt hash validálás |
| Register duplicate email → 409 | `auth.test.js` | Unit | Email unique constraint enforce |
| Login correct credentials → JWT token | `auth.test.js` | Unit | JWT generation, token content |
| Login wrong password → 401 | `auth.test.js` | Unit | Password hash compare fail |
| Protected GET /api/users/me with token → 200 | `auth.test.js` | Controller | JWT middleware, header parse |
| Protected GET /api/users/me no token → 401 | `auth.test.js` | Controller | Auth gate enforce |
| POST /api/auth/logout → session clear | `auth.test.js` | Controller | Logout flow és auth middleware viselkedés |

**Why critical:** A felhasználó bejelentkezés nélkül nem tudja elérni a saját adatait, lovait, versenyek. Ez az app alapfunkciója.

### 2. Verseny regisztráció flow

**Szekvencia:** Felhasználó bejelentkezik → Verseny lista → Ló kiválasztása → Regisztrálás → Naptáron megjelenik

**Lefedő tesztek (Unit + Integration):**

| Teszt | Fájl | Szint | Célja |
|-------|------|-------|-------|
| GET /api/competitions → lista | `competitions.test.js` | Unit | Verseny lekérés logika |
| POST /api/competitions/:id/register + horse_id → success | `competitions.test.js` | Unit | Regisztráció logika, jogosultság check (owner) |
| POST register already registered → duplicate skip | `competitions.test.js` | Unit | Duplikáció védelem |
| GET /api/calendar?start=X&end=Y → includes registered competitions | `calendar.test.js` | Unit | Calendar query, reláció join |

**Why critical:** Üzleti érték: a felhasználó versenyek szervezésének és naptárkezelésének az a fő célja. Ha a regisztráció vagy a naptár szinkron nem működik, rossz UX.

---

## 4. Mock / Stub stratégia

### Unit teszteknél

**Modules fully replaced with jest.mock():**
- `pool.query()` – mock returns `{ rows: [...] }` vagy `rejected: Error`
- `bcrypt.hash()` – mock returns fixed hash
- `jwt.sign()` – mock returns "mock-token"
- `jwt.verify()` – mock returns fixed `{ felhasznalo_id: 1, ... }`
- `multer.single()` – mock middleware returns `req.file = { filename: "test.jpg" }`

**Típikus unit test minta:**
```javascript
jest.mock("../config/db", () => ({
  query: jest.fn(),
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn(() => "hashed-password"),
  compare: jest.fn((pwd, hash) => pwd === "correct-password"),
}));

describe("Register endpoint", () => {
  it("should return 200 when user data is valid", async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // no duplicate

    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@test.com", password: "secure123" })
      .expect(200);

    expect(response.body.token).toBe("mock-token");
    expect(bcrypt.hash).toHaveBeenCalled();
  });
});
```

**Előnyök:**
- Nincs real I/O
- Determinisztikus (azonos teszt → azonos kimenet)
- Gyors (<100 ms)

### Controller teszteknél

**Supertest + mock DB (jelenlegi setup):**

```javascript
jest.mock("../config/db", () => ({
  query: jest.fn(),
}));

const app = buildApp(); // Express app with real middleware

describe("HTTP API contract", () => {
  it("should return 401 when token missing", async () => {
    const response = await request(app)
      .get("/api/users/me")
      .expect(401);
    
    expect(response.body.message).toContain("Unauthorized");
  });

  it("should return 200 with user data when token valid", async () => {
    // Mock JWT middleware
    jwt.verify.mockReturnValueOnce({ felhasznalo_id: 1 });
    
    pool.query.mockResolvedValueOnce({ 
      rows: [{ felhasznalo_id: 1, email: "test@test.com" }] 
    });

    const response = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer mock-token")
      .expect(200);
    
    expect(response.body.email).toBe("test@test.com");
  });
});
```

**Előnyök:**
- Teljes Express middleware sorrend tesztelése (auth → authZ → handler)
- HTTP status kódok validálása (401, 403, 404, 500)
- Request/response headers, body format ellenőrzés
- Gyors (mock DB = no I/O)

**Jellemzők:**
- Futási idő: <500 ms per teszt
- Middleware order validation
- Contract stability (API consumers megbízhatnak a szerződésben)

---

## 5. Quality Gate-ek

CI pipeline jelenleg nincs konfigurálva, de a tesztek lokálisan teljes mértékben futtathatók
és dokumentált módon reprodukálhatók.

**Aktuális gate-ek (lokál fejlesztés):**
- ✅ `npm test` pass – Jest 39/39 teszt pass-al zárjon

**Minimális quality gate:**
- `npm install` – dependency resolving, lock file check
- `npm test` – a teljes, végleges 39/39 tesztkészletnek kell passzolnia
- `npm run lint` – ha a repo-ban elérhető és használatban van

---

## 6. Tesztek futtatása

### Összes teszt futtatása

```bash
cd backend
npm test
```

**Kimenet:** Jest összesítés, 39/39 passed

### Egy adott teszt file futtatása

```bash
cd backend
npm test -- auth.test.js
```

### Jest coverage gyűjtése

```bash
cd backend
jest --coverage
```

### Csak unit tesztek (mock DB-vel)

```bash
cd backend
jest --testPathPattern="test.js$"
```

### Watch mód (fejlesztés közben)

```bash
cd backend
jest --watch
```

### Debug módban futtatás (VSCode debugger)

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
# Chrome DevTools: chrome://inspect → Attach
```

---

## Összefoglalás

### Aktuális (2026-04-30)

| Elem | Status |
|------|--------|
| **Unit tesztek** | ✅ 30 (route logika mock DB-vel) |
| **Controller tesztek** | ✅ 9 (HTTP Supertest) |
| **Integration tesztek** | Nincs külön suite |
| **Összesen** | ✅ **39 teszt** |
| **Futási idő** | ~1,6 mp |
| **Coverage** | ~45% (becslés) |
| **CI pipeline** | ⏳ Nincs |



