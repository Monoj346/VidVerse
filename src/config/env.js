import dotenv from "dotenv";

dotenv.config();

const requiredEnv = [
  "PORT",
  "MONGODB_URI",
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
  "CORS_ORIGIN",
  "REDIS_URL",
  "RABBITMQ_URL",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",

  PORT: Number(process.env.PORT) || 8000,

  MONGODB_URI: process.env.MONGODB_URI,

  REDIS_URL: process.env.REDIS_URL,

  RABBITMQ_URL: process.env.RABBITMQ_URL,

  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,

  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,

  CORS_ORIGIN: process.env.CORS_ORIGIN,
};