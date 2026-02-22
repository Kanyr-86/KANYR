/**
 * Jest konfiguráció a KANYR backend teszteléshez
 * SQLite in-memory adatbázist használ a tesztekhez
 */
module.exports = {
  // Teszt környezet beállítása
  testEnvironment: 'node',

  // Teszt fájlok mintája
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],

  // Ignorált könyvtárak
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/'
  ],

  // Coverage beállítások
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'services/**/*.js',
    'repositories/**/*.js',
    'controllers/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 14,
      lines: 10,
      statements: 9.5
    }
  },

  // Setup fájlok
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Timeout beállítások
  testTimeout: 30000,

  // Verbose kimenet
  verbose: true,

  // Global változók
  globals: {
    'TEST_TIMEOUT': 30000
  },

  // Module paths
  moduleDirectories: ['node_modules', 'src'],

  // Root directory
  rootDir: '.',

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true
};