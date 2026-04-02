# Project Plan – Lóidő – Lovarda menedzsment rendszer (Horse-Time Management)

Webalkalmazás lovardák és lókezelés adminisztrálására (felhasználók, lovak, lovardák kezelése), amely szerepkör alapú jogosultságkezeléssel és relációs adatmodellel biztosít komplex működést.

---

## Képességek

| Képesség | Kategória | Komplexitás | Miért nem triviális? |
|---|---|---|---|
| Bejelentkezés és szerepkörök | Productization | M | JWT + role-based access (admin/user), route védelem frontend + backend |
| Felhasználó profil és lovarda hozzárendelés | Value | M | Relációk kezelése (user–lovarda), dinamikus frissítés |
| Lovak kezelése (CRUD) | Value | M | Több entitás összekapcsolása (ló–lovarda–felhasználó) |
| Lovardák kezelése (CRUD + törlés logika) | Value | L | Törlésnél idegen kulcsok kezelése (ne törölje a felhasználót, csak nullázza a kapcsolatot) |
| API hibakezelés és validáció | Productization | M | Backend validáció + egységes hibaválaszok + frontend kezelés |
| Auth token kezelés (localStorage + védelem) | Productization | S | Token kezelés, lejárat kezelése |
| Admin felület külön nézettel | Value | L | Külön UI logika, jogosultság alapú komponens megjelenítés |
| Responsive UI (mobil + desktop navbar) | Productization | S | Feltételes renderelés + CSS/UX kezelés |

---

## A legnehezebb rész

A relációs adatkezelés és törlési logika (pl. lovarda törlésekor a felhasználók megmaradjanak, de a kapcsolat megszűnjön).

## Tech stack – indoklással

| Réteg | Technológia | Miért ezt és nem mást? |
|---|---|---|
| UI | React (+ CSS / DaisyUI) | Komponens alapú felépítés, gyors fejlesztés, jól kezelhető state |
| Backend / logika | Node.js + Express | Egyszerű REST API készítés, jól integrálható Reacttel |
| Adattárolás | PostgreSQL | Relációs adatbázis → ideális kapcsolatok kezelésére (user–ló–lovarda) |
| Auth | JWT (JSON Web Token) | Stateless auth, könnyen kezelhető frontend-backend között |

---

## Ami kimarad (non-goals)

- Valós idejű kommunikáció (pl. chat, websocket)
- Mobil natív alkalmazás

---

## Ami még nem tiszta

- Lovakról egyedi kép feltöltése
- Felhasználó profilkép beállítása
