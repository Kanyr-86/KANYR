const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      'no-unused-vars': ['error', { 
        'vars': 'all', 
        'args': 'all',
        'varsIgnorePattern': '^_',
        'argsIgnorePattern': '^_',
        'caughtErrors': 'all'
      }],
    },
  },
  {
    ignores: ['node_modules/**', 'coverage/**'],
  },
];
