import "../config/env.js";
import connectDB from "../db/index.js";

import { connectRabbitMQ, getRabbitChannel } from "../lib/rabbitmq.js";
import {
  VIDEO_PROCESSING_QUEUE,
  VIDEO_DLQ,
  initVideoQueue,
  publishRetryJob,
} from "../queues/video.queue.js";

import { logger } from "../utils/logger.js";
import { getVideoDuration } from "../utils/ffmpeg.js";
import { Video } from "../models/video.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

import fs from "fs";

const cleanupTempFile = (filePath) => {
  if (!filePath) return;

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);

      logger.info(
        {
          filePath,
        },
        "Temporary file deleted"
      );
    }
  } catch (error) {
    logger.warn(
      {
        err: error,
        filePath,
      },
      "Failed to delete temporary file"
    );
  }
};

const processVideo = async (job) => {
  const {
    videoId,
    videoLocalPath,
    thumbnailLocalPath,
  } = job;

  const attempt = job.attempt || 0;

  const video = await Video.findOneAndUpdate(
    {
      _id: videoId,
      status: "PROCESSING",
    },
    {
      $set: {
        processingStartedAt: new Date(),
        processingError: null,
      },
      $inc: {
        processingAttempts: 1,
      },
    },
    {
      new: true,
    }
  );

  if (!video) {
    const existingVideo = await Video.findById(videoId);

    if (!existingVideo) {
      throw new Error(`Video not found: ${videoId}`);
    }

    if (existingVideo.status === "READY") {
      logger.info(
        {
          videoId,
          attempt,
        },
        "Video already processed, skipping duplicate job"
      );

      return;
    }

    throw new Error(
      `Video cannot be processed. Current status: ${existingVideo.status}`
    );
  }

  logger.info(
    {
      videoId,
      attempt,
    },
    "Starting video processing"
  );

  /*
   * Step 1: Detect video duration
   */
  const duration = await getVideoDuration(videoLocalPath);

  logger.info(
    {
      videoId,
      duration,
    },
    "Video duration detected"
  );

  /*
   * Step 2: Upload thumbnail
   */
  const thumbnail = await uploadOnCloudinary(
    thumbnailLocalPath,
    {
      resourceType: "image",
      folder: "videotube/thumbnails",
      publicId: videoId,
    }
  );

  logger.info(
    {
      videoId,
      publicId: thumbnail.public_id,
    },
    "Thumbnail uploaded"
  );

  /*
   * Step 3: Upload video
   */
  const videoFile = await uploadOnCloudinary(
    videoLocalPath,
    {
      resourceType: "video",
      folder: "videotube/videos",
      publicId: videoId,
    }
  );

  logger.info(
    {
      videoId,
      publicId: videoFile.public_id,
    },
    "Video uploaded"
  );

  /*
   * Step 4: Update MongoDB
   */
  await Video.findByIdAndUpdate(videoId, {
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    duration,
    status: "READY",
    processingCompletedAt: new Date(),
    processingError: null,
  });

  /*
   * Step 5: Delete temporary files
   */
  cleanupTempFile(videoLocalPath);
  cleanupTempFile(thumbnailLocalPath);

  logger.info(
    {
      videoId,
    },
    "Video processing completed"
  );
};

const moveToDLQ = async (job, error) => {
  const channel = getRabbitChannel();

  const message = Buffer.from(
    JSON.stringify({
      ...job,
      failedAt: new Date().toISOString(),
      error: error.message,
    })
  );

  channel.sendToQueue(
    VIDEO_DLQ,
    message,
    {
      persistent: true,
      contentType: "application/json",
    }
  );

  await Video.findByIdAndUpdate(job.videoId, {
    status: "FAILED",
    processingError: error.message,
  });

  /*
   * The job will not be retried anymore,
   * so its temporary files can be removed.
   */
  cleanupTempFile(job.videoLocalPath);
  cleanupTempFile(job.thumbnailLocalPath);

  logger.error(
    {
      videoId: job.videoId,
      attempt: job.attempt || 0,
      error: error.message,
      dlq: VIDEO_DLQ,
    },
    "Video processing moved to DLQ"
  );
};

const startWorker = async () => {
  try {
    /*
     * Connect to MongoDB
     */
    await connectDB();

    /*
     * Connect to RabbitMQ
     */
    await connectRabbitMQ();

    /*
     * Initialize processing queues
     */
    await initVideoQueue();

    const channel = getRabbitChannel();

    /*
     * Process only one video at a time per worker.
     */
    channel.prefetch(1);

    logger.info(
      {
        queue: VIDEO_PROCESSING_QUEUE,
      },
      "Video worker started"
    );

    await channel.consume(
      VIDEO_PROCESSING_QUEUE,
      async (message) => {
        if (!message) {
          return;
        }

        let job;

        try {
          /*
           * Parse RabbitMQ message
           */
          job = JSON.parse(
            message.content.toString()
          );

          logger.info(
            {
              videoId: job.videoId,
              userId: job.userId,
              attempt: job.attempt || 0,
            },
            "Video processing job received"
          );

          /*
           * Process video
           */
          await processVideo(job);

          /*
           * Tell RabbitMQ that the job
           * was successfully processed.
           */
          channel.ack(message);
        } catch (error) {
          logger.error(
            {
              err: error,
              videoId: job?.videoId,
              attempt: job?.attempt || 0,
            },
            "Video processing failed"
          );

          const attempt = job?.attempt || 0;

          try {
            /*
             * Retry up to 3 times.
             */
            if (attempt < 3) {
              publishRetryJob(job);

              /*
               * Remove the current message from
               * the processing queue.
               */
              channel.ack(message);
            } else {
              /*
               * Maximum retries reached.
               * Move the job to DLQ.
               */
              await moveToDLQ(
                job,
                error
              );

              /*
               * Remove the failed message
               * from the processing queue.
               */
              channel.ack(message);
            }
          } catch (retryError) {
            logger.error(
              {
                err: retryError,
                videoId: job?.videoId,
              },
              "Failed to handle video processing failure"
            );

            /*
             * If retry/DLQ handling itself fails,
             * reject the message without requeueing.
             */
            channel.nack(
              message,
              false,
              false
            );
          }
        }
      }
    );
  } catch (error) {
    logger.fatal(
      {
        err: error,
      },
      "Video worker failed to start"
    );

    process.exit(1);
  }
};

startWorker();