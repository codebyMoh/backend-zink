import dotenv from 'dotenv';
dotenv.config();
const config = {
    PORT: Number(process.env.PORT) || 7777,
    DB_URL: process.env.DB_URL,
    RATE_LIMIT: Number(process.env.RATE_LIMIT) || 5, // default fallback
    JWT_USER_SECRET: process.env.JWT_USER_SECRET,
    TURNKEY_USER_ID: process.env.TURNKEY_USER_ID,
    TURNKEY_ORG_KEY: process.env.TURNKEY_ORG_KEY,
    TURNKEY_API_PUBLIC_KEY: process.env.TURNKEY_API_PUBLIC_KEY,
    TURNKEY_API_PRIVATE_KEY: process.env.TURNKEY_API_PRIVATE_KEY,
};
export default config;
