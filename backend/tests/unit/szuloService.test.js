/**
 * SzuloService egységtesztek
 * Teszteli a szülő CRUD műveleteit
 */

const SzuloService = require('../../services/SzuloService');
const SzuloRepository = require('../../repositories/SzuloRepository');
const { testSzulok, testLakcimok, cloneTestData, generateUniqueEmail } = require('../fixtures/testData');

// Mock a repository
jest.mock('../../repositories/SzuloRepository');

describe('SzuloService egységtesztek', () => {
  let szuloService;
  let mockDb;
  let mockRepository;

  beforeEach(() => {
    // Mock adatbázis
    mockDb = {
      Szulo: {},
      Diak: {},
      Lakcim: {}
    };

    // Repository mock törlése
    SzuloRepository.mockClear();

    // Mock repository instance
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };

    SzuloRepository.mockImplementation(() => mockRepository);

    // Service inicializálása
    szuloService = new SzuloService(mockDb);
  });

  describe('getAllSzulos', () => {
    test('visszaadja az összes szülőt', async () => {
      // Arrange
      const expectedSzulok = [
        { szulo_id: 1, nev: 'Teszt Szülő 1', email: 'szulo1@test.hu' },
        { szulo_id: 2, nev: 'Teszt Szülő 2', email: 'szulo2@test.hu' }
      ];
      mockRepository.findAll.mockResolvedValue(expectedSzulok);

      // Act
      const result = await szuloService.getAllSzulos();

      // Assert
      expect(mockRepository.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(expectedSzulok);
      expect(result).toHaveLength(2);
    });

    test('visszaadja a szülőket szűrési opciókkal', async () => {
      // Arrange
      const options = { limit: 10, offset: 0, sort: 'nev', order: 'ASC' };
      const expectedSzulok = [{ szulo_id: 1, nev: 'Teszt Szülő' }];
      mockRepository.findAll.mockResolvedValue(expectedSzulok);

      // Act
      const result = await szuloService.getAllSzulos(options);

      // Assert
      expect(mockRepository.findAll).toHaveBeenCalledWith(options);
      expect(result).toEqual(expectedSzulok);
    });

    test('üres listát ad vissza ha nincs szülő', async () => {
      // Arrange
      mockRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await szuloService.getAllSzulos();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getSzuloById', () => {
    test('visszaadja a szülőt ID alapján', async () => {
      // Arrange
      const expectedSzulo = {
        szulo_id: 1,
        nev: 'Teszt Szülő',
        email: 'szulo@test.hu',
        telefonszam: '+36301234567'
      };
      mockRepository.findById.mockResolvedValue(expectedSzulo);

      // Act
      const result = await szuloService.getSzuloById(1);

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith(1, true);
      expect(result).toEqual(expectedSzulo);
    });

    test('null-t ad vissza ha nem található a szülő', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act
      const result = await szuloService.getSzuloById(999);

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith(999, true);
      expect(result).toBeNull();
    });

    test('kapcsolatok nélkül adja vissza a szülőt', async () => {
      // Arrange
      const expectedSzulo = { szulo_id: 1, nev: 'Teszt Szülő' };
      mockRepository.findById.mockResolvedValue(expectedSzulo);

      // Act
      const result = await szuloService.getSzuloById(1, false);

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith(1, false);
      expect(result).toEqual(expectedSzulo);
    });
  });

  describe('createSzulo', () => {
    test('létrehoz egy új szülőt', async () => {
      // Arrange
      const newSzuloData = {
        nev: 'Új Szülő',
        email: 'uj@test.hu',
        telefonszam: '+36301111111',
        szemelyi_igazolvany_szam: 'NEW123456',
        cim_id: 1
      };
      const createdSzulo = { szulo_id: 1, ...newSzuloData };
      mockRepository.create.mockResolvedValue(createdSzulo);

      // Act
      const result = await szuloService.createSzulo(newSzuloData);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith(newSzuloData);
      expect(result).toEqual(createdSzulo);
    });

    test('hibát dob érvénytelen adatok esetén', async () => {
      // Arrange
      const invalidData = {
        nev: '',
        email: 'nem-email',
        telefonszam: '',
        szemelyi_igazolvany_szam: ''
      };
      mockRepository.create.mockRejectedValue(new Error('Validációs hiba'));

      // Act & Assert
      await expect(szuloService.createSzulo(invalidData)).rejects.toThrow('Validációs hiba');
    });

    test('hibát dob ha az email már foglalt', async () => {
      // Arrange
      const szuloData = {
        nev: 'Teszt Szülő',
        email: 'letezo@test.hu',
        telefonszam: '+36301234567',
        szemelyi_igazolvany_szam: 'TEST123'
      };
      mockRepository.create.mockRejectedValue(new Error('Ez az email cím már regisztrálva van!'));

      // Act & Assert
      await expect(szuloService.createSzulo(szuloData)).rejects.toThrow('Ez az email cím már regisztrálva van!');
    });
  });

  describe('updateSzulo', () => {
    test('frissíti a szülő adatait', async () => {
      // Arrange
      const updates = { nev: 'Frissített Név', telefonszam: '+36309999999' };
      const updatedSzulo = {
        szulo_id: 1,
        nev: 'Frissített Név',
        email: 'szulo@test.hu',
        telefonszam: '+36309999999'
      };
      mockRepository.update.mockResolvedValue(updatedSzulo);

      // Act
      const result = await szuloService.updateSzulo(1, updates);

      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith(1, updates);
      expect(result).toEqual(updatedSzulo);
    });

    test('hibát dob ha a szülő nem található', async () => {
      // Arrange
      mockRepository.update.mockRejectedValue(new Error('A szülő nem található!'));

      // Act & Assert
      await expect(szuloService.updateSzulo(999, { nev: 'Teszt' })).rejects.toThrow('A szülő nem található!');
    });

    test('hibát dob ha az új email már foglalt', async () => {
      // Arrange
      const updates = { email: 'foglalt@test.hu' };
      mockRepository.update.mockRejectedValue(new Error('Ez az email cím már regisztrálva van!'));

      // Act & Assert
      await expect(szuloService.updateSzulo(1, updates)).rejects.toThrow('Ez az email cím már regisztrálva van!');
    });
  });

  describe('deleteSzulo', () => {
    test('törli a szülőt', async () => {
      // Arrange
      mockRepository.delete.mockResolvedValue(true);

      // Act
      const result = await szuloService.deleteSzulo(1);

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    test('hibát dob ha a szülő nem található', async () => {
      // Arrange
      mockRepository.delete.mockRejectedValue(new Error('A szülő nem található!'));

      // Act & Assert
      await expect(szuloService.deleteSzulo(999)).rejects.toThrow('A szülő nem található!');
    });

    test('hibát dob ha a szülőnek vannak diákjai', async () => {
      // Arrange
      mockRepository.delete.mockRejectedValue(new Error('A szülő nem törölhető, mert kapcsolódó diákjai vannak!'));

      // Act & Assert
      await expect(szuloService.deleteSzulo(1)).rejects.toThrow('A szülő nem törölhető, mert kapcsolódó diákjai vannak!');
    });
  });

  describe('hibakezelés', () => {
    test('adatbázis hiba kezelése getAllSzulos esetén', async () => {
      // Arrange
      mockRepository.findAll.mockRejectedValue(new Error('Adatbázis kapcsolat megszakadt'));

      // Act & Assert
      await expect(szuloService.getAllSzulos()).rejects.toThrow('Adatbázis kapcsolat megszakadt');
    });

    test('adatbázis hiba kezelése getSzuloById esetén', async () => {
      // Arrange
      mockRepository.findById.mockRejectedValue(new Error('Adatbázis hiba'));

      // Act & Assert
      await expect(szuloService.getSzuloById(1)).rejects.toThrow('Adatbázis hiba');
    });
  });
});