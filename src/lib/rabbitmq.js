import amqp from "amqplib";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

let connection;
let channel;

const connectRabbitMQ = async () => {
  if (connection && channel) {
    return { connection, channel };
  }

  try {
    logger.info("Connecting to RabbitMQ");

    connection = await amqp.connect(env.RABBITMQ_URL);

    channel = await connection.createChannel();

    logger.info("RabbitMQ connected");

    connection.on("error", (error) => {
      logger.error(
        {
          err: error,
        },
        "RabbitMQ connection error"
      );
    });

    connection.on("close", () => {
      logger.warn("RabbitMQ connection closed");

      connection = null;
      channel = null;
    });

    return { connection, channel };
  } catch (error) {
    logger.error(
      {
        err: error,
      },
      "Failed to connect to RabbitMQ"
    );

    connection = null;
    channel = null;

    throw error;
  }
};

const getRabbitChannel = () => {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized");
  }

  return channel;
};

export {
  connectRabbitMQ,
  getRabbitChannel,
};