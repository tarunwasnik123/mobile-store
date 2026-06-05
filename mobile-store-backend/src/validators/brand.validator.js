const Joi = require('joi');

const brandCreate = Joi.object({
  name: Joi.string().min(1).required(),
});

const brandUpdate = Joi.object({
  name: Joi.string().min(1).optional(),
});

module.exports = { brandCreate, brandUpdate };
