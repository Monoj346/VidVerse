import { Router } from "express";
import { 
  loginUser,
  logoutUser, 
  registerUser,
  refreshAccessToken, 
  changeCurrentPassword, 
  updateAccountDetails, 
  updateUserAvatar, 
  getUserChannelProfile, 
  getWatchHistory, 
  getCurrentUser
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { rateLimit } from "../middlewares/rateLimit.middleware.js";

const router= Router()

router.route("/register").post(
  rateLimit({
    windowSeconds: 60,
    maxRequests: 5,
    keyPrefix: "register",
  }),
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(
  rateLimit({
    windowSeconds: 60,
    maxRequests: 5,
    keyPrefix: "login",
  }),
  loginUser
);

//secured routes
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)

router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserAvatar)

router.route("/c/:username").get(verifyJWT,getUserChannelProfile)

router.route("/history").get(verifyJWT,getWatchHistory)

export default router