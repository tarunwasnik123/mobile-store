const mongoose = require('mongoose');

module.exports = function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/mobile-store';
  return mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
};
