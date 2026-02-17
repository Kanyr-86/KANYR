# Teljes Bug Report - Frontend/Backend Hibák

## 🔴 KRITIKUS HIBÁK

### 1. ✅ JAVÍTVA - ReportsView API Végpont Eltérések
**Status**: JAVÍTVA

3 kritikus hiba a ReportsView.vue-ban:
- `/diak/statistics` → `/diaks/statistics` (311. sor)
- `/szoba` → `/szobas` (317. sor)  
- `/szoba/bekoltozesek` → `/szobas/bekoltozesek` (344. sor)

---

### 2. 🔴 **SzobaController - Vegyes Error/Message Formátum**
**Severity**: MAGAS  
**Fájl**: `backend/controllers/SzobaController.js`  
**Probléma**: A controller **vegyes formátumot** használ az error válaszokhoz:

#### Inkonzisztens Error Response Formátum
A sikeres válaszok nem konzisztensek:
- Néha: `{ success: true, message: '...', data: ... }`
- Néha: `{ success: true, data: ... }` (nincs message)

Az error válaszok szintén vegyes:
- Néha: `{ success: false, message: '...' }`
- Néha: `{ success: false, error: '...' }`

#### Érintett Helyek:
| Sor | Típus | Formátum |
|-----|-------|----------|
| 19-20 | error | `message:` ❌ |
| 33, 39 | success/error | vegyes |
| 56, 65 | error | `message:` ❌ |
| 142, 173 | success | csak `message:` (nincs data) |
| 203, 216 | error | `message:` ❌ |
| 237, 268 | error | `message:` ❌ |
| 305, 335 | error | `message:` ❌ |
| 366, 372 | error | `message:` ❌ |
| 401 | error | `message:` ❌ |

#### Megoldás szükséges:
A konzisztencia érdekében az összes error response-nak `error` mezőt kellene használnia, mint a többi controller:

```javascript
// Rossz (jelenleg):
res.status(400).json({
  success: false,
  message: error.message  // ❌ Más kontrollerek ezt 'error' mezővel küldik
});

// Helyes:
res.status(400).json({
  success: false,
  error: error.message  // ✅ Konzisztens az összes controllerrel
});
```

---

## ⚠️ KÖZEPES FONTOSSÁGÚ HIBÁK

### 3. **Frontend Error Handling - Vegyes Formátum Elfogadása**
**Severity**: KÖZEPES  
**Fájl**: `frontend/src/views/RoomsView.vue`, `ParentsView.vue`  
**Probléma**: A frontend az alábbi kódot használja:

```javascript
const errorMsg = response.data.error || response.data.message || 'Ismeretlen hiba'
```

Ez azt jelenti, hogy a frontend **adaptálódik** az inkonzisztens backend formátumhoz, de nem ideális.

**Ajánlás**: 
- Backend konzisztensen `error` mezőt küldjön
- Frontend csak `error` mezőre támaszkodjon

---

## ℹ️ EGYÉB MEGFIGYELÉSEK

### 4. **Diak Model - cim_id Mező**
**Status**: OK (működik)  
**Megjegyzés**: A Diak modellben van `cim_id` mező diákok lakcímének tárolásához, amely szükséges az `enrollStudent` folyamatban.

### 5. **Advisory Tábla Index Gyakorlatok**
**Status**: Helyes

Az alábbi modellek helyes kapcsolatokkal vannak definiálva:
- ✅ Diak → Szulo (belongsTo)
- ✅ Diak → Lakcim (belongsTo) 
- ✅ Diak → SzobaBekoltozes (hasMany)
- ✅ Szoba → SzobaBekoltozes (hasMany)
- ✅ SzobaBekoltozes → Diak (belongsTo)
- ✅ SzobaBekoltozes → Szoba (belongsTo)

---

## 🔧 JAVASOLT JAVA SORREND

### Lépés 1: SzobaController javítása (KRITIKUS)
**Módosítandó**: `backend/controllers/SzobaController.js`

Helyettesítendő az összes `message:` error mezőt `error:` mezővel:

```javascript
// Cseréli ki az összes error response-ot:
res.status(xxx).json({
  success: false,
  message: error.message  // ❌
});

// Helyére ezt:
res.status(xxx).json({
  success: false,
  error: error.message  // ✅
});
```

Körülbelül **20+ hely** van amit módosítani kell.

### Lépés 2: Sikeres Válaszok Konzisztenciája (OPCIONÁLIS)
**Javasolt formátum**:
```javascript
// Success válasz formato
{
  success: true,
  data: {...},
  message: 'Tetszés szerinti üzenet' // OPCIONÁLIS
}
```

Ezt követően a frontend használhatja:
```javascript
if (response.data.success) {
  // Sikeres
}
```

---

## 📊 ÖSSZEGZÉS

| Hiba | Típus | Status | Megoldás Ideje |
|------|-------|--------|-----------------|
| ReportsView API végpontok | API | ✅ JAVÍTVA | - |
| SzobaController error/message | Controller | ⚠️ NYITOTT | ~30 perc |
| Frontend error handling | Frontend | ℹ️ MŰKÖDIK | Opcionális |

