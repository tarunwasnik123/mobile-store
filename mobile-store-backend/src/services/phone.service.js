const Phone = require('../models/Phone');
const mongoose = require('mongoose');
const { calculateBestScore } = require('../utils/bestPhoneScore');
const { generatePhoneSlug } = require('../utils/slug');
const { escapeRegExp } = require('../utils/escapeRegex');

exports.list = async (queryParams) => {
  const {
    page = 1,
    limit = 20,
    q,
    brand,
    minPrice,
    maxPrice,
    sort,
    minReleaseDate,
    maxReleaseDate,
  } = queryParams;

  const filter = {};

  if (q) {
    // limit length to avoid abuse and escape input before building a regex
    if (typeof q !== 'string' || q.length > 100) {
      throw { status: 400, message: 'Search query too long' };
    }
    const safe = escapeRegExp(q);
    const qRegex = new RegExp(safe, 'i');
    filter.$or = [{ name: qRegex }, { brand: qRegex }];
  }

  if (brand) {
    // support arrays and comma-separated lists for brand filtering with escaping
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
        filter.brand = brands[0];
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

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (minReleaseDate || maxReleaseDate) {
    filter['specs.General.LaunchDate'] = {};
    if (minReleaseDate) {
      filter['specs.General.LaunchDate'].$gte = new Date(minReleaseDate);
    }
    if (maxReleaseDate) {
      filter['specs.General.LaunchDate'].$lte = new Date(maxReleaseDate);
    }
  }

  const safePage = Math.max(Number(page), 1);
  const safeLimit = Math.min(Math.max(Number(limit), 1), 100);

  let query = Phone.find(filter);

  if (sort) {
    query = query.sort(sort);
  }

  const total = await Phone.countDocuments(filter);
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
  let phone = null;

  if (mongoose.Types.ObjectId.isValid(id)) {
    phone = await Phone.findById(id).lean();
  }

  if (!phone) {
    phone = await Phone.findOne({ externalId: id }).lean();
  }

  if (!phone) {
    throw { status: 404, message: 'Phone not found' };
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
  return Phone.create(data);
};

exports.update = async (id, data) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: 'Invalid phone ID' };
  }

  // Normalize data
  if (data.name) data.name = String(data.name).trim();
  if (data.brand) data.brand = String(data.brand).toLowerCase().trim();

  const phone = await Phone.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  if (!phone) {
    throw { status: 404, message: 'Phone not found' };
  }

  return phone;
};

exports.remove = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: 'Invalid phone ID' };
  }

  const phone = await Phone.findByIdAndDelete(id);

  if (!phone) {
    throw { status: 404, message: 'Phone not found' };
  }
};

exports.best = async (queryParams) => {
  const {
    page = 1,
    limit = 10,
    brand,
    minPrice,
    maxPrice,
    minScore = 0,
  } = queryParams;

  const filter = {};

  if (brand) {
    // Limit and escape brand filters for safety
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

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const safePage = Math.max(Number(page), 1);
  const safeLimit = Math.min(Math.max(Number(limit), 1), 100);

  const phones = await Phone.find(filter).lean();

  const ranked = phones
    .map((p) => ({
      ...p,
      bestScore: calculateBestScore(p),
    }))
    // apply optional minimum score filter (default 0)
    .filter((p) => p.bestScore >= Number(minScore))
    .sort((a, b) => b.bestScore - a.bestScore);

  const total = ranked.length;
  const results = ranked.slice(
    (safePage - 1) * safeLimit,
    safePage * safeLimit,
  );

  return {
    total,
    page: safePage,
    limit: safeLimit,
    results,
  };
};
