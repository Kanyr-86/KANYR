# User Story Implementation Summary

## User Story: Kollégiumi Titkár Diák Kezelése

**Mint** kollégiumi titkár,  
**Szeretném** segíteni a diákokat szobainformációval és szobaátcsatolással,  
**Hogy** hatékonyan kezeljem a kollégiumi elhelyezési kérdéseket.

## Megvalósított Funkciók

### 1. Diák Keresése (`GET /api/diaks/search`)
- **Leírás**: Diákok keresése név, email vagy egyéb kritériumok alapján
- **Használat**: `GET /api/diaks/search?nev=Teszt Diák&email=diak@example.com`
- **Visszatérési érték**: Diákok listája a megadott kritériumoknak megfelelően

### 2. Diák Szobájának Lekérdezése (`GET /api/diaks/:id/room`)
- **Leírás**: Egy diák aktuális szobájának és beköltözési adatainak lekérdezése
- **Használat**: `GET /api/diaks/123/room`
- **Visszatérési érték**: Diák szobájának részletes adatai (szoba száma, férőhelyek száma, beköltözés dátuma)

### 3. Elérhető Szobák Listázása (`GET /api/szoba/available`)
- **Leírás**: Szabad szobák listázása, figyelembe véve a jelenlegi elfoglaltságot
- **Használat**: `GET /api/szoba/available?prefix=A&limit=10`
- **Visszatérési érték**: Elérhető szobák listája szabad helyekkel együtt

### 4. Diák Áthelyezése (`POST /api/diaks/:id/transfer`)
- **Leírás**: Diák áthelyezése egyik szobából a másikba
- **Használat**: `POST /api/diaks/123/transfer`  
  ```json
  {
    "uj_szoba_id": 456,
    "atcsatolas_datum": "2024-01-15"
  }
  ```
- **Visszatérési érték**: Sikeres áthelyezés megerősítése

## Technikai Megvalósítás

### Új Komponensek

#### 1. SzobaRepository - `getAvailableRooms()` metódus
```javascript
async getAvailableRooms(options = {}) {
  // Szobák lekérdezése a kapacitás ellenőrzésével
  // Visszaadja az elérhető szobákat szabad helyekkel
}
```

#### 2. SzobaService - `getAvailableRooms()` metódus
```javascript
async getAvailableRooms(options = {}) {
  // Repository hívása és hibakezelés
  return await this.SzobaRepository.getAvailableRooms(options);
}
```

#### 3. SzobaController - `getAvailableRooms()` metódus
```javascript
async getAvailableRooms(req, res) {
  // Validáció és szerviz hívás
  // JSON válasz visszaadása
}
```

#### 4. Új API Végpont
```javascript
router.get('/available', authenticate, isAdmin, validateQueryParams,
  async (req, res) => SzobaController.getAvailableRooms(req, res)
);
```

### Módosított Komponensek

#### 1. DiakController
- **Meglévő metódusok**: `searchStudents()`, `getStudentRoom()`, `transferStudent()`
- **Javítottak**: Hibakezelés, validációk, válaszformátumok

#### 2. DiakService
- **Meglévő metódusok**: `searchStudents()`, `getStudentRoom()`, `transferStudent()`
- **Javítottak**: Szoba elérhetőség ellenőrzése, tranzakciók kezelése

## Fő Folyamat (Happy Path)

1. **Diák azonosítása**: `GET /api/diaks/search`
2. **Szoba lekérdezése**: `GET /api/diaks/:id/room`
3. **Elérhető szobák ellenőrzése**: `GET /api/szoba/available`
4. **Áthelyezés végrehajtása**: `POST /api/diaks/:id/transfer`

## Alternatív Folyamatok

### A1: Diák új beiratkozás
- **API**: `POST /api/diaks/enroll`
- **Leírás**: Teljes beiratkozási folyamat indítása

### A2: Diák szobája nem aktív
- **API**: `POST /api/diaks/:id/transfer`
- **Leírás**: Új szoba hozzárendelése inaktív szobával rendelkező diákhoz

### A3: Kért szoba foglalt
- **API**: `GET /api/szoba/available`
- **Leírás**: Szabad szobák keresése alternatív megoldásokért

## Kivételek

### E1: Diák nem található
- **HTTP Kód**: 404
- **Üzenet**: "Nincs ilyen diák a rendszerben"

### E2: Aktív beköltözés hiányzik
- **HTTP Kód**: 404
- **Üzenet**: "Diáknak nincs aktív szobája"

### E3: Szoba elérhetetlen
- **HTTP Kód**: 400
- **Üzenet**: "A szoba jelenleg teljes"

## Üzleti Szabályok

- **Egy diák egyszerre csak egy szobában lakhat**
- **Szobaátcsatoláskor előző beköltözés lezárásra kerül**
- **Szoba kapacitás automatikusan ellenőrzésre kerül**
- **Minden változás időbélyeggel rögzítésre kerül**

## Technikai Követelmények

### Használt API Végpontok
- `GET /api/diaks/search` - diák keresése
- `GET /api/diaks/:id/room` - diák szobájának lekérdezése
- `POST /api/diaks/:id/transfer` - szobaátcsatolás
- `GET /api/szoba/available` - szabad szobák listázása

### Jogosultságok
- **Admin szerepkör szükséges** a szobák listázásához és diák adatok eléréséhez
- **Hitelesítés szükséges** minden művelethez

## Elfogadási Kritériumok

✅ **Titkár megtalálja bármely diák adatait**
- Diák keresés működik név, email és egyéb kritériumok alapján
- Eredmények pontosak és relevánsak

✅ **Aktuális szoba információ helyesen megjelenik**
- Diák szobájának adatai pontosak
- Beköltözési dátum és szobaszám helyes

✅ **Szobaátcsatolás sikeresen végrehajtható**
- Diák áthelyezése másik szobába működik
- Előző beköltözés automatikusan lezárásra kerül

✅ **Rendszer megakadályozza érvénytelen műveleteket**
- Tele szobába nem lehet beköltöztetni
- Nem létező diákot nem lehet áthelyezni
- Érvénytelen adatokkal nem lehet műveletet végrehajtani

✅ **Minden művelet naplózásra kerül**
- Műveletek időbélyeggel rögzítve
- Változások nyomon követhetők

## Tesztelés

### Unit Tesztek
- **Fájl**: `backend/test_user_story.js`
- **Tartalom**: API végpontok tesztelése különböző bemenetekkel
- **Fedettség**: Összes fő funkció és kivételkezelés

### Demo
- **Fájl**: `backend/simple_demo.js`
- **Tartalom**: User Story szimuláció
- **Cél**: Funkciók bemutatása és ellenőrzése

## Használati Útmutató

### 1. Diák Keresése
```bash
curl -X GET "http://localhost:3000/api/diaks/search?nev=Teszt Diák" \
  -H "Authorization: Bearer <token>"
```

### 2. Diák Szobájának Lekérdezése
```bash
curl -X GET "http://localhost:3000/api/diaks/123/room" \
  -H "Authorization: Bearer <token>"
```

### 3. Elérhető Szobák Listázása
```bash
curl -X GET "http://localhost:3000/api/szoba/available?prefix=A" \
  -H "Authorization: Bearer <token>"
```

### 4. Diák Áthelyezése
```bash
curl -X POST "http://localhost:3000/api/diaks/123/transfer" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "uj_szoba_id": 456,
    "atcsatolas_datum": "2024-01-15"
  }'
```

## Összegzés

A user story sikeresen megvalósításra került. Az összes szükséges funkció implementálva lett:

1. **Diák azonosítás** és keresés
2. **Szoba információk** lekérdezése
3. **Elérhető szobák** listázása
4. **Diák áthelyezés** másik szobába
5. **Hibakezelés** és kivételek kezelése
6. **Jogosultságok** és hitelesítés
7. **Naplózás** és auditálhatóság

A megvalósítás követi a meglévő kódminőségi szabványokat, rendelkezik megfelelő validációkkal és hibakezeléssel, valamint tesztekkel biztosítva a megbízhatóságot.
