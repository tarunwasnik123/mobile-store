const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Phone = require('../src/models/Phone');
const UpcomingPhone = require('../src/models/UpcomingPhone');
const News = require('../src/models/News');

require('dotenv').config();

// Load cloudinary config
require('../src/config/cloudinary');

const { uploadToCloudinary } = require('../src/utils/cloudinary');

async function uploadImagesForCollection(Model, imageDir, folder) {
  console.log(`📸 Uploading images for ${Model.modelName}...`);

  const items = await Model.find({}).lean();
  let updated = 0;

  for (const item of items) {
    const updates = {};

    // Upload main image
    if (item.image && !item.image.startsWith('http')) {
      const imagePath = path.join(imageDir, item.image);
      if (fs.existsSync(imagePath)) {
        try {
          const buffer = fs.readFileSync(imagePath);
          const cloudinaryUrl = await uploadToCloudinary(buffer, folder);
          updates.image = cloudinaryUrl;
          console.log(`✅ Uploaded ${item.image} -> ${cloudinaryUrl}`);
        } catch (error) {
          console.error(`❌ Failed to upload ${item.image}:`, error.message);
        }
      }
    }

    // Upload images array
    if (item.images && Array.isArray(item.images)) {
      const newImages = [];
      for (const img of item.images) {
        if (img && !img.startsWith('http')) {
          const imagePath = path.join(imageDir, img);
          if (fs.existsSync(imagePath)) {
            try {
              const buffer = fs.readFileSync(imagePath);
              const cloudinaryUrl = await uploadToCloudinary(buffer, folder);
              newImages.push(cloudinaryUrl);
              console.log(`✅ Uploaded ${img} -> ${cloudinaryUrl}`);
            } catch (error) {
              console.error(`❌ Failed to upload ${img}:`, error.message);
              newImages.push(img); // Keep original if upload fails
            }
          } else {
            newImages.push(img); // Keep original if file doesn't exist
          }
        } else {
          newImages.push(img); // Keep Cloudinary URLs as-is
        }
      }
      if (newImages.length > 0) {
        updates.images = newImages;
      }
    }

    // Update the item if we have changes
    if (Object.keys(updates).length > 0) {
      await Model.findByIdAndUpdate(item._id, updates);
      updated++;
    }
  }

  console.log(`📸 Updated ${updated} ${Model.modelName} items`);
}

async function main() {
  console.log('🚀 Starting image upload process...');
  console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log(
    'CLOUDINARY_API_KEY:',
    process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET',
  );
  console.log(
    'CLOUDINARY_API_SECRET:',
    process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET',
  );

  // Test Cloudinary connection
  const cloudinary = require('../src/config/cloudinary');
  console.log('Cloudinary config test:', cloudinary.config().cloud_name);

  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/mobile-store';
  await mongoose.connect(uri);
  console.log('✅ Connected to', uri);

  const bulkRoot = path.resolve(
    __dirname,
    '..',
    '..',
    'Handsetnews bulk upload',
  );

  try {
    // Upload phone images
    const phonesImageDir = path.join(bulkRoot, 'phones-upload', 'images');
    await uploadImagesForCollection(Phone, phonesImageDir, 'phones');

    // Upload upcoming phone images
    const upcomingImageDir = path.join(bulkRoot, 'upcoming-upload', 'images');
    await uploadImagesForCollection(
      UpcomingPhone,
      upcomingImageDir,
      'upcoming',
    );

    // Upload news images
    const newsImageDir = path.join(bulkRoot, 'news-upload', 'images');
    await uploadImagesForCollection(News, newsImageDir, 'news');

    console.log('🎉 All images uploaded successfully!');
  } catch (error) {
    console.error('❌ Error uploading images:', error);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(console.error);
