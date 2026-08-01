/*
  Usage:
    set MONGO_URI (or use .env) then run:
      node scripts/seed.js
*/

require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const Phone = require('../src/models/Phone');
const Brand = require('../src/models/Brand');
const News = require('../src/models/News');
const UpcomingPhone = require('../src/models/UpcomingPhone');
const User = require('../src/models/User');
const { generatePhoneSlug } = require('../src/utils/slug');

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeImageList(item) {
  let images = [];
  if (Array.isArray(item?.images)) {
    images = item.images.map((x) => String(x).trim()).filter(Boolean);
  } else if (typeof item?.images === 'string') {
    images = item.images
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  } else if (typeof item?.image === 'string' && item.image.trim()) {
    images = [item.image.trim()];
  }
  return {
    ...item,
    image: images[0] || item?.image || null,
    images,
  };
}

function normalizePhonesForSeed(items) {
  return (items || []).map((item) => {
    const next = normalizeImageList(item);
    if (next.brand) next.brand = String(next.brand).toLowerCase().trim();
    if (next.name) next.name = String(next.name).trim();
    return next;
  });
}

async function main() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/mobile-store';

  await mongoose.connect(uri);
  console.log('✅ Connected to', uri);

  // Prefer bulk-upload JSONs if they exist (project root: "Handsetnews bulk upload")
  const bulkRoot = path.resolve(
    __dirname,
    '..',
    '..',
    'Handsetnews bulk upload',
  );
  const frontendDataRoot = path.resolve(
    __dirname,
    '..',
    '..',
    'mobile-store-frontend',
    'src',
    'data',
  );

  function pickJSON(...candidates) {
    for (const p of candidates) {
      try {
        if (fs.existsSync(p)) return readJSON(p);
      } catch (e) {
        // ignore
      }
    }
    throw new Error(
      `No JSON file found among candidates: ${candidates.join(', ')}`,
    );
  }

  const brandsData = pickJSON(
    path.join(bulkRoot, 'brands-upload', 'brands.json'),
    path.join(frontendDataRoot, 'brands.json'),
  );
  const phonesData = pickJSON(
    path.join(bulkRoot, 'phones-upload', 'phones.json'),
    path.join(frontendDataRoot, 'phones.json'),
  );
  const upcomingPhonesData = pickJSON(
    path.join(bulkRoot, 'upcoming-upload', 'upcoming.json'),
    path.join(frontendDataRoot, 'upcoming-phones.json'),
  );
  const newsData = pickJSON(
    path.join(bulkRoot, 'news-upload', 'news.json'),
    path.join(frontendDataRoot, 'news.json'),
  );

  const normalizedPhonesData = normalizePhonesForSeed(phonesData);
  const normalizedUpcomingData = normalizePhonesForSeed(upcomingPhonesData);

  // Function to set externalId
  const setExternalId = (item) => {
    if (!item.externalId && item.name) {
      item.externalId = generatePhoneSlug(item);
    }
    return item;
  };

  /* ---------------- BRANDS ---------------- */
  console.log('🌱 Seeding brands...');
  await Brand.deleteMany({});
  await Brand.insertMany(brandsData);

  /* ---------------- PHONES ---------------- */
  console.log('🌱 Seeding phones...');
  await Phone.deleteMany({});
  const phonesWithExternalId = normalizedPhonesData.map(setExternalId);
  await Phone.insertMany(phonesWithExternalId);

  /* ---------------- UPCOMING PHONES ---------------- */
  console.log('🌱 Seeding upcoming phones...');
  await UpcomingPhone.deleteMany({});
  const upcomingWithExternalId = normalizedUpcomingData.map(setExternalId);
  await UpcomingPhone.insertMany(upcomingWithExternalId);

  /* ---------------- NEWS ---------------- */
  console.log('🌱 Seeding news...');
  await News.deleteMany({});
  await News.insertMany(newsData);

  /* ---------------- ADMIN USER ---------------- */
  console.log('🌱 Seeding admin user...');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPass =
    process.env.ADMIN_PASSWORD ||
    (process.env.NODE_ENV === 'test' ? 'admin123' : null);

  if (!adminPass) {
    throw new Error(
      'ADMIN_PASSWORD must be set in the environment to create the admin user. Do not use default weak passwords in production.',
    );
  }

  await User.deleteMany({ email: adminEmail });
  const passwordHash = await bcrypt.hash(adminPass, 10);

  await User.create({
    name: 'Admin',
    email: adminEmail,
    passwordHash,
    role: 'admin',
  });

  console.log('✅ Done seeding!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed', err);
  process.exit(1);
});
