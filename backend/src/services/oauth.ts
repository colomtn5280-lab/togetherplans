import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client();

export async function verifyGoogleToken(idToken: string): Promise<{
  email: string;
  name: string;
  providerId: string;
  avatarUrl?: string;
}> {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: [
      '265703486967-4afi3ltmi5p8srd85gs06rhqsllp31h7.apps.googleusercontent.com', // iOS
      '265703486967-dr8qfsafbi0829ilats4ei7lgok17rot.apps.googleusercontent.com', // Android
      '265703486967-4krmr9fqc6su377v33od946jh6endhet.apps.googleusercontent.com', // Web
    ],
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) throw new Error('Invalid Google token');
  return {
    email: payload.email,
    name: payload.name ?? payload.email.split('@')[0],
    providerId: payload.sub,
    avatarUrl: payload.picture,
  };
}
