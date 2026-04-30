# Prompt Log – Lóidő

## Bevezetés

Ez a dokumentum a projekt során használt legfontosabb AI promptokat és azok eredményeit tartalmazza. A lista a főbb tervezési, implementációs és dokumentációs döntéseket befolyásoló promptokat tartalmazza.

---

## P-01

* **Dátum / iteráció:** 2025-10-12 (P-01)
* **Cél:** adatbázis séma megtervezése
* **Prompt:** "Készíts PostgreSQL adatbázis sémát lovarda management rendszerhez (felhasználó, ló, lovarda, teendők)"
* **AI válasz rövid kivonata:** relációs adatmodell több entitással és kapcsolatokkal
* **Hová került:** `horse_management_schema.sql`
* **Kézi módosítás:** mezőnevek magyarosítása, kapcsolatok finomítása

---

## P-02

* **Dátum / iteráció:** 2025-10-18 (P-02)
* **Cél:** backend alap struktúra
* **Prompt:** "Node.js Express backend alap struktúra REST API-hoz"
* **AI válasz rövid kivonata:** route/controller alap felépítés
* **Hová került:** `backend/` struktúra
* **Kézi módosítás:** mappastruktúra egyszerűsítése

---

## P-03

* **Dátum / iteráció:** 2025-11-02 (P-03)
* **Cél:** autentikáció megvalósítása
* **Prompt:** "Node.js JWT authentication login és register példával"
* **AI válasz rövid kivonata:** login + token generálás + middleware
* **Hová került:** `backend/routes/auth.js`
* **Kézi módosítás:** szerepkör kezelés hozzáadása

---

## P-04

* **Dátum / iteráció:** 2025-11-15 (P-04)
* **Cél:** frontend alap felépítés
* **Prompt:** "React app struktúra több oldallal és routinggal"
* **AI válasz rövid kivonata:** React Router alap struktúra
* **Hová került:** `frontend/src/App.js`
* **Kézi módosítás:** oldalak (Home, Profile stb.) hozzáadása

---

## P-05

* **Dátum / iteráció:** 2025-12-03 (P-05)
* **Cél:** API kommunikáció frontendről
* **Prompt:** "React fetch wrapper token kezeléssel"
* **AI válasz rövid kivonata:** központi API hívó függvény
* **Hová került:** `frontend/src/utils/api.js`
* **Kézi módosítás:** hibakezelés és token kezelés

---

## P-06

* **Dátum / iteráció:** 2026-01-10 (P-06)
* **Cél:** lovak kezelése (CRUD)
* **Prompt:** "Node.js CRUD endpoint példa PostgreSQL-lel"
* **AI válasz rövid kivonata:** create/read/update/delete minta
* **Hová került:** `backend/routes/horses.js`
* **Kézi módosítás:** user alapú szűrés

---

## P-07

* **Dátum / iteráció:** 2026-02-05 (P-07)
* **Cél:** lovarda kezelés
* **Prompt:** "Reláció kezelése user és organization között adatbázisban"
* **AI válasz rövid kivonata:** 1:N kapcsolat modell
* **Hová került:** `backend/routes/stables.js`
* **Kézi módosítás:** lovarda törlés logika (user megmarad)

---

## P-08

* **Dátum / iteráció:** 2026-03-01 (P-08)
* **Cél:** teendők és naptár
* **Prompt:** "Task management API design Node backendhez"
* **AI válasz rövid kivonata:** task CRUD + státusz mező
* **Hová került:** `backend/routes/calendar.js`
* **Kézi módosítás:** lóhoz kötés

---

## P-09

* **Dátum / iteráció:** 2026-03-20 (P-09)
* **Cél:** verseny rendszer
* **Prompt:** "Competition management rendszer adatmodell és API"
* **AI válasz rövid kivonata:** verseny + jelentkezés modell
* **Hová került:** `backend/routes/competitions.js`
* **Kézi módosítás:** jogosultság kezelés

---

## P-10

* **Dátum / iteráció:** 2026-04-02 (P-10)
* **Cél:** UX dokumentáció
* **Prompt:** "Írj UX flow-t task management webapphoz"
* **AI válasz rövid kivonata:** user journey struktúra
* **Hová került:** `docs/01_product/ux_flows.md`
* **Kézi módosítás:** lovardás kontextus

---

## P-11

* **Dátum / iteráció:** 2026-04-13 (P-11)
* **Cél:** API dokumentáció
* **Prompt:** "Írj REST API dokumentációt példákkal"
* **AI válasz rövid kivonata:** endpoint lista
* **Hová került:** `docs/03_design/api.md`
* **Kézi módosítás:** valós route-okhoz igazítás

---

## P-12

* **Dátum / iteráció:** 2026-04-18 (P-12)
* **Cél:** security és threat model
* **Prompt:** "STRIDE threat model web apphoz"
* **AI válasz rövid kivonata:** security kockázatok
* **Hová került:** `docs/05_security_ops/threat_model.md`
* **Kézi módosítás:** stack specifikus példák

---

## P-13

* **Dátum / iteráció:** 2026-04-22 (P-13)
* **Cél:** error handling stratégia
* **Prompt:** "Standard API error handling JSON Node backendhez"
* **AI válasz rövid kivonata:** error object javaslat
* **Hová került:** `docs/03_design/error_handling.md`
* **Kézi módosítás:** egyszerűsítés

---

## P-14

* **Dátum / iteráció:** 2026-04-24 (P-14)
* **Cél:** observability
* **Prompt:** "Logging és monitoring best practices"
* **AI válasz rövid kivonata:** log struktúra és metrikák
* **Hová került:** `docs/05_security_ops/observability.md`
* **Kézi módosítás:** egyszerű implementáció

---

## P-15

* **Dátum / iteráció:** 2026-04-25 (P-15)
* **Cél:** teszt stratégia
* **Prompt:** "Milyen backend teszteket érdemes írni REST API-hoz?"
* **AI válasz rövid kivonata:** auth, validation, edge case tesztek
* **Hová került:** `backend/tests/`
* **Kézi módosítás:** domain specifikus tesztek

---

## Megjegyzés a GitHub Copilot használatról

A GitHub Copilot a teljes fejlesztési folyamat során (2025 október – 2026 április) folyamatos támogatást nyújtott:

* CRUD műveletek generálása
* ismétlődő backend logika
* React komponensek vázának létrehozása

Ez nem külön promptok formájában történt, hanem inline javaslatként, amelyeket minden esetben manuálisan ellenőriztem és módosítottam.
