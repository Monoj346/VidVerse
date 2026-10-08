import "./config/env.js";

import connectDB, {
  disconnectDB,
} from "./db/index.js";
import {
  connectRedis,
  disconnectRedis,
} from "./lib/redis.js";

import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { connectRabbitMQ } from "./lib/rabbitmq.js";
import { initVideoQueue } from "./queues/video.queue.js";

let server;

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();
    await connectRabbitMQ();
    await initVideoQueue();

    server = app.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
          environment: env.NODE_ENV,
        },
        "Server started"
      );
    });
  } catch (error) {
    logger.fatal(
      {
        err: error,
      },
      "Failed to start server"
    );

    process.exit(1);
  }
};

const shutdown = async (signal) => {
  logger.info(
    {
      signal,
    },
    "Shutdown signal received"
  );

  if (!server) {
    await disconnectDB();
    process.exit(0);
  }

  server.close(async () => {
  logger.info("HTTP server closed");

  await disconnectRedis();
  await disconnectDB();

  process.exit(0);
  });
};

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

startServer();

/*
import express from "express"
const app=express()

(async()=>{
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    app.on("error",(error)=>{
      console.log("Error: ",error);
      throw error;
    })
    app.listen(process.env.PORT,()=>{
      console.log(`App is listening on port ${process.env.PORT}`)
    })

  } catch (error) {
    console.error("ERROR: ",error)
    throw error
  }
})()
  */
