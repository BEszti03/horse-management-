# Error Handling

## Bevezetés

Az egységes hibakezelés célja, hogy a rendszer kiszámíthatóan és konzisztensen reagáljon hibák esetén, valamint a felhasználó számára érthető visszajelzést adjon a további lépésekhez.

---

## Hibakategóriák

A rendszer az alábbi fő hibakategóriákat különbözteti meg:

| Kategória         | Leírás                            | Példa                          |
| ----------------- | --------------------------------- | ------------------------------ |
| Validációs hiba   | Hibás vagy hiányzó input adat     | Kötelező mező hiányzik         |
| Auth hiba         | Nem hitelesített vagy hibás token | Nincs token                    |
| Jogosultsági hiba | Nincs megfelelő szerepkör         | Nem admin felhasználó          |
| Not found         | Nem létező erőforrás              | Nem létező ló                  |
| Konfliktus        | Ütköző adat                       | Foglalt email                  |
| Rate limit        | Túl sok kérés                     | (jelenleg nincs implementálva) |
| Belső hiba        | Szerver oldali hiba               | DB hiba                        |

---

## Felhasználói hibaüzenetek elvei

A felhasználó felé megjelenített üzenetek:

* érthetőek (nem technikai jellegűek),
* rövidek és egyértelműek,
* cselekvésre ösztönöznek.

### Példák

| Helyzet              | Üzenet                                     |
| -------------------- | ------------------------------------------ |
| Hibás bejelentkezés  | "Hibás email vagy jelszó. Próbáld újra."   |
| Hiányzó mező         | "Kérlek tölts ki minden kötelező mezőt."   |
| Jogosultság hiányzik | "Ehhez a művelethez nincs jogosultságod."  |
| Szerverhiba          | "Hiba történt. Kérlek próbáld meg később." |

---

## Retry stratégia

A rendszer különböző hibák esetén eltérően kezeli az újrapróbálkozást:

| Hiba típusa            | Retry                           |
| ---------------------- | ------------------------------- |
| Network hiba / timeout | Igen (frontend újrapróbálhatja) |
| 500 belső hiba         | Igen (késleltetve)              |
| 401 auth hiba          | Nem (új login szükséges)        |
| 403 jogosultsági hiba  | Nem                             |
| 400 validációs hiba    | Nem (input javítása szükséges)  |
| 404 not found          | Nem                             |

A retry logika jelenleg nincs automatikusan implementálva, de a frontend bővíthető vele.

---

## Hibamodell (backend)

A backend JSON formátumban ad vissza hibákat.

### Jelenlegi formátum

```json
{
  "message": "Hibaüzenet"
}
```

vagy

```json
{
  "error": "Hibaüzenet"
}
```

### Megjegyzés

A kétféle formátum jelenleg nem egységes, ami ismert technikai adósság. A cél egy egységes error object használata:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Kérlek tölts ki minden mezőt",
    "details": {}
  }
}
```

---

## Error mapping (frontend)

A frontend az alábbi logika alapján kezeli a hibákat:

* HTTP státuszkód alapján kategorizál
* a `message` vagy `error` mezőt jeleníti meg
* fallback üzenetet használ, ha nincs konkrét hiba

### Példa mapping

| Státuszkód | Kezelés                |
| ---------- | ---------------------- |
| 400        | validációs hiba üzenet |
| 401        | átirányítás loginra    |
| 403        | jogosultsági hiba      |
| 404        | "Nem található" üzenet |
| 500        | általános hiba         |

---

## Logolás

A rendszer backend oldalon logolja a hibákat.

### Mit logolunk:

* hiba típusa
* endpoint
* időpont
* státuszkód
* technikai hibaüzenet

### Mit nem logolunk:

* jelszó
* token
* személyes adatok (PII)

### Cél

* hibák visszakövethetősége
* debugging támogatása
* rendszer stabilitásának javítása

---

## Bizonyítékok (evidence)

A hibakezelés működése az alábbi módokon ellenőrizhető:

### 1. Validációs hiba

* Üres mezőkkel történő mentés esetén hibaüzenet jelenik meg.
* Backend `400` választ ad.

### 2. Auth hiba

* Token nélküli kérés esetén:

  * backend `401` választ ad,
  * frontend visszairányít loginra.

### 3. Jogosultsági hiba

* Nem admin felhasználó admin endpoint hívásakor:

  * backend `403` választ ad.
