export default {
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", {
      useESM: true,
    }],
  },
  testEnvironment: "node",
  roots: ["<rootDir>"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
  collectCoverageFrom: [
    "**/*.ts",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/dist/**",
  ],
  moduleNameMapper: {
    "^@shared/(.*)$": "<rootDir>/../shared/$1",
  },
  moduleFileExtensions: ["ts", "js", "json"],
  transformIgnorePatterns: [
    "node_modules/(?!(.*\\.mjs$))"
  ],
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
};
