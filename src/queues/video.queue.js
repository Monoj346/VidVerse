import { getRabbitChannel } from "../lib/rabbitmq.js";
import { logger } from "../utils/logger.js";

const VIDEO_PROCESSING_QUEUE = "video.processing";

const VIDEO_RETRY_1_QUEUE = "video.processing.retry.1";
const VIDEO_RETRY_2_QUEUE = "video.processing.retry.2";
const VIDEO_RETRY_3_QUEUE = "video.processing.retry.3";

const VIDEO_DLQ = "video.processing.dlq";

const VIDEO_PROCESSING_EXCHANGE = "video.processing.exchange";

const RETRY_DELAYS = {
  1: 5000,
  2: 15000,
  3: 30000,
};

const initVideoQueue = async () => {
  const channel = getRabbitChannel();

  await channel.assertExchange(
    VIDEO_PROCESSING_EXCHANGE,
    "direct",
    {
      durable: true,
    }
  );

  await channel.assertQueue(VIDEO_DLQ, {
    durable: true,
  });

  await channel.assertQueue(VIDEO_PROCESSING_QUEUE, {
    durable: true,
  });

  await channel.bindQueue(
    VIDEO_PROCESSING_QUEUE,
    VIDEO_PROCESSING_EXCHANGE,
    VIDEO_PROCESSING_QUEUE
  );

  await channel.assertQueue(VIDEO_RETRY_1_QUEUE, {
    durable: true,
    messageTtl: RETRY_DELAYS[1],
    deadLetterExchange: VIDEO_PROCESSING_EXCHANGE,
    deadLetterRoutingKey: VIDEO_PROCESSING_QUEUE,
  });

  await channel.assertQueue(VIDEO_RETRY_2_QUEUE, {
    durable: true,
    messageTtl: RETRY_DELAYS[2],
    deadLetterExchange: VIDEO_PROCESSING_EXCHANGE,
    deadLetterRoutingKey: VIDEO_PROCESSING_QUEUE,
  });

  await channel.assertQueue(VIDEO_RETRY_3_QUEUE, {
    durable: true,
    messageTtl: RETRY_DELAYS[3],
    deadLetterExchange: VIDEO_PROCESSING_EXCHANGE,
    deadLetterRoutingKey: VIDEO_PROCESSING_QUEUE,
  });

  logger.info(
    {
      queue: VIDEO_PROCESSING_QUEUE,
      retryQueues: [
        VIDEO_RETRY_1_QUEUE,
        VIDEO_RETRY_2_QUEUE,
        VIDEO_RETRY_3_QUEUE,
      ],
      dlq: VIDEO_DLQ,
    },
    "Video processing queues initialized"
  );
};

const publishVideoJob = async (job) => {
  const channel = getRabbitChannel();

  const message = Buffer.from(
    JSON.stringify({
      ...job,
      attempt: job.attempt || 0,
    })
  );

  const published = channel.publish(
    VIDEO_PROCESSING_EXCHANGE,
    VIDEO_PROCESSING_QUEUE,
    message,
    {
      persistent: true,
      contentType: "application/json",
    }
  );

  if (!published) {
    throw new Error("Failed to publish video job");
  }

  logger.info(
    {
      videoId: job.videoId,
      attempt: job.attempt || 0,
    },
    "Video processing job published"
  );

  return true;
};

const publishRetryJob = (job) => {
  const channel = getRabbitChannel();

  const nextAttempt = (job.attempt || 0) + 1;

  let retryQueue;

  if (nextAttempt === 1) {
    retryQueue = VIDEO_RETRY_1_QUEUE;
  } else if (nextAttempt === 2) {
    retryQueue = VIDEO_RETRY_2_QUEUE;
  } else {
    retryQueue = VIDEO_RETRY_3_QUEUE;
  }

  const message = Buffer.from(
    JSON.stringify({
      ...job,
      attempt: nextAttempt,
    })
  );

  const published = channel.sendToQueue(
    retryQueue,
    message,
    {
      persistent: true,
      contentType: "application/json",
    }
  );

  if (!published) {
    throw new Error("Failed to publish retry job");
  }

  logger.warn(
    {
      videoId: job.videoId,
      attempt: nextAttempt,
      retryQueue,
      delay: RETRY_DELAYS[Math.min(nextAttempt, 3)],
    },
    "Video processing job scheduled for retry"
  );

  return true;
};

export {
  VIDEO_PROCESSING_QUEUE,
  VIDEO_RETRY_1_QUEUE,
  VIDEO_RETRY_2_QUEUE,
  VIDEO_RETRY_3_QUEUE,
  VIDEO_DLQ,
  initVideoQueue,
  publishVideoJob,
  publishRetryJob,
};