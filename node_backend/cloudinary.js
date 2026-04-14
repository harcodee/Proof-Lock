/**
 * cloudinary.js — Cloudinary configuration & upload helpers
 *
 * Exports two functions:
 *   uploadImage(filePath)  → { secure_url, public_id }
 *   uploadVideo(filePath)  → { secure_url, public_id }
 *
 * Credentials are read from environment variables (set in .env locally,
 * and in Render's Environment Variables on production).
 */
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dthjjuegt",
  api_key: process.env.CLOUDINARY_API_KEY || "213917558148869",
  api_secret: process.env.CLOUDINARY_API_SECRET || "ww2ngf-nHIMmSqbLNZ6ReOF8-lU",
  secure: true,
});

/**
 * Upload a local image file to Cloudinary.
 * @param {string} filePath  absolute or relative path to the image file
 * @param {string} [folder]  Cloudinary folder (default: "proof-lock/images")
 * @returns {Promise<{secure_url: string, public_id: string}>}
 */
async function uploadImage(filePath, folder = "proof-lock/images") {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: "image",
    // Auto-detect best format & quality
    quality: "auto",
    fetch_format: "auto",
  });
  return { secure_url: result.secure_url, public_id: result.public_id };
}

/**
 * Upload a local video file to Cloudinary.
 * @param {string} filePath  absolute or relative path to the video file
 * @param {string} [folder]  Cloudinary folder (default: "proof-lock/videos")
 * @returns {Promise<{secure_url: string, public_id: string}>}
 */
async function uploadVideo(filePath, folder = "proof-lock/videos") {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: "video",
  });
  return { secure_url: result.secure_url, public_id: result.public_id };
}

module.exports = { uploadImage, uploadVideo, cloudinary };
