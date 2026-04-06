// Silence logger output during tests so test results are clean.
// The logger module is mocked via jest module mocking in individual tests,
// but we also set env here to prevent real external calls.
process.env.NODE_ENV = 'test'
