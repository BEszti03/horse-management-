# Privacy és Licensing


## Adatkategóriák

A rendszer az alábbi típusú adatokat kezeli:

### Személyes adatok (PII)

* név
* email cím

### Hitelesítési adatok

* hash-elt jelszó (nem plain text)
* JWT token (ideiglenes)

### Profil adatok

* profilkép URL
* lovardához tartozás

### Lovardai és domain adatok

* lovak adatai (név, fajta, születési idő)
* teendők és naptár események
* versenyek és jelentkezések

### Naplózott adatok (logok)

* hibák
* endpoint hívások
* státuszkódok

---

## Adatáramlás

### Forrás

* felhasználói input (frontend UI)

### Feldolgozás

* React frontend → HTTP kérés
* Express backend → validáció és feldolgozás

### Tárolás

* PostgreSQL adatbázis

### Kimenet

* JSON válasz frontend felé

### Külső szolgáltatás

A rendszer **nem használ külső API-t vagy harmadik fél adatfeldolgozást**.

---

## Adatmegőrzés és törlés

### Megőrzés

* Az adatok addig tárolódnak, amíg a felhasználó vagy admin nem törli.
* Nincs automatikus törlési idő (retention policy).

### Törlés

* Felhasználó törölheti saját profilját.
* Admin törölhet felhasználókat.
* Törléskor:

  * kapcsolódó adatok (pl. lovak, teendők) törlődnek vagy nullázódnak.

### Példa

* felhasználó törlése → lovak, jegyzetek, teendők törlődnek
* lovarda törlése → felhasználók megmaradnak (`lovarda_id = NULL`)

---

## Hozzáférés és jogosultságok

A rendszer role-based access control-t használ:

| Szerepkör      | Hozzáférés           |
| -------------- | -------------------- |
| Felhasználó    | saját adatok         |
| Lovarda vezető | saját lovarda adatai |
| Admin          | teljes rendszer      |

### Védelem

* backend oldali jogosultság ellenőrzés
* védett endpointok
* JWT autentikáció

---

## AI használat és adatok

A rendszer:

* nem küld felhasználói adatokat AI szolgáltatásnak
* nem használ külső AI API-t
* fejlesztés során használt AI eszközök nem kaptak PII adatokat

Ez csökkenti az adatvédelmi kockázatokat.

---

## Harmadik fél függőségek és licenc

A projekt az alábbi főbb technológiákat használja:

### Backend

* Node.js
* Express

### Frontend

* React

### Adatbázis

* PostgreSQL

### Egyéb

* JWT (auth)

### Licencek

A használt könyvtárak jellemzően:

* MIT License
* BSD License

Ezek kompatibilisek egymással és szabadon használhatók oktatási és fejlesztési célokra.

---

## Security baseline

A projekt az alábbi alap biztonsági elveket követi:

### Secrets kezelés

* nincs hardcoded jelszó vagy token
* `.env` fájl használata konfigurációhoz

### Input validáció

* backend validáció minden fontos endpointnál
* frontend form validáció

### Auth és authorization

* JWT alapú autentikáció
* role-based hozzáférés

### Error handling

* nem kerül stack trace a klienshez
* nincs érzékeny adat a hibaüzenetekben

### Dependency hygiene

* ismert kritikus sérülékenység nincs használatban
* npm csomagok ellenőrizhetők (`npm audit`)

---

## Verification (ellenőrzés)

A biztonsági működés az alábbi módokon ellenőrizhető:

* token nélküli API hívás → 401 válasz
* nem admin user admin endpoint → 403 válasz
* hibás input → 400 válasz
* `.env` fájl használat ellenőrzése a kódban
* `npm audit` futtatása
