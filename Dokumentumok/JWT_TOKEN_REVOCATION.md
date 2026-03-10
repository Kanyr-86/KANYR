# JWT Token Revokációs Rendszer

## Áttekintés

A KANYR rendszer JWT token revokációs rendszere lehetővé teszi a tokenek érvénytelenné tételét a lejárat előtt. Ez elengedhetetlen biztonsági funkció a következő esetekben:

- Jelszó megváltoztatásakor
- Felhasználói szerepkör módosításakor
- Gyanús tevékenység észlelésekor
- Adminisztrátori kényszerített kijelentkeztetéskor

## Architektúra

### 1. Token Verziózás

Minden felhasználóhoz tartozik egy `token_version` mező, amely automatikusan növekszik, amikor:
- Jelszót változtatnak
- Szerepkört módosítanak
- Admin kényszerített kijelentkeztetést hajt végre

A JWT token tartalmazza a token verziót, és a middleware ellenőrzi, hogy a token verzió megegyezik-e a felhasználó jelenlegi verziójával.

### 2. Token Feketelista

A visszavont tokenek adatbázisban tárolódnak (`revoked_tokens` tábla). Minden kérésnél ellenőrizzük, hogy a token szerepel-e a feketelistán.

### 3. Biztonsági Jelzők

A felhasználói rekordban `security_flags` JSON mező tárolja:
- `force_logout`: Kényszerített kijelentkeztetés flag
- `suspicious_activity`: Gyanús tevékenység jelző
- `suspicious_activity_count`: Gyanús tevékenységek száma

## Végpontok

### Token Revokáció Végpontok

| Végpont | Módszer | Leírás |
|---------|---------|--------|
| `/api/auth/logout` | POST | Aktuális token visszavonása |
| `/api/users/:id/password` | POST | Jelszó módosítás + tokenek érvénytelenné tétele |
| `/api/users/:id/reset-password` | POST | Jelszó visszaállítás + tokenek érvénytelenné tétele |
| `/api/users/:id/make-admin` | POST | Admin jog adás + tokenek érvénytelenné tétele |
| `/api/users/:id/remove-admin` | POST | Admin jog elvétel + tokenek érvénytelenné tétele |
| `/api/users/:id/force-logout` | POST | Felhasználó összes eszközéről történő kijelentkeztetés |

## Használat

### Jelszó Megváltoztatása

```javascript
// Backend API hívás
POST /api/users/123/password
{
  "newPassword": "UjJelszo123!",
  "revokeTokens": true  // Opcionális, alapértelmezett: true
}

// Válasz
{
  "success": true,
  "message": "Jelszó sikeresen frissítve. Kérjük, jelentkezzen be újra az összes eszközön.",
  "requireRelogin": true,
  "isSelfChange": true
}
```

### Admin Jogosultság Módosítása

```javascript
// Admin jog adása
POST /api/users/123/make-admin

// Válasz
{
  "success": true,
  "message": "Felhasználó sikeresen adminná változtatva. A felhasználónak újra be kell jelentkeznie.",
  "requireRelogin": true
}
```

### Kényszerített Kijelentkeztetés

```javascript
// Admin általi kényszerített kijelentkeztetés
POST /api/users/123/force-logout
{
  "reason": "suspicious_activity"
}
```

## Biztonsági Funkciók

### 1. Automatikus Token Érvénytelenné Tétel

A rendszer automatikusan érvényteleníti az összes meglévő tokent:
- Jelszó változtatáskor
- Jelszó visszaállításkor
- Szerepkör módosításkor
- Kényszerített kijelentkeztetéskor

### 2. Gyanús Tevékenység Észlelés

A `securityMiddleware` nyomon követi:
- Túl sok kérést rövid idő alatt
- Érzékeny műveleteket (jelszó változtatás, admin jog módosítás)
- IP cím változásokat

Ha egy felhasználó 5 gyanús tevékenységet produkál, automatikusan kijelentkeztetésre kerül minden eszközről.

### 3. Rate Limiting

A rendszer beépített rate limiting-gel rendelkezik:
- Bejelentkezés: 5 kérés / 15 perc
- Írási műveletek: 100 kérés / 15 perc
- Olvasási műveletek: 200 kérés / 15 perc

### 4. Token Takarítás

24 óránként automatikusan törlődnek a lejárt tokenek a feketelistáról.

## Frontend Kezelés

A frontend automatikusan kezeli a 401-es hibákat:

```javascript
// api.js interceptor
if (status === 401) {
  // Toast értesítés megjelenítése
  toastStore.showToast({
    type: 'warning',
    message: 'A munkamenet lejárt. Kérjük, jelentkezzen be újra.',
    duration: 5000
  })

  // Token és felhasználói adatok törlése
  localStorage.removeItem('token')
  localStorage.removeItem('user')

  // Átirányítás a bejelentkezési oldalra
  window.location.href = '/login'
}
```

## Adatbázis Sémák

### revoked_tokens tábla

```sql
CREATE TABLE revoked_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES felhasznalos(user_id)
);

CREATE INDEX idx_revoked_tokens_user_id ON revoked_tokens(user_id);
CREATE INDEX idx_revoked_tokens_expires_at ON revoked_tokens(expires_at);
```

### felhasznalos tábla bővítése

```sql
-- Token verzió és biztonsági jelzők
ALTER TABLE felhasznalos ADD COLUMN token_version INTEGER DEFAULT 1;
ALTER TABLE felhasznalos ADD COLUMN last_password_change DATETIME;
ALTER TABLE felhasznalos ADD COLUMN security_flags JSON;
```

## Tesztelés

### Token Revokáció Tesztelése

```bash
# 1. Bejelentkezés
POST /api/auth/login
{
  "email": "teszt@example.com",
  "password": "Jelszo123!"
}
# Válasz: token_1

# 2. Jelszó megváltoztatása
POST /api/users/1/password
Authorization: Bearer token_1
{
  "newPassword": "UjJelszo456!"
}

# 3. Régi token használata - 401-es hiba várható
GET /api/auth/me
Authorization: Bearer token_1

# 4. Újra bejelentkezés új jelszóval
POST /api/auth/login
{
  "email": "teszt@example.com",
  "password": "UjJelszo456!"
}
# Válasz: token_2 (új token verzióval)
```

## Konfiguráció

### Környezeti Változók

```env
# JWT beállítások
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Token takarítás intervalluma (órában)
TOKEN_CLEANUP_INTERVAL=24
```

## Hibaelhárítás

### Gyakori Problémák

1. **Token érvénytelen, de nem járt le**
   - Ellenőrizd a `token_version` mezőt a felhasználói rekordban
   - Nézd meg a `security_flags` mezőt kényszerített kijelentkeztetés esetén

2. **Feketelista nem működik**
   - Ellenőrizd a `revoked_tokens` tábla létrehozását
   - Ellenőrizd a TokenBlacklistService inicializálását

3. **Gyanús tevékenység nem jelződik**
   - Ellenőrizd a securityMiddleware betöltését az app.js-ben
   - Ellenőrizd a requestTracker statisztikákat

## Fejlesztői Megjegyzések

- A token verziózás hatékonyabb, mint az összes token egyesével történő visszavonása
- A feketelista memória- és tárolóhatékony megoldás a rövid távú token visszavonásra
- A biztonsági jelzők lehetővé teszik a részletes naplózást és auditálást
- A rendszer skálázható több szerver esetén is (megosztott adatbázis szükséges)
