const phoneService = require('../services/phone.service');
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

const collectUploadFiles = (req) => {
  const files = [];
  if (req.file) files.push(req.file);
  if (req.files) {
    if (Array.isArray(req.files)) files.push(...req.files);
    if (Array.isArray(req.files.image)) files.push(...req.files.image);
    if (Array.isArray(req.files.images)) files.push(...req.files.images);
  }
  return files;
};

const parseBodyImages = (body) => {
  if (Array.isArray(body?.images)) {
    return body.images.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof body?.images === 'string' && body.images.trim()) {
    try {
      const parsed = JSON.parse(body.images);
      if (Array.isArray(parsed)) {
        return parsed.map((x) => String(x).trim()).filter(Boolean);
      }
    } catch {
      return body.images
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
    }
  }
  if (typeof body?.image === 'string' && body.image.trim()) {
    return [body.image.trim()];
  }
  return [];
};

const toBool = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const t = value.trim().toLowerCase();
    if (t === 'true' || t === '1' || t === 'yes') return true;
    if (t === 'false' || t === '0' || t === 'no') return false;
  }
  return false;
};

const normalizeImageList = (doc) => {
  if (Array.isArray(doc?.images) && doc.images.length) return doc.images;
  if (doc?.image) return [doc.image];
  return [];
};

const uploadImages = async (files, folder) => {
  const uploads = files.map((f) => uploadToCloudinary(f.buffer, folder));
  return Promise.all(uploads);
};

exports.list = async (req, res) => {
  try {
    const result = await phoneService.list(req.query);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch phones' });
  }
};

exports.get = async (req, res) => {
  try {
    const phone = await phoneService.getByIdOrExternalId(req.params.id);
    res.json(phone);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message || 'Failed to fetch phone',
    });
  }
};

exports.create = async (req, res) => {
  try {
    let uploadedImages = [];
    const files = collectUploadFiles(req);
    if (files.length) {
      try {
        uploadedImages = await uploadImages(files, 'phones');
      } catch (uploadErr) {
        console.error('Cloudinary upload error:', uploadErr);
        return res.status(500).json({ message: 'Image upload failed' });
      }
    }

    const normalize = (data) => {
      const d = JSON.parse(JSON.stringify(data || {}));
      if (d.brand) d.brand = String(d.brand).toLowerCase().trim();
      if (d.name) d.name = String(d.name).trim();
      if (d.price != null && d.price !== '') {
        const n = Number(d.price);
        if (!Number.isNaN(n)) d.price = n;
      }

      if (d.specs) {
        const s = d.specs;
        const normBool = (v) => {
          if (v === null || v === undefined) return v;
          if (typeof v === 'boolean') return v ? 'true' : 'false';
          if (typeof v === 'string') {
            const t = v.trim().toLowerCase();
            if (['yes', 'true', '1'].includes(t)) return 'true';
            if (['no', 'false', '0'].includes(t)) return 'false';
          }
          if (typeof v === 'number') return v === 1 ? 'true' : 'false';
          return String(v);
        };

        s.Bluetooth = normBool(s.Bluetooth);
        s.GPS = normBool(s.GPS);
        s.NFC = normBool(s.NFC);
        if (s.Network) s.Network.VoLTE = normBool(s.Network.VoLTE);

        if (s.Sensors && s.Sensors.OtherSensors) {
          if (typeof s.Sensors.OtherSensors === 'string') {
            s.Sensors.OtherSensors = s.Sensors.OtherSensors.split(',')
              .map((x) => x.trim())
              .filter(Boolean);
          } else if (Array.isArray(s.Sensors.OtherSensors)) {
            s.Sensors.OtherSensors = s.Sensors.OtherSensors.map((x) =>
              String(x).trim(),
            );
          } else if (
            typeof s.Sensors.OtherSensors === 'object' &&
            s.Sensors.OtherSensors !== null
          ) {
            // Convert object with numeric keys to array
            s.Sensors.OtherSensors = Object.values(s.Sensors.OtherSensors)
              .map((x) => String(x).trim())
              .filter(Boolean);
          }
        }
      }

      return d;
    };

    const bodyImages = parseBodyImages(req.body);
    const images = uploadedImages.length ? uploadedImages : bodyImages;
    const payload = normalize({
      ...req.body,
      image: images[0] || undefined,
      images: images.length ? images : undefined,
    });

    const phone = await phoneService.create(payload);

    res.status(201).json(phone);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({
      message: err.message || 'Failed to create phone',
    });
  }
};

exports.update = async (req, res) => {
  try {
    let data = { ...req.body };
    const replaceImages = toBool(data.replaceImages);
    delete data.replaceImages;
    const existingPhone = await phoneService.getByIdOrExternalId(req.params.id);
    const existingImages = normalizeImageList(existingPhone);
    const requestedImages = parseBodyImages(data);

    const files = collectUploadFiles(req);
    if (files.length) {
      try {
        const uploadedImages = await uploadImages(files, 'phones');
        const baseImages = requestedImages.length
          ? requestedImages
          : replaceImages
            ? []
            : existingImages;
        const nextImages = [...baseImages, ...uploadedImages];
        data.images = nextImages;
        data.image = nextImages[0] || null;
      } catch (uploadErr) {
        console.error('Cloudinary upload error:', uploadErr);
        return res.status(500).json({ message: 'Image upload failed' });
      }
    } else if (data.images !== undefined || data.image !== undefined) {
      const nextImages = replaceImages
        ? requestedImages
        : [...existingImages, ...requestedImages];
      data.images = nextImages;
      data.image = nextImages[0] || null;
    }

    // reuse normalization from create
    const normalize = (data) => {
      const d = JSON.parse(JSON.stringify(data || {}));
      if (d.brand) d.brand = String(d.brand).toLowerCase().trim();
      if (d.name) d.name = String(d.name).trim();
      if (d.price != null && d.price !== '') {
        const n = Number(d.price);
        if (!Number.isNaN(n)) d.price = n;
      }

      if (d.specs) {
        const s = d.specs;
        const normBool = (v) => {
          if (v === null || v === undefined) return v;
          if (typeof v === 'boolean') return v ? 'true' : 'false';
          if (typeof v === 'string') {
            const t = v.trim().toLowerCase();
            if (['yes', 'true', '1'].includes(t)) return 'true';
            if (['no', 'false', '0'].includes(t)) return 'false';
          }
          if (typeof v === 'number') return v === 1 ? 'true' : 'false';
          return String(v);
        };

        s.Bluetooth = normBool(s.Bluetooth);
        s.GPS = normBool(s.GPS);
        s.NFC = normBool(s.NFC);
        if (s.Network) s.Network.VoLTE = normBool(s.Network.VoLTE);

        if (s.Sensors && s.Sensors.OtherSensors) {
          if (typeof s.Sensors.OtherSensors === 'string') {
            s.Sensors.OtherSensors = s.Sensors.OtherSensors.split(',')
              .map((x) => x.trim())
              .filter(Boolean);
          } else if (Array.isArray(s.Sensors.OtherSensors)) {
            s.Sensors.OtherSensors = s.Sensors.OtherSensors.map((x) =>
              String(x).trim(),
            );
          } else if (
            typeof s.Sensors.OtherSensors === 'object' &&
            s.Sensors.OtherSensors !== null
          ) {
            // Convert object with numeric keys to array
            s.Sensors.OtherSensors = Object.values(s.Sensors.OtherSensors)
              .map((x) => String(x).trim())
              .filter(Boolean);
          }
        }
      }

      return d;
    };

    data = normalize(data);

    const phone = await phoneService.update(req.params.id, data);
    res.json(phone);
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message || 'Failed to update phone',
    });
  }
};

exports.remove = async (req, res) => {
  try {
    await phoneService.remove(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message || 'Failed to delete phone',
    });
  }
};

exports.remove = async (req, res) => {
  try {
    await phoneService.remove(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(err.status || 500).json({
      message: err.message || 'Failed to delete phone',
    });
  }
};

exports.best = async (req, res) => {
  try {
    const result = await phoneService.best(req.query);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch best phones' });
  }
};
