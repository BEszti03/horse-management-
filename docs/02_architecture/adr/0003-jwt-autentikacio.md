# 0003 - JWT alapú autentikáció

Dátum: 2026-04-26
Státusz: Accepted

## Context

A rendszerben szükséges a felhasználók azonosítása és a védett erőforrásokhoz való hozzáférés szabályozása.

## Decision

A rendszer JWT (JSON Web Token) alapú autentikációt használ.

## Alternatives

1. Session alapú autentikáció

   * Előny: egyszerű szerveroldali kezelés.
   * Hátrány: session tárolás szükséges.

2. OAuth

   * Előny: külső bejelentkezés.
   * Hátrány: túl komplex a projekthez.

## Consequences

### Pozitív

* Stateless működés.
* Egyszerű API használat.
* Könnyű frontend integráció.

### Negatív / kockázat

* Token tárolás biztonsági kérdés.
* Lejárati idő kezelése szükséges.

## Verification

* Token generálódik login után.
* Token nélkül nem érhetők el védett endpointok.
* Hibás token esetén a rendszer elutasítja a kérést.
