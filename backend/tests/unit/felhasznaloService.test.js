/**
 * FelhasznaloService egységtesztek
 * Teszteli a bejelentkezés, token validáció és felhasználó CRUD műveleteit
 */

const FelhasznaloService = require('../../services/FelhasznaloService');
const FelhasznaloRepository = require('../../repositories/FelhasznaloRepository');
const { generateToken, verifyToken, hashPassword, comparePassword } = require('../../utils/authUtils');

// Mock a repository és auth utils
jest.mock('../../repositories/FelhasznaloRepository');
jest.mock('../../utils/authUtils');

describe('FelhasznaloService egységtesztek', () => {
  let felhasznaloService;
  let mockDb;
  let mockRepository;

  beforeEach(() => {
    // Mock adatbázis
    mockDb = {
      Felhasznalo: {}
    };

    // Repository mock törlése
    FelhasznaloRepository.mockClear();

    // Mock repository instance
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      authenticate: jest.fn(),
      existsByEmail: jest.fn(),
      existsByUsername: jest.fn()
    };

    FelhasznaloRepository.mockImplementation(() => mockRepository);

    // Auth utils mock resetelése
    generateToken.mockClear();
    verifyToken.mockClear();
    hashPassword.mockClear();
    comparePassword.mockClear();

    // Service inicializálása
    felhasznaloService = new FelhasznaloService(mockDb, { repository: mockRepository });
  });

  describe('login', () => {
    test('sikeres bejelentkezés érvényes adatokkal', async () => {
      // Arrange
      const email = 'admin@test.hu';
      const password = 'admin12345678';
      const mockUser = {
        user_id: 1,
        username: 'admin',
        email: 'admin@test.hu',
        admin: true,
        toJSON: () => ({
          user_id: 1,
          username: 'admin',
          email: 'admin@test.hu',
          admin: true
        })
      };
      const mockToken = 'mock.jwt.token';

      mockRepository.authenticate.mockResolvedValue(mockUser);
      generateToken.mockReturnValue(mockToken);

      // Act
      const result = await felhasznaloService.login(email, password);

      // Assert
      expect(mockRepository.authenticate).toHaveBeenCalledWith(email, password);
      expect(generateToken).toHaveBeenCalledWith({
        userId: 1,
        username: 'admin',
        email: 'admin@test.hu',
        admin: true
      });
      expect(result).toEqual({
        user: {
          userId: 1,
          username: 'admin',
          email: 'admin@test.hu',
          admin: true
        },
        token: mockToken,
        expiresIn: '24h'
      });
    });

    test('sikertelen bejelentkezés hibás email cím megadása esetén', async () => {
      // Arrange
      const email = 'nemletezo@test.hu';
      const password = 'valamijelszo';

      mockRepository.authenticate.mockRejectedValue(new Error('Érvénytelen email vagy jelszó'));

      // Act & Assert
      await expect(felhasznaloService.login(email, password)).rejects.toThrow('Érvénytelen email vagy jelszó');
      expect(mockRepository.authenticate).toHaveBeenCalledWith(email, password);
    });

    test('sikertelen bejelentkezés hibás jelszó megadása esetén', async () => {
      // Arrange
      const email = 'admin@test.hu';
      const password = 'hibasjelszo';

      mockRepository.authenticate.mockRejectedValue(new Error('Érvénytelen email vagy jelszó'));

      // Act & Assert
      await expect(felhasznaloService.login(email, password)).rejects.toThrow('Érvénytelen email vagy jelszó');
    });

    test('normál felhasználó bejelentkezése', async () => {
      // Arrange
      const email = 'user@test.hu';
      const password = 'user12345678';
      const mockUser = {
        user_id: 2,
        username: 'user',
        email: 'user@test.hu',
        admin: false,
        toJSON: () => ({
          user_id: 2,
          username: 'user',
          email: 'user@test.hu',
          admin: false
        })
      };
      const mockToken = 'mock.user.token';

      mockRepository.authenticate.mockResolvedValue(mockUser);
      generateToken.mockReturnValue(mockToken);

      // Act
      const result = await felhasznaloService.login(email, password);

      // Assert
      expect(result.user.admin).toBe(false);
      expect(result.token).toBe(mockToken);
    });
  });

  describe('createUser', () => {
    test('létrehoz egy új felhasználót', async () => {
      // Arrange
      const newUserData = {
        username: 'ujfelhasznalo',
        email: 'uj@test.hu',
        password: 'UjJelszo123456!',
        admin: false
      };
      const createdUser = {
        user_id: 3,
        username: 'ujfelhasznalo',
        email: 'uj@test.hu',
        admin: false
      };

      mockRepository.existsByEmail.mockResolvedValue(false);
      mockRepository.existsByUsername.mockResolvedValue(false);
      mockRepository.create.mockResolvedValue(createdUser);

      // Act
      const result = await felhasznaloService.createUser(newUserData);

      // Assert
      expect(mockRepository.existsByEmail).toHaveBeenCalledWith(newUserData.email);
      expect(mockRepository.existsByUsername).toHaveBeenCalledWith(newUserData.username);
      expect(mockRepository.create).toHaveBeenCalledWith(newUserData);
      expect(result).toEqual(createdUser);
    });

    test('hibát dob ha az email már foglalt', async () => {
      // Arrange
      const userData = {
        username: 'ujfelhasznalo',
        email: 'foglalt@test.hu',
        password: 'Jelszo123456!',
        admin: false
      };

      mockRepository.existsByEmail.mockResolvedValue(true);

      // Act & Assert
      await expect(felhasznaloService.createUser(userData)).rejects.toThrow('Az email cím már foglalt');
    });

    test('hibát dob ha a felhasználónév már foglalt', async () => {
      // Arrange
      const userData = {
        username: 'letezofelhasznalo',
        email: 'uj@test.hu',
        password: 'Jelszo123456!',
        admin: false
      };

      mockRepository.existsByEmail.mockResolvedValue(false);
      mockRepository.existsByUsername.mockResolvedValue(true);

      // Act & Assert
      await expect(felhasznaloService.createUser(userData)).rejects.toThrow('A felhasználónév már foglalt');
    });
  });

  describe('getUserById', () => {
    test('visszaadja a felhasználót ID alapján', async () => {
      // Arrange
      const mockUser = {
        user_id: 1,
        username: 'admin',
        email: 'admin@test.hu',
        admin: true
      };
      mockRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await felhasznaloService.getUserById(1);

      // Assert
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });

    test('hibát dob ha a felhasználó nem található', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(felhasznaloService.getUserById(999)).rejects.toThrow('Felhasználó nem található');
    });
  });

  describe('getUserByEmail', () => {
    test('visszaadja a felhasználót email alapján', async () => {
      // Arrange
      const mockUser = {
        user_id: 1,
        username: 'admin',
        email: 'admin@test.hu',
        admin: true,
        toJSON: () => ({
          user_id: 1,
          username: 'admin',
          email: 'admin@test.hu',
          admin: true,
          password: 'hashed'
        })
      };
      mockRepository.findByEmail.mockResolvedValue(mockUser);

      // Act
      const result = await felhasznaloService.getUserByEmail('admin@test.hu');

      // Assert
      expect(mockRepository.findByEmail).toHaveBeenCalledWith('admin@test.hu');
      expect(result.email).toBe('admin@test.hu');
      expect(result.password).toBeUndefined();
    });

    test('hibát dob ha a felhasználó nem található', async () => {
      // Arrange
      mockRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(felhasznaloService.getUserByEmail('nemletezo@test.hu')).rejects.toThrow('Felhasználó nem található');
    });
  });

  describe('getAllUsers', () => {
    test('visszaadja az összes felhasználót', async () => {
      // Arrange
      const mockUsers = [
        { user_id: 1, username: 'admin', email: 'admin@test.hu', admin: true },
        { user_id: 2, username: 'user', email: 'user@test.hu', admin: false }
      ];
      mockRepository.findAll.mockResolvedValue(mockUsers);

      // Act
      const result = await felhasznaloService.getAllUsers();

      // Assert
      expect(mockRepository.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(mockUsers);
      expect(result).toHaveLength(2);
    });

    test('visszaadja a felhasználókat opciókkal', async () => {
      // Arrange
      const options = { limit: 10, offset: 0, sort: 'username', order: 'ASC' };
      const mockUsers = [{ user_id: 1, username: 'admin' }];
      mockRepository.findAll.mockResolvedValue(mockUsers);

      // Act
      const result = await felhasznaloService.getAllUsers(options);

      // Assert
      expect(mockRepository.findAll).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockUsers);
    });
  });

  describe('updateUser', () => {
    test('frissíti a felhasználó adatait', async () => {
      // Arrange
      const updates = { username: 'ujadminnev' };
      const updatedUser = {
        user_id: 1,
        username: 'ujadminnev',
        email: 'admin@test.hu',
        admin: true
      };
      mockRepository.update.mockResolvedValue(updatedUser);

      // Act
      const result = await felhasznaloService.updateUser(1, updates);

      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith(1, updates);
      expect(result).toEqual(updatedUser);
    });

    test('hibát dob ha a felhasználó nem található', async () => {
      // Arrange
      mockRepository.update.mockRejectedValue(new Error('Felhasználó nem található'));

      // Act & Assert
      await expect(felhasznaloService.updateUser(999, { username: 'teszt' })).rejects.toThrow('Felhasználó nem található');
    });
  });

  describe('deleteUser', () => {
    test('törli a felhasználót', async () => {
      // Arrange
      mockRepository.delete.mockResolvedValue(true);

      // Act
      const result = await felhasznaloService.deleteUser(1);

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    test('hibát dob ha a felhasználó nem található', async () => {
      // Arrange
      mockRepository.delete.mockRejectedValue(new Error('Felhasználó nem található'));

      // Act & Assert
      await expect(felhasznaloService.deleteUser(999)).rejects.toThrow('Felhasználó nem található');
    });
  });

  describe('createAdminUser', () => {
    test('létrehoz egy admin felhasználót', async () => {
      // Arrange
      const adminData = {
        username: 'ujadmin',
        email: 'ujadmin@test.hu',
        password: 'AdminJelszo123!'
      };
      const createdAdmin = {
        user_id: 3,
        username: 'ujadmin',
        email: 'ujadmin@test.hu',
        admin: true
      };

      mockRepository.existsByEmail.mockResolvedValue(false);
      mockRepository.existsByUsername.mockResolvedValue(false);
      mockRepository.create.mockResolvedValue(createdAdmin);

      // Act
      const result = await felhasznaloService.createAdminUser(adminData);

      // Assert
      expect(result.admin).toBe(true);
    });
  });

  describe('updatePassword', () => {
    test('frissíti a felhasználó jelszavát', async () => {
      // Arrange
      const newPassword = 'UjJelszo123456!';
      const updatedUser = {
        user_id: 1,
        username: 'admin',
        email: 'admin@test.hu'
      };
      mockRepository.update.mockResolvedValue(updatedUser);

      // Act
      const result = await felhasznaloService.updatePassword(1, newPassword);

      // Assert
      expect(mockRepository.update).toHaveBeenCalledWith(1, { password: newPassword });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('isAdmin', () => {
    test('true-t ad vissza admin felhasználó esetén', async () => {
      // Arrange
      const mockUser = { user_id: 1, admin: true };
      mockRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await felhasznaloService.isAdmin(1);

      // Assert
      expect(result).toBe(true);
    });

    test('false-t ad vissza normál felhasználó esetén', async () => {
      // Arrange
      const mockUser = { user_id: 2, admin: false };
      mockRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await felhasznaloService.isAdmin(2);

      // Assert
      expect(result).toBe(false);
    });

    test('hibát dob ha a felhasználó nem található', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(felhasznaloService.isAdmin(999)).rejects.toThrow('Felhasználó nem található');
    });
  });

  describe('hibakezelés', () => {
    test('adatbázis hiba kezelése login esetén', async () => {
      // Arrange
      mockRepository.authenticate.mockRejectedValue(new Error('Adatbázis kapcsolat megszakadt'));

      // Act & Assert
      await expect(felhasznaloService.login('test@test.hu', 'jelszo')).rejects.toThrow();
    });

    test('adatbázis hiba kezelése getAllUsers esetén', async () => {
      // Arrange
      mockRepository.findAll.mockRejectedValue(new Error('Adatbázis hiba'));

      // Act & Assert
      await expect(felhasznaloService.getAllUsers()).rejects.toThrow();
    });
  });
});