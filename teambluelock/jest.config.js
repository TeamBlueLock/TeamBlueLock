// teambluelock/jest.config.js
const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const custom = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  testMatch: ["**/?(*.)+(test).[tj]s?(x)"],
  testPathIgnorePatterns: ["<rootDir>/tests/"],

  // This is the important fix for coverage
  coverageProvider: "v8",

  // Optional but helpful: only collect from your app code
  collectCoverageFrom: [
    "src/app/dashboard/inventory/page.tsx",
    "src/app/dashboard/profit-analysis/page.tsx",
    "src/app/dashboard/recipes/page.tsx",
    "!**/*.d.ts",
  ],
};

module.exports = createJestConfig(custom);