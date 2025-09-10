import { OAuth2Client } from 'google-auth-library';
export async function googleLoginAuth(googleCode) {
    try {
        const client = new OAuth2Client({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRECT,
            redirectUri: process.env.FE_URL,
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
    }
    catch (error) {
        console.error('🚀 ~ googleLoginAuth ~ error:', error?.message);
        return null;
    }
}
