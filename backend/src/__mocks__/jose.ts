// Jest mock for jose (ESM-only package — cannot be required in CommonJS Jest environment)
// Apple token verification is an integration concern; unit tests mock it here.

export const createRemoteJWKSet = jest.fn();

export const jwtVerify = jest.fn().mockResolvedValue({
  payload: {
    sub: 'test-apple-user-id',
    email: 'test@example.com',
    iss: 'https://appleid.apple.com',
    aud: 'app.datemeup.datenight',
  },
});
