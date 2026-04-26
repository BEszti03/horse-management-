# Quality Attributes

## Fő minőségi attribútumok
### 1. Használhatóság (Usability)

* Egyszerű navigáció
* Gyors műveletvégzés
* Átlátható felületek

### 2. Biztonság (Security)

* Token alapú autentikáció (JWT)
* Backend oldali jogosultság ellenőrzés
* Védett endpointok

### 3. Adatkonzisztencia (Data Integrity)

* Relációs adatbázis (PostgreSQL)
* Idegen kulcsok használata
* Validáció mentés előtt

### 4. Karbantarthatóság (Maintainability)

* Moduláris backend (route-ok külön fájlokban)
* Komponens alapú frontend
* Egységes API használat

### 5. Teljesítmény (Performance)

* Gyors válaszidő normál használat mellett
* Egyszerű lekérdezések

---

## Quality Attribute Scenario-k

### 1. Bejelentkezés kezelése (Security + Performance)

* **Forrás (source):** felhasználó
* **Stimulus:** bejelentkezési kérés küldése
* **Környezet:** normál működés
* **Artefakt:** backend autentikációs modul
* **Válasz:**

  * sikeres hitelesítés esetén JWT token generálása
  * sikertelen hitelesítés esetén hibaüzenet visszaadása
* **Mérőszám:** válaszidő < 1 másodperc

---

### 2. Teendő mentése (Data Integrity)

* **Forrás (source):** felhasználó
* **Stimulus:** új teendő létrehozása
* **Környezet:** normál működés
* **Artefakt:** backend + adatbázis
* **Válasz:**

  * valid adatok esetén a teendő mentése az adatbázisba
  * hibás adatok esetén a mentés elutasítása és hibaüzenet
* **Mérőszám:** a mentett adat azonnal megjelenik a felhasználói felületen

