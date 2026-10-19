// Jest global setup — runs before any test module is imported.
// Sets env vars required by src/config.ts startup guards.
process.env.JWT_SECRET = 'test-secret-not-used-in-real-ops';
process.env.NODE_ENV = 'test';
