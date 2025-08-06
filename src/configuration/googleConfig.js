const { OAuth2Client } = require("google-auth-library");

async function googleLoginAuth(googleCode) {
  try {
    const client = new OAuth2Client({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRECT,
      redirectUri: process.env.FE_URL,
    });
    const { tokens } = await client.getToken(googleCode);
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload;
  } catch (error) {
    console.log("🚀 ~ googleLoginAuth ~ error:", error?.message);
    return 0;
  }
}

module.exports = { googleLoginAuth };
