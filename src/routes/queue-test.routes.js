import { Router } from "express";
import { publishQueueTest } from "../controllers/queue-test.controllers.js";

const router = Router();

router.post("/", publishQueueTest);

export default router;