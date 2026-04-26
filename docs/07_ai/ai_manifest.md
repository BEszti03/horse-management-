# AI Manifest – Lóidő

## Bevezetés

A projekt fejlesztése során mesterséges intelligencia alapú eszközöket használtam a tervezés, implementáció és dokumentáció támogatására. Az AI eszközök használata tudatosan, ellenőrzötten történt, minden generált tartalom manuális validáláson ment keresztül.

---

## Használt eszközök és verziók

* ChatGPT (OpenAI GPT-5.3)
* GitHub Copilot (Visual Studio Code)

---

## Felhasználási területek

Az AI az alábbi területeken került felhasználásra:

### Tervezés

* architektúra kialakítása
* adatmodell struktúra
* API design

### Implementáció

* backend route-ok kiegészítése
* frontend komponensek
* utility függvények (pl. API hívások)

### Dokumentáció

* UX leírások
* API dokumentáció
* security és deployment dokumentáció

### Debug és hibakeresés

* hibák okainak feltárása
* lehetséges megoldások javaslata

---

## IDE AI használat (GitHub Copilot)

A fejlesztés során a GitHub Copilot kódkiegészítő eszközt használtam Visual Studio Code környezetben.

Ez a következő funkciókat biztosította:

* automatikus kódkiegészítés (inline suggestion)
* kisebb függvények és kódrészletek generálása
* ismétlődő minták gyorsítása

Fontos, hogy:

* minden Copilot által generált kód manuálisan ellenőrzésre került
* a javaslatok szükség esetén módosításra kerültek
* kritikus logikai részek nem automatikusan kerültek be a kódba

---

## Tiltások (adatkezelés AI használat során)

Az AI használata során az alábbi adatokat nem adtam ki:

* jelszavak
* `.env` fájl tartalma
* JWT secret kulcsok
* személyes adatok (PII)
* adatbázis connection string

Ez biztosítja, hogy az AI használat nem jelentett adatvédelmi kockázatot.

---

## Kritikus döntések (nem AI által)

Az alábbi döntéseket nem az AI hozta, hanem saját fejlesztői döntések voltak:

1. Jogosultsági modell kialakítása (admin vs lovarda vezető különválasztása)
2. Lovarda törlésének viselkedése (felhasználók nem törlődnek)
3. Teendők checkbox alapú kezelése a főoldalon
4. Verseny rendszer logikája és kapcsolatai
5. Projekt scope és feature lista meghatározása

---

## Kockázatok és kezelésük

### 1. Hallucináció

**Kockázat:**
Az AI nem létező vagy hibás megoldást javasolhat.

**Kezelés:**

* manuális ellenőrzés
* tesztelés
* dokumentáció validálása

---

### 2. Security hibák

**Kockázat:**
Az AI nem mindig ad biztonságos kódot.

**Kezelés:**

* input validáció
* auth és role check implementálása
* security dokumentáció készítése

---

### 3. Copilot kockázat

**Kockázat:**
Automatikus kódkiegészítés hibás vagy nem kívánt logikát vihet be.

**Kezelés:**

* minden generált kód review után kerül be
* kritikus részek manuálisan lettek implementálva

---

### 4. Licenc és forrás

**Kockázat:**
AI által generált kód eredete nem mindig ismert.

**Kezelés:**

* egyszerű, saját implementációk használata
* ismert open-source minták követése

---

## Verifikációs megközelítés

Az AI által javasolt megoldások minden esetben ellenőrzésre kerültek:

* manuális teszteléssel
* API endpoint tesztekkel
* hibakezelési tesztekkel
* adatbázis műveletek ellenőrzésével

A részletes ellenőrzések a `verification_log.md` fájlban találhatók.