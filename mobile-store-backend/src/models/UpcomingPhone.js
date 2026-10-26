const mongoose = require('mongoose');

const UpcomingPhoneSchema = new mongoose.Schema(
  {
    externalId: { type: String, sparse: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, index: true },
    price: { type: Number, required: true },
    specScore: { type: Number, min: 0, max: 100 }, // admin-set spec score (e.g. 97)
    image: { type: String },
    images: [{ type: String }],
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
    pros: [{ type: String }],
    cons: [{ type: String }],
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
    specs: {
      General: {
        OperatingSystem: String,
        CustomUI: String,
        LaunchDate: Date,
        ReleaseDate: Date,
        OSUpdate: String,
      },
      Performance: {
        Chipset: String,
        CPU: String,
        GPU: String,
        RAM: String,
        RAMType: String,
        Architecture: String,
        Fabrication: String,
        PerformanceTestResults: String,
        BootupTime: String,
        AnTuTuScore: String,
      },
      Storage: {
        InternalStorage: String,
        StorageType: String,
      },
      Display: {
        Type: String,
        Size: String,
        Resolution: String,
        RefreshRate: String,
        ScreenToBodyRatio: String,
        BezelLessDisplay: String,
        PixelDensity: String,
        PeakBrightness: String,
        HBMBrightness: String,
        AspectRatio: String,
      },
      RearCamera: {
        Camera: {
          Primary: String,
          Secondary: String,
          Tertiary: String,
        },
      },
      FrontCamera: {
        Camera: String,
      },
      Battery: {
        Capacity: String,
        QuickCharging: String,
        WirelessCharging: String,
        BatteryChargingTime: String,
      },
      SoundAudio: {
        Loudspeakers: String,
        HeadphoneConnection: String,
        SoundTechnology: String,
      },
      NetworkConnectivity: {
        SIMSlot: String,
        SIMType: String,
        WiFi: String,
        NetworkSupport: String,
        VoLTE: String,
        Bluetooth: String,
        GPS: String,
        NFC: String,
      },
      Sensors: {
        Fingerprint: String,
        FingerprintSensorType: String,
        FingerprintSensorPosition: String,
        OtherSensors: [String],
      },
    },
  },
  { timestamps: true },
);

UpcomingPhoneSchema.index({ brand: 1, price: 1 });

// Drop old unique index if it exists (for migration from non-sparse to sparse)
UpcomingPhoneSchema.pre('syncIndexes', async function (next) {
  try {
    const collection = this.collection;
    const indexes = await collection.getIndexes();
    if (indexes['externalId_1'] && !indexes['externalId_1'].sparse) {
      await collection.dropIndex('externalId_1');
      console.log(
        '[Migration] Dropped old externalId_1 index from upcomingphones',
      );
    }
  } catch (err) {
    console.error('[Migration] Error checking indexes:', err.message);
  }
  next();
});

module.exports = mongoose.model('upcomingPhone', UpcomingPhoneSchema);