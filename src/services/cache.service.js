import { redisClient } from "../lib/redis.js";
import { logger } from "../utils/logger.js";

const get = async (key) => {
  try {
    return await redisClient.get(key);
  } catch (error) {
    logger.error(
      {
        err: error,
        key,
      },
      "Redis cache get failed"
    );

    return null;
  }
};

const set = async (key, value, ttlSeconds) => {
  try {
    await redisClient.set(key, value, {
      EX: ttlSeconds,
    });

    return true;
  } catch (error) {
    logger.error(
      {
        err: error,
        key,
      },
      "Redis cache set failed"
    );

    return false;
  }
};

const del = async (key) => {
  try {
    await redisClient.del(key);

    return true;
  } catch (error) {
    logger.error(
      {
        err: error,
        key,
      },
      "Redis cache delete failed"
    );

    return false;
  }
};

const getJson = async (key) => {
  const value = await get(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    logger.warn(
      {
        key,
      },
      "Invalid JSON found in cache"
    );

    await del(key);

    return null;
  }
};

const setJson = async (key, value, ttlSeconds) => {
  return set(key, JSON.stringify(value), ttlSeconds);
};

export {
  get,
  set,
  del,
  getJson,
  setJson,
};