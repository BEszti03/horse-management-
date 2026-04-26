# 0004 - Szerepkör alapú jogosultságkezelés

Dátum: 2026-04-26
Státusz: Accepted

## Context

A rendszerben különböző felhasználói szintek vannak:

* admin
* lovarda vezető
* felhasználó

Ezek eltérő jogosultságokkal rendelkeznek.

## Decision

A rendszer szerepkör alapú jogosultságkezelést alkalmaz.

## Alternatives

1. Egységes jogosultság minden felhasználónak

   * Előny: egyszerű implementáció.
   * Hátrány: nem biztonságos.

2. Részletes ACL rendszer

   * Előny: finomhangolt jogosultságok.
   * Hátrány: túl komplex.

## Consequences

### Pozitív

* Biztonságos adatkezelés.
* Egyszerűen bővíthető modell.
* Backend oldali kontroll.

### Negatív / kockázat

* Több ellenőrzés szükséges.
* Hibás implementáció esetén jogosultsági hibák.

## Verification

* Admin funkciók csak admin számára érhetők el.
* Lovarda vezető saját adatait kezeli.
* Jogosultság nélküli kérés elutasításra kerül.
