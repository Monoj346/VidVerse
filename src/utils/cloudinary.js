import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath, options = {}) => {
  if (!localFilePath) {
    throw new Error("Local file path is required");
  }

  const uploadOptions = {
    resource_type: options.resourceType || "auto",
  };

  if (options.folder) {
    uploadOptions.folder = options.folder;
  }

  if (options.publicId) {
    uploadOptions.public_id = options.publicId;
    uploadOptions.overwrite = true;
  }

  const response = await cloudinary.uploader.upload(
    localFilePath,
    uploadOptions
  );

  return response;
};

export { uploadOnCloudinary };