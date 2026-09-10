import { createRemoteJWKSet, jwtVerify } from 'jose';

const APPLE_JWKS_URL = 'https://appleid.apple.com/auth/keys';
const APPLE_ISSUER = 'https://appleid.apple.com';

// Bundle ID for native mobile token; Services ID for web (if ever added)
const VALID_AUDIENCES = [
  'app.togetherplans.datenight',         // native iOS
  'com.togetherplans.datenight.web',     // Services ID (web flow)
];

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) jwks = createRemoteJWKSet(new URL(APPLE_JWKS_URL));
  return jwks;
}

export async function verifyAppleToken(identityToken: string): Promise<{
  email: string | null;
  name: string | null;
  providerId: string;
}> {
  const { payload } = await jwtVerify(identityToken, getJwks(), {
    issuer: APPLE_ISSUER,
    audience: VALID_AUDIENCES,
  });

  if (!payload.sub) throw new Error('Apple token missing sub claim');

  return {
    // Apple only sends email on first sign-in; subsequent logins omit it
    email: (payload.email as string) ?? null,
    name: null, // name comes from the client, not the token
    providerId: payload.sub,
  };
}
