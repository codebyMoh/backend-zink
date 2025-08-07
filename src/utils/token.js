const crypto = require('crypto');
const { SignJWT } = require('jose');
const {
  JWT_SECRET,
  JWT_EXPIRATION_TIME,
  REFRESH_TOKEN_EXPIRY,
} = require('./constants');

const createAccessToken = async (payload) => {
  const issuedAt = Math.floor(Date.now() / 1000);

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(JWT_EXPIRATION_TIME)
    .setSubject(payload.sub)
    .setIssuedAt(issuedAt)
    .sign(new TextEncoder().encode(JWT_SECRET));
};

const createRefreshToken = async (payload) => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const jti = crypto.randomUUID();

  return new SignJWT({
    ...payload,
    jti,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setIssuedAt(issuedAt)
    .sign(new TextEncoder().encode(JWT_SECRET));
};

module.exports = {
  createAccessToken,
  createRefreshToken,
};
