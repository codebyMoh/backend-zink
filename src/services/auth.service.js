const { GOOGLE_CLIENT_ID, BK_URL, WEB_URL, APP_SCHEME, GOOGLE_AUTH_URL } = require('../utils/constants');
const jose = require("jose");
const { COOKIE_NAME, JWT_SECRET } = require("../utils/constants");

exports.getGoogleAuthorizeUrl = (req) => {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      return reject({ status: 500, message: 'Missing GOOGLE_CLIENT_ID environment variable' });
    }

    const url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    const internalClient = url.searchParams.get('client_id');
    const redirectUri = url.searchParams.get('redirect_uri');
    let platform;
    if (redirectUri === APP_SCHEME) {
      platform = 'mobile';
    } else if (redirectUri === WEB_URL) {
      platform = 'web';
    } else {
      return reject({ status: 400, message: 'Invalid redirect_uri' });
    }

    const state = platform + '|' + url.searchParams.get('state');

    if (internalClient !== 'google') {
      return reject({ status: 400, message: 'Invalid client' });
    }

    if (!state) {
      return reject({ status: 400, message: 'Invalid state' });
    }

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: BK_URL + '/api/auth/callback',
      response_type: 'code',
      scope: url.searchParams.get('scope') || 'identity',
      state: state,
      prompt: 'select_account',
    });

    resolve(GOOGLE_AUTH_URL + '?' + params.toString());
  });
};

exports.getSession = async (req) => {
  const cookieHeader = req.headers.cookie;
  // console.log("🍪 Incoming cookies:", cookieHeader);

  if (!cookieHeader) {
    throw { status: 401, message: "Not authenticated" };
  }

  const cookies = {};

  cookieHeader.split(";").forEach((cookie) => {
    const trimmedCookie = cookie.trim();

    if (trimmedCookie.includes("=")) {
      const [key, value] = trimmedCookie.split("=");
      const cookieName = key.trim();
      cookies[cookieName] = { value };
    } else if (trimmedCookie.toLowerCase() === "httponly") {
      const lastCookieName = Object.keys(cookies).pop();
      if (lastCookieName) cookies[lastCookieName].httpOnly = "true";
    } else if (trimmedCookie.toLowerCase().startsWith("expires=")) {
      const lastCookieName = Object.keys(cookies).pop();
      if (lastCookieName)
        cookies[lastCookieName].expires = trimmedCookie.substring(8);
    } else if (trimmedCookie.toLowerCase().startsWith("max-age=")) {
      const lastCookieName = Object.keys(cookies).pop();
      if (lastCookieName)
        cookies[lastCookieName].maxAge = trimmedCookie.substring(8);
    }
  });

  if (!cookies[COOKIE_NAME] || !cookies[COOKIE_NAME].value) {
    throw { status: 401, message: "Not authenticated" };
  }

  const token = cookies[COOKIE_NAME].value;

  try {
    const verified = await jose.jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    );

    let cookieExpiration = null;

    if (cookies[COOKIE_NAME].maxAge) {
      const maxAge = parseInt(cookies[COOKIE_NAME].maxAge, 10);
      const issuedAt =
        (verified.payload.iat ?? Math.floor(Date.now() / 1000));
      cookieExpiration = issuedAt + maxAge;
    }

    return {
      ...verified.payload,
      cookieExpiration,
    };
  } catch (err) {
    console.warn("❌ Invalid token:", err.message);
    throw { status: 401, message: "Invalid token" };
  }
};