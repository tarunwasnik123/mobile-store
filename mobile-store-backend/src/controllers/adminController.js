const { spawn } = require('child_process');
const unzipper = require('unzipper');
const { Readable } = require('stream');
const Phone = require('../models/Phone');
const Brand = require('../models/Brand');
const News = require('../models/News');
const UpcomingPhone = require('../models/UpcomingPhone');
const upcomingPhoneService = require('../services/upcomingphone.service');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { generatePhoneSlug, generateNewsSlug } = require('../utils/slug');

// In-memory upload history (last 20 uploads)
const uploadHistory = [];
const MAX_HISTORY = 20;

function logUploadResult(type, result) {
  const entry = {
    timestamp: new Date().toISOString(),
    type,
    ...result,
  };
  uploadHistory.unshift(entry); // Add to beginning
  if (uploadHistory.length > MAX_HISTORY) {
    uploadHistory.pop(); // Remove oldest
  }
}

// Extract zip file and return { jsonContent, files }
// files is a map of { filename: Buffer }
async function extractZip(zipBuffer) {
  const files = {};
  let jsonContent = null;

  return new Promise((resolve, reject) => {
    Readable.from([zipBuffer])
      .pipe(unzipper.Parse())
      .on('entry', async (entry) => {
        const fileName = entry.path;
        const isFile = !entry.type || entry.type === 'File';

        if (isFile) {
          const chunks = [];
          entry.on('data', (chunk) => chunks.push(chunk));
          entry.on('end', () => {
            const buffer = Buffer.concat(chunks);
            files[fileName] = buffer;

            // Check if this is the JSON file
            if (fileName.endsWith('.json') && !fileName.includes('/')) {
              try {
                jsonContent = JSON.parse(buffer.toString('utf8'));
              } catch (err) {
                // ignore parse errors for now, will be caught in validation
              }
            }
          });
        } else {
          entry.autodrain();
        }
      })
      .on('close', () => {
        resolve({ jsonContent, files });
      })
      .on('error', reject);
  });
}

function validateItems(type, items) {
  const errors = [];
  const valid = [];

  items.forEach((it, idx) => {
    const itemErrors = [];

    // Normalize and validate per type so bulk data matches individual form behavior
    if (type === 'brands') {
      if (!it.name) itemErrors.push('name is required');
      else
        valid.push({
          name: String(it.name).toLowerCase().trim(),
        });
    } else if (type === 'phones' || type === 'upcoming') {
      // required fields
      if (!it.name) itemErrors.push('name is required');
      if (!it.brand) itemErrors.push('brand is required');
      // For published phones price is required; for upcoming price is optional
      if (type === 'phones') {
        if (it.price == null || it.price === '')
          itemErrors.push('price is required');
      }

      // attempt to coerce types and trim strings
      const candidate = JSON.parse(JSON.stringify(it || {}));
      if (candidate.name) candidate.name = String(candidate.name).trim();
      if (candidate.brand)
        candidate.brand = String(candidate.brand).toLowerCase().trim();
      if (candidate.price != null && candidate.price !== '') {
        const n = Number(candidate.price);
        if (Number.isNaN(n)) {
          itemErrors.push('price must be a number');
        } else {
          candidate.price = n;
        }
      }

      // Normalize boolean-like and sensor fields inside specs
      const normalizeBooleanString = (v) => {
        if (v === null || v === undefined) return v;
        if (typeof v === 'boolean') return v ? 'true' : 'false';
        if (typeof v === 'string') {
          const s = v.trim().toLowerCase();
          if (['yes', 'true', '1'].includes(s)) return 'true';
          if (['no', 'false', '0'].includes(s)) return 'false';
        }
        if (typeof v === 'number') return v === 1 ? 'true' : 'false';
        return String(v); // return original value as string if not recognized
      };

      if (candidate.specs) {
        // Normalize fields in NetworkConnectivity
        if (candidate.specs.NetworkConnectivity) {
          const nc = candidate.specs.NetworkConnectivity;
          nc.Bluetooth = normalizeBooleanString(nc.Bluetooth);
          nc.GPS = normalizeBooleanString(nc.GPS);
          nc.NFC = normalizeBooleanString(nc.NFC);
          nc.VoLTE = normalizeBooleanString(nc.VoLTE);
        }

        // Normalize Sensors.OtherSensors to array when provided as comma-separated string
        if (
          candidate.specs.Sensors &&
          candidate.specs.Sensors.OtherSensors &&
          typeof candidate.specs.Sensors.OtherSensors === 'string'
        ) {
          candidate.specs.Sensors.OtherSensors =
            candidate.specs.Sensors.OtherSensors.split(',')
              .map((x) => x.trim())
              .filter(Boolean);
        }
      }

      // Normalize pros, cons, faqs
      if (candidate.pros && Array.isArray(candidate.pros)) {
        candidate.pros = candidate.pros
          .map((p) => String(p).trim())
          .filter(Boolean);
      }
      if (candidate.cons && Array.isArray(candidate.cons)) {
        candidate.cons = candidate.cons
          .map((c) => String(c).trim())
          .filter(Boolean);
      }
      if (candidate.faqs && Array.isArray(candidate.faqs)) {
        candidate.faqs = candidate.faqs
          .filter((faq) => faq.question && faq.answer)
          .map((faq) => ({
            question: String(faq.question).trim(),
            answer: String(faq.answer).trim(),
          }));
      }

      if (itemErrors.length === 0) valid.push(candidate);
    } else if (type === 'news') {
      if (!it.title) itemErrors.push('title is required');
      if (!it.content) itemErrors.push('content is required');

      if (itemErrors.length === 0) {
        const candidate = JSON.parse(JSON.stringify(it || {}));
        if (candidate.title) candidate.title = String(candidate.title).trim();
        if (candidate.content)
          candidate.content = String(candidate.content).trim();
        if (candidate.category)
          candidate.category = String(candidate.category).trim().toLowerCase();
        valid.push(candidate);
      }
    } else {
      itemErrors.push('unsupported type');
    }

    if (itemErrors.length > 0) {
      errors.push({ idx, errors: itemErrors });
    }
  });

  return { valid, errors };
}

// Upload images for phones, news, upcoming from extracted files
async function processImages(type, items, files) {
  const typesWithImages = ['phones', 'upcoming', 'news'];
  if (!typesWithImages.includes(type))
    return { processedItems: items, imageErrors: [] };

  const getFileFromReference = (ref) => {
    if (!ref) return null;
    const direct = files[ref];
    if (direct) return { buffer: direct, ref };
    const inImagesDir = files[`images/${ref}`];
    if (inImagesDir) return { buffer: inImagesDir, ref: `images/${ref}` };
    return null;
  };

  const toBaseName = (ref) => String(ref || '').replace(/^images\//, '');

  const findNumberedVariants = (baseRef) => {
    const base = toBaseName(baseRef)
      .replace(/\.[^/.]+$/, '')
      .trim();
    if (!base) return [];

    const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(?:^|/)${escaped}-(\\d+)\\.[^/]+$`, 'i');

    return Object.keys(files)
      .map((key) => {
        const match = key.match(pattern);
        if (!match) return null;
        return { key, order: Number(match[1]) || 0 };
      })
      .filter(Boolean)
      .sort((a, b) => a.order - b.order)
      .map((x) => x.key);
  };

  const processedItems = [];
  const imageErrors = [];

  for (let idx = 0; idx < items.length; idx++) {
    const item = JSON.parse(JSON.stringify(items[idx]));
    try {
      let sourceNames = Array.isArray(item.images)
        ? item.images
        : typeof item.images === 'string'
          ? item.images
              .split(',')
              .map((x) => x.trim())
              .filter(Boolean)
          : item.image && typeof item.image === 'string'
            ? [item.image]
            : [];

      // Convenience for bulk uploads:
      // if item.image is a base name (e.g. "google_pixel_8"), automatically
      // resolve numbered files like "google_pixel_8-1.jpg", "google_pixel_8-2.jpg".
      if (sourceNames.length === 1) {
        const exact = getFileFromReference(sourceNames[0]);
        if (!exact) {
          const variants = findNumberedVariants(sourceNames[0]);
          if (variants.length > 0) sourceNames = variants;
        }
      }

      if (!sourceNames.length) {
        processedItems.push(item);
        continue;
      }

      const uploadedUrls = [];
      for (const ref of sourceNames) {
        const resolved = getFileFromReference(ref);
        if (!resolved) {
          imageErrors.push({
            idx,
            errors: [
              `Image file not found: "${ref}". Item will be inserted without this image.`,
            ],
          });
          continue;
        }

        try {
          const cloudinaryUrl = await uploadToCloudinary(resolved.buffer, type);
          uploadedUrls.push(cloudinaryUrl);
        } catch (uploadErr) {
          console.error(
            `[Bulk Upload] Image upload failed for item ${idx}:`,
            uploadErr.message,
          );
          imageErrors.push({
            idx,
            errors: [
              `Failed to upload image "${resolved.ref}": ${uploadErr.message}. Item will be inserted without this image.`,
            ],
          });
        }
      }

      item.images = uploadedUrls;
      item.image = uploadedUrls[0] || null;
      processedItems.push(item);
    } catch (err) {
      console.error(`[Bulk Upload] Error processing item ${idx}:`, err.message);
      imageErrors.push({
        idx,
        errors: [`Error processing item: ${err.message}`],
      });
      item.image = null;
      item.images = [];
      processedItems.push(item);
    }
  }

  return { processedItems, imageErrors };
}

// Check for duplicates in database
async function checkDuplicates(type, items) {
  const duplicateErrors = [];

  if (type === 'phones' || type === 'upcoming') {
    // For phones/upcoming: check name+brand combination
    const Model = type === 'phones' ? Phone : UpcomingPhone;

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      if (item.name && item.brand) {
        const existing = await Model.findOne({
          name: item.name.trim(),
          brand: item.brand.trim(),
        });
        if (existing) {
          duplicateErrors.push({
            idx,
            errors: [`Duplicate: ${item.name} (${item.brand}) already exists`],
          });
        }
      }
    }
  } else if (type === 'news') {
    // For news: check title
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      if (item.title) {
        const existing = await News.findOne({
          title: item.title.trim(),
        });
        if (existing) {
          duplicateErrors.push({
            idx,
            errors: [
              `Duplicate: News with title "${item.title}" already exists`,
            ],
          });
        }
      }
    }
  } else if (type === 'brands') {
    // For brands: check name (case-insensitive)
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      if (item.name) {
        const existing = await Brand.findOne({
          name: item.name.toLowerCase().trim(),
        });
        if (existing) {
          duplicateErrors.push({
            idx,
            errors: [`Duplicate: Brand "${item.name}" already exists`],
          });
        }
      }
    }
  }

  return duplicateErrors;
}

exports.bulkUpload = async (req, res) => {
  try {
    const type = req.params.type;
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    console.log(`[Bulk Upload] Starting ${type} upload...`);

    // Extract zip file
    let jsonContent;
    let extractedFiles;
    try {
      const result = await extractZip(file.buffer);
      jsonContent = result.jsonContent;
      extractedFiles = result.files;
    } catch (err) {
      return res
        .status(400)
        .json({ message: `Failed to extract zip: ${err.message}` });
    }

    if (!jsonContent) {
      return res.status(400).json({ message: 'No JSON file found in zip' });
    }

    if (!Array.isArray(jsonContent)) {
      return res.status(400).json({ message: 'JSON must be an array' });
    }

    // Validate items
    const { valid: validItems, errors: validationErrors } = validateItems(
      type,
      jsonContent,
    );

    // Check for duplicates in database
    const duplicateErrors = await checkDuplicates(type, validItems);
    const itemsWithoutDuplicates = validItems.filter(
      (_, idx) => !duplicateErrors.some((err) => err.idx === idx),
    );

    // Dry run: just return validation result (no image processing, with duplicates warned)
    if (req.query.dry === 'true') {
      return res.json({
        ok: true,
        validated: validItems.length,
        total: jsonContent.length,
        duplicates: duplicateErrors.length,
        itemsToInsert: itemsWithoutDuplicates.length,
        errors: [...validationErrors, ...duplicateErrors],
        message: `Dry run - ${itemsWithoutDuplicates.length} items will be inserted (${duplicateErrors.length} duplicates found)`,
      });
    }

    // Process images for phones, upcoming, news
    let processedItems = itemsWithoutDuplicates;
    let imageErrors = [];

    if (itemsWithoutDuplicates.length > 0) {
      const imageResult = await processImages(
        type,
        itemsWithoutDuplicates,
        extractedFiles,
      );
      processedItems = imageResult.processedItems;
      imageErrors = imageResult.imageErrors;
    }

    let Model;
    if (type === 'phones') Model = Phone;
    else if (type === 'brands') Model = Brand;
    else if (type === 'news') Model = News;
    else if (type === 'upcoming') Model = UpcomingPhone;
    else return res.status(400).json({ message: 'Invalid type' });

    // Normalize brand names to lowercase for consistency with frontend data
    if (type === 'phones' || type === 'upcoming') {
      processedItems.forEach((item) => {
        if (item.brand) {
          item.brand = item.brand.toLowerCase();
        }
      });
    }

    // For brands ensure lowercase name
    if (type === 'brands') {
      processedItems.forEach((b) => (b.name = b.name.toLowerCase()));
    }

    // Generate externalId for phones, upcoming, and news if missing
    if (type === 'phones') {
      processedItems.forEach((item) => {
        if (!item.externalId && item.name) {
          item.externalId = generatePhoneSlug(item);
        }
      });
    } else if (type === 'upcoming') {
      processedItems.forEach((item) => {
        if (!item.externalId && item.name) {
          item.externalId = generatePhoneSlug(item);
        }
      });
    } else if (type === 'news') {
      processedItems.forEach((item) => {
        if (!item.externalId && item.title) {
          item.externalId = generateNewsSlug(item.title);
        }
      });
    }

    // Ensure OtherSensors is consistently an array (schema now accepts arrays)
    processedItems.forEach((item) => {
      if (
        item.specs &&
        item.specs.Sensors &&
        item.specs.Sensors.OtherSensors &&
        typeof item.specs.Sensors.OtherSensors === 'string'
      ) {
        item.specs.Sensors.OtherSensors = item.specs.Sensors.OtherSensors.split(
          ',',
        )
          .map((x) => x.trim())
          .filter(Boolean);
      }
    });

    // Minimal logging: number of items to insert
    console.log(
      `[Bulk Upload] Preparing to insert ${processedItems.length} ${type} items.`,
    );

    let result = [];
    let insertErrors = [];

    try {
      if (!processedItems || processedItems.length === 0) {
        console.log('[Bulk Upload] No items to insert');
        result = [];
      } else {
        console.log(
          `[Bulk Upload] Calling Model.insertMany() with ${processedItems.length} items...`,
        );

        result = await Model.insertMany(processedItems, { ordered: false });

        console.log(
          `[Bulk Upload] insertMany completed: inserted ${Array.isArray(result) ? result.length : 0}/${processedItems.length}`,
        );
        if (Array.isArray(result) && result.length > 0) {
          console.log(
            '[Bulk Upload] Sample inserted IDs:',
            result
              .slice(0, 3)
              .map((r) => r._id)
              .join(', '),
          );
        }
      }
    } catch (err) {
      console.error(`[Bulk Upload] ${type}: Insert EXCEPTION caught!`);
      console.error(`[Bulk Upload] Error name: ${err.name}`);
      console.error(`[Bulk Upload] Error code: ${err.code}`);
      console.error(`[Bulk Upload] Error message: ${err.message}`);
      console.error(
        '[Bulk Upload] Full error object:',
        JSON.stringify(err, null, 2),
      );

      if (err.writeErrors && err.writeErrors.length > 0) {
        console.log(
          `[Bulk Upload] Write errors found: ${err.writeErrors.length}`,
        );
        err.writeErrors.forEach((we, idx) => {
          console.error(
            `  [${idx}] Error at index ${we.index}:`,
            we.err.errmsg || we.err.message,
          );
          insertErrors.push({
            idx: we.index || idx,
            errors: [we.err.errmsg || we.err.message || JSON.stringify(we.err)],
          });
        });
      } else {
        console.error('[Bulk Upload] Non-write error:', err.message);
        insertErrors.push({
          idx: -1,
          errors: [err.message],
        });
      }

      // Try to salvage partially inserted documents
      result = err.insertedDocs || [];
      if (result.length > 0) {
        console.log(
          `[Bulk Upload] Partial insert: ${result.length} items were saved before error`,
        );
      }
    }

    if (type === 'upcoming') {
      try {
        await upcomingPhoneService.migrateExpiredUpcomingPhones();
      } catch (migrateErr) {
        console.error(
          '[Bulk Upload] Failed to migrate expired upcoming phones:',
          migrateErr,
        );
      }
    }

    // Combine all errors (validation + duplicates + image + insert)
    const allErrors = [
      ...validationErrors,
      ...duplicateErrors,
      ...imageErrors,
      ...insertErrors,
    ];

    // Log result to history for admin viewing
    logUploadResult(type, {
      inserted: result.length,
      total: jsonContent.length,
      validated: validItems.length,
      duplicates: duplicateErrors.length,
      processed: processedItems.length,
      imageErrors: imageErrors.length,
      insertErrors: insertErrors.length,
      totalErrors: allErrors.length,
      success: insertErrors.length === 0 && duplicateErrors.length === 0,
    });

    res.json({
      ok: true,
      inserted: result.length,
      validated: validItems.length,
      duplicates: duplicateErrors.length,
      processed: processedItems.length,
      total: jsonContent.length,
      imageErrors: imageErrors.length,
      insertErrors: insertErrors.length,
      totalErrors: allErrors.length,
      errors: allErrors.length > 0 ? allErrors.slice(0, 50) : undefined,
      message: `Inserted ${result.length} of ${processedItems.length} items`,
    });
  } catch (err) {
    console.error('[Bulk Upload] Unexpected error:', err.message);
    res.status(500).json({ message: err.message || 'Upload failed' });
  }
};

exports.runSeed = async (req, res) => {
  try {
    if (process.env.ALLOW_ADMIN_SEED !== 'true') {
      return res
        .status(403)
        .json({ message: 'Seeding via API is disabled in this environment' });
    }

    // spawn seed script so it doesn't exit the server
    const proc = spawn(
      process.execPath,
      [require('path').join(__dirname, '..', '..', 'scripts', 'seed.js')],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env,
      },
    );

    let out = '';
    proc.stdout.on('data', (d) => (out += d.toString()));
    let errOut = '';
    proc.stderr.on('data', (d) => (errOut += d.toString()));

    proc.on('close', (code) => {
      res.json({ code, stdout: out, stderr: errOut });
    });
  } catch (err) {
    console.error('Seed error', err);
    res.status(500).json({ message: 'Seed failed' });
  }
};

// Get upload history for admin
exports.getUploadHistory = async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  res.json({
    ok: true,
    count: uploadHistory.length,
    uploads: uploadHistory.slice(0, limit),
  });
};
