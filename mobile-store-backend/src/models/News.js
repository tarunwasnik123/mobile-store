const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema(
  {
    externalId: { type: String, sparse: true, unique: true, index: true },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    image: String,
    summary: {
      type: String,
      trim: true,
    },
    metaTitle: {
      type: String,
      trim: true,
    },
    metaName: {
      type: String,
      trim: true,
    },
   metaDescription: {
      type: String,
      trim: true,
    },
    canonicalUrl: {
      type: String,
      trim: true,
    },
    schemaType: {
      type: String,
      trim: true,
      default: 'NewsArticle',
    },
    ogImage: {
      type: String,
      trim: true,
    },
    twitterImage: {
      type: String,
      trim: true,
    },
    imageAltText: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    category: {
      type: String,
      index: true,
    },
     rating: {
      type: Number,
      min: 0,
      max: 10,
    },
    createdBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String },
      role: { type: String },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('News', NewsSchema);
