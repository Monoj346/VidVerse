import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { rateLimit } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.use(verifyJWT);

router
  .route("/")
  .get(
    rateLimit({
      windowSeconds: 60,
      maxRequests: 100,
      keyPrefix: "video-read",
      keyGenerator: (req) => `user:${req.user._id}`,
    }),
    getAllVideos
  )
  .post(
    rateLimit({
      windowSeconds: 3600,
      maxRequests: 10,
      keyPrefix: "video-upload",
      keyGenerator: (req) => `user:${req.user._id}`,
    }),
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    publishAVideo
  );

router
  .route("/toggle/publish/:videoId")
  .patch(
    rateLimit({
      windowSeconds: 60,
      maxRequests: 30,
      keyPrefix: "video-write",
      keyGenerator: (req) => `user:${req.user._id}`,
    }),
    togglePublishStatus
  );

router
  .route("/:videoId")
  .get(
    rateLimit({
      windowSeconds: 60,
      maxRequests: 100,
      keyPrefix: "video-read",
      keyGenerator: (req) => `user:${req.user._id}`,
    }),
    getVideoById
  )
  .delete(
    rateLimit({
      windowSeconds: 60,
      maxRequests: 30,
      keyPrefix: "video-write",
      keyGenerator: (req) => `user:${req.user._id}`,
    }),
    deleteVideo
  )
  .patch(
    rateLimit({
      windowSeconds: 60,
      maxRequests: 30,
      keyPrefix: "video-write",
      keyGenerator: (req) => `user:${req.user._id}`,
    }),
    upload.single("thumbnail"),
    updateVideo
  );



export default router;