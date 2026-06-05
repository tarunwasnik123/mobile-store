const Joi = require('joi');

const phoneCreate = Joi.object({
  // allow slug-like externalIds (letters, numbers, hyphens, underscores)
  externalId: Joi.string()
    .pattern(/^[\w-]+$/)
    .min(1)
    .optional(),
  name: Joi.string().min(1).required(),
  brand: Joi.string().min(1).required(),
  price: Joi.number().min(0).required(),
  image: Joi.string().allow('', null),
  images: Joi.array().items(Joi.string().allow('', null)).optional(),
  replaceImages: Joi.boolean().optional(),
  metaTitle: Joi.string().allow('', null).optional(),
  metaName: Joi.string().allow('', null).optional(),
  metaDescription: Joi.string().allow('', null).optional(),
  pros: Joi.array().items(Joi.string()).optional(),
  cons: Joi.array().items(Joi.string()).optional(),
  faqs: Joi.array()
    .items(
      Joi.object({
        question: Joi.string().required(),
        answer: Joi.string().required(),
      }),
    )
    .optional(),
  specs: Joi.object().unknown(true).optional(),
});

const phoneUpdate = Joi.object({
  name: Joi.string().min(1).optional(),
  brand: Joi.string().min(1).optional(),
  price: Joi.number().min(0).optional(),
  image: Joi.string().allow('', null).optional(),
  images: Joi.array().items(Joi.string().allow('', null)).optional(),
  replaceImages: Joi.boolean().optional(),
  metaTitle: Joi.string().optional(),
  metaName: Joi.string().optional(),
  metaDescription: Joi.string().optional(),
  pros: Joi.array().items(Joi.string()).optional(),
  cons: Joi.array().items(Joi.string()).optional(),
  faqs: Joi.array()
    .items(
      Joi.object({
        question: Joi.string().required(),
        answer: Joi.string().required(),
      }),
    )
    .optional(),
  specs: Joi.object().unknown(true).optional(),
});

module.exports = { phoneCreate, phoneUpdate };
