# KANYR - Teljes Hibajelentés

Ez a dokumentum a KANYR rendszer összes azonosított és javított hibáját tartalmazza.

---

## ✅ JAVÍTOTT HIBÁK

### 1. [2026.02.19] Race Condition - Szoba Beköltözés
**Fájl**: `backend/controllers/SzobaValtoztatasController.js`  
**Probléma**: Párhuzamos szobaváltási kérelmek esetén a szoba kapacitás túlléphető volt.  
**Megoldás**: 
- SERIALIZABLE izolációs szint a tranzakcióhoz
- Row locking (LOCK.UPDATE) a szoba rekordon
- Atomikus kapacitás ellenőrzés

### 2. [2026.02.19] N+1 Query Problémák
**Fájlok**: `backend/services/SzobaService.js`, `backend/services/DiakService.js`  
**Probléma**: A `getAllSzobas()`, `getRoomStatistics()` és `getDetailedStatistics()` metódusok ciklusban végeztek adatbázis hívásokat.  
**Megoldás**:
- Eager loading `include` opcióval
- GROUP BY aggregáció
- Promise.all párhuzamos lekérdezésekhez

### 3. [2026.02.18] API Végpont Eltérések
**Fájl**: `frontend/src/views/ReportsView.vue`  
**Probléma**: Helytelen API végpontok a frontendben.  
**Megoldás**:
- `/diak/statistics` → `/diaks/statistics`
- `/szoba` → `/szobas`
- `/szoba/bekoltozesek` → `/szobas/bekoltozesek`

### 4. [2026.02.18] Route Inicializáció
**Fájl**: `backend/app.js`  
**Probléma**: Route-ok az adatbázis kapcsolat előtt inicializálódtak.  
**Megoldás**: Route-ok betöltése a DB sync után, `app.locals.db` beállítása először.

### 5. [2025.02.13] JWT_SECRET Hardcoded
**Fájl**: `backend/utils/authUtils.js`  
**Probléma**: A JWT titkos kulcs hardcoded volt a kódban.  
**Megoldás**: `.env` fájl és környezeti változók használata.

### 6. [2025.02.13] CORS Hardcoded
**Fájl**: `backend/app.js`  
**Probléma**: CORS origins hardcoded voltak.  
**Megoldás**: `ALLOWED_ORIGINS` környezeti változó bevezetése.

### 7. [2025.02.13] Error Response Inkonzisztencia
**Fájl**: `backend/controllers/SzobaController.js`  
**Probléma**: Vegyes `message` és `error` mező használata a hiba válaszokban.  
**Megoldás**: Egységes `error` mező használata minden controllerben.

---

## 📊 HIBASTATISZTIKA

| Dátum | Hibák száma | Státusz |
|-------|-------------|---------|
| 2026.02.19 | 4 | ✅ Mind javítva |
| 2026.02.18 | 2 | ✅ Mind javítva |
| 2025.02.13 | 3 | ✅ Mind javítva |

---

## 🔍 ISMERT PROBLÉMÁK (TODO)

### Magas prioritás
- [ ] Validation Error Messages szanitálása
- [ ] Database migrations implementálása

### Közepes prioritás
- [ ] Toast library teljes integrálása
- [ ] API dokumentáció (Swagger/OpenAPI)

---

**Utolsó frissítés**: 2026.02.19