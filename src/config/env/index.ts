import dotenv from 'dotenv';
dotenv.config();

interface Config {
  PORT: number;
  DB_URL: string;
  RATE_LIMIT: number;
  JWT_USER_SECRET: string;
  TURNKEY_USER_ID: string;
  TURNKEY_ORG_KEY: string;
  TURNKEY_API_PUBLIC_KEY: string;
  TURNKEY_API_PRIVATE_KEY: string;
}

const config: Config = {
  PORT: Number(process.env.PORT) || 7777,
  DB_URL: process.env.DB_URL as string,
  RATE_LIMIT: Number(process.env.RATE_LIMIT) || 5, // default fallback
  JWT_USER_SECRET: process.env.JWT_USER_SECRET as string,
  TURNKEY_USER_ID: process.env.TURNKEY_USER_ID as string,
  TURNKEY_ORG_KEY: process.env.TURNKEY_ORG_KEY as string,
  TURNKEY_API_PUBLIC_KEY: process.env.TURNKEY_API_PUBLIC_KEY as string,
  TURNKEY_API_PRIVATE_KEY: process.env.TURNKEY_API_PRIVATE_KEY as string,
};

export default config;
