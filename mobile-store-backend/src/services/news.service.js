const News = require('../models/News');
const mongoose = require('mongoose');
const { generateNewsSlug } = require('../utils/slug');
const { escapeRegExp } = require('../utils/escapeRegex');

const normalizeSlug = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

exports.list = async ({ page = 1, limit = 10, q, category, sort }) => {
  const pageNum = Math.max(parseInt(page, 10), 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10), 1), 50);

  const skip = (pageNum - 1) * limitNum;

  const filter = {};
  if (q) {
    if (typeof q !== 'string' || q.length > 100) {
      throw { status: 400, message: 'Search query too long' };
    }

    const qRegex = new RegExp(escapeRegExp(q), 'i');
    filter.$or = [
      { title: qRegex },
      { category: qRegex },
      { summary: qRegex },
      { externalId: qRegex },
    ];
  }

  if (category) {
    filter.category = {
      $regex: new RegExp(`^${escapeRegExp(category)}$`, 'i'),
    };
  }

  let sortObj = { createdAt: -1 }; // default sort by createdAt desc
  if (sort) {
    // parse sort like -createdAt or createdAt
    const sortMatch = sort.match(/^(-)?(.+)$/);
    if (sortMatch) {
      const dir = sortMatch[1] ? -1 : 1;
      const field = sortMatch[2];
      sortObj = { [field]: dir };
    }
  }

  const [total, results] = await Promise.all([
    News.countDocuments(filter),
    News.find(filter).sort(sortObj).skip(skip).limit(limitNum).lean(),
  ]);

  return {
    total,
    page: pageNum,
    limit: limitNum,
    results,
  };
};

exports.getByIdOrExternalId = async (id) => {
  let article = null;

  if (mongoose.Types.ObjectId.isValid(id)) {
    article = await News.findById(id);
  }

  if (!article) {
    article = await News.findOne({ externalId: id });
  }

  if (!article) {
    throw { status: 404, message: 'News not found' };
  }

  return article;
};

exports.create = async (data) => {
  if (!data.title || !data.content) {
    throw { status: 400, message: 'Missing required fields' };
  }

  if (data.category) {
    data.category = String(data.category).trim().toLowerCase();
  }

  if (data.externalId) {
    data.externalId = normalizeSlug(data.externalId);
  }

  if (!data.externalId && data.title) {
    data.externalId = generateNewsSlug(data.title);
  }

  return News.create(data);
};

exports.update = async (id, data) => {
  if (data.category) {
    data.category = String(data.category).trim().toLowerCase();
  }

  if (data.externalId) {
    const normalized = normalizeSlug(data.externalId);
    if (normalized) {
      data.externalId = normalized;
    } else {
      delete data.externalId;
    }
  }

  const article = await News.findByIdAndUpdate(id, data, { new: true });
  if (!article) {
    throw { status: 404, message: 'News not found' };
  }
  return article;
};

exports.remove = async (id) => {
  let article = null;

  if (mongoose.Types.ObjectId.isValid(id)) {
    article = await News.findByIdAndDelete(id);
  }

  if (!article) {
    article = await News.findOneAndDelete({ externalId: id });
  }

  if (!article) {
    throw { status: 404, message: 'News not found' };
  }
  return true;
};
