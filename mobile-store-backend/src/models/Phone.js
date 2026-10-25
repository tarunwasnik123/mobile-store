const mongoose = require('mongoose');

// Rear camera table ke extra columns (MP alag se Camera.Primary/Secondary... me aata hai)
const cameraDetail = () => ({
  LensFeatures: String,
  Aperture: String,
  Zoom: String,
  FocalLength: String,
});

const PhoneSchema = new mongoose.Schema(
  {
    externalId: { type: String, sparse: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, index: true },
    price: { type: Number, required: false, default: null }, // CHANGED: was required: true
    rating: { type: Number, min: 0, max: 5 }, // admin-set rating out of 5 (e.g. 3.7)
    colors: [{ type: String }], // e.g. ['Nebula Black', 'Moonlight Silver']
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
        SecurityUpdates: String,
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
      Design: {
        Height: String,
        Width: String,
        Thickness: String,
        Weight: String,
        BuildMaterial: String,
        WaterResistance: String,
        Ruggedness: String,
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
          Quaternary: String,
        },
        Details: {
          Primary: cameraDetail(),
          Secondary: cameraDetail(),
          Tertiary: cameraDetail(),
          Quaternary: cameraDetail(),
        },
      },
      FrontCamera: {
        Camera: String,
      },
      Battery: {
        Capacity: String,
        BatteryType: String,
        QuickCharging: String,
        WirelessCharging: String,
        ReverseCharging: String,
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