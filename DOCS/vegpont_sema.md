# Végpont séma

Ez a dokumentáció a projekt REST API végpontjait írja le: meglévő route-okra támaszkodva ajánlott és javasolt végpontok, paraméterek, request/response sémák és konkrét példák (pl. szobák szint szerint, lakcímek A–D szűrése).

Alap URL: `/api`

Általános query-param-ok (számos route támogatja):
- `limit` (int) – lapozásnál visszaadott elem szám (pl. 10)
- `offset` (int) – lapozás eltolás (pl. 0)
- `sort` (string) – rendező mező (pl. `nev`)
- `order` (string) – `ASC` vagy `DESC`
- `includeRelations` (boolean) – kapcsolódó entitások beolvasása

---

**Erőforrások és javasolt végpontok**

- **Diákok** (`/api/diak`)
  - GET `/api/diak` – lista (támogatja: `limit`, `offset`, `sort`, `order`, `includeRelations`)
  - GET `/api/diak/active` – aktív diákok
  - GET `/api/diak/search?nev=...&email=...` – keresés név/email/kapcsolattípus szerint
  - GET `/api/diak/:id` – részletek diák ID alapján
  - GET `/api/diak/:id/report` – diák riport (PDF/JSON)
  - GET `/api/diak/:id/room` – a diákhoz tartozó szoba adatai
  - POST `/api/diak` – új diák létrehozása
  - POST `/api/diak/enroll` – egyszerre diák + szülő + lakcím + beköltözés (body: `diakData`, `szuloData`, `lakcimData`, `szoba_id`, `bekoltozes_datum`)
  - POST `/api/diak/bulk-enroll` – tömeges felvétel (tömb)
  - PUT `/api/diak/:id` – diák frissítése
  - DELETE `/api/diak/:id` – diák törlése
  - POST `/api/diak/:id/transfer` – szobaátköltöztetés (body: `uj_szoba_id`, `atcsatolas_datum`)
  - POST `/api/diak/:id/move-out` – kiköltözés (body: `kikoltozes_datum`)

- **Lakcímek** (`/api/lakcim`)
  - GET `/api/lakcim` – lista (támogatja: `limit`, `offset`, `sort`, `order`, `includeRelations`)
  - GET `/api/lakcim/:id` – lakcím részletei
  - GET `/api/lakcim/city/:varos` – város szerinti lekérdezés
  - POST `/api/lakcim` – új lakcím
  - PUT `/api/lakcim/:id` – lakcím frissítése
  - DELETE `/api/lakcim/:id` – lakcím törlése

  - Szűrés A–D (javasolt végpontok / query-paramok):
    - GET `/api/lakcim/range?from=A&to=D` – visszaadja az `utca_hazszam` mező kezdőbetűje alapján az A–D közötti találatokat.
    - Alternatív: GET `/api/lakcim?letterFrom=A&letterTo=D` vagy `/api/lakcim?letters=A,B,C,D`

  - Példa lekérés (A–D):
    - Kérés: `GET /api/lakcim/range?from=A&to=D&limit=50`
    - Válasz (200):
      ```json
      [
        { "cim_id": 12, "orszag": "Magyarország", "iranyitoszam": "1011", "varos": "Budapest", "utca_hazszam": "A utca 12" },
        { "cim_id": 13, "utca_hazszam": "B utca 5" }
      ]
      ```

- **Szülők** (`/api/szulo`)
  - GET `/api/szulo` – lista (lapozás)
  - GET `/api/szulo/:id` – részletek
  - POST `/api/szulo` – létrehozás
  - PUT `/api/szulo/:id` – frissítés
  - DELETE `/api/szulo/:id` – törlés

- **Szobák** (`/api/szoba`) – javasolt végpontok (a modell jelenleg `szoba_szama` és `osszes_hely` mezőket tartalmaz):
  - GET `/api/szoba` – lista (lapozás, rendezés)
  - GET `/api/szoba/:id` – szoba részletei
  - POST `/api/szoba` – új szoba létrehozása
  - PUT `/api/szoba/:id` – frissítés
  - DELETE `/api/szoba/:id` – törlés
  - POST `/api/szoba/bekoltozes` – új beköltözés létrehozása (body: `diak_id`, `szoba_id`, `bekoltozes_datum`)
  - GET `/api/szoba/:id/occupants` – szobában tartózkodó diákok listázása
  - GET `/api/szoba/statistics` – szoba statisztikák lekérdezése

  - Szobák szint/szint-tartomány szerint (példa):
    - Ha a `szoba_szama` struktúrája tartalmazza a szintet (pl. "A101", vagy a prefix jelzi az épületszárnyat), két opció:
      - GET `/api/szoba?level=1` – adott szint összes szobája
      - GET `/api/szoba?prefix=A` – prefix alapú szűrés (pl. épületszárny A)

  - Példa: GET `/api/szoba?prefix=A&limit=100`
    - Válasz (200):
      ```json
      [ { "szoba_id": 1, "szoba_szama": "A101", "osszes_hely": 2 }, { "szoba_id": 2, "szoba_szama": "A102", "osszes_hely": 2 } ]
      ```

- **SzobaBekoltozes** (`/api/szobabekoltozes`) – javasolt végpontok a beköltözések/kiöltözések kezelésére:
  - GET `/api/szobabekoltozes` – lista beköltözésekről
  - POST `/api/szobabekoltozes` – új beköltözés (body: `diak_id`, `szoba_id`, `bekoltozes_datum`)
  - PUT `/api/szobabekoltozes/:id` – frissítés (pl. kijelölés, dátum)
  - DELETE `/api/szobabekoltozes/:id` – törlés / visszavonás

---

**Request/response példák**

- Lekérdezés: szobák egy épületszárny (A) szerint

  Kérés:

  GET /api/szoba?prefix=A

  Válasz (200):

  ```json
  [
    { "szoba_id": 1, "szoba_szama": "A101", "osszes_hely": 2, "aktualis_foglalt": 1 },
    { "szoba_id": 2, "szoba_szama": "A102", "osszes_hely": 2, "aktualis_foglalt": 2 }
  ]
  ```

- Lekérdezés: lakcímek A–D (utca kezdőbetű szerint)

  Kérés:

  GET /api/lakcim/range?from=A&to=D

  Válasz (200): (rövidített példa)

  ```json
  [
    { "cim_id": 101, "varos": "Budapest", "utca_hazszam": "A kerület utca 5" },
    { "cim_id": 102, "varos": "Budapest", "utca_hazszam": "B tér 2" }
  ]
  ```

---

**Megjegyzések és megvalósítási javaslatok**
- A meglévő `routes/` fájlok (`routes/DiakRoutes.js`, `routes/LakcimRoutes.js`, `routes/SzuloRoutes.js`) nagy részét lefedi a fenti CRUD és keresési műveleteknek. Lásd a részleteket a kódban a pontos validációkért.
- A `Szoba` modell jelenleg nem feltétlenül tartalmaz explicit `level` mezőt; javasolt egy opcionális `szint` vagy `epulet_szarny` mező hozzáadása, ha szükséges a könnyebb szűréshez. Alternatív megoldás: a `szoba_szama` előtagjából levezetett szint/prefix alapú keresés.
- A `lakcim` A–D típusú szűrés megvalósítható a `utca_hazszam` mező kezdőbetűjének vizsgálatával, vagy külön mező használatával (pl. `epulet_blokk: 'A'`).

---

Ha szeretnéd, be is illesztem a javasolt új route-okat (`/api/szoba`, `/api/szobabekoltozes`, `/api/lakcim/range`) a `routes/` mappába és készítek hozzá rövid controller-sémát és példateszteket.

---

**Részletes végpont séma**

Minden végpontnál megadott: HTTP metódus, útvonal, fontos query/body paraméterek, példa request body és példa válasz (sikeres eset). A validációk a route-okban megtalálhatók.

- Diákok
  - GET `/api/diak`
    - Query: `limit`, `offset`, `sort`, `order`, `includeRelations`
    - Response 200: Array of `Diak` summary objects
      ```json
      [ { "diak_id": 1, "nev": "Kiss János", "email": "kiss@example.com", "aktiv": true } ]
      ```

  - GET `/api/diak/:id`
    - Response 200: full `Diak` object with related `Szulo`, `Lakcim`, `Szoba` (ha `includeRelations=true`)
      ```json
      { "diak_id": 1, "nev": "Kiss János", "email": "kiss@example.com", "szulo": { "nev": "Kiss István" }, "lakcim": { "varos": "Budapest" }, "szoba": { "szoba_szama": "A101" } }
      ```

  - POST `/api/diak/enroll`
    - Body (JSON):
      ```json
      {
        "diakData": { "nev":"...","email":"...","telefonszam":"...", "szuletesi_datum":"YYYY-MM-DD", "szemelyi_igazolvany_szam":"...", "taj_szam":"...", "diakigazolvany_szam":"...", "kapcsolat_tipusa":"anya" },
        "szuloData": { "nev":"...","email":"...","telefonszam":"...","szemelyi_igazolvany_szam":"..." },
        "lakcimData": { "orszag":"...","iranyitoszam":"...","varos":"...","utca_hazszam":"..." },
        "szoba_id": 5,
        "bekoltozes_datum": "YYYY-MM-DD"
      }
      ```
    - Response 201: created `Diak` object (plus created `Szulo`/`Lakcim` as kapcsolatok)

  - POST `/api/diak/:id/transfer`
    - Body: `{ "uj_szoba_id": 7, "atcsatolas_datum": "YYYY-MM-DD" }`
    - Response 200: updated transfer record / diák új szoba adat

- Lakcímek
  - GET `/api/lakcim`
    - Query: `limit`, `offset`, `sort`, `order`, `includeRelations`
    - Response 200: list of lakcim objects

  - GET `/api/lakcim/range?from=A&to=D`
    - Description: visszaadja az `utca_hazszam` kezdőbetűje alapján az A–D közötti találatokat.
    - Impl. javaslat: SQL `WHERE SUBSTR(utca_hazszam,1,1) BETWEEN 'A' AND 'D'` vagy karakterenkénti IN-lista.
    - Response 200 sample:
      ```json
      [ { "cim_id": 12, "utca_hazszam": "A utca 12", "varos": "Bp" } ]
      ```

  - POST `/api/lakcim`
    - Body: `{ "orszag":"...","iranyitoszam":"...","varos":"...","utca_hazszam":"..." }`
    - Response 201: created lakcim

- Szülők
  - POST `/api/szulo`
    - Body: `{ "nev":"...","email":"...","telefonszam":"...","szemelyi_igazolvany_szam":"...","cim_id": 12 }`
    - Response 201: created szulo

- Szobák
  - GET `/api/szoba`
    - Query: `limit`, `offset`, `sort`, `order`, `prefix`, `level`
    - `prefix` javaslat: épületszárny (pl. `A`) — a szerveren a `szoba_szama`-ból vagy külön mezőből szűrve.
    - Response 200 sample:
      ```json
      [ { "szoba_id": 1, "szoba_szama": "A101", "osszes_hely": 2, "aktualis_foglalt": 1 } ]
      ```

  - GET `/api/szoba?level=1` (vagy `levelFrom`, `levelTo`)
    - Javaslat: ha nincs `level` mező, levezetés regex-szel a `szoba_szama`-ból (pl. A101 -> level 1)

  - POST `/api/szoba`
    - Body: `{ "szoba_szama":"A101","osszes_hely":2 }`
    - Response 201: created szoba

- SzobaBekoltozes
  - POST `/api/szobabekoltozes` (MEGVALÓSÍTVA: `/api/szobas/bekoltozes`)
    - Body: `{ "diak_id":1, "szoba_id":2, "bekoltozes_datum":"YYYY-MM-DD" }`
    - Response 201: created bekoltozes record
    - Validációk: diák és szoba létezés, szoba elérhetőség, duplikáció ellenőrzés

  - GET `/api/szoba/:id/occupants` (MEGVALÓSÍTVA)
    - Leírja a szobában tartózkodó diákokat és státuszukat
    - Response 200 sample:
      ```json
      [ { "diak_id": 1, "nev": "Kiss János", "bekoltozes_datum": "2025-09-01" } ]
      ```

  - POST `/api/szobas/bekoltozes` (ÚJ VÉGPONT - MEGVALÓSÍTVA)
    - Body (JSON):
      ```json
      {
        "diak_id": 1,
        "szoba_id": 1,
        "bekoltozes_datum": "2024-09-01"
      }
      ```
    - Response 201 (sikeres eset):
      ```json
      {
        "success": true,
        "message": "Beköltözés sikeresen létrehozva",
        "data": {
          "bekoltozes_id": 1,
          "diak_id": 1,
          "szoba_id": 1,
          "bekoltozes_datum": "2024-09-01",
          "kikoltozes_datum": null
        }
      }
      ```
    - Response 400 (validációs hiba):
      ```json
      {
        "success": false,
        "errors": [
          {
            "msg": "A diák ID pozitív egész számnak kell lennie",
            "param": "diak_id",
            "location": "body"
          }
        ]
      }
      ```
    - Response 400 (üzleti logika hiba):
      ```json
      {
        "success": false,
        "message": "A szoba tele van! Maximális férőhely: 2"
      }
      ```

**Válasz státuszok és hibakezelés (összefoglaló)**
- 200 OK – sikeres lekérdezés
- 201 Created – erőforrás létrehozva
- 400 Bad Request – validációs hiba (részletes hibaüzenetek a body-ban)
- 404 Not Found – nem található erőforrás
- 500 Internal Server Error – váratlan hiba (logolás szükséges)

**Megvalósítási megjegyzések**
- A `Szoba` modellhez érdemes opcionális `level` vagy `prefix` mezőt hozzáadni a hatékonyabb szűréshez.
- A `lakcim` A–D szűrésnél jobb adatminőség esetén külön mező (`epulet_blokk`) használata javasolt; gyors alternatíva: a `utca_hazszam` első karakterének vizsgálata.
- Minden POST/PUT végponton validálni kell a kötelező mezőket (a route-okban express-validator már használva van).
