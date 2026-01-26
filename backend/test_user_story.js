const express = require('express');
const request = require('supertest');
const app = require('./app');

describe('User Story: Kollégiumi Titkár Diák Kezelése', () => {
  let server;
  let token;

  beforeAll(async () => {
    // Start server for testing
    server = app.listen(0); // Use random port
    
    // Create test admin user and get token (this would need to be implemented)
    // For now, we'll assume we have a way to authenticate
  });

  afterAll(async () => {
    await server.close();
  });

  describe('Diák keresése', () => {
    test('GET /api/diaks/search - diák keresése név alapján', async () => {
      const response = await request(app)
        .get('/api/diaks/search')
        .query({ nev: 'Teszt Diák' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/diaks/search - diák keresése email alapján', async () => {
      const response = await request(app)
        .get('/api/diaks/search')
        .query({ email: 'diak@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Diák szobájának lekérdezése', () => {
    test('GET /api/diaks/:id/room - diák aktuális szobájának lekérdezése', async () => {
      const response = await request(app)
        .get('/api/diaks/1/room')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('diak');
      expect(response.body.data).toHaveProperty('szoba');
      expect(response.body.data).toHaveProperty('bekoltozes_datum');
    });

    test('GET /api/diaks/:id/room - diák nincs aktív szobában', async () => {
      const response = await request(app)
        .get('/api/diaks/999/room')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('nincs aktív szobája');
    });
  });

  describe('Elérhető szobák listázása', () => {
    test('GET /api/szoba/available - elérhető szobák listázása', async () => {
      const response = await request(app)
        .get('/api/szoba/available')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Ellenőrizzük, hogy minden szobának van-e szabad_helyek tulajdonsága
      response.body.data.forEach(szoba => {
        expect(szoba).toHaveProperty('szabad_helyek');
        expect(szoba.szabad_helyek).toBeGreaterThan(0);
      });
    });

    test('GET /api/szoba/available - szűrés prefix alapján', async () => {
      const response = await request(app)
        .get('/api/szoba/available')
        .query({ prefix: 'A' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Ellenőrizzük, hogy minden szoba száma A-val kezdődik
      response.body.data.forEach(szoba => {
        expect(szoba.szoba_szama).toMatch(/^A/);
      });
    });
  });

  describe('Diák áthelyezése', () => {
    test('POST /api/diaks/:id/transfer - diák áthelyezése másik szobába', async () => {
      const transferData = {
        uj_szoba_id: 2,
        atcsatolas_datum: '2024-01-15'
      };

      const response = await request(app)
        .post('/api/diaks/1/transfer')
        .send(transferData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('message', 'Diák sikeresen átcsatolva');
    });

    test('POST /api/diaks/:id/transfer - szoba tele van', async () => {
      const transferData = {
        uj_szoba_id: 999, // Nem létező vagy tele szoba
        atcsatolas_datum: '2024-01-15'
      };

      const response = await request(app)
        .post('/api/diaks/1/transfer')
        .send(transferData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('teljes');
    });

    test('POST /api/diaks/:id/transfer - diák nem található', async () => {
      const transferData = {
        uj_szoba_id: 2,
        atcsatolas_datum: '2024-01-15'
      };

      const response = await request(app)
        .post('/api/diaks/999/transfer')
        .send(transferData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('nem található');
    });
  });

  describe('Hibakezelés', () => {
    test('GET /api/diaks/search - érvénytelen paraméterek', async () => {
      const response = await request(app)
        .get('/api/diaks/search')
        .query({ aktiv: 'nem_boolean' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('GET /api/diaks/:id/room - érvénytelen ID', async () => {
      const response = await request(app)
        .get('/api/diaks/abc/room')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Érvénytelen diák ID');
    });

    test('POST /api/diaks/:id/transfer - érvénytelen ID-k', async () => {
      const transferData = {
        uj_szoba_id: 'abc',
        atcsatolas_datum: '2024-01-15'
      };

      const response = await request(app)
        .post('/api/diaks/abc/transfer')
        .send(transferData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Érvénytelen ID paraméterek');
    });
  });
});

console.log('User Story tesztek elkészültek!');
console.log('A tesztek a következő funkciókat ellenőrzik:');
console.log('1. Diák keresése név és email alapján');
console.log('2. Diák aktuális szobájának lekérdezése');
console.log('3. Elérhető szobák listázása');
console.log('4. Diák áthelyezése másik szobába');
console.log('5. Hibakezelés érvénytelen bemenetekre');
