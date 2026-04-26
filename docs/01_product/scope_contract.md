# Scope Contract

## MVP user story-k

### 1. Felhasználó regisztráció és bejelentkezés

A felhasználó képes fiókot létrehozni és bejelentkezni az alkalmazásba.

**Acceptance criteria:**

* Sikeres regisztráció után a felhasználó be tud jelentkezni.
* Hibás adatok esetén hibaüzenet jelenik meg.
* Token alapú autentikáció működik.
* Be nem jelentkezett felhasználó nem ér el védett oldalakat.

---

### 2. Lovarda létrehozása és csatlakozás

A felhasználó létrehozhat egy lovardát vagy csatlakozhat egy meglévőhöz.

**Acceptance criteria:**

* A felhasználó létre tud hozni lovardát.
* A lovardát létrehozó felhasználó a lovarda vezetőjévé válik.
* A felhasználó ki tud választani egy lovardát.
* Lovarda nélkül bizonyos funkciók nem érhetők el.

---

### 3. Lovak kezelése

A felhasználó lovakat tud létrehozni és kezelni.

**Acceptance criteria:**

* Új ló hozzáadható.
* A ló adatai megjelennek listában.
* A ló szerkeszthető és törölhető.
* A ló egy adott lovashoz tartozik.

---

### 4. Teendők és naptár kezelése

A felhasználó teendőket és eseményeket tud létrehozni és követni.

**Acceptance criteria:**

* Új teendő vagy naptárbejegyzés létrehozható.
* A teendők és események megjelennek listában vagy naptár nézetben.
* A teendők kipipálhatók (completed státusz).
* A felhasználó csak a saját vagy a lovardájához tartozó adatokat látja.

---

### 5. Versenyek kezelése

A versenyek kezelése jogosultsághoz kötött.

**Acceptance criteria:**

* Lovarda vezető képes versenyt létrehozni.
* A versenyek listázva jelennek meg.
* A felhasználók jelentkezhetnek versenyekre.
* A lovarda vezető látja a jelentkezők listáját (lóval együtt).
* Globális admin jogosult minden verseny kezelésére.

---

### 6. Profil kezelés

A felhasználó módosíthatja saját adatait és beállításait.

**Acceptance criteria:**

* A felhasználó megtekintheti saját profilját.
* A név és a lovarda módosítható.
* A módosítás mentése után az adatok frissülnek.

---

## Jogosultsági modell

A rendszer három szintű jogosultsági modellt használ:

* **Admin:** teljes hozzáférés minden adathoz (manuálisan beállítva)
* **Lovarda vezető:** saját lovardájához tartozó adatok kezelése
* **Felhasználó:** saját adatok és a lovardához tartozó funkciók elérése

A jogosultságok backend oldalon kerülnek ellenőrzésre.

---

## Stretch (opcionális funkciók)

* Checkboxos teendő lista a főoldalon (gyors kezeléssel)
* UI/UX fejlesztések (reszponzivitás, ikonok)
* Admin felület bővítése
* Több lovarda kezelésének támogatása

---

## Korlátok

* Időkorlát: szakdolgozati keret (~600 óra)
* Egy fejlesztő (single developer projekt)
* Nincs külső API integráció
* Web alkalmazás (nem mobil)
* Egyszerű jogosultsági modell

---

## Definition of Done (kész definíció)

A projekt akkor tekinthető késznek, ha:

* A README alapján az alkalmazás elindítható.
* A fő funkciók (MVP user story-k) működnek.
* Az alapvető hibakezelés implementálva van.
* Az adatbázis és backend stabilan működik.
* A frontend használható és navigálható.
* A felhasználó végig tud menni legalább egy teljes folyamaton:

  * regisztráció → lovarda létrehozás/csatlakozás → ló létrehozás → teendő vagy esemény létrehozás → verseny jelentkezés

---

## Korlátok és tudatosan kihagyott funkciók

* Nincs valós idejű kommunikáció (chat)
* Nincs fizetési rendszer
* Nincs mobil alkalmazás
* Nincs komplex analitika rendszer
* Nincs külső szolgáltatások integrációja
