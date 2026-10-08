import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${env.MONGODB_URI}/${DB_NAME}`
    );

    logger.info(
      {
        host: connectionInstance.connection.host,
        database: DB_NAME,
      },
      "MongoDB connected"
    );

    return connectionInstance;
  } catch (error) {
    logger.error(
      {
        err: error,
      },
      "MongoDB connection failed"
    );

    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();

    logger.info("MongoDB connection closed");
  } catch (error) {
    logger.error(
      {
        err: error,
      },
      "Failed to close MongoDB connection"
    );

    throw error;
  }
};

export {
  connectDB,
  disconnectDB,
};

export default connectDB;