/**
 * LakcimService egységtesztek
 * Teszteli a lakcím CRUD műveleteit
 */

const LakcimService = require('../../services/LakcimService');
const LakcimRepository = require('../../repositories/LakcimRepository');
const { testLakcimok, cloneTestData } = require('../fixtures/testData');

// Mock a repository
jest.mock('../../repositories/LakcimRepository');

describe('LakcimService egységtesztek', () => {
  let lakcimService;
  let mockDb;
  let mockRepository;

  beforeEach(() => {
    // Mock adatbázis
    mockDb = {
      Lakcim: {},
      Diak: {},
      Szulo: {},
      sequelize: {
        Sequelize: {
          Op: {
            like: Symbol('like')
          }
        }
      }
    };

    // Repository mock törlése
    LakcimRepository.mockClear();

    // Mock repository instance
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByAddress: jest.fn(),
      findByCity: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };

    LakcimRepository.mockImplementation(() => mockRepository);

    // Service inicializálása
    lakcimService = new LakcimService(mockDb);
  });

  describe('getAllLakcims', () => {
    test('visszaadja az összes lakcímet', async () => {
      // Arrange
      const expectedLakcimek = [
        { cim_id: 1, varos: 'Budapest', utca_hazszam: 'Teszt utca 1.' },
        { cim_id: 2, varos: 'Debrecen', utca_hazszam: 'Minta út 42.' }
      ];
      mockRepository.findAll.mockResolvedValue(expectedLakcimek);

      // Act
      const result = await lakcimService.getAllLakcims();

      // Assert
      expect(mockRepository.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(expectedLakcimek);
      expect(result).toHaveLength(2);
    });

    test('visszaadja a lakcímeket szűrési opciókkal', async () => {
      // Arrange
      const options = { limit: 10, offset: 5, sort: 'varos', order: 'DESC' };
      const expectedLakcimek = [{ cim_id: 1, varos: 'Budapest' }];
      mockRepository.findAll.mockResolvedValue(expectedLakcimek);

      // Act
      const result = await lakcimService.getAllLakcims(options);

      // Assert
      expect(mockRepository.findAll).toHaveBeenCalledWith(options);
      expect(result).toEqual(expectedLakcimek);
    });

    test('üres listát ad vissza ha nincs lakcím', async () => {
      // Arrange
      mockRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await lakcimService.getAllLakcims();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getLakcimById', () => {
    test('visszaadja a lakcímet ID alapján', async () => {
      // Arrange
      const expectedLakcim = {
        cim_id: 1,
        orszag: 'Magyarország',
        iranyitoszam: '1234',
        varos: 'Budapest',
        utca_hazszam: 'Teszt utca 1.'
      };
      mockRepository.findById.mockResolvedValue(expectedLakcim);

      // Act
      const result = await lakcimService.getLakcimById(1);

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith(1, true);
      expect(result).toEqual(expectedLakcim);
    });

    test('null-t ad vissza ha nem található a lakcím', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act
      const result = await lakcimService.getLakcimById(999);

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith(999, true);
      expect(result).toBeNull();
    });

    test('kapcsolatok nélkül adja vissza a lakcímet', async () => {
      // Arrange
      const expectedLakcim = { cim_id: 1, varos: 'Budapest' };
      mockRepository.findById.mockResolvedValue(expectedLakcim);

      // Act
      const result = await lakcimService.getLakcimById(1, false);

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith(1, false);
      expect(result).toEqual(expectedLakcim);
    });
  });

  describe('createLakcim', () => {
    test('létrehoz egy új lakcímet', async () => {
      // Arrange
      const newLakcimData = {
        orszag: 'Magyarország',
        iranyitoszam: '9999',
        varos: 'Újváros',
        utca_hazszam: 'Új utca 1.'
      };
      const createdLakcim = { cim_id: 1, ...newLakcimData };
      mockRepository.create.mockResolvedValue(createdLakcim);

      // Act
      const result = await lakcimService.createLakcim(newLakcimData);

      // Assert
      expect(mockRepository.create).toHaveBeenCalledWith(newLakcimData);
      expect(result).toEqual(createdLakcim);
    });

    test('hibát dob hiányzó mezők esetén', async () => {
      // Arrange
      const invalidData = {
        orszag: '',
        iranyitoszam: '',
        varos: '',
        utca_hazszam: ''
      };
      mockRepository.create.mockRejectedValue(new Error('Hiányzó kötelező mezők'));

      // Act & Assert
      await expect(lakcimService.createLakcim(invalidData)).rejects.toThrow('Hiányzó kötelező mezők');
    });
  });

  describe('updateLakcim', () => {
    test('frissíti a lakcím adatait', async () => {
      // Arrange
      const updates = { varos: 'Frissített Város', utca_hazszam: 'Új utca 2.' };
      const updatedLakcim = {
        cim_id: 1,
        orszag: 'Magyarország',
        iranyitoszam: '1234',
        varos: 'Frissített Város',
        utca_hazszam: 'Új utca 2.'
      };
      mockRepository.update.mockResolvedValue(updatedLakcim);

      // Act
      const result = await lakcimService.updateLakcim(1, updates);

      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith(1, updates);
      expect(result).toEqual(updatedLakcim);
    });

    test('hibát dob ha a lakcím nem található', async () => {
      // Arrange
      mockRepository.update.mockRejectedValue(new Error('A lakcím nem található!'));

      // Act & Assert
      await expect(lakcimService.updateLakcim(999, { varos: 'Teszt' })).rejects.toThrow('A lakcím nem található!');
    });
  });

  describe('deleteLakcim', () => {
    test('törli a lakcímet', async () => {
      // Arrange
      mockRepository.delete.mockResolvedValue(true);

      // Act
      const result = await lakcimService.deleteLakcim(1);

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    test('hibát dob ha a lakcím nem található', async () => {
      // Arrange
      mockRepository.delete.mockRejectedValue(new Error('A lakcím nem található!'));

      // Act & Assert
      await expect(lakcimService.deleteLakcim(999)).rejects.toThrow('A lakcím nem található!');
    });

    test('hibát dob ha a lakcímhez diákok tartoznak', async () => {
      // Arrange
      mockRepository.delete.mockRejectedValue(new Error('A lakcím nem törölhető, mert kapcsolódó diákjai vagy szülei vannak!'));

      // Act & Assert
      await expect(lakcimService.deleteLakcim(1)).rejects.toThrow('A lakcím nem törölhető, mert kapcsolódó diákjai vagy szülei vannak!');
    });
  });

  describe('getLakcimsByCity', () => {
    test('visszaadja a lakcímeket város alapján', async () => {
      // Arrange
      const expectedLakcimek = [
        { cim_id: 1, varos: 'Budapest', utca_hazszam: 'Teszt utca 1.' },
        { cim_id: 2, varos: 'Budapest', utca_hazszam: 'Minta út 2.' }
      ];
      mockRepository.findByCity.mockResolvedValue(expectedLakcimek);

      // Act
      const result = await lakcimService.getLakcimsByCity('Budapest');

      // Assert
      expect(mockRepository.findByCity).toHaveBeenCalledWith('Budapest');
      expect(result).toEqual(expectedLakcimek);
      expect(result).toHaveLength(2);
    });

    test('üres listát ad vissza ha nincs találat', async () => {
      // Arrange
      mockRepository.findByCity.mockResolvedValue([]);

      // Act
      const result = await lakcimService.getLakcimsByCity('Nemlétező város');

      // Assert
      expect(mockRepository.findByCity).toHaveBeenCalledWith('Nemlétező város');
      expect(result).toEqual([]);
    });

    test('részleges egyezéssel is keres', async () => {
      // Arrange
      const expectedLakcimek = [{ cim_id: 1, varos: 'Budapest' }];
      mockRepository.findByCity.mockResolvedValue(expectedLakcimek);

      // Act
      const result = await lakcimService.getLakcimsByCity('Bud');

      // Assert
      expect(mockRepository.findByCity).toHaveBeenCalledWith('Bud');
      expect(result).toEqual(expectedLakcimek);
    });
  });

  describe('hibakezelés', () => {
    test('adatbázis hiba kezelése getAllLakcims esetén', async () => {
      // Arrange
      mockRepository.findAll.mockRejectedValue(new Error('Adatbázis kapcsolat megszakadt'));

      // Act & Assert
      await expect(lakcimService.getAllLakcims()).rejects.toThrow('Adatbázis kapcsolat megszakadt');
    });

    test('adatbázis hiba kezelése getLakcimById esetén', async () => {
      // Arrange
      mockRepository.findById.mockRejectedValue(new Error('Adatbázis hiba'));

      // Act & Assert
      await expect(lakcimService.getLakcimById(1)).rejects.toThrow('Adatbázis hiba');
    });

    test('adatbázis hiba kezelése createLakcim esetén', async () => {
      // Arrange
      mockRepository.create.mockRejectedValue(new Error('Adatbázis írási hiba'));

      // Act & Assert
      await expect(lakcimService.createLakcim({})).rejects.toThrow('Adatbázis írási hiba');
    });

    test('adatbázis hiba kezelése getLakcimsByCity esetén', async () => {
      // Arrange
      mockRepository.findByCity.mockRejectedValue(new Error('Keresési hiba'));

      // Act & Assert
      await expect(lakcimService.getLakcimsByCity('Budapest')).rejects.toThrow('Keresési hiba');
    });
  });
});