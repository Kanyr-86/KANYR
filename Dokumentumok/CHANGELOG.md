# KANYR Változásnapló

Ez a dokumentum a KANYR (Kollégiumi Adatbázis Nyilvántartó Rendszer) összes változását, javítását és frissítését tartalmazza fordított időrendi sorrendben.

---

## [2026.02.23] - Frontend Komponenskönyvtár és Backend Infrastruktúra

### Újdonságok ✨

#### Frontend Komponenskönyvtár
Teljes körű újrafelhasználható komponenskönyvtár létrehozása a Vue 3 + Pinia + Bootstrap 5 stackhez.

##### Store-ok
- **`frontend/src/store/toast.js`** - Toast értesítések Pinia store
  - `success()`, `error()`, `info()`, `warning()` metódusok
  - Automatikus ID generálás és timeout kezelés
  - `removeToast()` egyedi törléshez

- **`frontend/src/store/theme.js`** - Téma kezelés Pinia store
  - `light` / `dark` téma támogatás
  - localStorage perzisztencia
  - `toggleTheme()`, `setTheme()`, `applyTheme()` metódusok
  - Rendszer preferencia figyelés

##### Komponensek

**Alap komponensek:**
- **`frontend/src/components/BaseButton.vue`** - Újrafelhasználható gomb
  - 17 Bootstrap 5 variáns (primary, secondary, danger, outline-*, stb.)
  - `sm`, `md`, `lg` méretek
  - Loading state spinnerrel
  - Bootstrap Icons támogatás (`icon` prop)
  - Block (teljes szélesség) opció

- **`frontend/src/components/BaseCard.vue`** - Kártya konténer
  - `title`, `subtitle` props
  - `loading` state skeleton loaderrel
  - `variant` - szegély szín variánsok (primary, success, danger, warning)
  - `shadow` - hover effekt
  - `noPadding` opció
  - `header`, `footer`, `actions` slotok

- **`frontend/src/components/BaseModal.vue`** - Modal ablak
  - `v-model:show` kétirányú kötés
  - `sm`, `md`, `lg`, `xl` méretek
  - `closeOnBackdrop`, `closeOnEscape` opciók
  - `hideFooter` opció
  - Testreszabható `header`, `footer` slotok
  - Escape billentyű és body scroll kezelés

- **`frontend/src/components/BaseTable.vue`** - Adattábla
  - `columns` - `{ key, label, sortable?, formatter? }` konfiguráció
  - `items` - adat tömb
  - `loading` - skeleton loader
  - Rendezhető oszlopok (`sortable` flag)
  - `sortKey`, `sortOrder` state management
  - `emptyText` - magyar alapértelmezett
  - `cell-[key]` slotok egyedi cella megjelenítéshez
  - `actions` slot művelet gombokhoz
  - Bootstrap 5 `table-hover`, `table-striped` támogatás

**Form komponensek:**
- **`frontend/src/components/forms/BaseInput.vue`** - Input mező
  - `label`, `placeholder`, `type`, `error` props
  - `v-model` támogatás
  - Validációs hiba megjelenítés
  - Bootstrap 5 `form-control` styling

- **`frontend/src/components/forms/BaseSelect.vue`** - Lenyíló lista
  - `options` - `{ value, label }` vagy egyszerű értékek
  - `placeholder`, `error` props
  - `v-model` támogatás
  - Bootstrap 5 `form-select` styling

- **`frontend/src/components/forms/BaseCheckbox.vue`** - Jelölőnégyzet
  - `label`, `error` props
  - `v-model` támogatás
  - Bootstrap 5 `form-check` styling

- **`frontend/src/components/forms/BaseTextarea.vue`** - Többsoros szöveg
  - `label`, `placeholder`, `rows`, `error` props
  - `v-model` támogatás
  - Bootstrap 5 `form-control` styling

**Layout komponensek:**
- **`frontend/src/components/layout/PageHeader.vue`** - Oldal fejléc
  - `title`, `subtitle` props
  - `breadcrumbs` - `{ label, to? }` tömb
  - `actions` slot gombokhoz
  - Bootstrap breadcrumb komponens

- **`frontend/src/components/layout/PageContent.vue`** - Tartalom konténer
  - `noPadding` opció
  - Reszponzív padding
  - CSS változók támogatás

- **`frontend/src/components/layout/EmptyState.vue`** - Üres állapot
  - `icon`, `title`, `description` props
  - `actionText`, `actionRoute` - akció gomb
  - `icon`, `action` slotok
  - Középre igazított layout

- **`frontend/src/components/layout/ErrorState.vue`** - Hiba állapot
  - `title`, `message` props
  - `retryAction` - újrapróbálás callback
  - Hiba ikon és danger színezés
  - `action` slot egyedi gombhoz

**Overlays:**
- **`frontend/src/components/LoadingOverlay.vue`** - Betöltés overlay
  - `show` - láthatóság
  - `message` - opcionális üzenet
  - `opacity` - háttér átlátszóság
  - Bootstrap 5 spinner
  - `Teleport` to body

- **`frontend/src/components/ConfirmDialog.vue`** - Megerősítő ablak
  - `useConfirm` composable integráció
  - `variant` - danger/primary színezés
  - Magyar alapértelmezett szövegek
  - Figyelmeztető ikon

##### Composables

- **`frontend/src/composables/useLoading.js`** - Betöltés state
  - `isLoading` - reaktív state
  - `startLoading()`, `stopLoading()` - state vezérlés
  - `withLoading(asyncFn, onError?)` - wrapper függvény
  - Komponens unmount cleanup

- **`frontend/src/composables/useDebounce.js`** - Debounce
  - `debouncedFn` - debounced függvény
  - `cancel()` - megszakítás
  - `flush()` - azonnali végrehajtás
  - Komponens unmount cleanup

- **`frontend/src/composables/useSearch.js`** - Keresés
  - `searchQuery`, `searchResults`, `isSearching`, `error`
  - `clearSearch()` - törlés
  - Automatikus debounce (300ms alapértelmezett)
  - `useDebounce` integráció

- **`frontend/src/composables/useConfirm.js`** - Megerősítés
  - `confirm(options)` - Promise alapú API
  - `isOpen`, `options` - reaktív state
  - `handleConfirm()`, `handleCancel()` - callbacks
  - `ConfirmDialog` komponenshez

- **`frontend/src/composables/useFormValidation.js`** - Form validáció
  - Built-in validátorok: `required`, `minLength`, `maxLength`, `min`, `max`, `email`, `pattern`
  - Magyar hibaüzenetek
  - `errors`, `validate()`, `validateField()`, `clearErrors()`, `isValid`

- **`frontend/src/composables/useTheme.js`** - Téma kezelés
  - `theme`, `isDark`, `isLight`
  - `toggleTheme()`, `setTheme()`, `initializeTheme()`
  - `data-theme="dark"` attribútum kezelés

##### Styling

- **`frontend/src/style.css`** - CSS változók frissítése
  - `:root` - Light téma változók
  - `[data-theme="dark"]` - Dark téma változók
  - `--bg-primary`, `--bg-secondary`, `--bg-card`
  - `--text-primary`, `--text-secondary`, `--text-muted`
  - `--border-color`, `--shadow-color`
  - Smooth átmenetek (0.3s ease)

### App.vue Integráció ✅

- **`ConfirmDialog`** komponens regisztrálva
- **`useTheme`** composable importálva
- **`initializeTheme()`** hívás `onMounted`-ban
- Téma perzisztencia localStorage-ban

### Használati Példák

#### BaseButton
```vue
<BaseButton 
  variant="danger" 
  icon="bi-trash" 
  :loading="isDeleting"
  @click="handleDelete"
>
  Törlés
</BaseButton>
```

#### BaseTable
```vue
<BaseTable
  :columns="columns"
  :items="students"
  :loading="isLoading"
  :sort-key="sortKey"
  :sort-order="sortOrder"
  @sort="handleSort"
>
  <template #cell-name="{ item }">
    {{ item.firstName }} {{ item.lastName }}
  </template>
  <template #actions="{ item }">
    <BaseButton variant="outline-primary" size="sm">Szerkesztés</BaseButton>
  </template>
</BaseTable>
```

#### useConfirm
```javascript
const { confirm } = useConfirm()

async function handleDelete(id) {
  const result = await confirm({
    title: 'Diák törlése',
    message: 'Biztosan törölni szeretnéd?',
    confirmText: 'Törlés',
    cancelText: 'Mégse',
    variant: 'danger'
  })
  
  if (result) {
    await deleteStudent(id)
  }
}
```

#### useFormValidation
```javascript
const rules = {
  nev: { required: true, minLength: 2 },
  email: { required: true, email: true }
}

const { errors, validate, isValid } = useFormValidation(rules)

async function handleSubmit() {
  if (validate(formData)) {
    await saveData(formData)
  }
}
```

### Megjegyzések 📝

- A meglévő view-k (pl. `StudentsView.vue`) jelenleg natív Bootstrap modals és HTML form elemeket használnak
- Az új komponensek elérhetők és használhatók új view-kban vagy refaktoráláskor
- Minden komponens tartalmaz JSDoc kommenteket és használati példákat

---

### Újdonságok ✨

#### Hibakezelési infrastruktúra
- **`backend/utils/AppError.js`** - Egyedi hibaosztályok
  - `AppError` - Alaposztály `statusCode`, `status`, `isOperational` tulajdonságokkal
  - `ValidationError` (400) - Validációs hibákhoz
  - `UnauthorizedError` (401) - Hitelesítési hibákhoz
  - `ForbiddenError` (403) - Jogosultsági hibákhoz
  - `NotFoundError` (404) - Nem található erőforrásokhoz
  - `ConflictError` (409) - Erőforrás ütközésekhez

- **`backend/middleware/errorHandler.js`** - Központi hibakezelő middleware
  - Automatikus státuszkód kezelés
  - Fejlesztői környezetben részletes hibainformációk
  - Produktív környezetben biztonságos hibaüzenetek

- **`backend/utils/asyncHandler.js`** - Async wrapper függvény
  - `Promise.resolve().catch(next)` minta
  - Eliminálja a try-catch boilerplate kódot

#### Validációs infrastruktúra
- **`backend/middleware/validationHandler.js`** - Validáció kezelő middleware
  - `express-validator` eredmények feldolgozása
  - Strukturált hibaüzenetek `{ field, message }` formátumban

- **`backend/validators/diakValidators.js`** - Diák validációs szabályok
  - `createDiakValidator` - Új diák létrehozásához
  - `updateDiakValidator` - Diák frissítéséhez
  - `getDiakValidator` - Listázási query paraméterekhez
  - Magyar hibaüzenetek

- **`backend/validators/authValidators.js`** - Auth validációs szabályok
  - `loginValidator` - Bejelentkezéshez
  - `registerValidator` - Regisztrációhoz (jelszó komplexitás ellenőrzés)
  - Magyar hibaüzenetek

#### Biztonsági middleware
- **`backend/middleware/requireRole.js`** - Szerepkör alapú hozzáférés-vezérlés
  - `requireRole(...roles)` - Meghatározott szerepkörök ellenőrzése
  - `requireSelfOrRole(idParam, ...roles)` - Saját adat vagy szerepkör ellenőrzése

- **`backend/middleware/sanitizer.js`** - Bemeneti tisztítás
  - NoSQL injection védelem (`$` karakterek eltávolítása)
  - MongoDB dot notation injection védelem
  - Rekurzív tisztítás beágyazott objektumokhoz

- **`backend/middleware/requestLogger.js`** - Kérés naplózás
  - ISO timestamp, HTTP metódus, URL, státuszkód, időtartam, IP cím

#### Egyéb utils
- **`backend/utils/transaction.js`** - Tranzakció helper
  - `withTransaction(db, callback)` - Sequelize tranzakciók egyszerű kezelése
  - Automatikus commit/rollback

### Biztonság 🔒

- **Helmet integráció** - HTTP biztonsági fejlécek
  - Content-Security-Policy beállítása
  - Cross-Origin-Embedder-Policy (development-ben kikapcsolva)
  - További alapértelmezett biztonsági fejlécek

### Refaktorálva 🔧

- **`backend/controllers/DiakController.js`**
  - Minden metódus átalakítva `asyncHandler` használatára
  - Try-catch blokkok eltávolítása (~150 sor kód csökkentés)
  - `NotFoundError` és `ValidationError` használata

- **`backend/routes/DiakRoutes.js`**
  - Importált validátorok használata
  - `validationHandler` middleware alkalmazása
  - `requireRole` és `requireSelfOrRole` middleware integráció
  - Inline validációk eltávolítása

### App.js frissítések 📝

- Helmet middleware hozzáadása (CORS után)
- Request logger middleware hozzáadása
- Globális errorHandler a middleware lánc végén
- 404 handler `NotFoundError` dobása

### Fejlesztői környezet 🛠️

- **Jest konfiguráció** - Tesztelési keretrendszer
  - `npm test` - Tesztek futtatása
  - `npm run test:watch` - Figyelt mód
  - `npm run test:coverage` - Kódlefedettség

- **npm scripts frissítése**
  - `start` - Éles futtatás (node)
  - `dev` - Fejlesztői mód (nodemon)

### Függőségek 📦

**Új:**
- `helmet` - HTTP biztonsági fejlécek
- `jest` (devDependency) - Teszt keretrendszer

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
- [x] ~~Validation Error Messages szanitálása (sensitív adatok leak)~~ ✅ *Megvalósítva: 2026.02.23 - sanitizer.js*
- [ ] Database migrations implementálása
- [ ] Frontend CSS modulárizálása

### Közepes prioritás
- [ ] Toast library teljes integrálása
- [ ] API dokumentáció (Swagger/OpenAPI)
- [ ] Unit/Integration teszt írása (Jest konfigurálva)

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
- ✅ Input sanitizálás (NoSQL injection védelem) - *2026.02.23*
- ✅ HTTP biztonsági fejlécek (Helmet) - *2026.02.23*
- ✅ Központi hibakezelés - *2026.02.23*
- ✅ Validációs infrastruktúra - *2026.02.23*
- ⚠️ Production JWT_SECRET (TODO)
- ⚠️ API rate limiting (TODO)

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

**Utolsó frissítés**: 2026.02.23  
**Karbantartó**: KANYR Fejlesztő Csapat
