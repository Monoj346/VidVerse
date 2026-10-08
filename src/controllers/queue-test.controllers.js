import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { publishVideoJob } from "../queues/video.queue.js";

const publishQueueTest = asyncHandler(async (req, res) => {
  const job = {
    type: "VIDEO_PROCESSING",
    videoId: "6a84e526e70829b2771671f1",
    userId: "test-user-123",
    filePath: "public/temp/non-existent-video.mp4",
    thumbnailPath: "public/temp/non-existent-thumbnail.jpg",
    timestamp: new Date().toISOString(),
  };

  await publishVideoJob(job);

  return res.status(202).json(
    new ApiResponse(
      202,
      job,
      "Video processing failure-test job published"
    )
  );
});

export {
  publishQueueTest,
};