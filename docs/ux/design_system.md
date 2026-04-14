# Design rendszer / vizuális nyelv

## UI könyvtár / komponens rendszer

Az alkalmazás React alapú, és jelenleg **saját CSS stílusokat** használ.
Nem került bevezetésre külön UI komponens-könyvtár (pl. MUI vagy Bootstrap), a komponensek egyedi kialakításúak.

A layout és az elemek (gombok, inputok, kártyák) konzisztens módon, újrafelhasználható React komponensekből épülnek fel.

---

## Színpaletta

Az alkalmazás világos témát használ, semleges háttérrel és jól elkülönülő akciószínekkel.

* **Primary:** #2c7a7b (fő akciók, gombok)
* **Secondary:** #edf2f7 (háttér, panelek)
* **Accent:** #38b2ac (kiemelések, hover állapotok)
* **Success:** #38a169 (sikeres műveletek visszajelzése)
* **Warning:** #dd6b20 (figyelmeztetések)
* **Error:** #e53e3e (hibák, validációs üzenetek)
* **Surface:** #ffffff (kártyák, tartalom háttér)
* **Text:** #1a202c (fő szöveg)

A színek célja az egyszerűség és az olvashatóság biztosítása.

---

## Tipográfia

* **Font család:** Arial, sans-serif
* **Alap betűméret:** 16px
* **Címsorok:** nagyobb méret és félkövér (font-weight: 600–700)
* **Törzsszöveg:** normál (font-weight: 400)

A tipográfia célja a gyors olvashatóság és az egyszerű, letisztult megjelenés.

---

## Spacing / grid rendszer

Az alkalmazás egy **8px alapú spacing rendszert** használ:

* Kis térköz: 8px
* Közepes: 16px
* Nagy: 24–32px

A layout jellemzően:

* középre igazított tartalom
* kártya alapú elrendezés
* rugalmas (flexbox) szerkezet

Maximális tartalomszélesség desktop nézetben: ~1200px

---

## Ikonkészlet

Az alkalmazás jelenleg **nem használ dedikált ikonkészletet**,
a vizuális elemek főként szöveges gombokra és egyszerű UI elemekre épülnek.

(Szükség esetén bővíthető pl. Heroicons vagy Lucide használatával.)

---

## Sötét mód

A rendszer jelenleg **nem támogat sötét módot**.
A felület világos témára optimalizált.

---

## Reszponzív működés

Az alkalmazás részben reszponzív, főként desktop használatra optimalizált.

Alkalmazott breakpoint-ok:

* **Mobile:** < 768px
* **Tablet:** 768px – 1024px
* **Desktop:** > 1024px

Mobil nézetben a navigáció egyszerűsített (pl. hamburger menü).

---

## Forrás / design tervek

Nem készült külön Figma vagy más design tool alapú terv.
A UI közvetlenül implementáció során került kialakításra, iteratív módon.

---

## Megjegyzés

A design rendszer célja egy egyszerű, átlátható és könnyen használható felület biztosítása,
különös tekintettel a gyors adatbevitelre és a napi használhatóságra (lovak, események kezelése).
