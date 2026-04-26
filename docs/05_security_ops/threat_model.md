# Threat Model

## Bevezetés

A threat model célja az alkalmazás lehetséges biztonsági kockázatainak azonosítása és kezelése. A rendszer webalkalmazás, amely felhasználói adatokat, lovardai információkat és eseményeket kezel, ezért fontos a megfelelő védelem.

---

## Attack surface

A rendszer fő belépési pontjai:

* **Frontend UI (React):**

  * felhasználói input (formok: login, regisztráció, teendők, lovak)
* **Backend API (Express):**

  * REST endpointok (`/api/*`)
* **Autentikáció:**

  * JWT token kezelés
* **Admin felület:**

  * magas jogosultságú műveletek
* **Adatbázis:**

  * PostgreSQL lekérdezések

---

## Fenyegetések

### 1. SQL Injection

* **Leírás:** rosszindulatú input SQL lekérdezések manipulálására
* **Hatás:** adatvesztés, adatlopás
* **Valószínűség:** közepes

**Mitigáció:**

* paraméterezett lekérdezések használata
* input validáció

**Residual risk:**

* minimális, ha minden query paraméterezett

**Verification:**

* manuális tesztelés speciális inputokkal
* kód review

---

### 2. Jogosulatlan hozzáférés (Auth bypass)

* **Leírás:** nem hitelesített felhasználó hozzáfér védett endpointokhoz
* **Hatás:** adatbiztonsági sérülés
* **Valószínűség:** közepes

**Mitigáció:**

* JWT ellenőrzés minden védett endpointnál
* middleware használata

**Residual risk:**

* token kezelés hibái esetén fennáll

**Verification:**

* token nélküli kérés tesztelése
* hibás token tesztelése

---

### 3. Jogosultság eszkaláció

* **Leírás:** felhasználó admin jogosultságot szerez
* **Hatás:** teljes rendszer kompromittálása
* **Valószínűség:** alacsony

**Mitigáció:**

* backend role check
* admin endpointok védelme

**Residual risk:**

* hibás implementáció esetén fennáll

**Verification:**

* nem admin user admin endpoint teszt

---

### 4. XSS (Cross-Site Scripting)

* **Leírás:** rosszindulatú script injektálása UI-ba
* **Hatás:** session lopás, felhasználó manipuláció
* **Valószínűség:** közepes

**Mitigáció:**

* React automatikus escaping
* input tisztítás

**Residual risk:**

* ha raw HTML kerül megjelenítésre

**Verification:**

* script injection tesztek

---

### 5. Token ellopás

* **Leírás:** JWT token megszerzése
* **Hatás:** felhasználói fiók átvétele
* **Valószínűség:** közepes

**Mitigáció:**

* token tárolás biztonságosan (localStorage kezelése tudatosan)
* HTTPS használat (deploy esetén)

**Residual risk:**

* kliens oldali támadások esetén fennáll

**Verification:**

* token nélküli és lejárt token teszt

---

### 6. DoS / túlterhelés

* **Leírás:** túl sok kérés a backend felé
* **Hatás:** szolgáltatás lelassul vagy leáll
* **Valószínűség:** alacsony

**Mitigáció:**

* egyszerű backend logika
* később rate limiting bevezethető

**Residual risk:**

* jelenleg nincs aktív védelem

**Verification:**

* terheléses teszt (manuális)

---

## Összefoglalás

A rendszer alap szinten védi:

* autentikációt (JWT)
* jogosultságokat (role-based access)
* adatbázis műveleteket (paraméterezett queryk)

A fő kockázatok:

* kliens oldali támadások (XSS)
* token kezelés
* rate limiting hiánya

