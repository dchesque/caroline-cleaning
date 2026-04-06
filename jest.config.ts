import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        // Relax some strict settings that ts-jest has trouble with in a Next.js project
        moduleResolution: 'node',
        module: 'commonjs',
      },
    }],
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  // Suppress logger noise in tests
  setupFiles: ['<rootDir>/jest.setup.ts'],
}

export default config
