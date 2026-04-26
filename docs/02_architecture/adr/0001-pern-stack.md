# 0001 - PERN stack használata

Dátum: 2026-04-26
Státusz: Accepted

## Context

A projekt egy webalapú lovarda menedzsment rendszer, amely frontend és backend rétegből áll. Olyan technológiai stack-re volt szükség, amely egyszerűen fejleszthető, jól dokumentált és alkalmas REST API alapú kommunikációra.

## Decision

A rendszer PERN stack-et használ (PostgreSQL, Express, React, Node.js).

## Alternatives

1. MERN stack (MongoDB)

   * Előny: rugalmas séma.
   * Hátrány: relációk kezelése bonyolultabb.

2. Laravel + Vue

   * Előny: komplett keretrendszer.
   * Hátrány: több technológia, nagyobb tanulási görbe.

## Consequences

### Pozitív

* Egységes JavaScript alapú fejlesztés.
* Könnyű frontend-backend integráció.
* Relációs adatkezelés PostgreSQL-lel.

### Negatív / kockázat

* Több különálló komponens kezelése szükséges.
* Backend és frontend külön deploy.

## Verification

* A frontend és backend sikeresen kommunikál API-n keresztül.
* CRUD műveletek működnek adatbázissal.
* Az alkalmazás lokálisan futtatható.
