# Data model 
## Bevezetés

A Lóidő alkalmazás PostgreSQL relációs adatbázist használ. Az adatmodell a lovardák, felhasználók, lovak, naptárbejegyzések, pályahasználatok, jegyzetek és versenyek tárolására épül.

---

## Entitások

### `felhasznalo`

A regisztrált felhasználók adatait tárolja.

**Kulcs mezők:**

| Mező | Leírás |
|---|---|
| `felhasznalo_id` | Elsődleges kulcs |
| `nev` | Felhasználó neve |
| `email` | Egyedi email cím |
| `szerepkor` | `lovas`, `lovarda_vezeto` vagy `admin` |
| `lovarda_id` | Kapcsolódó lovarda |
| `jelszo_hash` | Hash-elt jelszó |
| `profilkep_url` | Profilkép elérési útja |
| `elso_belepes` | Első belépés jelölése |

**Integritás:**

- Az `email` egyedi.
- A `szerepkor` csak `lovas`, `lovarda_vezeto` vagy `admin` lehet.
- A `lovarda_id` a `lovarda` táblára hivatkozik.
- Lovarda törlésekor a felhasználó `lovarda_id` értéke `NULL` lesz.

---

### `lovarda`

A lovardák alapadatait tárolja.

**Kulcs mezők:**

| Mező | Leírás |
|---|---|
| `lovarda_id` | Elsődleges kulcs |
| `nev` | Lovarda neve |

---

### `lo`

A lovak adatait tárolja.

**Kulcs mezők:**

| Mező | Leírás |
|---|---|
| `lo_id` | Elsődleges kulcs |
| `nev` | Ló neve |
| `fajta` | Ló fajtája |
| `szuletesi_ido` | Születési dátum |
| `felhasznalo_id` | Tulajdonos / rögzítő felhasználó |
| `kep_url` | Ló képének elérési útja |

**Integritás:**

- Minden ló egy felhasználóhoz tartozik.
- Felhasználó törlésekor a hozzá tartozó lovak is törlődnek.

---

### `jegyzet`

Felhasználói jegyzeteket tárol.

**Kulcs mezők:**

| Mező | Leírás |
|---|---|
| `jegyzet_id` | Elsődleges kulcs |
| `cim` | Jegyzet címe |
| `szoveg` | Jegyzet tartalma |
| `mikor_irta` | Létrehozás ideje |
| `felhasznalo_id` | Jegyzetet létrehozó felhasználó |

**Integritás:**

- Minden jegyzet egy felhasználóhoz tartozik.
- Felhasználó törlésekor a hozzá tartozó jegyzetek törlődnek.

---

### `palya`

A lovardához tartozó pályaidőpontokat tárolja.

**Kulcs mezők:**

| Mező | Leírás |
|---|---|
| `palya_id` | Elsődleges kulcs |
| `lovarda_id` | Kapcsolódó lovarda |
| `ferohely` | Férőhely |
| `idopont` | Pályahasználat időpontja |

**Integritás:**

- Minden pálya egy lovardához tartozik.
- A `ferohely` értéke csak pozitív szám lehet.
- Lovarda törlésekor a hozzá tartozó pályaidőpontok törlődnek.

---

### `palya_tartozkodas`

A pályahasználat foglalásait tárolja.

**Kulcs mezők:**

| Mező | Leírás |
|---|---|
| `palya_id` | Kapcsolódó pálya |
| `felhasznalo_id` | Kapcsolódó felhasználó |
| `mettol` | Foglalás kezdete |
| `meddig` | Foglalás vége |
| `lo_id` | Kapcsolódó ló |
| `elvegzett` | Elvégzett állapot |

**Elsődleges kulcs:**

- `palya_id`
- `felhasznalo_id`
- `mettol`

**Integritás:**

- A `meddig` nem lehet korábbi, mint a `mettol`.
- Pálya vagy felhasználó törlésekor a kapcsolódó tartózkodások törlődnek.
- Ló törlésekor a `lo_id` értéke `NULL` lesz.

---

### `teendo`

A naptárhoz kapcsolódó teendőket tárolja.

**Kulcs mezők:**

| Mező | Leírás |
|---|---|
| `teendo_id` | Elsődleges kulcs |
| `leiras` | Teendő leírása |
| `statusz` | Teendő állapota |
| `kezdeti_ido` | Kezdési idő |
| `hatarido` | Határidő |
| `felhasznalo_id` | Teendőt létrehozó felhasználó |
| `tipus` | Teendő típusa |
| `lo_id` | Kapcsolódó ló |
| `elvegzett` | Elvégzett állapot |

**Integritás:**

- A teendő felhasználóhoz tartozik.
- A teendő opcionálisan lóhoz kapcsolható.
- A `hatarido` nem lehet korábbi, mint a `kezdeti_ido`.
- Felhasználó törlésekor a teendők törlődnek.
- Ló törlésekor a `lo_id` értéke `NULL` lesz.

---

### `verseny`

A lovardákhoz kapcsolódó versenyeket tárolja.

**Kulcs mezők:**

| Mező | Leírás |
|---|---|
| `verseny_id` | Elsődleges kulcs |
| `nev` | Verseny neve |
| `datum` | Verseny dátuma |
| `lovarda_id` | Kapcsolódó lovarda |
| `letrehozo_felhasznalo_id` | Versenyt létrehozó felhasználó |

**Integritás:**

- A verseny egy lovardához kapcsolódhat.
- Lovarda törlésekor a hozzá tartozó versenyek törlődnek.
- A létrehozó felhasználó törlésekor a `letrehozo_felhasznalo_id` értéke `NULL` lesz.

---

### `verseny_felhasznalo`

Kapcsolótábla a versenyek és felhasználók között.

**Kulcs mezők:**

| Mező | Leírás |
|---|---|
| `verseny_id` | Kapcsolódó verseny |
| `felhasznalo_id` | Jelentkező felhasználó |

**Elsődleges kulcs:**

- `verseny_id`
- `felhasznalo_id`

**Integritás:**

- Egy felhasználó egy versenyre egyszer jelentkezhet.
- Verseny vagy felhasználó törlésekor a kapcsolat is törlődik.

---

### `verseny_lo`

Kapcsolótábla a versenyek és lovak között.

**Kulcs mezők:**

| Mező | Leírás |
|---|---|
| `verseny_id` | Kapcsolódó verseny |
| `lo_id` | Kapcsolódó ló |

**Elsődleges kulcs:**

- `verseny_id`
- `lo_id`

**Integritás:**

- Egy ló egy versenyhez egyszer kapcsolódhat.
- Verseny vagy ló törlésekor a kapcsolat is törlődik.

---

## Kapcsolatok

### 1:N kapcsolatok

| Kapcsolat | Leírás |
|---|---|
| `lovarda` → `felhasznalo` | Egy lovardához több felhasználó tartozhat |
| `lovarda` → `palya` | Egy lovardához több pályaidőpont tartozhat |
| `lovarda` → `verseny` | Egy lovardához több verseny tartozhat |
| `felhasznalo` → `lo` | Egy felhasználóhoz több ló tartozhat |
| `felhasznalo` → `jegyzet` | Egy felhasználóhoz több jegyzet tartozhat |
| `felhasznalo` → `teendo` | Egy felhasználóhoz több teendő tartozhat |
| `palya` → `palya_tartozkodas` | Egy pályaidőponthoz több tartózkodás tartozhat |

---

### N:M kapcsolatok

| Kapcsolat | Kapcsolótábla |
|---|---|
| `verseny` ↔ `felhasznalo` | `verseny_felhasznalo` |
| `verseny` ↔ `lo` | `verseny_lo` |

---

## Cascade és törlési szabályok

| Kapcsolat | Törlési szabály |
|---|---|
| `felhasznalo.lovarda_id` → `lovarda.lovarda_id` | `ON DELETE SET NULL` |
| `lo.felhasznalo_id` → `felhasznalo.felhasznalo_id` | `ON DELETE CASCADE` |
| `jegyzet.felhasznalo_id` → `felhasznalo.felhasznalo_id` | `ON DELETE CASCADE` |
| `palya.lovarda_id` → `lovarda.lovarda_id` | `ON DELETE CASCADE` |
| `palya_tartozkodas.palya_id` → `palya.palya_id` | `ON DELETE CASCADE` |
| `palya_tartozkodas.felhasznalo_id` → `felhasznalo.felhasznalo_id` | `ON DELETE CASCADE` |
| `palya_tartozkodas.lo_id` → `lo.lo_id` | `ON DELETE SET NULL` |
| `teendo.felhasznalo_id` → `felhasznalo.felhasznalo_id` | `ON DELETE CASCADE` |
| `teendo.lo_id` → `lo.lo_id` | `ON DELETE SET NULL` |
| `verseny.lovarda_id` → `lovarda.lovarda_id` | `ON DELETE CASCADE` |
| `verseny.letrehozo_felhasznalo_id` → `felhasznalo.felhasznalo_id` | `ON DELETE SET NULL` |
| `verseny_felhasznalo.verseny_id` → `verseny.verseny_id` | `ON DELETE CASCADE` |
| `verseny_felhasznalo.felhasznalo_id` → `felhasznalo.felhasznalo_id` | `ON DELETE CASCADE` |
| `verseny_lo.verseny_id` → `verseny.verseny_id` | `ON DELETE CASCADE` |
| `verseny_lo.lo_id` → `lo.lo_id` | `ON DELETE CASCADE` |

---

## Migráció és verziózás

A projekt jelenlegi állapotában az adatbázis szerkezete SQL fájlból állítható elő.

Jelenlegi stratégia:

- az adatbázis séma SQL exportként szerepel a projektben;
- a séma módosításai manuálisan történnek;
- a változások Git-ben verziózhatók;
- külön migrációs eszköz jelenleg nincs bevezetve.

Későbbi fejlesztésként érdemes bevezetni:

- `migrations/` mappát;
- időrendben verziózott SQL migrációkat;
- rollback scripteket;
- seed adatok külön kezelését.

---

## Adatélettartam és törlés

A rendszer az adatokat addig tárolja, amíg azokat a felhasználó vagy az admin nem törli.

### Tárolt adatkategóriák

| Adattípus | Példa |
|---|---|
| Személyes adat | név, email |
| Hitelesítési adat | hash-elt jelszó |
| Profil adat | profilkép URL, első belépés állapota |
| Lovardai adat | lovarda neve |
| Ló adat | név, fajta, születési idő, kép URL |
| Felhasználói tartalom | teendő, jegyzet |
| Verseny adat | verseny neve, dátuma, jelentkezések |

### Törlési elvek

- Felhasználó törlésekor a hozzá tartozó lovak, jegyzetek, teendők és versenyjelentkezések törlődnek.
- Lovarda törlésekor a felhasználók nem törlődnek, csak a `lovarda_id` mezőjük `NULL` értékre áll.
- Lovarda törlésekor a hozzá tartozó pályák és versenyek törlődnek.
- Ló törlésekor a teendőkben és pályahasználatokban a `lo_id` mező `NULL` értékre áll.
- Verseny törlésekor a hozzá tartozó jelentkezések és ló-kapcsolatok törlődnek.

---

## Indexelés és teljesítmény

Az adatbázis több indexet használ a gyakori lekérdezések gyorsítására.

| Index | Mező |
|---|---|
| `idx_felhasznalo_lovarda` | `felhasznalo.lovarda_id` |
| `idx_jegyzet_felhasznalo` | `jegyzet.felhasznalo_id` |
| `idx_lo_felhasznalo` | `lo.felhasznalo_id` |
| `idx_palya_lovarda` | `palya.lovarda_id` |
| `idx_tartozkodas_felhasznalo` | `palya_tartozkodas.felhasznalo_id` |
| `idx_tartozkodas_felhasznalo_elvegzett` | `palya_tartozkodas(felhasznalo_id, elvegzett)` |
| `idx_teendo_felhasznalo` | `teendo.felhasznalo_id` |
| `idx_teendo_felhasznalo_elvegzett` | `teendo(felhasznalo_id, elvegzett)` |
| `idx_verseny_datum` | `verseny.datum` |
| `ux_felhasznalo_email_lower` | `lower(email)` |

### Teljesítmény megfontolások

- A felhasználóhoz kötött adatok indexelt idegen kulcsokon keresztül kérdezhetők le.
- A teendők és pályahasználatok `elvegzett` állapot szerinti szűrése indexelt.
- A versenyek dátum szerinti listázását a `verseny.datum` index támogatja.
- Az email egyedi kezelése kis- és nagybetűfüggetlen indexszel is támogatott.