require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const UpcomingPhone = require('./models/UpcomingPhone');
const Phone = require('./models/Phone');

async function run() {
  await connectDB();

  const allUpcoming = await UpcomingPhone.find({}, { name: 1, externalId: 1, 'specs.General.ReleaseDate': 1, 'specs.General.LaunchDate': 1 }).lean();
  console.log('--- All UpcomingPhone docs ---');
  console.log(JSON.stringify(allUpcoming, null, 2));

  const allPhones = await Phone.find({}, { name: 1, externalId: 1 }).lean();
  console.log('--- All Phone docs ---');
  console.log(JSON.stringify(allPhones, null, 2));

  await mongoose.disconnect();
}

run();