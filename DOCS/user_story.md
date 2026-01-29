# User Stories

## Kollégiumi Titkár Diák Kezelése

### User Story: Titkár segíti a diákot szobainformációval és áthelyezéssel
**Mint** kollégiumi titkár,  
**Szeretném** segíteni a diákokat szobainformációval és szobaátcsatolással,  
**Hogy** hatékonyan kezeljem a kollégiumi elhelyezési kérdéseket.

#### Előfeltételek:
- Titkár be van jelentkezve a rendszerbe
- Diák azonosítása szükséges (név, diákigazolvány alapján)

#### Fő folyamat (Happy Path):
1. Diák megérkezik a titkárságra
2. Titkár azonosítja a diákot a rendszerben
3. Titkár lekérdezi a diák aktuális szobáját
4. Titkár tájékoztatja a diákot a szoba számáról és részleteiről
5. Diák kéri az áthelyezését másik szobába
6. Titkár ellenőrzi a kért szoba elérhetőségét
7. Titkár végrehajtja a szobaátcsatolást
8. Titkár visszaigazolja a változást a diáknak

#### Alternatív folyamatok:
- **A1: Diák új beiratkozás** - Titkár teljes beiratkozási folyamatot indít
- **A2: Diák szobája nem aktív** - Titkár új szobát rendel hozzá
- **A3: Kért szoba foglalt** - Titkár szabad szobákat keres

#### Kivételek:
- **E1: Diák nem található** - "Nincs ilyen diák a rendszerben"
- **E2: Aktív beköltözés hiányzik** - "Diáknak nincs aktív szobája"
- **E3: Szoba elérhetetlen** - "A szoba jelenleg teljes"

#### Üzleti szabályok:
- Egy diák egyszerre csak egy szobában lakhat
- Szobaátcsatoláskor előző beköltözés lezárásra kerül
- Szoba kapacitás automatikusan ellenőrzésre kerül
- Minden változás időbélyeggel rögzítésre kerül

#### Technikai követelmények:
- **Használt API végpontok:**
  - `GET /api/diaks/search` - diák keresése
  - `GET /api/diaks/:id/room` - diák szobájának lekérdezése
  - `POST /api/diaks/:id/transfer` - szobaátcsatolás
  - `GET /api/szoba` - szabad szobák listázása

#### Elfogadási kritériumok:
- ✅ Titkár megtalálja bármely diák adatait
- ✅ Aktuális szoba információ helyesen megjelenik
- ✅ Szobaátcsatolás sikeresen végrehajtható
- ✅ Rendszer megakadályozza érvénytelen műveleteket
- ✅ Minden művelet naplózásra kerül

## Új diák, nincs rendszerben szülő

## Új diák, van rendszerben szülő

## Diák szobába szobába költözése

## Diák egyik szobából másikba költözése

## Diák kiköltözése

## Új szoba felvétele

## Új suülő felvétele

## Diák szülő módosítása

## Szülő törlése

## Diák törlése

## Szoba törlése