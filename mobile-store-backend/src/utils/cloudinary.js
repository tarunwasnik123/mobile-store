const cloudinary = require('../config/cloudinary');

// Upload buffer to Cloudinary
// type can be 'phones', 'news', 'upcoming-phones'
const uploadToCloudinary = (buffer, type) => {
  const base = process.env.CLOUDINARY_FOLDER || '';
  const folderPath = base ? `${base}/${type}` : type;
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folderPath, resource_type: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      },
    );
    uploadStream.end(buffer);
  });
};

module.exports = { uploadToCloudinary };
