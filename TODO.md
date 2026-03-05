# KANYR - Projekt Állapot és Feladatok

**Utolsó frissítés**: 2026.02.23

---

## ✅ Kész komponensek

### Adatmodellek (backend/models/)
- [x] Diak.js - Diák modell
- [x] Felhasznalo.js - Felhasználó modell (bcrypt jelszó, JWT)
- [x] Lakcim.js - Lakcím modell
- [x] Szoba.js - Szoba modell
- [x] SzobaBekoltozes.js - Beköltözés modell
- [x] SzobaValtoztatas.js - Szobaváltás modell
- [x] Szulo.js - Szülő modell
- [x] Notification.js - Értesítés modell

### Repository réteg (backend/repositories/)
- [x] DiakRepository.js
- [x] FelhasznaloRepository.js
- [x] LakcimRepository.js
- [x] SzobaRepository.js
- [x] SzuloRepository.js

### Service réteg (backend/services/)
- [x] DiakService.js
- [x] FelhasznaloService.js
- [x] LakcimService.js
- [x] SzobaService.js
- [x] SzuloService.js

### Controller réteg (backend/controllers/)
- [x] DiakController.js - ✅ *Refaktorálva: asyncHandler használata*
- [x] FelhasznaloController.js
- [x] LakcimController.js
- [x] SzobaController.js
- [x] SzobaValtoztatasController.js
- [x] SzuloController.js

### Route-ok (backend/routes/)
- [x] DiakRoutes.js - ✅ *Refaktorálva: validator és middleware integráció*
- [x] FelhasznaloRoutes.js
- [x] LakcimRoutes.js
- [x] SzobaRoutes.js
- [x] SzobaValtoztatasRoutes.js
- [x] SzuloRoutes.js
- [x] authRoutes.js

### Middleware (backend/middleware/)
- [x] authMiddleware.js - JWT hitelesítés
- [x] errorHandler.js - ✅ *ÚJ: Központi hibakezelő*
- [x] requestLogger.js - ✅ *ÚJ: Kérés naplózás*
- [x] requireRole.js - ✅ *ÚJ: Szerepkör alapú hozzáférés (requireRole, requireSelfOrRole)*
- [x] sanitizer.js - ✅ *ÚJ: NoSQL injection védelem*
- [x] validationHandler.js - ✅ *ÚJ: Validáció kezelő*

### Utils (backend/utils/)
- [x] AppError.js - ✅ *ÚJ: Egyedi hibaosztályok (ValidationError, NotFoundError, stb.)*
- [x] asyncHandler.js - ✅ *ÚJ: Async wrapper try-catch eliminálására*
- [x] authUtils.js - Auth segédfüggvények
- [x] transaction.js - ✅ *ÚJ: Sequelize tranzakció helper*

### Validátorok (backend/validators/)
- [x] diakValidators.js - ✅ *ÚJ: Diák validációs szabályok*
- [x] authValidators.js - ✅ *ÚJ: Auth validációs szabályok*

### Konfiguráció
- [x] database.js - Sequelize kapcsolat
- [x] jest.config.js - ✅ *ÚJ: Jest teszt konfiguráció*

### App.js
- [x] CORS konfiguráció
- [x] Helmet integráció - ✅ *ÚJ: HTTP biztonsági fejlécek*
- [x] Request logger middleware - ✅ *ÚJ*
- [x] Global error handler - ✅ *ÚJ*

---

## ⚠️ Függőben lévő feladatok

### Magas prioritás
- [ ] Database migrations implementálása
- [ ] Frontend CSS modulárizálása
- [x] API rate limiting ✅ *express-rate-limit integrálva*

### Közepes prioritás
- [ ] Toast library teljes integrálása
- [ ] API dokumentáció (Swagger/OpenAPI)
- [ ] Unit/Integration teszt írása (Jest konfigurálva ✅)

### Production deployment
- [ ] `.env` fájl production értékekkel
- [ ] JWT_SECRET generálása (min 32 karakter)
- [ ] Database backup stratégia

---

## 📦 Függőségek

### Production dependencies
- express - Web framework
- sequelize - ORM
- sqlite3 - Adatbázis
- bcrypt - Jelszó titkosítás
- jsonwebtoken - JWT hitelesítés
- express-validator - Validáció
- helmet - ✅ *ÚJ: HTTP biztonsági fejlécek*
- dotenv - Környezeti változók
- axios - HTTP kliens

### Dev dependencies
- nodemon - Fejlesztői szerver
- jest - ✅ *ÚJ: Teszt keretrendszer*

---

## 🛠️ npm scripts

```json
{
  "start": "node app.js",
  "dev": "nodemon app.js",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

---

## 📚 API Végpontok

### Auth (/api/auth)
| Módszer | Végpont | Leírás | Auth |
|---------|---------|--------|------|
| POST | /login | Bejelentkezés | - |
| POST | /logout | Kijelentkezés | - |
| GET | /me | Aktuális felhasználó | ✅ |
| GET | /check-admin | Admin jog ellenőrzése | ✅ |

### Diák (/api/diaks)
| Módszer | Végpont | Leírás | Auth |
|---------|---------|--------|------|
| GET | / | Összes diák | ✅ |
| GET | /active | Aktív diákok | ✅ |
| GET | /search | Diákok keresése | ✅ |
| GET | /statistics | Statisztikák | Admin |
| GET | /:id | Diák lekérése | ✅ requireSelfOrRole |
| POST | / | Új diák | ✅ requireRole('titkár') |
| PUT | /:id | Diák frissítése | ✅ |
| DELETE | /:id | Diák törlése | Admin |
| POST | /enroll | Beiratkozás | ✅ |
| POST | /:id/transfer | Áthelyezés | ✅ |
| POST | /:id/move-out | Kiköltöztetés | ✅ |

### Szoba (/api/szobas)
| Módszer | Végpont | Leírás |
|---------|---------|--------|
| GET | / | Összes szoba |
| GET | /statistics | Statisztikák |
| POST | /bekoltozes | Beköltözés |
| POST | /bulk-bekoltozes | Tömeges beköltözés |

### Szülő (/api/szulos)
| Módszer | Végpont | Leírás |
|---------|---------|--------|
| GET | / | Összes szülő |
| GET | /:id | Szülő lekérése |
| POST | / | Új szülő |
| PUT | /:id | Szülő frissítése |
| DELETE | /:id | Szülő törlése |

### Lakcím (/api/lakcims)
| Módszer | Végpont | Leírás |
|---------|---------|--------|
| GET | / | Összes lakcím |
| GET | /:id | Lakcím lekérése |
| POST | / | Új lakcím |
| PUT | /:id | Lakcím frissítése |
| DELETE | /:id | Lakcím törlése |

---

## 🔒 Biztonsági ellenőrzőlista

- ✅ JWT_SECRET environment variable
- ✅ CORS configuration environment-ből
- ✅ .env a .gitignore-ban
- ✅ Database logging kikapcsolva production-ben
- ✅ Admin user létrehozva seed script-ben
- ✅ Input sanitizálás (NoSQL injection védelem)
- ✅ HTTP biztonsági fejlécek (Helmet)
- ✅ Központi hibakezelés
- ✅ Validációs infrastruktúra
- ✅ Szerepkör alapú hozzáférés-vezérlés
- ✅ API rate limiting (express-rate-limit)
- ⚠️ Production JWT_SECRET (TODO)

---

## 📋 Implementációs történet

### 2026.02.23 - Backend Infrastruktúra és Biztonság
- Hibakezelési infrastruktúra (AppError, errorHandler, asyncHandler)
- Validációs infrastruktúra (validationHandler, validators)
- Biztonsági middleware (requireRole, sanitizer, requestLogger)
- Helmet integráció
- Jest konfiguráció
- DiakController refaktorálás
- DiakRoutes frissítés

### 2026.02.19 - Teljesítmény optimalizálás
- N+1 query problémák megoldása
- Race condition javítások

### 2026.02.16 - Student Dashboard
- Diák dashboard implementálása
- Értesítési rendszer

### 2026.01.15 - Admin rendszer
- JWT hitelesítés
- Admin middleware
- Felhasználó CRUD

---

**Karbantartó**: KANYR Fejlesztő Csapat