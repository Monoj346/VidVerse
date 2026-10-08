import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { env } from "./config/env.js";

import userRouter from "./routes/user.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import queueTestRoutes from "./routes/queue-test.routes.js";

import { requestId } from "./middlewares/requestId.middleware.js";
import { requestLogger } from "./middlewares/requestLogger.middleware.js";
import {
  notFoundHandler,
  errorHandler,
} from "./middlewares/error.middleware.js";

const app = express();

app.set("trust proxy", 1);

/*
 * Security
 */

app.disable("x-powered-by");

app.use(
  helmet({
    strictTransportSecurity:
      env.NODE_ENV === "production",
  })
);

/*
 * Request tracking
 */
app.use(requestId);
app.use(requestLogger);
/*
 * CORS
 */
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

/*
 * Body parsing
 */
app.use(express.json({ limit: "16kb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);

/*
 * Static files
 */
app.use(express.static("public"));

/*
 * Cookies
 */
app.use(cookieParser());

/*
 * Routes
 */
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/queue-test", queueTestRoutes);

/*
 * 404
 */
app.use(notFoundHandler);

/*
 * Global error handler
 */
app.use(errorHandler);

export { app };