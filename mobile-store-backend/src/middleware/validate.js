const Joi = require('joi');

module.exports = (schema) => (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach((key) => {
      const value = req.body[key];
      if (typeof value !== 'string') return;
      const trimmed = value.trim();
      if (
        (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))
      ) {
        try {
          req.body[key] = JSON.parse(trimmed);
        } catch {
          // Keep original string if not valid JSON
        }
      }
    });
  }

  const opts = { abortEarly: false, allowUnknown: false, stripUnknown: true };
  const { error, value } = schema.validate(req.body, opts);
  if (error) {
    const details = error.details.map((d) => d.message);
    return res
      .status(400)
      .json({ message: 'Validation failed', errors: details });
  }
  req.body = value;
  next();
};
