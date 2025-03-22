// dependencies
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const FormData = require('form-data');

const app = express();
app.use(express.json());

// your Cloudinary config
const CLOUD_NAME = 'your_cloud_name';
const API_KEY = 'your_api_key';
const API_SECRET = 'your_api_secret';
const FOLDER_NAME = 'uploaded_from_voiceflow';

function generateSignature(paramsToSign) {
  const sortedParams = Object.keys(paramsToSign).sort().map(key => `${key}=${paramsToSign[key]}`).join('&');
  const signature = crypto.createHash('sha1').update(sortedParams + API_SECRET).digest('hex');
  return signature;
}

app.post('/upload-images', async (req, res) => {
  const imageUrls = req.body.image_urls_combined; // assume this is an array of URLs

  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return res.status(400).json({ error: 'No image URLs provided' });
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const uploadResults = [];

    for (const [index, imageUrl] of imageUrls.entries()) {
      const paramsToSign = {
        folder: FOLDER_NAME,
        timestamp,
      };
      const signature = generateSignature(paramsToSign);

      const form = new FormData();
      form.append('file', imageUrl);
      form.append('api_key', API_KEY);
      form.append('timestamp', timestamp);
      form.append('signature', signature);
      form.append('folder', FOLDER_NAME);

      const uploadResponse = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        form,
        { headers: form.getHeaders() }
      );

      uploadResults.push(uploadResponse.data.secure_url);
    }

    // return array of public image URLs as fallback
    res.json({
      message: 'Uploaded successfully!',
      image_urls: uploadResults,
      folder_url: `https://res.cloudinary.com/${CLOUD_NAME}/image/list/${FOLDER_NAME}.json`
    });
  } catch (err) {
    console.error('Upload failed:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Image upload failed', details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

