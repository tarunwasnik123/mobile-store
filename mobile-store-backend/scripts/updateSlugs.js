/*
  Usage:
    set MONGO_URI (or use .env) then run:
      node scripts/updateSlugs.js
*/

require('dotenv').config();
const mongoose = require('mongoose');
const Phone = require('../src/models/Phone');
const UpcomingPhone = require('../src/models/UpcomingPhone');
const { generatePhoneSlug } = require('../src/utils/slug');

async function updateSlugs() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/mobile-store',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    );

    console.log('Connected to MongoDB');

    // Update Phone slugs
    const phones = await Phone.find({});
    console.log(`Found ${phones.length} phones to update`);

    for (const phone of phones) {
      const newSlug = generatePhoneSlug(phone);
      if (phone.externalId !== newSlug) {
        await Phone.updateOne({ _id: phone._id }, { externalId: newSlug });
        console.log(`Updated ${phone.name}: ${phone.externalId} -> ${newSlug}`);
      }
    }

    // Update UpcomingPhone slugs
    const upcomingPhones = await UpcomingPhone.find({});
    console.log(`Found ${upcomingPhones.length} upcoming phones to update`);

    for (const phone of upcomingPhones) {
      const newSlug = generatePhoneSlug(phone);
      if (phone.externalId !== newSlug) {
        await UpcomingPhone.updateOne(
          { _id: phone._id },
          { externalId: newSlug },
        );
        console.log(
          `Updated upcoming ${phone.name}: ${phone.externalId} -> ${newSlug}`,
        );
      }
    }

    console.log('Slug update completed');
  } catch (error) {
    console.error('Error updating slugs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateSlugs();
