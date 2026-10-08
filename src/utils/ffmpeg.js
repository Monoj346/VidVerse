import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath("/usr/bin/ffmpeg");
ffmpeg.setFfprobePath("/usr/bin/ffprobe");

export const getVideoDuration = (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const duration = metadata?.format?.duration;

      if (typeof duration !== "number") {
        reject(new Error("Unable to determine video duration"));
        return;
      }

      resolve(duration);
    });
  });
};