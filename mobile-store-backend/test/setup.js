const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongo;

module.exports = {
  async start() {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    process.env.MONGO_URI = uri;
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  },
  async stop() {
    try {
      await mongoose.disconnect();
    } catch (e) {}
    try {
      await mongo.stop();
    } catch (e) {
      // Ignore process kill errors on Windows CI
    }
  },
  async clear() {
    const collections = Object.keys(mongoose.connection.collections);
    for (const name of collections) {
      await mongoose.connection.collections[name].deleteMany({});
    }
  },
};
