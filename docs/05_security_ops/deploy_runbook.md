# Deploy + Runbook

## Bevezetés

A dokumentum célja, hogy leírja a rendszer futtatásának és telepítésének lépéseit, valamint azt, hogyan kezelhetők a tipikus hibák. A jelenlegi projekt fejlesztői környezetre optimalizált, de a struktúra lehetővé teszi későbbi éles deploy-t is.

---

## Környezeti modell

A rendszer jelenleg az alábbi környezetekkel számol:

### Lokális (development)

* React frontend (`localhost:3000`)
* Express backend (`localhost:5000`)
* PostgreSQL adatbázis

### Staging (tervezett)

* Teszt környezet deploy előtt
* Azonos konfiguráció a production-höz

### Production (tervezett)

* Web szerver (frontend build)
* Node.js backend
* PostgreSQL adatbázis
* HTTPS kapcsolat

---

## Deploy lépések

### Előfeltételek

* Node.js telepítve
* PostgreSQL fut
* `.env` fájl konfigurálva

---

### 1. Backend indítása

```bash id="b1"
cd backend
npm install
npm start
```

---

### 2. Frontend indítása

```bash id="b2"
cd frontend
npm install
npm start
```

---

### 3. Adatbázis

* SQL séma importálása:

```bash id="b3"
psql -U user -d database < horse_management_schema.sql
```

---

## Konfiguráció és secrets

A rendszer `.env` fájlt használ.

### Példa:

```env id="b4"
DATABASE_URL=postgres://user:password@localhost:5432/db
JWT_SECRET=your_secret_key
```

### Elvek

* nincs hardcoded secret
* `.env` nincs feltöltve a repository-ba
* `.env.example` használata ajánlott

---

## Rollback stratégia

Ha a deploy hibás:

1. backend leállítása
2. visszaállás előző Git commitra:

```bash id="b5"
git checkout <previous_commit>
```

3. újraindítás

Adatbázis esetén:

* backup visszaállítása (ha van)

---

## Verziózás

A projekt verziózása Git alapú:

* commit hash azonosítja a verziót
* opcionálisan tag használható:

```bash id="b6"
git tag v1.0.0
```

---

# Runbook – Incident kezelések

## 1. API nem válaszol / 500 hibák

### Tünetek

* frontend nem tölt adatot
* `500 Internal Server Error`
* API nem érhető el

### Diagnózis

* backend fut-e (`npm start`)
* logok ellenőrzése
* adatbázis kapcsolat működik-e

### Ideiglenes megoldás

* backend újraindítása
* hibás endpoint ideiglenes kikapcsolása

### Végleges megoldás

* hiba reprodukálása
* bug fix implementálása
* új deploy

---

## 2. Adatbázis kapcsolat megszakad

### Tünetek

* minden kérés hibára fut
* `database connection error`

### Diagnózis

* PostgreSQL fut-e
* connection string helyes-e
* hálózati kapcsolat

### Ideiglenes megoldás

* DB újraindítása
* backend újraindítása

### Végleges megoldás

* connection pool javítása
* retry logika bevezetése

---

## 3. Bejelentkezés nem működik

### Tünetek

* user nem tud belépni
* `401 Unauthorized`

### Diagnózis

* JWT_SECRET helyes-e
* auth endpoint működik-e
* token generálás ellenőrzése

### Ideiglenes megoldás

* auth service újraindítása
* token reset

### Végleges megoldás

* auth logika javítása
* tesztek bővítése
