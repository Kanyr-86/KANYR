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

### Teszt fiókok
| Szerepkör | Email | Jelszó |
|-----------|-------|--------|
| Titkár (Admin) | admin@kanyr.hu | admin123 |
| Diak | diaknév@kanyr.hu | user1234 |

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
**Utolsó frissítés**: 2026.02.23
