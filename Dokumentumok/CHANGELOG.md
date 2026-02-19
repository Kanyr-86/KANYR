# KANYR Változásnapló

Ez a dokumentum a KANYR (Kollégiumi Adatbázis Nyilvántartó Rendszer) összes változását, javítását és frissítését tartalmazza fordított időrendi sorrendben.

---

## [2026.02.19] - Hibajavítások, Teljesítményjavítások és Optimalizációk

### Javítva ✅
- **SzobaValtoztatasController** - Race condition javítása a szobaváltás jóváhagyásakor
  - SERIALIZABLE izolációs szint hozzáadva a tranzakcióhoz
  - Row locking (LOCK.UPDATE) implementálva a szoba lekérdezéshez
  - Megakadályozza, hogy két párhuzamos kérelem túllépje a szoba kapacitást

- **SzobaController** - Konzisztens hibaválasz formátum
  - Az összes hibaválasz most már egységesen `error` mezőt használ
  - Formátum: `{ success: false, error: 'hibaüzenet' }`

- **ReportsView** - API végpontok javítva
  - `/diak/statistics` → `/diaks/statistics`
  - `/szoba` → `/szobas`
  - `/szoba/bekoltozesek` → `/szobas/bekoltozesek`

### Optimalizálva ⚡
- **SzobaService.getAllSzobas()** - N+1 query probléma megoldva
  - Eager loading használata a `include` opcióval
  - Egyetlen adatbázis lekérdezés az összes szoba és beköltözés lekérésére
  - Jelentős teljesítmény javulás nagy adatmennyiségnél

- **SzobaService.getRoomStatistics()** - N+1 query probléma megoldva
  - GROUP BY használata a COUNT aggregációhoz
  - Map alapú adatstruktúra a gyors kereséshez
  - Csak 2 adatbázis lekérdezés N szoba helyett

- **DiakService.getDetailedStatistics()** - N+1 query probléma megoldva
  - Promise.all a párhuzamos lekérdezésekhez
  - GROUP BY aggregáció a foglaltsági adatokhoz
  - 7 párhuzamos lekérdezés a ciklusok helyett

- **DiakService.checkRoomAvailability()** - Race condition védelem
  - Row locking (LOCK.UPDATE) implementálva
  - Biztosítja, hogy a szoba kapacitás ellenőrzés atomikus legyen

---

## [2026.02.18] - Route Inicializáció és Diák/Szoba Logic Fix

### Javítva ✅
- **Route inicializáció** - Route-ok az adatbázis kapcsolat után inicializálódnak
  - `app.locals.db` beállítása a route-ok előtt
  - Megoldja a "db is undefined" hibákat indításkor

- **Diák/Szoba logika** - Diák szoba lekérdezés javítások
  - Student dashboard endpointok javítása
  - Szobatársak lekérdezés optimalizálása

---

## [2026.02.17] - Backend/Frontend Patch#6

### Változások 📝
- Backend és frontend javítások
- API kommunikáció stabilizálása

---

## [2026.02.16] - Student Dashboard és Értesítések

### Újdonságok ✨
- **Student Dashboard** - Diák dashboard implementálása
  - Szoba információk megjelenítése
  - Szobatársak listázása

- **Értesítések** - Diák értesítési rendszer
  - Értesítések lekérése
  - Értesítések olvasottnak jelölése

---

## [2026.02.13] - Bejelentkezés és Bug Fixek

### Újdonságok ✨
- **Gyors bejelentkezés gombok** - Teszteléshez gyors bejelentkezés
- **User stories frissítés** - Dokumentáció frissítése

### Javítva ✅
- Bug fixes#1 - Különböző hibajavítások

---

## [2026.02.12] - Backend/Frontend Patch#5

### Változások 📝
- Backend és frontend javítások
- Adatvalidáció javítása

---

## [2026.02.12] - Backend/Frontend Patch#4

### Változások 📝
- Backend és frontend javítások
- API végpontok stabilizálása

---

## [2026.02.11] - Backend/Frontend Patch#2-3

### Változások 📝
- Backend patch#1 - Backend javítások
- Back/frontend patch#1-3 - Közös javítások

---

## [2026.02.10] - Frontend Patch#8-9

### Újdonságok ✨
- **Diák áthelyezés** - Diák szobaváltás funkcionalitás
  - Szoba választó javítása
  - Áthelyezés validáció

### Javítva ✅
- Small frontend patch#1fix - Apró javítások

---

## [2026.02.09] - Frontend Patch#5-7

### Változások 📝
- Frontend patch#5-7 - UI javítások
- User story frissítés - Dokumentáció

---

## [2026.02.08] - Frontend Patch#4

### Változások 📝
- UI/UX javítások
- Komponens optimalizációk

---

## [2026.02.06] - Back/Frontend Patch#1

### Változások 📝
- Backend és frontend első közös javítás
- API integráció javítások

---

## [2026.02.05] - Frontend Patch#3

### Változások 📝
- Frontend javítások
- Komponens refactor

---

## [2026.02.02] - React → Vite-Vue Migráció

### Újdonságok ✨
- **Vue.js migráció** - React-ról Vue.js-re váltás
  - Vite build rendszer
  - Vue 3 Composition API
  - Pinia state management

---

## [2026.01.29] - Frontend Patch#1-2

### Újdonságok ✨
- **User story alapok** - Felhasználási esetek implementálása
- Frontend patch#1-2 - UI javítások

---

## [2026.01.28] - Dokumentáció

### Dokumentáció 📚
- **Tartalomjegyzék** - Kezdetleges tartalomjegyzék
- Tartalomjegyzék fix - Javítások

---

## [2026.01.27] - v1.11 - Tömeges Beköltözés

### Újdonságok ✨
- **Tömeges beköltözési funkció** - `POST /api/szobas/bulk-bekoltozes`
  - Több diák egyidejű beköltöztetése ugyanabba a szobába
  - Tranzakciós biztonság (atomikus művelet)
  - Részletes hibakezelés és validáció

---

## [2026.01.26] - Backend Befejezése

### Újdonságok ✨
- **Backend userstory accepted** - User story implementáció elfogadva
- **Test commit új gépről** - Új fejlesztői környezet beállítása
- **Backend befejezése** - Backend teljes implementálása

---

## [2026.01.22] - User Story

### Dokumentáció 📚
- **User_Story added** - Felhasználói történetek dokumentációja

---

## [2026.01.20] - Frontend Fejlesztés

### Újdonságok ✨
- **Frontend majdnem teljes elkészítése** - UI komponensek
- View-k implementálása

---

## [2026.01.19] - Auth és Frontend Struktúra

### Újdonságok ✨
- **Admin auth** - Admin hitelesítés implementálása
- **JWT token** - Token alapú hitelesítés
- **Frontend mappa fix** - Könyvtárszerkezet rendezése
- **Backend, frontend directory** - Projekt struktúra

---

## [2026.01.15] - Middleware és Admin Jogok

### Újdonságok ✨
- **Middleware és Admin jogok** - Hitelesítési middleware
- **http-request formátum igazítás** - API tesztelés
- **Szobabeköltözés javítva** - Beköltözési logika fix
- **TODO.md befejezve** - Feladatlista
- **Jeleng tervezet végpontok** - API végpont tervezés
- **KANYR Alpha Változtatások Dokumentáció** - Verzió dokumentáció

---

## [2026.01.12] - Dokumentáció és Előkészület

### Dokumentáció 📚
- **TODO.md Updated** - Feladatlista frissítése
- **Végpont DOC added** - API végpont dokumentáció
- Teszt commitok

---

## [2026.01.08] - Backend Fejlesztés Folytatás

### Változások 📝
- **Befejeztem amit tegnap elkezdtünk** - Backend fejlesztés

---

## [2026.01.06] - Projekt Kezdet

### Újdonságok ✨
- **0106 minden egyszerre** - Kezdeti projekt struktúra
- **Nodemodules added** - Függőségek
- **README.md** - Projekt leírás
- **Docs file changes** - Dokumentáció
- **TxT → MD file** - Fájlformátum váltás
- **DOCS folder** - Dokumentációs mappa

---

## [2026.01.05] - Projekt Alapítás

### Alapítás 🎉
- **Create README.md** - Projekt létrehozása
- **Dokumentáció** - Kezdeti dokumentumok

---

## Függőben lévő feladatok

### Magas prioritás
- [ ] Validation Error Messages szanitálása (sensitív adatok leak)
- [ ] Database migrations implementálása
- [ ] Frontend CSS modulárizálása

### Közepes prioritás
- [ ] Toast library teljes integrálása
- [ ] API dokumentáció (Swagger/OpenAPI)
- [ ] Unit/Integration teszt írása

### Production deployment
- [ ] `.env` fájl production értékekkel
- [ ] JWT_SECRET generálása (min 32 karakter)
- [ ] Database backup stratégia
- [ ] API rate limiting

---

## Biztonsági ellenőrzőlista

- ✅ JWT_SECRET environment variable
- ✅ CORS configuration environment-ből
- ✅ .env a .gitignore-ban
- ✅ Database logging kikapcsolva production-ben
- ✅ Admin user létrehozva seed script-ben
- ⚠️ Validation messages szanitálása (TODO)
- ⚠️ Production JWT_SECRET (TODO)

---

## API Végpont Összefoglaló

### Diák végpontok (`/api/diaks`)
| Módszer | Végpont | Leírás |
|---------|---------|--------|
| GET | `/` | Összes diák listázása |
| GET | `/active` | Aktív diákok |
| GET | `/search` | Diákok keresése |
| GET | `/statistics` | Statisztikák (admin) |
| GET | `/:id` | Diák lekérése |
| POST | `/` | Új diák létrehozása |
| PUT | `/:id` | Diák frissítése |
| DELETE | `/:id` | Diák törlése |
| POST | `/enroll` | Teljes beiratkozás |
| POST | `/:id/transfer` | Diák áthelyezése |
| POST | `/:id/move-out` | Kiköltöztetés |

### Szoba végpontok (`/api/szobas`)
| Módszer | Végpont | Leírás |
|---------|---------|--------|
| GET | `/` | Összes szoba |
| GET | `/statistics` | Szoba statisztikák |
| GET | `/available` | Elérhető szobák |
| GET | `/:id` | Szoba lekérése |
| POST | `/` | Új szoba létrehozása |
| PUT | `/:id` | Szoba frissítése |
| DELETE | `/:id` | Szoba törlése |
| POST | `/bekoltozes` | Beköltözés |
| POST | `/bulk-bekoltozes` | Tömeges beköltözés |
| GET | `/bekoltozesek` | Beköltözések szűréssel |

### Szülő végpontok (`/api/szulos`)
| Módszer | Végpont | Leírás |
|---------|---------|--------|
| GET | `/` | Összes szülő |
| GET | `/:id` | Szülő lekérése |
| POST | `/` | Új szülő |
| PUT | `/:id` | Szülő frissítése |
| DELETE | `/:id` | Szülő törlése |

### Auth végpontok (`/api/auth`)
| Módszer | Végpont | Leírás |
|---------|---------|--------|
| POST | `/login` | Bejelentkezés |
| POST | `/logout` | Kijelentkezés |
| GET | `/me` | Aktuális felhasználó |
| GET | `/check-admin` | Admin jog ellenőrzése |

---

**Utolsó frissítés**: 2026.02.19  
**Karbantartó**: KANYR Fejlesztő Csapat