const Joi = require('joi');

const slugPattern = /^[a-zA-Z0-9_\-\s]+$/;

const newsCreate = Joi.object({
  externalId: Joi.string().pattern(slugPattern).min(1).optional(),
  title: Joi.string().min(1).required(),
  summary: Joi.string().allow('', null).optional(),
  rating: Joi.number().min(0).max(10).optional(),
  metaTitle: Joi.string().allow('', null).optional(),
  metaName: Joi.string().allow('', null).optional(),
  metaDescription: Joi.string().allow('', null).optional(),
  canonicalUrl: Joi.string().allow('', null).optional(),
  schemaType: Joi.string().allow('', null).optional(),
  ogImage: Joi.string().allow('', null).optional(),
  twitterImage: Joi.string().allow('', null).optional(),
  imageAltText: Joi.string().allow('', null).optional(),
  // Content is required by the News model and by service.create
  content: Joi.string().min(1).required(),
  image: Joi.string().allow('', null).optional(),
  date: Joi.date().optional(),
  category: Joi.string().optional(),
});

const newsUpdate = Joi.object({
  externalId: Joi.string().pattern(slugPattern).min(1).optional(),
  title: Joi.string().min(1).optional(),
  summary: Joi.string().optional(),
  rating: Joi.number().min(0).max(10).optional(),
  metaTitle: Joi.string().optional(),
  metaName: Joi.string().optional(),
  metaDescription: Joi.string().optional(),
  canonicalUrl: Joi.string().allow('', null).optional(),
  schemaType: Joi.string().allow('', null).optional(),
  ogImage: Joi.string().allow('', null).optional(),
  twitterImage: Joi.string().allow('', null).optional(),
  imageAltText: Joi.string().allow('', null).optional(),
  content: Joi.string().optional(),
  image: Joi.string().optional(),
  date: Joi.date().optional(),
  category: Joi.string().optional(),
});

module.exports = { newsCreate, newsUpdate };