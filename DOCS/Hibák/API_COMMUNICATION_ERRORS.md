# API Kommunikációs Hibák - Endpont Eltérések

## Összefoglalás
A frontend és backend közötti API hívásokba több eltérés találtam, ahol a frontend másik nevet vagy útvonalat hívva meg, mint amit a backend ténylegesen biztosít.

---

## 🔴 KRITIKUS HIBÁK

### 1. **ReportsView.vue - Helytelenül definiált API hívások**

#### Hiba 1A: Statistics végpont szingular alak
**Hely**: `frontend/src/views/ReportsView.vue` (311. sor)
```javascript
// ❌ HIBÁS - Frontend hívás:
const statsResponse = await api.get('/diak/statistics')

// ✅ HELYES - Backend végpont:
// Az adat: GET /api/diaks/statistics (DiakRoutes.js + DiakController.getStatistics)
```
**Probléma**: A frontend `/diak/statistics` (szingular) végpontot hívja, de a backend `/api/diaks/statistics` (plurális szobák) végpontot biztosít.

**Javítás szükséges**:
```javascript
// Módosítás a 311. sorban:
const statsResponse = await api.get('/diaks/statistics')  // ← 's' hozzáadva
```

---

#### Hiba 1B: Szobák listázási végpont nem létezik
**Hely**: `frontend/src/views/ReportsView.vue` (317. sor)
```javascript
// ❌ HIBÁS - Frontend hívás:
const roomsResponse = await api.get('/szoba')

// ✅ HELYES - Backend végpont:
// GET /api/szobas (SzobaRoutes.js + SzobaController.getAllSzobas)
```
**Probléma**: A frontend `/szoba` (szingular) végpontot hívja, de a backend `/api/szobas` (plurális) végpontot biztosít.

**Javítás szükséges**:
```javascript
// Módosítás a 317. sorban:
const roomsResponse = await api.get('/szobas')  // ← 's' hozzáadva
```

---

#### Hiba 1C: Beköltözések szűrése - helytelenül definiált útvonal
**Hely**: `frontend/src/views/ReportsView.vue` (344. sor)
```javascript
// ❌ HIBÁS - Frontend hívás:
const response = await api.get(`/szoba/bekoltozesek?${params.toString()}`)

// ✅ HELYES - Backend végpont:
// GET /api/szobas/bekoltozesek (SzobaRoutes.js + SzobaController.getBekoltozesekWithFilters)
```
**Probléma**: A frontend `/szoba/bekoltozesek` (szingular) végpontot hívja, de a backend `/api/szobas/bekoltozesek` (plurális) végpontot biztosít.

**Javítás szükséges**:
```javascript
// Módosítás a 344. sorban:
const response = await api.get(`/szobas/bekoltozesek?${params.toString()}`)  // ← 's' hozzáadva
```

---

## ✅ HELYES IMPLEMENTÁCIÓK (Referenciaként)

Az alábbi végpontok helyesen vannak implementálva:

### DashboardView.vue
```javascript
// ✅ Helyes hívás (75. sor):
const response = await api.get('/diaks/statistics')
```

### StudentsView.vue
```javascript
// ✅ Összes helyes hívás:
await api.get('/diaks?includeRelations=true')  // ✅
await api.get('/szobas')                       // ✅
await api.get('/szulos')                       // ✅
await api.get('/lakcims')                      // ✅
await api.post('/diaks/enroll', ...)           // ✅
await api.post(`/diaks/${id}/transfer`, ...)   // ✅
await api.post(`/diaks/${id}/move-out`, ...)   // ✅
await api.put(`/diaks/${id}`, ...)             // ✅
await api.delete(`/diaks/${id}`)               // ✅
```

### ParentsView.vue
```javascript
// ✅ Összes helyes hívás:
await api.get('/szulos')                       // ✅
await api.post('/szulos', ...)                 // ✅
await api.put(`/szulos/${id}`, ...)            // ✅
await api.delete(`/szulos/${id}`)              // ✅
```

### RoomsView.vue
```javascript
// ✅ Összes helyes hívás:
await api.get('/szobas')                       // ✅
await api.get(`/szobas/${id}/occupancy`)       // ✅
await api.get('/szobas/available')             // ✅
await api.get('/diaks')                        // ✅
await api.post('/szobas', ...)                 // ✅
await api.put(`/szobas/${id}`, ...)            // ✅
await api.delete(`/szobas/${id}`)              // ✅
await api.post('/szobas/bulk-bekoltozes', ...) // ✅
```

---

## 📋 VÉGPONTOK ÁTTEKINTÉSE

### Diákok (`/api/diaks`)
| Módszer | Backend Végpont | Frontend Hívás | Status |
|---------|-----------------|----------------|--------|
| GET | `/api/diaks` | `/diaks` | ✅ OK |
| GET | `/api/diaks/statistics` | `/diak/statistics` | ❌ HIBA - Szingular alak |
| GET | `/api/diaks/active` | (nem használt) | ℹ️ |
| GET | `/api/diaks/:id` | `/diaks/{id}` | ✅ OK (kikövetkeztetett) |
| POST | `/api/diaks` | (közvetlenül nem hívott) | ℹ️ |
| POST | `/api/diaks/enroll` | `/diaks/enroll` | ✅ OK |
| PUT | `/api/diaks/:id` | `/diaks/{id}` | ✅ OK |
| DELETE | `/api/diaks/:id` | `/diaks/{id}` | ✅ OK |
| POST | `/api/diaks/:id/transfer` | `/diaks/{id}/transfer` | ✅ OK |
| POST | `/api/diaks/:id/move-out` | `/diaks/{id}/move-out` | ✅ OK |

### Szobák (`/api/szobas`)
| Módszer | Backend Végpont | Frontend Hívás | Status |
|---------|-----------------|----------------|--------|
| GET | `/api/szobas` | `/szoba` | ❌ HIBA - Szingular alak |
| GET | `/api/szobas/bekoltozesek` | `/szoba/bekoltozesek` | ❌ HIBA - Szingular alak |
| GET | `/api/szobas/available` | `/szobas/available` | ✅ OK |
| GET | `/api/szobas/:id/occupancy` | `/szobas/{id}/occupancy` | ✅ OK |
| POST | `/api/szobas` | `/szobas` | ✅ OK |
| PUT | `/api/szobas/:id` | `/szobas/{id}` | ✅ OK |
| DELETE | `/api/szobas/:id` | `/szobas/{id}` | ✅ OK |
| POST | `/api/szobas/bulk-bekoltozes` | `/szobas/bulk-bekoltozes` | ✅ OK |

### Szülők (`/api/szulos`)
| Módszer | Backend Végpont | Frontend Hívás | Status |
|---------|-----------------|----------------|--------|
| GET | `/api/szulos` | `/szulos` | ✅ OK |
| GET | `/api/szulos/:id` | `/szulos/{id}` | ✅ OK |
| POST | `/api/szulos` | `/szulos` | ✅ OK |
| PUT | `/api/szulos/:id` | `/szulos/{id}` | ✅ OK |
| DELETE | `/api/szulos/:id` | `/szulos/{id}` | ✅ OK |

### Lakóhelyek (`/api/lakcims`)
| Módszer | Backend Végpont | Frontend Hívás | Status |
|---------|-----------------|----------------|--------|
| GET | `/api/lakcims` | `/lakcims` | ✅ OK |

---

## 🔧 JAVASOLT MEGOLDÁS

Csak a ReportsView.vue fájl 3 helyét kell módosítani:

### Módosítások a ReportsView.vue-ben

**311. sor**:
```diff
- const statsResponse = await api.get('/diak/statistics')
+ const statsResponse = await api.get('/diaks/statistics')
```

**317. sor**:
```diff
- const roomsResponse = await api.get('/szoba')
+ const roomsResponse = await api.get('/szobas')
```

**344. sor**:
```diff
- const response = await api.get(`/szoba/bekoltozesek?${params.toString()}`)
+ const response = await api.get(`/szobas/bekoltozesek?${params.toString()}`)
```

---

## ⚠️ MEGJEGYZÉS

A probléma egységesen a **szingular forma** (singular) használata a `ReportsView.vue`-ban, míg a többi view helyesen a **plurális formát** (plural) használja. Ez az inkonzisztencia az API kommunikcióban hibához vezet.

**Javasolt nómenklatúra**:
- Gyűjtemény végpontok: Plurális forma (`/diaks`, `/szobas`, `/szulos`, `/lakcims`)
- Egy elem végpontok: Plurális forma + ID (`/diaks/1`, `/szobas/1`)
