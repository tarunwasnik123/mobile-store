const UpcomingPhone = require('../models/UpcomingPhone');
const Phone = require('../models/Phone');

async function promoteUpcomingPhones() {
  try {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    const duePhones = await UpcomingPhone.find({
      'specs.General.ReleaseDate': { $lte: now },
    });

    if (duePhones.length === 0) {
      console.log('[Promote Job] No upcoming phones due for promotion.');
      return;
    }

    for (const upcoming of duePhones) {
      const data = upcoming.toObject();
      delete data._id;
      delete data.__v;
      delete data.createdAt;
      delete data.updatedAt;

      const existing = await Phone.findOne({ externalId: data.externalId });
      if (existing) {
        console.log(
          `[Promote Job] Skipping ${data.name} — already exists in Phone collection.`,
        );
        await UpcomingPhone.deleteOne({ _id: upcoming._id });
        continue;
      }

      await Phone.create(data);
      await UpcomingPhone.deleteOne({ _id: upcoming._id });
      console.log(`[Promote Job] Promoted "${data.name}" to Latest Phones.`);
    }
  } catch (err) {
    console.error('[Promote Job] Error:', err.message);
  }
}

module.exports = promoteUpcomingPhones;