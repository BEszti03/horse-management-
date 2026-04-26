# UX Flows

## 1. Regisztráció és lovarda hozzárendelés

**Cél:**
A felhasználó fiókot hoz létre és csatlakozik egy lovardához.

**Előfeltétel:**
A felhasználó nincs bejelentkezve.

**Lépések:**

1. Regisztráció
2. Bejelentkezés
3. Profil megnyitása
4. Lovarda kiválasztása vagy létrehozása
5. Mentés

**Siker kritérium:**
A felhasználó profiljához lovarda van rendelve.

**Hibák:**

* Hibás vagy hiányzó adatok → hibaüzenet
* Foglalt email → regisztráció sikertelen
* Nem menthető lovarda → hibaüzenet

---

## 2. Ló hozzáadása és szerkesztése

**Cél:**
A felhasználó új lovat rögzít és módosítja annak adatait.

**Előfeltétel:**
A felhasználó be van jelentkezve és lovardához tartozik.

**Lépések:**

1. Ló adatok oldal megnyitása
2. Új ló létrehozása
3. Ló megjelenik a listában
4. Ló szerkesztése és mentése

**Siker kritérium:**
A ló megjelenik a listában, és a módosítások mentésre kerülnek.

**Hibák:**

* Hiányzó vagy hibás adatok → mentés sikertelen

---

## 3. Naptár esemény létrehozása

**Cél:**
A felhasználó új eseményt vagy teendőt hoz létre.

**Előfeltétel:**
A felhasználó be van jelentkezve.

**Lépések:**

1. Naptár megnyitása
2. Időpont kiválasztása
3. Esemény adatok megadása
4. Mentés

**Siker kritérium:**
Az esemény megjelenik a naptárban a megfelelő időpontban.

**Hibák:**

* Hiányzó vagy hibás adatok → esemény nem menthető

---

## Empty state-ek

* Nincs ló → üres lista jelenik meg, lehetőség új ló hozzáadására
* Nincs teendő → üres főoldal, új teendő létrehozható
* Nincs verseny → nincs találat a versenyek oldalon


