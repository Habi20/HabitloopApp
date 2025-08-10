module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  plugins: [
    'unused-imports'
  ],
  rules: {
    'no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': 'warn'
  },
  ignorePatterns: [
    'dist/', 
    'node_modules/', 
    '*.js',
    '__tests__/**/*',
    'tests/**/*'
  ]
};