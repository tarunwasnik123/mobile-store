const UpcomingPhone = require('../models/UpcomingPhone');
const Phone = require('../models/Phone');
const mongoose = require('mongoose');
const { escapeRegExp } = require('../utils/escapeRegex');
const { generatePhoneSlug } = require('../utils/slug');

const isReleasedPastToday = (value) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const releaseDay = new Date(date);
  releaseDay.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return releaseDay < today;
};

const buildPhonePayloadFromUpcoming = (upcoming) => {
  const payload = JSON.parse(JSON.stringify(upcoming || {}));
  delete payload._id;
  delete payload.__v;

  if (payload.specs && payload.specs.General) {
    const releaseDate = payload.specs.General.ReleaseDate;
    if (releaseDate != null) {
      payload.specs.General.LaunchDate = releaseDate;
      delete payload.specs.General.ReleaseDate;
    }
  }

  return payload;
};

exports.migrateExpiredUpcomingPhones = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allUpcomingPhones = await UpcomingPhone.find({
    'specs.General.ReleaseDate': { $exists: true },
  }).lean();

  const expiredUpcomingPhones = allUpcomingPhones.filter((upcoming) =>
    isReleasedPastToday(upcoming?.specs?.General?.ReleaseDate),
  );

  for (const upcoming of expiredUpcomingPhones) {
    if (!upcoming?.specs?.General?.ReleaseDate) continue;

    let existingPhone = null;
    if (upcoming.externalId) {
      existingPhone = await Phone.findOne({ externalId: upcoming.externalId });
    }
    if (!existingPhone) {
      existingPhone = await Phone.findOne({
        name: upcoming.name,
        brand: upcoming.brand,
      });
    }

    if (existingPhone) {
      if (
        !existingPhone.specs?.General?.LaunchDate &&
        upcoming.specs.General.ReleaseDate
      ) {
        await Phone.updateOne(
          { _id: existingPhone._id },
          {
            $set: {
              'specs.General.LaunchDate': upcoming.specs.General.ReleaseDate,
            },
          },
        );
      }
    } else {
      const phonePayload = buildPhonePayloadFromUpcoming(upcoming);
      await Phone.create(phonePayload);
    }

    await UpcomingPhone.deleteOne({ _id: upcoming._id });
  }
};

exports.list = async (queryParams) => {
  await exports.migrateExpiredUpcomingPhones();
  const {
    page = 1,
    limit = 20,
    q,
    brand,
    minPrice,
    maxPrice,
    sort,
  } = queryParams;

  const filter = {};

  // 🔍 Search
  if (q) {
    if (typeof q !== 'string' || q.length > 100) {
      throw { status: 400, message: 'Search query too long' };
    }
    filter.name = { $regex: escapeRegExp(q), $options: 'i' };
  }

  // 🏷 Brand filter (same logic as phone.service, now case-insensitive)
  if (brand) {
    if (Array.isArray(brand)) {
      const safeBrands = brand.map((b) => {
        if (typeof b !== 'string' || b.length > 50)
          throw { status: 400, message: 'Brand filter too long' };
        return new RegExp(escapeRegExp(b), 'i');
      });
      filter.brand = { $in: safeBrands };
    } else if (typeof brand === 'string' && brand.includes(',')) {
      const brands = brand
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean);
      if (brands.length === 1) {
        if (brands[0].length > 50)
          throw { status: 400, message: 'Brand filter too long' };
        filter.brand = { $regex: escapeRegExp(brands[0]), $options: 'i' };
      } else if (brands.length > 1) {
        filter.brand = {
          $in: brands.map((b) => new RegExp(escapeRegExp(b), 'i')),
        };
      }
    } else {
      if (typeof brand === 'string' && brand.length > 50)
        throw { status: 400, message: 'Brand filter too long' };
      filter.brand = { $regex: escapeRegExp(brand), $options: 'i' };
    }
  }

  // 💰 Price filter
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const safePage = Math.max(Number(page), 1);
  const safeLimit = Math.min(Math.max(Number(limit), 1), 100);

  let query = UpcomingPhone.find(filter);

  // ↕ Sorting
  if (sort) {
    query = query.sort(sort);
  } else {
    // Default sort → nearest release first
    query = query.sort({ 'specs.General.ReleaseDate': 1 });
  }

  const total = await UpcomingPhone.countDocuments(filter);
  const results = await query
    .skip((safePage - 1) * safeLimit)
    .limit(safeLimit)
    .lean();

  return {
    total,
    page: safePage,
    limit: safeLimit,
    results,
  };
};

exports.getByIdOrExternalId = async (id) => {
  await exports.migrateExpiredUpcomingPhones();

  let phone = null;

  // Try Mongo ObjectId
  if (mongoose.Types.ObjectId.isValid(id)) {
    phone = await UpcomingPhone.findById(id).lean();
  }

  // Fallback to externalId
  if (!phone) {
    phone = await UpcomingPhone.findOne({ externalId: id }).lean();
  }

  if (!phone) {
    let released = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      released = await Phone.findById(id).lean();
    }
    if (!released) {
      released = await Phone.findOne({ externalId: id }).lean();
    }
    if (released) {
      if (released.specs?.General?.LaunchDate) {
        released.specs.General.ReleaseDate = released.specs.General.LaunchDate;
      }
      return released;
    }
  }

  if (!phone) {
    throw { status: 404, message: 'Upcoming phone not found' };
  }

  return phone;
};

exports.create = async (data) => {
  // Normalize data
  if (data.name) data.name = String(data.name).trim();
  if (data.brand) data.brand = String(data.brand).toLowerCase().trim();

  if (!data.externalId && data.name) {
    data.externalId = generatePhoneSlug(data);
  }
  return UpcomingPhone.create(data);
};

exports.update = async (id, data) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: 'Invalid upcoming phone ID' };
  }

  // Normalize data
  if (data.name) data.name = String(data.name).trim();
  if (data.brand) data.brand = String(data.brand).toLowerCase().trim();

  const phone = await UpcomingPhone.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!phone) {
    throw { status: 404, message: 'Upcoming phone not found' };
  }

  return phone;
};

exports.remove = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: 'Invalid upcoming phone ID' };
  }

  const phone = await UpcomingPhone.findByIdAndDelete(id);

  if (!phone) {
    throw { status: 404, message: 'Upcoming phone not found' };
  }
};
