module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: [
        '**/__tests__/**/*.ts',
        '**/?(*.)+(spec|test).ts'
    ],
    transform: {
        '^.+\.ts$': ['ts-jest', {
            tsconfig: {
                target: 'ES2020',
                module: 'CommonJS',
                lib: ['ES2020', 'DOM', 'DOM.Iterable'],
                moduleResolution: 'node',
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
                skipLibCheck: true,
                jsx: 'react'
            },
            useESM: false
        }]
    },
    moduleFileExtensions: ['ts', 'js', 'json'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts'
    ],
    testTimeout: 10000,
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^(\\.{1,2}/.*)\\.(js|ts)$': '$1'
    },
    extensionsToTreatAsEsm: [],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};