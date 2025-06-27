export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.ts$': 'ts-jest'
  },
  testMatch: [
    '**/__tests__/**/*.spec.[jt]s?(x)'
  ],
  moduleFileExtensions: ['js', 'ts', 'json', 'vue'],
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json'
    }
  }
}
