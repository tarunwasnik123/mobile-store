const mongoose = require('mongoose');

const PhoneSchema = new mongoose.Schema(
  {
    externalId: { type: String, sparse: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, index: true },
    price: { type: Number, required: false, default: null }, // ✅ CHANGED: was required: true
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
    canonicalUrl: {
      type: String,
      trim: true,
    },
    schemaType: {
      type: String,
      trim: true,
      default: 'Product',
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

PhoneSchema.index({ brand: 1, price: 1 });

module.exports = mongoose.model('Phone', PhoneSchema);