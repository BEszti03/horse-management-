# Teszt riport

## Utolsó futás

| Adat | Érték |
|------|-------|
| Dátum | 2026-04-30 |
| Időpont | 11:45:20 → 11:45:22 (≈1,6 s) |
| Környezet | Windows (lokál) |
| Framework | Jest 30.3.0 |
| Eredmény | ✅ **39 / 39 passed** |

---

## Suite összefoglaló

| Test Suite | Tesztek | Passed | Failed | Futási idő |
|-----------|---------|--------|--------|------------|
| `auth.test.js` | 5 | 5 | 0 | <100 ms |
| `calendar.test.js` | 5 | 5 | 0 | <100 ms |
| `horses.test.js` | 6 | 6 | 0 | <100 ms |
| `competitions.test.js` | 4 | 4 | 0 | <100 ms |
| `arenas.test.js` | 4 | 4 | 0 | <100 ms |
| `notes.test.js` | 5 | 5 | 0 | <100 ms |
| `stables.test.js` | 3 | 3 | 0 | <100 ms |
| `error-handling.test.js` | 2 | 2 | 0 | <100 ms |
| **Összesen** | **39** | **39** | **0** | **~1,6 s** |

---

## Futtatási parancsok

```bash
# Összes teszt (szekvenciális futás)
npm test

# Parancs részletezve
jest --runInBand

# Csak egy adott teszt file
npm test -- auth.test.js

# Watch mód (figyeli a fájlváltásokat)
jest --watch

# Verbózus kimenetre
jest --verbose
```

---

## Auth tesztek részletei (5 db)

| Teszt | Eredmény |
|-------|----------|
| Sikeres regisztráció új felhasználóval | ✅ |
| Sikeres bejelentkezés érvényes adatokkal | ✅ |
| Bejelentkezés elutasítása helytelen jelszóval | ✅ |
| JWT token validálása | ✅ |
| Kijelentkezés és session kezelés | ✅ |

---

## Calendar tesztek részletei (5 db)

| Teszt | Eredmény |
|-------|----------|
| Naptár esemény létrehozása | ✅ |
| Naptár esemény lekérdezése dátumtartománytól | ✅ |
| Naptár esemény módosítása | ✅ |
| Naptár esemény törlése | ✅ |
| Naptár események szűrése felhasználó alapján | ✅ |

---

## Horses tesztek részletei (6 db)

| Teszt | Eredmény |
|-------|----------|
| Ló hozzáadása új adatokkal | ✅ |
| Ló adatainak lekérdezése | ✅ |
| Ló információinak frissítése | ✅ |
| Ló törlése az adatbázisból | ✅ |
| Ló képfeltöltés és kezelés | ✅ |
| Összes ló listázása szűrésekkel | ✅ |

---

## Competitions tesztek részletei (4 db)

| Teszt | Eredmény |
|-------|----------|
| Verseny létrehozása és regisztrációja | ✅ |
| Verseny adatainak lekérdezése | ✅ |
| Verseny módosítása | ✅ |
| Verseny résztvevő kezelése | ✅ |

---

## Arenas tesztek részletei (4 db)

| Teszt | Eredmény |
|-------|----------|
| Arena létrehozása és konfigurálása | ✅ |
| Arena adatainak lekérdezése | ✅ |
| Arena frissítése | ✅ |
| Arena törlése | ✅ |

---

## Notes tesztek részletei (5 db)

| Teszt | Eredmény |
|-------|----------|
| Jegyzet létrehozása lóhoz | ✅ |
| Jegyzet lekérdezése | ✅ |
| Jegyzet szerkesztése | ✅ |
| Jegyzet törlése | ✅ |
| Jegyzetek szűrése és lapozása | ✅ |

---

## Stables tesztek részletei (3 db)

| Teszt | Eredmény |
|-------|----------|
| Stabil hozzáadása és konfigurálása | ✅ |
| Stabil adatainak lekérdezése | ✅ |
| Stabil módosítása és törlése | ✅ |

---

## Error Handling tesztek részletei (2 db)

| Teszt | Eredmény |
|-------|----------|
| 404 Not Found hibakezelés | ✅ |
| 500 Server Error hibakezelés és logging | ✅ |

---

## Coverage

Coverage mérés jelenleg nincs konfigurálva. Futtatható:
```bash
jest --coverage
```

A tesztek az API endpointok funkcionális lefedettségét biztosítják, de pontos %-os mérés még nem készült.

---

## Ismert hiányosságok

| Hiányosság | Indok |
|-----------|-------|
| Nincs frontend teszt (React) | Időkeret korlát; a backend API tesztek a funkcionális contract szintet fedik |
| Nincs CI/CD pipeline | Lokálisan teljes mértékben futtatható; GitHub Actions konfigurálása tervezett |
| Coverage % nem mért | Jest coverage eszköz elérhető, de riport nem generált |
| Nincs e2e teszt | Szeparált tool szükséges; prioritás szerint később |

---

## Flaky tesztek

Jelenleg nem ismert flaky teszt. A tesztek izolált, in-memory vagy teszt adatbázis-leszállításon futnak,
ezért nem érzékenyek párhuzamos futásra vagy teszt-sorrendtől függő állapotra.
