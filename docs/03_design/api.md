# API dokumentáció

## Base URL

Lokális fejlesztési környezetben:

```
http://localhost:5000/api
```

Az API jelenleg nem használ külön verziózást (`/api/v1`), de a struktúra ezt lehetővé teszi a későbbiekben.

---

## Autentikáció

A rendszer JWT (JSON Web Token) alapú autentikációt használ.

A védett endpointoknál a frontend a tokent az alábbi módon küldi:

```
Authorization: Bearer <token>
```

Token nélküli vagy érvénytelen kérés esetén a backend `401 Unauthorized` választ ad.

---

## Jogosultsági modell

A rendszer három fő szerepkört különböztet meg:

* **Vendég:** regisztráció és bejelentkezés
* **Felhasználó:** saját adatok, lovak, teendők, verseny jelentkezés
* **Lovarda vezető:** saját lovardához tartozó versenyek kezelése
* **Admin:** teljes rendszerhez hozzáférés

---

## Endpoint lista

### Auth

| Method | Path                 | Leírás        | Auth |
| ------ | -------------------- | ------------- | ---- |
| POST   | `/api/auth/register` | Regisztráció  | Nem  |
| POST   | `/api/auth/login`    | Bejelentkezés | Nem  |

#### Példa request

```json
{
  "nev": "Teszt Elek",
  "email": "teszt@example.com",
  "jelszo": "titkos123"
}
```

#### Példa response

```json
{
  "user": {
    "felhasznalo_id": 1,
    "nev": "Teszt Elek",
    "email": "teszt@example.com",
    "szerepkor": "user",
    "lovarda_id": null
  },
  "token": "jwt-token"
}
```

---

### Profil / Users

| Method | Path            | Leírás                | Auth |
| ------ | --------------- | --------------------- | ---- |
| GET    | `/api/users/me` | Saját adatok lekérése | Igen |
| PUT    | `/api/users/me` | Profil módosítása     | Igen |
| DELETE | `/api/users/me` | Profil törlése        | Igen |

---

### Lovardák

| Method | Path           | Leírás              | Auth |
| ------ | -------------- | ------------------- | ---- |
| GET    | `/api/stables` | Lovardák listázása  | Nem  |
| POST   | `/api/stables` | Lovarda létrehozása | Igen |

---

### Lovak

| Method | Path              | Leírás            | Auth |
| ------ | ----------------- | ----------------- | ---- |
| GET    | `/api/horses`     | Lovak listázása   | Igen |
| POST   | `/api/horses`     | Új ló létrehozása | Igen |
| PUT    | `/api/horses/:id` | Ló módosítása     | Igen |
| DELETE | `/api/horses/:id` | Ló törlése        | Igen |

---

### Naptár és teendők

| Method | Path                                 | Leírás                    | Auth |
| ------ | ------------------------------------ | ------------------------- | ---- |
| GET    | `/api/calendar`                      | Események lekérése        | Igen |
| POST   | `/api/calendar/teendo`               | Teendő létrehozása        | Igen |
| PUT    | `/api/calendar/teendo/:id`           | Teendő módosítása         | Igen |
| PATCH  | `/api/calendar/teendo/:id/elvegzett` | Teendő státusz módosítása | Igen |
| DELETE | `/api/calendar/teendo/:id`           | Teendő törlése            | Igen |

---

### Versenyek

| Method | Path                           | Leírás                | Auth |
| ------ | ------------------------------ | --------------------- | ---- |
| GET    | `/api/competitions`            | Versenyek listázása   | Igen |
| POST   | `/api/competitions`            | Verseny létrehozása   | Igen |
| POST   | `/api/competitions/:id/signup` | Jelentkezés versenyre | Igen |
| DELETE | `/api/competitions/:id/signup` | Jelentkezés törlése   | Igen |
| DELETE | `/api/competitions/:id`        | Verseny törlése       | Igen |

---

### Admin

| Method | Path                        | Leírás                 |
| ------ | --------------------------- | ---------------------- |
| GET    | `/api/admin/users`          | Felhasználók listázása |
| PUT    | `/api/admin/users/:id/role` | Szerepkör módosítása   |
| DELETE | `/api/admin/users/:id`      | Felhasználó törlése    |

---

## Hibamodell

A rendszer JSON formátumban ad vissza hibát.

### Általános formátum

```json
{
  "message": "Hibaüzenet"
}
```

Egyes esetekben:

```json
{
  "error": "Hibaüzenet"
}
```

Ez jelenleg nem egységes, ami ismert korlátozás.

---

## Hibakódok

| Kód | Jelentés                    |
| --- | --------------------------- |
| 400 | Hibás kérés                 |
| 401 | Nincs autentikáció          |
| 403 | Nincs jogosultság           |
| 404 | Nem található erőforrás     |
| 409 | Ütközés (pl. email foglalt) |
| 500 | Szerverhiba                 |

---

## Rate limit / védelem

Jelenleg nincs implementált rate limiting.

A rendszer védelme:

* JWT alapú autentikáció
* backend jogosultság ellenőrzés

Későbbi fejlesztésként:

* login próbálkozás limitálás
* IP alapú korlátozás

---

## Idempotencia és retry

* `GET` kérések ismételhetők.
* `POST` kérések nem idempotensek (új adatot hoznak létre).
* `PUT`, `PATCH`, `DELETE` kérések adott erőforrásra vonatkoznak.

