import { createClient } from "redis";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on("connect", () => {
  logger.info("Redis connecting");
});

redisClient.on("ready", () => {
  logger.info("Redis ready");
});

redisClient.on("reconnecting", () => {
  logger.warn("Redis reconnecting");
});

redisClient.on("error", (error) => {
  logger.error(
    {
      err: error,
    },
    "Redis client error"
  );
});

redisClient.on("end", () => {
  logger.info("Redis connection closed");
});

const connectRedis = async () => {
  if (redisClient.isOpen) {
    return;
  }

  await redisClient.connect();
};

const disconnectRedis = async () => {
  if (!redisClient.isOpen) {
    return;
  }

  await redisClient.quit();

  logger.info("Redis connection closed");
};

export {
  redisClient,
  connectRedis,
  disconnectRedis,
};