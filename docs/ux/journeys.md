# User journey-k

## 1. Regisztráció és lovarda hozzárendelése

**Persona:** Egy új felhasználó most kezdi használni az alkalmazást, és szeretné létrehozni a fiókját, majd hozzárendelni magát egy meglévő lovardához vagy új lovardát felvenni.
**Belépési pont:** alkalmazás megnyitása, bejelentkezési képernyő

### Lépések

1. **S01 — Bejelentkezés**
   A felhasználó a "Regisztráció" lehetőségre kattint.
   → S02 (Regisztráció) jelenik meg.

2. **S02 — Regisztráció**
   A felhasználó megadja a nevét, email címét, jelszavát és a jelszó megerősítését, majd a "Regisztráció" gombra kattint.
   → S01 vagy közvetlenül S03 jelenik meg, az implementációtól függően.
   **Hibaág:** hiányzó mezők, nem egyező jelszavak vagy már foglalt email esetén hibaüzenet jelenik meg.

3. **S01 — Bejelentkezés**
   A felhasználó bejelentkezik az új adataival.
   → S03 (Dashboard) jelenik meg.
   **Hibaág:** hibás bejelentkezési adatok esetén a rendszer nem engedi tovább.

4. **S03 — Dashboard**
   A felhasználó a "Profil" menüpontra kattint.
   → S04 (Profil) jelenik meg.

5. **S04 — Profil**
   A felhasználó a "Profil szerkesztése" gombra kattint.
   → S05 (Profil szerkesztése) jelenik meg.

6. **S05 — Profil szerkesztése**
   A felhasználó kiválaszt egy meglévő lovardát a listából.
   → Mentés után visszatér S04-re, ahol a lovarda már megjelenik a profilban.
   **Hibaág:** ha a kiválasztott lovarda nem menthető, a rendszer hibaüzenetet jelenít meg.

7. **S05 — Profil szerkesztése**
   Ha a kívánt lovarda nem létezik, a felhasználó az "Új lovarda felvitele" lehetőséget választja.
   → S06 (Új lovarda hozzáadása) jelenik meg.

8. **S06 — Új lovarda hozzáadása**
   A felhasználó megadja a lovarda nevét, majd a "Hozzáadás" gombra kattint.
   → Visszatér S05-re, ahol az új lovarda már kiválasztható vagy automatikusan beállításra kerül.
   **Hibaág:** üres név esetén a rendszer nem menti az adatot.

9. **S05 — Profil szerkesztése**
   A felhasználó elmenti a módosításokat.
   → S04 (Profil) jelenik meg, frissített lovarda-adatokkal.

**Sikerkritérium:** A felhasználó profiljában megjelenik a hozzárendelt lovarda neve.
**Mért időtartam:** ~30–50 másodperc / ~7–9 kattintás

---

## 2. Ló hozzáadása és szerkesztése

**Persona:** Egy lovas felhasználó új lovat szeretne rögzíteni, majd szükség esetén módosítani az adatait.
**Belépési pont:** Dashboard

### Lépések

1. **S03 — Dashboard**
   A felhasználó a "Ló adatok" menüpontra kattint.
   → S07 (Ló adatok) jelenik meg.

2. **S07 — Ló adatok**
   A felhasználó kitölti az új ló adatait, majd a "Hozzáadás" gombra kattint.
   → A rendszer elmenti az új lovat, és a lista frissül.
   **Hibaág:** kötelező mező hiányzik vagy hibás formátum esetén a mentés sikertelen.

3. **S07 — Ló adatok**
   A felhasználó a meglévő ló mellett a "Szerkesztés" gombra kattint.
   → S08 (Ló adatainak szerkesztése) állapot jelenik meg.

4. **S08 — Ló adatainak szerkesztése**
   A felhasználó módosítja az adatokat, majd "Mentés" gombra kattint.
   → Visszatér S07-re, ahol a frissített adatok láthatók.
   **Hibaág:** hibás vagy hiányzó adatok esetén a rendszer nem menti a módosítást.

**Sikerkritérium:** Az új ló megjelenik a listában, és szerkesztés után a módosított adatok is láthatóvá válnak.
**Mért időtartam:** ~20–30 másodperc / ~4–6 kattintás

---

## 3. Naptár esemény létrehozása

**Persona:** Egy felhasználó szeretne egy új teendőt vagy eseményt felvenni a naptárba, hogy nyomon kövesse a lovával kapcsolatos programokat.
**Belépési pont:** Dashboard

### Lépések

1. **S03 — Dashboard**
   A felhasználó a "Naptár" menüpontra kattint.
   → S10 (Naptár) jelenik meg.

2. **S10 — Naptár**
   A felhasználó új esemény létrehozását kezdeményezi egy időpontra kattintva.
   → S16 (Naptár – esemény felvételi állapot) jelenik meg.

3. **S16 — Naptár – esemény felvételi állapot**
   A felhasználó megadja az esemény adatait, majd a "Mentés" gombra kattint.
   → A rendszer létrehozza az eseményt, majd az megjelenik az S10 naptárnézetben.
   **Hibaág:** ha kötelező adat hiányzik vagy hibás a dátum/idő, a rendszer nem menti az eseményt.

4. **S10 — Naptár**
   A felhasználó ellenőrzi, hogy az új esemény a megfelelő időpontban megjelent-e.

**Sikerkritérium:** Az új esemény látható a naptárban a megfelelő dátumon és időpontban.
**Mért időtartam:** ~15–25 másodperc / ~3–4 kattintás
