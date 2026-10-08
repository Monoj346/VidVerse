import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { redisClient } from "../lib/redis.js";

const healthcheck = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { status: "OK" },
        "Service is running smoothly"
      )
    );
});

const liveness = asyncHandler(async (req, res) => {
  return res.status(200).json({
    success: true,
    status: "UP",
    service: "videotube-api",
    timestamp: new Date().toISOString(),
  });
});

const readiness = asyncHandler(async (req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;
  const redisReady = redisClient.isReady;

  if (!mongoReady || !redisReady) {
    return res.status(503).json({
      success: false,
      status: "NOT_READY",
      service: "videotube-api",
      dependencies: {
        mongodb: mongoReady ? "UP" : "DOWN",
        redis: redisReady ? "UP" : "DOWN",
      },
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(200).json({
    success: true,
    status: "READY",
    service: "videotube-api",
    dependencies: {
      mongodb: "UP",
      redis: "UP",
    },
    timestamp: new Date().toISOString(),
  });
});

export {
  healthcheck,
  liveness,
  readiness,
};