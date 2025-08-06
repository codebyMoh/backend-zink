require("dotenv").config();

const COOKIE_MAX_AGE = 20; // 20 seconds
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

module.exports = {
  // Auth
  COOKIE_NAME: "auth_token",
  REFRESH_COOKIE_NAME: "refresh_token",
  COOKIE_MAX_AGE,
  JWT_EXPIRATION_TIME: "20s", // match your frontend JWT exp
  REFRESH_TOKEN_EXPIRY: "30d", // for backend JWT generation
  REFRESH_TOKEN_MAX_AGE,

  // Refresh Logic
  REFRESH_BEFORE_EXPIRY_SEC: 60,

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: `${process.env.EXPO_PUBLIC_BK_URL}/api/auth/callback`,
  GOOGLE_AUTH_URL: "https://accounts.google.com/o/oauth2/v2/auth",

  // Apple OAuth (optional if you're using it)
  APPLE_CLIENT_ID: "com.beto.expoauthexample.web",
  APPLE_CLIENT_SECRET: process.env.APPLE_CLIENT_SECRET,
  APPLE_REDIRECT_URI: `${process.env.EXPO_PUBLIC_BK_URL}/api/auth/apple/callback`,
  APPLE_AUTH_URL: "https://appleid.apple.com/auth/authorize",

  // BK app settings
  BK_URL: process.env.EXPO_PUBLIC_BK_URL,
  WEB_URL: process.env.EXPO_PUBLIC_WEB_URL,
  APP_SCHEME: process.env.APP_SCHEME,
  JWT_SECRET: process.env.JWT_SECRET,

  // Cookie Options
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  },

  REFRESH_COOKIE_OPTIONS: {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/api/auth/refresh",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  },
};
