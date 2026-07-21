module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'api/**/*.ts',
    'game/**/*.ts',
    'lib/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/out/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.tsx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: false,
          },
          target: 'es2022',
        },
        module: {
          type: 'commonjs',
          noInterop: false,
          ignoreDynamic: true,
        },
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 10000,
};
