# KANYR - Kollégiumi Adatbázis Nyilvántartó Rendszer

Ez a Ganz Ábrahám Szakközép és Technikum diákjainak a csoport projektje.

## 📋 Rendszer Leírás

A KANYR egy átfogó kollégiumi nyilvántartó rendszer, amely lehetővé teszi:
- Diákok kezelését és szobákba történő elhelyezését
- Szülők és lakcímek nyilvántartását
- Szobák foglaltságának követését
- Szobaváltási kérelmek kezelését
- Diák értesítési rendszer működtetését
- Tömeges beköltözési műveletek végrehajtását
- Adminisztrátori és diák felületek külön kezelését

## 🏗️ Rendszerarchitektúra

```
KANYR/
├── backend/           # Node.js + Express + SQLite backend
│   ├── controllers/   # API vezérlők
│   ├── services/      # Üzleti logika
│   ├── repositories/  # Adatbázis műveletek
│   ├── models/        # Sequelize modellek
│   ├── routes/        # API végpontok
│   ├── middleware/    # Hitelesítés, validáció, biztonság
│   ├── validators/    # Validációs szabályok
│   ├── utils/         # Segédprogramok és eszközök
│   └── config/        # Konfigurációs fájlok
├── frontend/          # Vue.js 3 + Vite frontend
│   └── src/
│       ├── views/     # Oldal komponensek
│       ├── components/# Újrafelhasználható komponensek
│       │   ├── Base/  # Alap komponensek (Button, Card, Modal, Table)
│       │   ├── forms/ # Form komponensek (Input, Select, Checkbox, Textarea)
│       │   ├── layout/# Layout komponensek (PageHeader, EmptyState, ErrorState)
│       │   └── overlays/# Overlay komponensek (LoadingOverlay, ConfirmDialog)
│       ├── composables/# Vue composable-ek
│       ├── services/  # API szolgáltatások
│       ├── store/     # Pinia state management
│       ├── utils/     # Segédprogramok
│       ├── i18n/      # Nemzetközi fordítások
│       └── styles/    # CSS változók és stílusok
└── Dokumentumok/      # Projekt dokumentáció
```

## 🚀 Gyors Indítás

### Előfeltételek
- Node.js (v18 vagy újabb)
- npm vagy yarn

### Backend indítása
```bash
cd backend
npm install
npm start
```

### Frontend indítása
```bash
cd frontend
npm install
npm run dev
```

### Fejlesztői környezet
```bash
# Backend fejlesztési mód
npm run dev

# Frontend fejlesztési mód
npm run dev

# Tesztek futtatása
npm test

# Kódminőség ellenőrzés
npm run lint
```

### Teszt fiókok
| Szerepkör | Email | Jelszó | Leírás |
|-----------|-------|--------|--------|
| Admin | admin@kanyr.hu | Admin123! | Teljes hozzáférés, minden művelet |
| Diák | diak@kanyr.hu | Student123! | Korlátozott hozzáférés, saját adatok |

## 📚 Dokumentáció

A részletes dokumentáció a `Dokumentumok/` mappában található:
- **[CHANGELOG.md](Dokumentumok/CHANGELOG.md)** - Változásnapló
- **[adatbazis_sema.md](Dokumentumok/adatbazis_sema.md)** - Adatbázis séma
- **[vegpont_sema.md](Dokumentumok/vegpont_sema.md)** - API végpont dokumentáció
- **[user_story.md](Dokumentumok/user_story.md)** - Felhasználói történetek
- **[funkciok.md](Dokumentumok/funkciok.md)** - Funkcionális követelmények
- **[kovetelmenyek.md](Dokumentumok/kovetelmenyek.md)** - Követelmények

## 🔧 Technológiák

### Backend
- **Node.js** + **Express.js** - Web framework
- **SQLite** + **Sequelize ORM** - Adatbázis kezelés
- **JWT** - Hitelesítés és engedélyezés
- **Express-validator** - Validáció
- **Helmet** - Biztonsági fejlécek
- **Jest** - Tesztelési keretrendszer

### Frontend
- **Vue.js 3** (Composition API) - UI framework
- **Vite** - Build rendszer és fejlesztői szerver
- **Pinia** - State management
- **Bootstrap 5** - UI komponensek és styling
- **Bootstrap Icons** - Ikonok
- **Axios** - HTTP kliens

### Biztonság
- **JWT token alapú hitelesítés**
- **Role-based access control (RBAC)**
- **Input sanitization** (NoSQL injection védelem)
- **CORS konfiguráció**
- **HTTP biztonsági fejlécek** (Helmet)
- **Központi hibakezelés**

## 📊 API Végpontok

### Auth végpontok (`/api/auth`)
| Módszer | Végpont | Leírás | Szerepkör |
|---------|---------|--------|-----------|
| POST | `/login` | Bejelentkezés | Nyilvános |
| POST | `/logout` | Kijelentkezés | Auth szükséges |
| GET | `/me` | Aktuális felhasználó | Auth szükséges |
| GET | `/check-admin` | Admin jog ellenőrzése | Auth szükséges |

### Diák végpontok (`/api/diaks`)
| Módszer | Végpont | Leírás | Szerepkör |
|---------|---------|--------|-----------|
| GET | `/` | Összes diák listázása | Admin |
| GET | `/active` | Aktív diákok | Admin |
| GET | `/search` | Diákok keresése | Admin |
| GET | `/statistics` | Statisztikák | Admin |
| GET | `/:id` | Diák lekérése | Admin, Diák (saját) |
| POST | `/` | Új diák létrehozása | Admin |
| PUT | `/:id` | Diák frissítése | Admin |
| DELETE | `/:id` | Diák törlése | Admin |
| POST | `/enroll` | Teljes beiratkozás | Admin |
| POST | `/:id/transfer` | Diák áthelyezése | Admin |
| POST | `/:id/move-out` | Kiköltöztetés | Admin |

### Szoba végpontok (`/api/szobas`)
| Módszer | Végpont | Leírás | Szerepkör |
|---------|---------|--------|-----------|
| GET | `/` | Összes szoba | Admin |
| GET | `/statistics` | Szoba statisztikák | Admin |
| GET | `/available` | Elérhető szobák | Admin |
| GET | `/:id` | Szoba lekérése | Admin |
| POST | `/` | Új szoba létrehozása | Admin |
| PUT | `/:id` | Szoba frissítése | Admin |
| DELETE | `/:id` | Szoba törlése | Admin |
| POST | `/bekoltozes` | Beköltözés | Admin |
| POST | `/bulk-bekoltozes` | Tömeges beköltözés | Admin |
| GET | `/bekoltozesek` | Beköltözések szűréssel | Admin |

### Szülő végpontok (`/api/szulos`)
| Módszer | Végpont | Leírás | Szerepkör |
|---------|---------|--------|-----------|
| GET | `/` | Összes szülő | Admin |
| GET | `/:id` | Szülő lekérése | Admin |
| POST | `/` | Új szülő | Admin |
| PUT | `/:id` | Szülő frissítése | Admin |
| DELETE | `/:id` | Szülő törlése | Admin |

### Lakcím végpontok (`/api/lakcims`)
| Módszer | Végpont | Leírás | Szerepkör |
|---------|---------|--------|-----------|
| GET | `/` | Összes lakcím | Admin |
| GET | `/:id` | Lakcím lekérése | Admin |
| POST | `/` | Új lakcím | Admin |
| PUT | `/:id` | Lakcím frissítése | Admin |
| DELETE | `/:id` | Lakcím törlése | Admin |

## 🎨 Frontend Komponenskönyvtár

### Alap komponensek
- **BaseButton** - 17 Bootstrap variáns, ikonok, loading state
- **BaseCard** - Kártya konténer, változó méretek, slotok
- **BaseModal** - Modal ablak, különböző méretek, kezelés
- **BaseTable** - Adattábla, rendezés, formázás, slotok

### Form komponensek
- **BaseInput** - Input mező, validáció, hiba megjelenítés
- **BaseSelect** - Lenyíló lista, opciók, validáció
- **BaseCheckbox** - Jelölőnégyzet, címke, validáció
- **BaseTextarea** - Többsoros szöveg, sorok, validáció

### Layout komponensek
- **PageHeader** - Oldal fejléc, kenyérmorzsa, akciók
- **PageContent** - Tartalom konténer, padding, styling
- **EmptyState** - Üres állapot, ikon, akció gomb
- **ErrorState** - Hiba állapot, újrapróbálás, ikon

### Overlays
- **LoadingOverlay** - Betöltés overlay, üzenet, opacity
- **ConfirmDialog** - Megerősítő ablak, variánsok, callback

### Composables
- **useLoading** - Betöltés state, wrapper függvények
- **useDebounce** - Debounce, cancel, flush
- **useSearch** - Keresés, debounce, eredmények
- **useConfirm** - Megerősítés, Promise API
- **useFormValidation** - Form validáció, szabályok, hibák
- **useTheme** - Téma kezelés, localStorage, perzisztencia
- **useInlineValidation** - Inline validáció, mezők, form
- **useDirtyForm** - Form változás, eredeti adatok
- **useRequestDeduplication** - Kérelmek deduplikáció
- **useSanitizer** - Bemeneti tisztítás, objektumok, tömbök

## 👥 Fejlesztők

Ganz Ábrahám Szakközép és Technikum - 13.B osztály

## 🤝 Közreműködés

### Fejlesztési folyamat
1. **Feature branch** - Mindig készíts új branchot feature-ekhez
2. **Commit üzenetek** - Használj világos, leíró commit üzeneteket
3. **Pull request** - PR készítése review előtt
4. **Code review** - Más fejlesztők átnézik a kódot
5. **Tesztelés** - Minden változtatás tesztelve
6. **Merge** - Master branch frissítése

### Kódminőség
- **Linting** - Eslint konfiguráció használata
- **Formázás** - Prettier vagy VS Code formázás
- **Tesztelés** - Unit és integration tesztek
- **Dokumentáció** - JSDoc kommentek, README frissítés

### Stílus irányelvek
- **ESLint** - Kódminőség ellenőrzés
- **Prettier** - Kód formázás
- **Git commit konvenciók** - Leíró commit üzenetek
- **Branch nevek** - `feature/leiras`, `fix/hiba-leiras`

---

**Verzió**: 2.0.0  
**Utolsó frissítés**: 2026.03.19  
**Licenc**: MIT
