import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscription.models.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Comment} from "../models/comment.models.js"
import {Tweet} from "../models/tweet.models.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  // const totalVideos = await Video.countDocuments({ owner: userId });

  // if (totalVideos === null || totalVideos === undefined) {
  //   throw new ApiError(
  //     500,
  //     "Something went wrong while displaying total videos"
  //   );
  // }

  //using mongodb aggregate function    
    const userId=req.user._id
    const totalVideos= await Video.aggregate([
        {
            $match: {
                owner:userId
            },
        },
        {
            $count: "totalVideos"
        },
        {
            $project: {
                _id:0,
                totalVideos:1
            }
        }
    ])

    if(!totalVideos){
        throw new ApiError(500,"Something went wrong while displaying total videos")
    }

  //   const totalSubscribers = await Subscription.countDocuments({
  //   channel: userId,
  // });

  // if (totalSubscribers === null || totalSubscribers === undefined) {
  //   throw new ApiError(
  //     500,
  //     "Something went wrong while displaying total subscribers"
  //   );
  // }

  //using mongodb aggregate function
    const totalSubscribers=await Subscription.aggregate([
        {
            $match: {
                channel:userId
            },
        },
        {
            $count: "totalSubscribers"
        },
        {
            $project: {
                _id:0,
                totalSubscribers:1
            }
        }
    ])

    if(!totalSubscribers){
        throw new ApiError(500,"Something went wrong while displaying total subscribers")
    }

  // const totalVideoLikes = await Like.countDocuments({
  //   video: {
  //     $in: await Video.find({ owner: userId }).distinct("_id"),
  //   },
  // });

  // if (totalVideoLikes === null || totalVideoLikes === undefined) {
  //   throw new ApiError(
  //     500,
  //     "Something went wrong while displaying total likes"
  //   );
  // }  

  //using mongodb aggregate function  
    const totalVideoLikes=await Like.aggregate([
        {
            $match: {
                video: {
                    $in: await Video.find({ owner: userId }).distinct("_id"),
                },
            },
        },
        {
            $count: "totalVideoLikes"
        },
        {
            $project: {
                _id:0,
                totalVideoLikes:1
            }
        }
    ])

    if(!totalVideoLikes){
        throw new ApiError(500,"Something went wrong while displaying total likes")
    }

  //   const totalTweetLikes = await Like.countDocuments({
  //   tweet: {
  //     $in: await Tweet.find({ owner: userId }).distinct("_id"),
  //   },
  // });

  // if (totalTweetLikes === null || totalTweetLikes === undefined) {
  //   throw new ApiError(
  //     500,
  //     "Something went wrong while displaying total tweet likes"
  //   );
  // }

  //using mongodb aggregate function
    const totalTweetLikes=await Like.aggregate([
        {
            $match: {
                tweet: {
                    $in: await Tweet.find({ owner: userId }).distinct("_id"),
                },
            },
        },
        {
            $count: "totalTweetLikes"
        },
        {
            $project: {
                _id:0,
                totalTweetLikes:1
            }
        }
    ])

    if(!totalTweetLikes){
        throw new ApiError(500,"Something went wrong while displaying total tweet likes")
    }

  //   const totalCommentLikes = await Like.countDocuments({
  //   comment: {
  //     $in: await Comment.find({ owner: userId }).distinct("_id"),
  //   },
  // });

  // if (totalCommentLikes === null || totalCommentLikes === undefined) {
  //   throw new ApiError(
  //     500,
  //     "Something went wrong while displaying total comment likes"
  //   );
  // }

  //using mongodb aggregate function
    const totalCommentLikes=await Like.aggregate([
        {
            $match: {
                comment: {
                    $in: await Comment.find({ owner: userId }).distinct("_id"),
                },
            },
        },
        {
            $count: "totalCommentLikes"
        },
        {
            $project: {
                _id:0,
                totalCommentLikes:1
            }
        }
    ])

    if(!totalCommentLikes){
        throw new ApiError(500,"Something went wrong while displaying total comment likes")
    }

  //   const totalViews = await Video.aggregate([
  //   { $match: { owner: userId } },
  //   {
  //     $group: {
  //       _id: null,
  //       totalViews: { $sum: "$views" }, // Sum up the `views` field
  //     },
  //   },
  // ]);

  // if (totalViews === null || totalViews === undefined) {
  //   throw new ApiError(
  //     500,
  //     "Something went wrong while displaying total views"
  //   );
  // }

  //using mongodb aggregate function
    const totalViews=await Video.aggregate([
        {
            $match: {
                owner: userId
            },
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" }, // Sum up the `views` field
            },
        },
    ])

    if(!totalViews){
        throw new ApiError(500,"Something went wrong while displaying total views")
    }

  //    res.status(200).json(
  //   new ApiResponse(
  //     200,
  //     {
  //       totalVideos,
  //       totalSubscribers,
  //       totalVideoLikes,
  //       totalTweetLikes,
  //       totalCommentLikes,
  //       totalViews: totalViews[0]?.totalViews || 0, // Default to 0 if no views are found
  //     },
  //     "Channel stats fetched successfully"
  //   )
  // );


    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                totalVideos:totalVideos[0]?.totalVideos||0,
                totalSubscribers:totalSubscribers[0]?.totalSubscribers||0,
                totalVideoLikes:totalVideoLikes[0]?.totalVideoLikes||0,
                totalTweetLikes:totalTweetLikes[0]?.totalTweetLikes||0,
                totalCommentLikes:totalCommentLikes[0]?.totalCommentLikes||0,
                totalViews:totalViews[0]?.totalViews||0
            },
            "Channel stats displayed successfully"
        )
    )
    
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user._id;
    const videos = await Video.find({
    owner: userId,
  }).sort({
    createdAt: -1, // Sorting videos in descending order (newest first)
  });

  // - This ensures that the client knows when a channel has no videos.
  if (!videos || videos.length === 0) {
    throw new ApiError(404, "No videos found for this channel");
  }

  res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
})

export {
    getChannelStats, 
    getChannelVideos
    }