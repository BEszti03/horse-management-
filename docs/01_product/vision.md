# Product Vision

## Probléma

A lovardák mindennapi működése gyakran manuálisan vagy több különböző eszközön keresztül történik (jegyzetek, Excel, üzenetküldő alkalmazások). Ez megnehezíti:

* a lovak nyilvántartását
* a napi teendők és pályahasználat követését
* a felhasználók közötti koordinációt
* a versenyek szervezését és kezelését

Az információk szétszórtsága hibákhoz, félreértésekhez és időveszteséghez vezet.

---

## Célfelhasználók

### 1. Lovarda vezető

* Lovarda létrehozása és kezelése
* Felhasználók és lovak nyilvántartása
* Versenyek szervezése és jelentkezések kezelése
* Saját profil és lovak kezelése
* Naptárbejegyzések és teendők követése
* Pályahasználat és edzések rögzítése
* Versenyekhez való jelentkezés

### 2. Lovas / felhasználó

* Saját profil és lovak kezelése
* Naptárbejegyzések és teendők követése
* Pályahasználat és edzések rögzítése
* Versenyekhez való jelentkezés

### 3. Admin

* Saját profil és lovak kezelése
* Naptárbejegyzések és teendők követése
* Pályahasználat és edzések rögzítése
* Versenyekhez való jelentkezés
* Lovarda létrehozása és kezelése
* Felhasználók és lovak nyilvántartása
* Versenyek szervezése és jelentkezések kezelése
* Admin felület kezelése

---

## Értékajánlat

A Lóidő egy webalapú lovarda menedzsment rendszer, amely:

* egyetlen felületen kezeli a lovardához kapcsolódó adatokat
* segíti a napi teendők és események szervezését
* támogatja a lovak és felhasználók strukturált nyilvántartását
* lehetővé teszi a versenyek kezelését és a jelentkezések nyomon követését
* szerepkör alapú jogosultságkezeléssel biztosítja az adatok védelmét

---

## Siker definíció

### North Star metric

* Havonta elvégzett naptárbejegyzések és teendők száma.

Ez a metrika azt mutatja meg, hogy a felhasználók mennyire használják aktívan a rendszert a lovardai mindennapi feladatok szervezésére és követésére.

---

### Guardrail metrikák

* Regisztrált felhasználók száma
* Létrehozott lovak száma
* Lovardák száma
* Létrehozott versenyek száma
* Versenyekhez leadott jelentkezések száma
* Létrehozott naptárbejegyzések száma

---

## Non-goals (nem célok)

* Natív mobilalkalmazás fejlesztése
* Valós idejű chat vagy kommunikációs rendszer
* Online fizetési megoldások integrálása
* Külső versenyrendszerekkel való integráció
* Több lovarda közötti komplex hálózati működés (multi-tenant enterprise szint)

---

## Kockázatok és bizonytalanságok

### 1. Felhasználói elfogadás

A felhasználók megszokott eszközöket használnak (pl. Messenger, papír alapú jegyzetek).

* **Megoldás:** egyszerű, gyorsan tanulható UI és onboarding.

### 2. Jogosultságkezelési hibák

Nem megfelelő hozzáférések esetén adatvédelmi probléma léphet fel.

* **Megoldás:** backend oldali szerepkör alapú ellenőrzés (admin / lovarda vezető / lovas).

### 3. Adatinkonzisztencia

Több felhasználó egyidejű módosításai problémát okozhatnak.

* **Megoldás:** relációs adatmodell és megfelelő constraint-ek használata.

### 4. Hibakezelés hiányosságai

Nem megfelelő visszajelzések esetén a felhasználó nem tudja, mi történt.

* **Megoldás:** egységes error handling és felhasználóbarát üzenetek.

### 5. AI által generált kód hibái

A fejlesztés során AI eszközök használata miatt hibás vagy nem optimális megoldások kerülhetnek be.

* **Megoldás:** tesztelés, manuális ellenőrzés és verification log vezetése.
