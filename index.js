import express from "express";
import dotenv from "dotenv";
import cloudinary from "cloudinary";
import axios from "axios";

dotenv.config();
const app = express();
app.use(express.json());

// Cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload route
app.post("/upload", async (req, res) => {
  try {
    const { image_urls } = req.body;

    if (!image_urls) {
      return res.status(400).json({ success: false, message: "No image_urls provided" });
    }

    const urls = typeof image_urls === "string" ? image_urls.split(",") : [];

    const folderName = "voiceflow-uploads";

    const uploadedUrls = [];

    for (let url of urls) {
      const response = await cloudinary.v2.uploader.upload(url.trim(), {
        folder: folderName,
        type: "upload",
        resource_type: "image"
      });
      uploadedUrls.push(response.secure_url);
    }

    return res.status(200).json({
      success: true,
      uploaded_images: uploadedUrls,
      folder: folderName
    });

  } catch (err) {
    console.error("Upload Error:", err);
    return res.status(500).json({
      success: false,
      message: "Upload failed",
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
