# Horse Time Management

## Projekt áttekintés

A Horse Time Management egy webalapú alkalmazás, amely lovardák és lovasok számára
nyújt segítséget a mindennapi teendők, események és adatok kezelésében.
A rendszer célja az adminisztráció egyszerűsítése, az információk központosítása,
valamint a felhasználók közötti együttműködés támogatása.

Az alkalmazás role-based access control elven működik, így a különböző
felhasználói szerepkörök eltérő jogosultságokkal rendelkeznek.

---

## Technológiai stack

- **Frontend:** React
- **Backend:** Node.js, Express
- **Adatbázis:** PostgreSQL
- **Architektúra:** PERN
- **Autentikáció:** JWT (JSON Web Token)

---

## Architektúra áttekintés

Az alkalmazás háromrétegű architektúrára épül:

- **Frontend (React SPA):**
  Felhasználói felület, állapotkezelés, API-hívások.
- **Backend (Node.js + Express):**
  REST API, üzleti logika, jogosultságkezelés.
- **Adatbázis (PostgreSQL):**
  Relációs adatok tárolása, referenciális integritás biztosítása.

A frontend HTTP kéréseken keresztül kommunikál a backenddel,
a backend pedig SQL-lekérdezésekkel éri el az adatbázist.

---

## Infrastrukturális felépítés

A projekt fejlesztési környezetben lokálisan fut:

- a frontend és backend külön Node.js folyamatként működik,
- a frontend proxy segítségével kommunikál a backenddel,
- az adatbázis PostgreSQL szerveren fut.

Ez a felépítés lehetővé teszi a komponensek elkülönített fejlesztését
és karbantartását.

---

## Környezeti beállítások

A backend futtatásához egy `.env` fájl szükséges, amely az alábbi
környezeti változókat tartalmazza:

```env
PORT=5000
DATABASE_URL=postgresql://felhasznalo:jelszo@localhost:5432/adatbazis
JWT_SECRET=secret_kulcs
