const Brand = require('../models/Brand');
const { escapeRegExp } = require('../utils/escapeRegex');

exports.list = async (queryParams = {}) => {
  const { page = 1, limit = 20, q } = queryParams;
  const filter = {};

  if (q && typeof q === 'string') {
    if (q.length > 100) throw { status: 400, message: 'Search query too long' };
    filter.name = { $regex: escapeRegExp(q), $options: 'i' };
  }

  const safePage = Math.max(Number(page), 1);
  const safeLimit = Math.min(Math.max(Number(limit), 1), 100);

  const total = await Brand.countDocuments(filter);
  const results = await Brand.find(filter)
    .sort({ name: 1 })
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

exports.create = async ({ name }) => {
  try {
    return await Brand.create({ name: String(name).toLowerCase().trim() });
  } catch (err) {
    if (err.code === 11000) {
      throw { status: 409, message: 'Brand already exists' };
    }
    throw err;
  }
};

exports.update = async (id, { name }) => {
  const brand = await Brand.findByIdAndUpdate(
    id,
    { name: String(name).toLowerCase().trim() },
    { new: true, runValidators: true },
  );

  if (!brand) {
    throw { status: 404, message: 'Brand not found' };
  }

  return brand;
};

exports.remove = async (id) => {
  const brand = await Brand.findByIdAndDelete(id);

  if (!brand) {
    throw { status: 404, message: 'Brand not found' };
  }
};
