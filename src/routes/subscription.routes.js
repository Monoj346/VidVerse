import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controllers.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

// router
//     .route("/c/:channelId")
//     .get(getSubscribedChannels)
//     .post(toggleSubscription);

// router.route("/u/:subscriberId").get(getUserChannelSubscribers);

router
  .route("/c/:channelId")
  .post(toggleSubscription)         // toggleSubscription is about channelId, good
router
  .route("/u/:subscriberId")
  .get(getSubscribedChannels);      // This gets channels user subscribed to by subscriberId

router
  .route("/s/:channelId")
  .get(getUserChannelSubscribers);  // This returns list of subscribers of channel


export default router