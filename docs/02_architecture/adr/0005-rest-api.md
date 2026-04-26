# 0005 - REST API használata

Dátum: 2026-04-26
Státusz: Accepted

## Context

A frontend és backend közötti kommunikációhoz API szükséges.

## Decision

A rendszer REST API-t használ JSON alapú kommunikációval.

## Alternatives

1. GraphQL

   * Előny: rugalmas lekérdezések.
   * Hátrány: komplexebb implementáció.

2. RPC

   * Előny: egyszerű hívások.
   * Hátrány: kevésbé standard webes környezetben.

## Consequences

### Pozitív

* Egyszerű és jól ismert megoldás.
* Könnyen tesztelhető.
* Illeszkedik a frontendhez.

### Negatív / kockázat

* Több endpoint szükséges.
* Overfetching előfordulhat.

## Verification

* API endpointok működnek (GET, POST, PUT, DELETE).
* Frontend sikeresen kommunikál backenddel.
* JSON válaszok megfelelően feldolgozhatók.
