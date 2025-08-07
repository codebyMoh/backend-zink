const fetch = require('node-fetch');
const crypto = require('crypto');
const { decodeJwt, jwtVerify } = require('jose');
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  COOKIE_MAX_AGE,
  JWT_SECRET,
  COOKIE_OPTIONS,
  REFRESH_COOKIE_OPTIONS,
} = require('../utils/constants');
const { createAccessToken, createRefreshToken } = require('../utils/token');
const authService = require('../services/auth.service');

// ⬇️ Added imports
const { code } = require("../../constant/code");
const { db } = require("../model/index");
const { apiResponse } = require("../utils/apiResponse");
const ThrowError = require("../utils/ThrowError");
const {
  createWalletInTurnKey,
  createWalletInTurnKeyEvm,
} = require("../services/turnkey/createWalletOnTurnkey");

// Redirect user to Google's OAuth URL
const googleAuthorize = async (req, res) => {
  try {
    const redirectUrl = await authService.getGoogleAuthorizeUrl(req);
    return res.redirect(redirectUrl);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
};

// Handle Google's OAuth callback (if needed by backend)
const googleCallback = async (req, res) => {
  try {
    const result = await authService.handleGoogleCallback(req, res);
    return result;
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
};

// Get session (if you're tracking sessions separately)
const getSession = async (req, res) => {
  try {
    const sessionData = await authService.getSession(req);
    return res.status(200).json(sessionData);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
};

// Exchange Google code for tokens (sign-in or signup)
const exchangeGoogleCode = async (req, res) => {
  try {
    const code = req?.body?.code;
    const platform = req?.body?.platform || 'native';

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
        code,
      }),
    });

    const data = await tokenRes.json();

    if (!data.id_token || data.error) {
      return res.status(400).json({
        error: data.error || 'Failed to get ID token',
        details: data,
      });
    }

    const userInfo = decodeJwt(data.id_token);
    console.log("userInfo", userInfo);
    const { sub, email, name, picture, email_verified } = userInfo;

    let user = await db.User.findOne({ email: email.toLowerCase() });
    console.log("user", user);

    if (!user) {
      user = await db.User.create({
        email: email.toLowerCase(),
        name: name || 'No Name',
        picture,
        email_verified,
      });

      const [solWallet, evmWallet] = await Promise.allSettled([
        createWalletInTurnKey(user.email),
        createWalletInTurnKeyEvm(user.email),
      ]);

      if (!solWallet?.value?.address && !evmWallet?.value?.address) {
        return ThrowError(
          code.INTERNAL_SERVER_ERROR,
          'Internal server error (Turnkey wallet generation).'
        );
      }

      user.solTurnkeyId = solWallet.value.walletId.toString();
      user.evmTurnkeyId = evmWallet.value.walletId.toString();
      user.walletAddressEVM = evmWallet.value.address.toString();

      user.walletAddressSOL = [
        {
          wallet: solWallet.value.address.toString(),
          primary: true,
          index: 0,
        },
      ];

      user.referralId = `${solWallet.value.address.slice(0, 4)}${solWallet.value.address.slice(-4)}`;
      user.verify = true;
      user.active = true;
      user.lastLogin = new Date();

      await user.save();
    } else {
      user.lastLogin = new Date();
      await user.save();
    }

    // ✅ Token payload (no exp, no extra fields like before)
    const issuedAt = Math.floor(Date.now() / 1000);

    const activeWallet = user.walletAddressSOL?.find((w) => w.primary);

    const accessPayload = {
      sub: user._id.toString(),
      name: userInfo.given_name,
      email: user.email,
      picture: userInfo.picture,
      email_verified: user.email_verified,
      walletAddressSOL: activeWallet?.wallet || null,
      walletAddressEVM: user.walletAddressEVM || null,
      referralId: user.referralId || null,
      referredBy: user.referredBy || null,
    };

    const accessToken = await createAccessToken(accessPayload);
    const refreshToken = await createRefreshToken(accessPayload);

    if (platform === 'web') {
      res.cookie(COOKIE_NAME, accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: COOKIE_OPTIONS.maxAge * 1000,
      });

      res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
        ...REFRESH_COOKIE_OPTIONS,
        maxAge: REFRESH_COOKIE_OPTIONS.maxAge * 1000,
      });

      const primarySolWallet = user.walletAddressSOL?.find((w) => w.primary)?.wallet;

      return res.json({
        success: true,
        issuedAt,
        expiresAt: issuedAt + COOKIE_OPTIONS.maxAge,
        user: {
          _id: user._id,
          email: user.email,
          solWallet: primarySolWallet,
          evmWallet: user.walletAddressEVM,
          referralId: user.referralId,
          referredBy: user.referredBy,
        },
      });
    }

    return res.json({ accessToken, refreshToken });
  } catch (error) {
    console.error('[exchangeGoogleCode] Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};




// Refresh access & refresh token
const refreshToken = async (req, res) => {
  try {
    let platform = 'native';
    let token = null;
    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('application/json')) {
      platform = req.body.platform || 'native';
      token = req.body.refreshToken;
    } else if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      platform = req.body.platform || 'native';
      token = req.body.refreshToken;
    } else {
      platform = req.query.platform || 'native';
    }

    if (platform === 'web' && !token) {
      token = req.cookies?.[REFRESH_COOKIE_NAME];
    }

    // Fallback: use access token
    if (!token) {
      const authHeader = req.headers['authorization'];
      if (authHeader?.startsWith('Bearer ')) {
        const accessToken = authHeader.split(' ')[1];
        try {
          const { payload } = await jwtVerify(
            accessToken,
            new TextEncoder().encode(JWT_SECRET)
          );

          const issuedAt = Math.floor(Date.now() / 1000);
          const newAccessToken = await createAccessToken({
            ...payload,
            sub: payload.sub,
          });

          if (platform === 'web') {
            res.cookie(COOKIE_NAME, newAccessToken, COOKIE_OPTIONS);
            return res.json({
              success: true,
              issuedAt,
              expiresAt: issuedAt + COOKIE_MAX_AGE,
              warning: 'Used access token fallback - refresh token missing',
            });
          }

          return res.json({
            accessToken: newAccessToken,
            warning: 'Used access token fallback - refresh token missing',
          });
        } catch (err) {
          return res
            .status(401)
            .json({ error: 'Access token expired or invalid' });
        }
      }

      return res.status(401).json({ error: 'Refresh token missing' });
    }

    let decoded;
    try {
      decoded = await jwtVerify(
        token,
        new TextEncoder().encode(JWT_SECRET)
      );
    } catch (err) {
      if (err.code === 'ERR_JWT_EXPIRED') {
        return res
          .status(401)
          .json({ error: 'Refresh token expired, please sign in again' });
      }
      return res
        .status(401)
        .json({ error: 'Invalid refresh token, please sign in again' });
    }

    const payload = decoded.payload;

    if (payload.type !== 'refresh') {
      return res
        .status(401)
        .json({ error: 'Invalid token type, please sign in again' });
    }

    const sub = payload.sub;
    const issuedAt = Math.floor(Date.now() / 1000);

    const userInfo = {
      sub,
      name: payload.name || 'user',
      email: payload.email || 'user@example.com',
      picture:
        payload.picture || 'https://ui-avatars.com/api/?name=User&background=random',
      email_verified: payload.email_verified || false,
      given_name: payload.given_name || '',
      family_name: payload.family_name || '',
    };

    const newAccessToken = await createAccessToken(userInfo);
    const newRefreshToken = await createRefreshToken(userInfo);

    if (platform === 'web') {
      res.cookie(COOKIE_NAME, newAccessToken, COOKIE_OPTIONS);
      res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, REFRESH_COOKIE_OPTIONS);
      return res.json({
        success: true,
        issuedAt,
        expiresAt: issuedAt + COOKIE_MAX_AGE,
      });
    }
    console.log("newAccessToken", newAccessToken);
    console.log("newRefreshToken", newRefreshToken);
    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error('[refreshToken] Error:', err);
    return res.status(500).json({ error: 'Failed to refresh token' });
  }
};

// Clear cookies for logout (unchanged)
const logout = (req, res) => {
  try {
    res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
    res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
    return res.json({ success: true });
  } catch (error) {
    console.error('[logout] Error clearing cookies:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  googleAuthorize,
  googleCallback,
  getSession,
  exchangeGoogleCode,
  logout,
  refreshToken,
};
