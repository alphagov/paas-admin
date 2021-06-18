const config = {
  rootDir: '.',
  testTimeout: 20000,
  testMatch: [
    '<rootDir>/acceptance-tests/**/*.test.ts',
  ],
  preset: 'jest-puppeteer',
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
}

module.exports = config;
