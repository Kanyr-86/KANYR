# KANYR - Kollégiumi Adatbázis Nyilvántartó Rendszer

Ez a Ganz Ábrahám Szakközép és Technikum diákjainak a csoport projektje.

## 📋 Rendszer Leírás

A KANYR egy átfogó kollégiumi nyilvántartó rendszer, amely lehetővé teszi:
- Diákok kezelését és szobákba történő elhelyezését
- Szülők és lakcímek nyilvántartását
- Szobák foglaltságának követését
- Szobaváltási kérelmek kezelését
- Diák értesítési rendszer működtetését

## 🏗️ Rendszerarchitektúra

```
KANYR/
├── backend/           # Node.js + Express + SQLite backend
│   ├── controllers/   # API vezérlők
│   ├── services/      # Üzleti logika
│   ├── repositories/  # Adatbázis műveletek
│   ├── models/        # Sequelize modellek
│   ├── routes/        # API végpontok
│   └── middleware/    # Hitelesítés és validáció
├── frontend/          # Vue.js 3 + Vite frontend
│   └── src/
│       ├── views/     # Oldal komponensek
│       ├── components/# Újrafelhasználható komponensek
│       ├── services/  # API szolgáltatások
│       └── store/     # Pinia state management
└── Dokumentumok/      # Projekt dokumentáció
```

## 🚀 Gyors Indítás

### Opció 1: Docker (Ajánlott)

A legegyszerűbb mód a projekt futtatásának Docker használata.

#### Előfeltételek
- [Docker](https://www.docker.com/get-started) telepítve
- [Docker Compose](https://docs.docker.com/compose/install/) telepítve

#### Fejlesztői környezet indítása
```bash
# Konténerek indítása
docker-compose up -d

# Újraépítés szükségtése esetén
docker-compose up -d --build
```

A webalkalmazás elérhető: http://localhost

#### Produkciós környezet indítása
```bash
# Hozzon létre egy .env fájlt a gyökérkönyvtárban
JWT_SECRET=your-secure-secret-key
JWT_EXPIRES_IN=24h
ALLOWED_ORIGINS=https://yourdomain.com

# Indítás
docker-compose -f docker-compose.prod.yml up -d
```

#### Docker parancsok
| Parancs | Leírás |
|---------|--------|
| `docker-compose up -d` | Konténerek indítása háttérben |
| `docker-compose up -d --build` | Újraépítés és indítás |
| `docker-compose down` | Konténerek leállítása és törlése |
| `docker-compose down -v` | Konténerek és volumenek törlése |
| `docker-compose logs -f` | Naplók követése |
| `docker-compose ps` | Konténerek állapota |

#### Adatbázis megőrzése
Az SQLite adatbázis a `kanyr-sqlite-data` nevű Docker volumenben tárolódik, így a konténer újraindítása után is megmaradnak az adatok.

### Opció 2: Helyi fejlesztés

#### Backend indítása
```bash
cd backend
npm install
npm start
```

#### Frontend indítása
```bash
cd frontend
npm install
npm run dev
```

### Teszt fiókok
| Szerepkör | Email | Jelszó |
|-----------|-------|--------|
| Titkár | admin@kanyr.hu | admin123 |
| Diák | (teszt user token) | - |

## 📚 Dokumentáció

A részletes dokumentáció a `Dokumentumok/` mappában található:
- **[CHANGELOG.md](Dokumentumok/CHANGELOG.md)** - Változásnapló
- **[adatbazis_sema.md](Dokumentumok/adatbazis_sema.md)** - Adatbázis séma
- **[vegpont_sema.md](Dokumentumok/vegpont_sema.md)** - API végpont dokumentáció
- **[user_story.md](Dokumentumok/user_story.md)** - Felhasználói történetek

## 🔧 Technológiák

### Backend
- Node.js + Express.js
- SQLite + Sequelize ORM
- JWT hitelesítés
- Express-validator

### Frontend
- Vue.js 3 (Composition API)
- Vite
- Pinia (state management)
- Bootstrap 5

## 📊 API Végpontok

| Modul | Végpont | Leírás |
|-------|---------|--------|
| Auth | `/api/auth` | Bejelentkezés, kijelentkezés |
| Diák | `/api/diaks` | Diák CRUD, beiratkozás |
| Szoba | `/api/szobas` | Szoba kezelés, beköltözés |
| Szülő | `/api/szulos` | Szülő CRUD |
| Lakcím | `/api/lakcims` | Lakcím CRUD |

## 👥 Fejlesztők

Ganz Ábrahám Szakközép és Technikum - 13.B osztály

---

**Verzió**: 1.11  
**Utolsó frissítés**: 2026.02.19