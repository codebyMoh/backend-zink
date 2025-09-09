import { OAuth2Client } from 'google-auth-library';
import type { TokenPayload } from 'google-auth-library';
export async function googleLoginAuth(
  googleCode: string,
): Promise<TokenPayload | null> {
  try {
    const client = new OAuth2Client({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRECT as string,
      redirectUri: process.env.FE_URL as string,
    });

    const { tokens } = await client.getToken(googleCode);

    if (!tokens.id_token) {
      throw new Error('No ID token received from Google');
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    return payload ?? null;
  } catch (error: any) {
    console.error('🚀 ~ googleLoginAuth ~ error:', error?.message);
    return null;
  }
}
