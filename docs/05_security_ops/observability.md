# Observability

## Bevezetés

Az observability célja, hogy a rendszer működése átlátható legyen, és hiba esetén gyorsan diagnosztizálható legyen. Ez logging, healthcheck és metrikák segítségével valósul meg.

---

## Logging

### Log szintek

A rendszer az alábbi log szinteket használja:

| Szint | Leírás                                |
| ----- | ------------------------------------- |
| info  | normál működés (pl. request érkezett) |
| warn  | nem kritikus probléma                 |
| error | hiba történt                          |

---

### Log struktúra (javasolt)

A logok strukturált formában (JSON) kerülnek rögzítésre:

```json id="log1"
{
  "timestamp": "2026-04-26T12:00:00Z",
  "level": "error",
  "endpoint": "/api/auth/login",
  "method": "POST",
  "status": 401,
  "message": "Hibás email vagy jelszó",
  "requestId": "abc123"
}
```

---

### Mit nem logolunk

* jelszó
* JWT token
* email cím teljes formában (PII minimalizálás)
* személyes adatok

---

## Healthcheck

A rendszer támogat egyszerű healthcheck endpointot:

```text
GET /health
```

### Mit vizsgál

* backend fut-e
* adatbázis kapcsolat működik-e

### Példa válasz

```json id="health1"
{
  "status": "ok",
  "database": "connected"
}
```

---

## Metrikák

A rendszer jelenleg nem gyűjt automatizált metrikákat, de az alábbiak javasoltak:

### 1. Latency (válaszidő)

* API válaszidő mérése
* cél: < 1 másodperc normál működés mellett

---

### 2. Error rate

* hibás kérések aránya
* cél: < 5%

---

### 3. Throughput

* kérések száma időegység alatt
* cél: stabil kiszolgálás

---

## Tracing (opcionális)

A rendszer jelenleg nem használ dedikált tracing megoldást, de a request követése megvalósítható:

* `requestId` generálás minden kéréshez
* logok összekapcsolása azonosító alapján

---

## Debugging guide

### Hol találom a logokat?

* backend konzol (Node.js output)
* fejlesztői környezet terminál

---

### Mit keressek?

* `error` log szint
* HTTP státuszkódok (400, 401, 500)
* konkrét endpoint

---

### Tipikus hibakeresési lépések

1. hiba reprodukálása
2. endpoint azonosítása
3. backend log ellenőrzése
4. adatbázis kapcsolat ellenőrzése
5. input validáció ellenőrzése

---

## Monitoring koncepció (javasolt)

A jövőben a rendszer bővíthető:

* központi log gyűjtés (pl. ELK stack)
* metrika gyűjtés (pl. Prometheus)
* dashboard (pl. Grafana)

---

## SLO (Service Level Objective)

A rendszer céljai:

* 99% uptime
* < 1 másodperc válaszidő normál használat mellett
* hibaarány < 5%