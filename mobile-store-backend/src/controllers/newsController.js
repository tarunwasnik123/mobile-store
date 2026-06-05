const newsService = require('../services/news.service');
const cloudinary = require('../config/cloudinary');

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer, folder) => {
  const base = process.env.CLOUDINARY_FOLDER || '';
  const folderPath = base ? `${base}/${folder}` : folder;
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

exports.list = async (req, res) => {
  try {
    const data = await newsService.list(req.query);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch news' });
  }
};

exports.get = async (req, res) => {
  try {
    const article = await newsService.getByIdOrExternalId(req.params.id);
    res.json(article);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message || 'Failed to fetch news',
    });
  }
};

exports.create = async (req, res) => {
  try {
    let imageUrl;

    if (req.file) {
      try {
        imageUrl = await uploadToCloudinary(req.file.buffer, 'news');
      } catch (uploadErr) {
        console.error('Cloudinary upload error:', uploadErr);
        return res.status(500).json({ message: 'Image upload failed' });
      }
    }

    const author = req.user
      ? {
          userId: req.user._id,
          name: req.user.name || req.user.email,
          role: req.user.role,
        }
      : { name: 'admin', role: 'admin' };

    const article = await newsService.create({
      ...req.body,
      image: imageUrl || undefined,
      createdBy: author,
    });

    res.status(201).json(article);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({
      message: err.message || 'Failed to create news',
    });
  }
};

exports.update = async (req, res) => {
  try {
    let data = { ...req.body };

    if (req.file) {
      try {
        data.image = await uploadToCloudinary(req.file.buffer, 'news');
      } catch (uploadErr) {
        console.error('Cloudinary upload error:', uploadErr);
        return res.status(500).json({ message: 'Image upload failed' });
      }
    }

    const article = await newsService.update(req.params.id, data);
    res.json(article);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message || 'Failed to update news',
    });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const imageUrl = await uploadToCloudinary(req.file.buffer, 'news-content');
    res.json({ location: imageUrl });
  } catch (err) {
    console.error('Image upload error:', err);
    res.status(500).json({ message: 'Image upload failed' });
  }
};

exports.remove = async (req, res) => {
  try {
    await newsService.remove(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message || 'Failed to delete news',
    });
  }
};
