import { Router } from "express";

import {
  healthcheck,
  liveness,
  readiness,
} from "../controllers/healthcheck.controllers.js";

const router = Router();

router.route("/").get(healthcheck);

router.route("/live").get(liveness);

router.route("/ready").get(readiness);

export default router;