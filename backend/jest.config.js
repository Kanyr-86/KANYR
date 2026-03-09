/**
 * Jest konfiguráció backend tesztekhez
 */

module.exports = {
  // Node.js teszt környezet használata
  testEnvironment: 'node',

  // Teszt fájl minták
  testMatch: [
    '**/__tests__/**/*.js',
    '**/*.test.js'
  ],

  // Lefedettség konfiguráció
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!coverage/**',
    '!jest.config.js',
    '!app.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Beállító fájlok futtatása tesztek előtt
  // setupFilesAfterEnv: ['./tests/setup.js'],

  // Teszt időkorlát (ezredmásodpercben)
  testTimeout: 10000,

  // Részletes kimenet
  verbose: true,

  // Mock-ok törlése tesztek között
  clearMocks: true,

  // Mock-ok visszaállítása minden teszt után
  restoreMocks: true
};