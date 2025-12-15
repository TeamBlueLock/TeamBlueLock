// teambluelock/jest.config.js
const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const custom = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // IMPORTANT: pick the right one:
  // If you have /src folder:
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  // If you do NOT have /src folder, use:
  // moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },

  testMatch: ["**/?(*.)+(test).[tj]s?(x)"],
  testPathIgnorePatterns: ["<rootDir>/tests/"], // ignores Playwright tests
};

module.exports = createJestConfig(custom);
