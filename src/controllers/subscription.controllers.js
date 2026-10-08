import { isValidObjectId } from "mongoose";
import mongoose from "mongoose";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user._id;

  
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }


  if (subscriberId.toString() === channelId.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  
  const existingSubscription = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  });

  
  if (existingSubscription) {
    // Remove the existing subscription (unsubscribe)
    await Subscription.findByIdAndDelete(existingSubscription._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Unsubscribed successfully"));
  }

  
  await Subscription.create({ subscriber: subscriberId, channel: channelId });
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Subscribed successfully"));

  
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  
  // This returns list of subscribers of channel

  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const channelObjectId = new mongoose.Types.ObjectId(channelId);

  const channelSubs = await Subscription.aggregate([
    {
      $match: {
        channel: channelObjectId,
      },
    },
    {
      $lookup: {
        from: "users",       // assuming channels are users
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberDetails",
      },
    },
    {
      $unwind: "$subscriberDetails"
    },
    {
      $project: {
        _id: 0,
        subscriberId: "$subscriberDetails._id",
        subscriberName: "$subscriberDetails.name",   // assuming User has a 'name' field
        // add more channel fields if needed
      },
    },
  ]);
  if(!channelSubs){
    throw new ApiError(404,"No channel found")
  }
  return res.status(200).json(new ApiResponse(200,channelSubs,"Subscribers fetched successfully"))

  // const channelId = req.user._id;

  // // Validate if the channel ID is a valid MongoDB ObjectId
  // if (!isValidObjectId(channelId)) {
  //   throw new ApiError(400, "Invalid channel ID");
  // }

  

  // const subscribersDocs = await Subscription.find({
  //   channel: channelId,
  // }).populate("subscriber", "_id name email");

  // // If no subscribers are found, return a 404 error.
  // if (!subscribersDocs) {
  //   throw new ApiError(404, "No subscribers found for this channel");
  // }

  
  // return res
  //   .status(200)
  //   .json(
  //     new ApiResponse(200, subscribersDocs, "Subscribers fetched successfully")
  //   );

  
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
   // This gets channels user subscribed to by subscriberId

  const {subscriberId}=req.params
  if(!isValidObjectId(subscriberId)){
    throw new ApiError(400,"Invalid subscriber ID")
  }

  const subscriberObjectId =new  mongoose.Types.ObjectId(subscriberId);

  const channelSubs = await Subscription.aggregate([
  {
    $match: {
      subscriber: subscriberObjectId,
    },
  },
  {
    $lookup: {
      from: "users",       // assuming channels are users
      localField: "channel",
      foreignField: "_id",
      as: "channelDetails",
    },
  },
  {
    $unwind: "$channelDetails"
  },
  {
    $project: {
      _id: 0,
      channelId: "$channelDetails._id",
      channelName: "$channelDetails.name",   // assuming User has a 'name' field
      // add more channel fields if needed
    },
  },
]);

  if(!channelSubs){
    throw new ApiError(404,"No channel found")
  }
  return res.status(200).json(new ApiResponse(200,channelSubs,"Subscribed channels fetched successfully"))
  

  // const subscriberId = req.user._id;

  

  // const subscribedChannels = await Subscription.find({
  //   subscriber: subscriberId,
  // }).populate("channel", "_id name email");

  
  // if (!subscribedChannels || subscribedChannels.length === 0) {
  //   throw new ApiError(404, "No subscribed channels found");
  // }

  
  // return res
  //   .status(200)
  //   .json(
  //     new ApiResponse(
  //       200,
  //       subscribedChannels,
  //       "Subscribed channels fetched successfully"
  //     )
  //   );

    
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };