// controllers/auth.controller.js
const fetch = require('node-fetch'); // If using Node <18
const crypto = require('crypto');
const { SignJWT, decodeJwt } = require('jose');
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  COOKIE_MAX_AGE,
  JWT_EXPIRATION_TIME,
  JWT_SECRET,
  COOKIE_OPTIONS,
  REFRESH_TOKEN_EXPIRY,
  REFRESH_COOKIE_OPTIONS,
} = require('../utils/constants');
const authService = require('../services/auth.service');

exports.googleAuthorize = async (req, res) => {
  try {
    const redirectUrl = await authService.getGoogleAuthorizeUrl(req);
    return res.redirect(redirectUrl);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
};

exports.googleCallback = async (req, res) => {
  try {
    const result = await authService.handleGoogleCallback(req, res);
    return result;
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
};

// ✅ New session endpoint
exports.getSession = async (req, res) => {
  try {
    const sessionData = await authService.getSession(req);
    return res.status(200).json(sessionData);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
};

exports.exchangeGoogleCode = async (req, res) => {
  try {
    const code = req?.body?.code;
    const platform = req?.body?.platform || 'native';

    console.log('[exchangeGoogleCode] Code:', code);
    console.log('[exchangeGoogleCode] Platform:', platform);

    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
        code: code,
      }),
    });

    const data = await tokenRes.json();

    if (!data.id_token) {
      console.error('[exchangeGoogleCode] Failed response:', data);
      return res.status(400).json({
        error: 'Missing required parameters',
        details: data,
      });
    }

    if (data.error) {
      console.error('[exchangeGoogleCode] OAuth error:', data);
      return res.status(400).json({
        error: data.error,
        error_description: data.error_description,
        message: 'OAuth validation error - check your credentials and scopes',
      });
    }

    const userInfo = decodeJwt(data.id_token);
    const { exp, ...userInfoWithoutExp } = userInfo;
    const sub = userInfo.sub;
    const issuedAt = Math.floor(Date.now() / 1000);
    const jti = crypto.randomUUID();

    // Access Token
    const accessToken = await new SignJWT(userInfoWithoutExp)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(JWT_EXPIRATION_TIME)
      .setSubject(sub)
      .setIssuedAt(issuedAt)
      .sign(new TextEncoder().encode(JWT_SECRET));

    // Refresh Token
    const refreshToken = await new SignJWT({
      sub,
      jti,
      type: 'refresh',
      name: userInfo.name,
      email: userInfo.email,
      picture: userInfo.picture,
      given_name: userInfo.given_name,
      family_name: userInfo.family_name,
      email_verified: userInfo.email_verified,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(REFRESH_TOKEN_EXPIRY)
      .setIssuedAt(issuedAt)
      .sign(new TextEncoder().encode(JWT_SECRET));

    if (platform === 'web') {
      // Set cookies for web platform
      res.cookie(COOKIE_NAME, accessToken, {
        maxAge: COOKIE_OPTIONS.maxAge * 1000,
        httpOnly: COOKIE_OPTIONS.httpOnly,
        secure: COOKIE_OPTIONS.secure,
        sameSite: COOKIE_OPTIONS.sameSite,
        path: COOKIE_OPTIONS.path,
      });

      res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
        maxAge: REFRESH_COOKIE_OPTIONS.maxAge * 1000,
        httpOnly: REFRESH_COOKIE_OPTIONS.httpOnly,
        secure: REFRESH_COOKIE_OPTIONS.secure,
        sameSite: REFRESH_COOKIE_OPTIONS.sameSite,
        path: REFRESH_COOKIE_OPTIONS.path,
      });

      return res.json({
        success: true,
        issuedAt,
        expiresAt: issuedAt + COOKIE_MAX_AGE,
      });
    }

    // Return tokens for mobile/native
    return res.json({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('[exchangeGoogleCode] Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.logout = (req, res) => {
  try {
    console.log("[logout] Clearing auth cookies...");

    res.clearCookie(COOKIE_NAME, {
      path: COOKIE_OPTIONS.path,
      httpOnly: COOKIE_OPTIONS.httpOnly,
      secure: COOKIE_OPTIONS.secure,
      sameSite: COOKIE_OPTIONS.sameSite,
    });

    res.clearCookie(REFRESH_COOKIE_NAME, {
      path: REFRESH_COOKIE_OPTIONS.path,
      httpOnly: REFRESH_COOKIE_OPTIONS.httpOnly,
      secure: REFRESH_COOKIE_OPTIONS.secure,
      sameSite: REFRESH_COOKIE_OPTIONS.sameSite,
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("[logout] Error clearing cookies:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    let platform = "native";
    let refreshToken = null;

    // 1. Detect platform and get refreshToken from body or cookies
    const contentType = req.headers["content-type"] || "";

    if (contentType.includes("application/json")) {
      platform = req.body.platform || "native";
      if (platform === "native") refreshToken = req.body.refreshToken;
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      platform = req.body.platform || "native";
      if (platform === "native") refreshToken = req.body.refreshToken;
    } else {
      platform = req.query.platform || "native";
    }

    // 2. For web clients: check cookies for refresh token
    if (platform === "web" && !refreshToken) {
      refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    }

    // 3. Fallback to access token
    if (!refreshToken) {
      const authHeader = req.headers["authorization"];
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const accessToken = authHeader.split(" ")[1];

        try {
          const { payload } = await jose.jwtVerify(
            accessToken,
            new TextEncoder().encode(JWT_SECRET)
          );

          const issuedAt = Math.floor(Date.now() / 1000);
          const newAccessToken = await new jose.SignJWT({ ...payload })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime(JWT_EXPIRATION_TIME)
            .setSubject(payload.sub)
            .setIssuedAt(issuedAt)
            .sign(new TextEncoder().encode(JWT_SECRET));

          if (platform === "web") {
            res.cookie(COOKIE_NAME, newAccessToken, COOKIE_OPTIONS);
            return res.json({
              success: true,
              issuedAt,
              expiresAt: issuedAt + COOKIE_MAX_AGE,
              warning: "Using access token fallback - refresh token missing",
            });
          }

          return res.json({
            accessToken: newAccessToken,
            warning: "Using access token fallback - refresh token missing",
          });
        } catch (err) {
          return res
            .status(401)
            .json({ error: "Authentication required - no valid refresh token" });
        }
      }

      return res
        .status(401)
        .json({ error: "Authentication required - no refresh token" });
    }

    // 4. Verify refresh token
    let decoded;
    try {
      decoded = await jose.jwtVerify(
        refreshToken,
        new TextEncoder().encode(JWT_SECRET)
      );
    } catch (err) {
      if (err instanceof jose.errors.JWTExpired) {
        return res
          .status(401)
          .json({ error: "Refresh token expired, please sign in again" });
      }
      return res
        .status(401)
        .json({ error: "Invalid refresh token, please sign in again" });
    }

    const payload = decoded.payload;
    if (payload.type !== "refresh") {
      return res
        .status(401)
        .json({ error: "Invalid token type, please sign in again" });
    }

    const sub = payload.sub;
    if (!sub) {
      return res.status(401).json({ error: "Invalid token, missing subject" });
    }

    // 5. Build new tokens
    const issuedAt = Math.floor(Date.now() / 1000);
    const jti = crypto.randomUUID();

    const hasUserInfo = payload.name && payload.email && payload.picture;
    const completeUserInfo = {
      ...payload,
      type: "refresh",
      name: payload.name || "apple-user",
      email: payload.email || "apple-user",
      picture:
        payload.picture ||
        `https://ui-avatars.com/api/?name=User&background=random`,
    };

    const newAccessToken = await new jose.SignJWT({
      ...completeUserInfo,
      type: undefined,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(JWT_EXPIRATION_TIME)
      .setSubject(sub)
      .setIssuedAt(issuedAt)
      .sign(new TextEncoder().encode(JWT_SECRET));

    const newRefreshToken = await new jose.SignJWT({
      ...completeUserInfo,
      jti,
      type: "refresh",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(REFRESH_TOKEN_EXPIRY)
      .setIssuedAt(issuedAt)
      .sign(new TextEncoder().encode(JWT_SECRET));

    // 6. Return tokens or set cookies
    if (platform === "web") {
      res.cookie(COOKIE_NAME, newAccessToken, COOKIE_OPTIONS);
      res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, REFRESH_COOKIE_OPTIONS);
      return res.json({
        success: true,
        issuedAt,
        expiresAt: issuedAt + COOKIE_MAX_AGE,
      });
    }

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error("[refreshToken] Error:", err);
    return res.status(500).json({ error: "Failed to refresh token" });
  }
};

