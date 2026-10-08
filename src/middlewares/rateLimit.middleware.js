import { redisClient } from "../lib/redis.js";
import { ApiError } from "../utils/ApiError.js";

const rateLimitScript = `
local current = redis.call("INCR", KEYS[1])

if current == 1 then
    redis.call("EXPIRE", KEYS[1], ARGV[1])
end

local ttl = redis.call("TTL", KEYS[1])

return {current, ttl}
`;

const rateLimit = ({
  windowSeconds = 60,
  maxRequests = 100,
  keyPrefix = "default",
  keyGenerator = (req) => `ip:${req.ip || "unknown"}`,
} = {}) => {
  return async (req, res, next) => {
    try {
      const identity = keyGenerator(req);
      const key = `ratelimit:${keyPrefix}:${identity}`;

      const result = await redisClient.eval(rateLimitScript, {
        keys: [key],
        arguments: [String(windowSeconds)],
      });

      const count = Number(result[0]);
      const ttl = Number(result[1]);

      const remaining = Math.max(0, maxRequests - count);

      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", remaining);
      res.setHeader("X-RateLimit-Reset", Math.max(0, ttl));

      if (count > maxRequests) {
        res.setHeader("Retry-After", Math.max(1, ttl));

        throw new ApiError(
          429,
          "Too many requests. Please try again later."
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export { rateLimit };