const mongoose = require('mongoose');

const BrandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

// Ensure case-insensitive uniqueness at DB level
BrandSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Brand', BrandSchema);
