import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema = new mongoose.Schema(
  {
    videoFile: {
    type: String,
    default: null,
    },

    thumbnail: {
      type: String,
      default: null,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    duration: {
      type: Number,
      default: null,
    },

    views: {
      type: Number,
      default: 0,
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    status: {
      type: String,
      enum: ["PROCESSING", "READY", "FAILED"],
      default: "PROCESSING",
      index: true,
    },

    processingError: {
    type: String,
    default: null,
    },

    processingAttempts: {
      type: Number,
      default: 0,
    },

    processingStartedAt: {
    type: Date,
    default: null,
    },

    processingCompletedAt: {
    type: Date,
    default: null,
    },
  },
  { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);

  export const Video = mongoose.model("Video", videoSchema);