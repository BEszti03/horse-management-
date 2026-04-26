# 0002 - PostgreSQL relációs adatbázis választása

Dátum: 2026-04-26
Státusz: Accepted

## Context

A rendszer több összefüggő entitást kezel (felhasználók, lovak, lovardák, versenyek), ezért fontos a strukturált adatkezelés és a kapcsolatok kezelése.

## Decision

A rendszer PostgreSQL relációs adatbázist használ.

## Alternatives

1. MongoDB

   * Előny: rugalmas dokumentum alapú modell.
   * Hátrány: relációk kezelése bonyolultabb.

2. SQLite

   * Előny: egyszerű beállítás.
   * Hátrány: nem ideális több felhasználós rendszerhez.

## Consequences

### Pozitív

* Erős adatkonzisztencia.
* Kapcsolatok kezelése (foreign key).
* Stabil és bevált megoldás.

### Negatív / kockázat

* Szigorú séma miatt több előkészítés kell.
* Migráció kezelés szükséges.

## Verification

* Az adatok megfelelően mentésre kerülnek.
* Kapcsolatok (pl. user–lovarda) működnek.
* SQL lekérdezésekkel visszaellenőrizhető az állapot.
