module.exports = {
  testEnvironment: "node", // Use Node.js environment for WebDriver tests
  testTimeout: 60000, // Global timeout for all tests and hooks (60 seconds)
  testMatch: [
    "**/Tests/**/*.test.js", // Jest will find your test files in the Tests folder
  ],
};
