import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content}=req.body
    const ownerId=req.user._id
    if(!content){
      throw new ApiError(400,"Tweet content should not be empty")
    }

    const newTweet= await Tweet.create({content,owner:ownerId})

    if(!newTweet){
      throw new ApiError(500,"Something went wrong while creating tweet")
    }

    return res.status(200).json(
      new ApiResponse(200,newTweet,"Tweet created successfully")
    )
})

// const getUserTweets = asyncHandler(async (req, res) => {
//     // TODO: get user tweets
//     const {username}=req.params
    
//     if(!username?.trim()){
//     throw new ApiError(400,"Username is missing")
//     }

//     const userWithTweets=await User.aggregate([
//       {
//       $match:{
//         username:username?.toLowerCase()
//       }
//       },
//       {
//         $lookup:{
//           from:"tweets",
//           localField:"_id",
//           foreignField:"owner",
//           as:"tweets",
//         }
//       },
//       {
//         $project:{
//           owner:1,
//           fullname:1,
//           tweets:1
//         }
//       }
//     ])

//       if (!userWithTweets.length) {
//         throw new ApiError(404, "User not found");
//       }

//       res.status(200).json(
//         new ApiResponse(200,userWithTweets[0],"User tweets fetched successfully")
//       );
// })

// const getUserTweets = asyncHandler(async (req, res) => {
//   const { username } = req.params;

//   if (!username?.trim()) {
//     throw new ApiError(400, "Username is missing");
//   }

//   const userWithTweets = await User.aggregate([
//     {
//       $match: {
//         username: username.toLowerCase()
//       }
//     },
//     {
//       $lookup: {
//         from: "tweets",
//         localField: "_id",
//         foreignField: "owner",
//         as: "tweets"
//       }
//     },
//     {
//       $project: {
//         _id: 0,
//         username: 1,
//         name: 1,
//         tweets: {
//           $map: {
//             input: "$tweets",
//             as: "tweet",
//             in: {
//               content: "$$tweet.content",
//               createdAt: "$$tweet.createdAt"
//             }
//           }
//         }
//       }
//     }
//   ]);

//   if (!userWithTweets.length) {
//     throw new ApiError(404, "User not found");
//   }

//   res.status(200).json({
//     success: true,
//     data: userWithTweets[0]
//   });
// });

const getUserTweets = asyncHandler(async (req, res) => {
  // Extracting userId from request parameters
  const { userId } = req.params;

  // We need to ensure the provided user ID is a valid MongoDB ObjectId
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  // Fetch tweets from the database
  // We query the Tweet collection for tweets where the 'owner' field matches the userId
  // We also sort the tweets by 'createdAt' in descending order (-1) to show the latest tweets first
  const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 });

  //  Handle case where no tweets are found
  if (!tweets || tweets.length === 0) {
    throw new ApiError(404, "Tweets are not found");
  }

  // Return the response with tweets
  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "User tweets fetched successfully"));

  /*
Fetching User Tweets - Notes:

👉 Why do we use `.sort({ createdAt: -1 })`?
   - Sorting ensures that the newest tweets appear first in the response.
   - `-1` means descending order, so the most recent tweets are shown first.

*/
});


const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId}=req.params
    const {content}=req.body
    const user=req.user._id

    if(!isValidObjectId(tweetId)){
      throw new ApiError(400,"Invalid tweet Id")
    }

    const tweet=await Tweet.findById(tweetId);

    if(!tweet){
      throw new ApiError(404,"Tweet Not found")
    }

    if(tweet.owner.toString()!== user.toString()){
      throw new ApiError(403,"You can only update your own tweet")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
    );

    if(!updatedTweet){
      throw new ApiError(500,"Something went wrong while updating the tweet")
    }

    return res.status(200).json(
       new ApiResponse(200,updatedTweet,"Tweet updated successfully")
    )

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId}=req.params
    const user=req.user._id

    if(!isValidObjectId(tweetId)){
      throw new ApiError(400,"Invalid tweet Id")
    }

    const tweet=await Tweet.findById(tweetId);

    if(!tweet){
      throw new ApiError(404,"Tweet Not found")
    }

    if(tweet.owner.toString()!== user.toString()){
      throw new ApiError(403,"You can only delete your own tweet")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    if(!deletedTweet){
      throw new ApiError(500,"Something went wrong while deleting the tweet")
    }

    return res.status(200).json(
       new ApiResponse(200,deletedTweet,"Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}