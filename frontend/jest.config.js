module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: ['node_modules/(?!uint8array-extras/|@noble/|@scure/|@exodus/)'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        isolatedModules: true,
        tsconfig: { jsx: 'react-jsx', allowJs: true },
      },
    ],
  },
  setupFiles: ['<rootDir>/jest.setup.ts'],
};
