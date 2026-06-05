const fs = require('fs');
const path = require('path');

// Function to transform old spec structure to new standardized structure
function transformSpecs(oldSpecs) {
  const newSpecs = {};

  // General section
  if (oldSpecs.General) {
    newSpecs.General = {
      OperatingSystem: oldSpecs.General.OS || oldSpecs.General.OperatingSystem,
      CustomUI: oldSpecs.General.UI || oldSpecs.General.CustomUI,
      LaunchDate: oldSpecs.General.ReleaseDate || oldSpecs.General.LaunchDate,
      OSUpdate: oldSpecs.General.OSUpdate || 'Up to 3 major versions',
    };
  }

  // Performance section
  if (oldSpecs.Performance) {
    newSpecs.Performance = {
      ...oldSpecs.Performance,
      RAMType: oldSpecs.Performance.RAM_Type || oldSpecs.Performance.RAMType,
      PerformanceTestResults:
        oldSpecs.Performance.PerformanceTestResults || 'Good',
      BootupTime: oldSpecs.Performance.BootupTime || '20 seconds',
      AnTuTuScore: oldSpecs.Performance.AnTuTuScore || '800000',
    };
  }

  // Storage section
  newSpecs.Storage = oldSpecs.Storage || {
    InternalStorage:
      oldSpecs.KeySpecs?.RAM_Storage?.split(' + ')[1] || '128 GB',
    StorageType: 'UFS 2.2',
  };

  // Display section
  if (oldSpecs.Display) {
    newSpecs.Display = {
      ...oldSpecs.Display,
      ScreenToBodyRatio: oldSpecs.Display.ScreenToBodyRatio || '85%',
      BezelLessDisplay: oldSpecs.Display.BezelLessDisplay || 'Yes',
      PixelDensity: oldSpecs.Display.PixelDensity || '400 PPI',
      PeakBrightness: oldSpecs.Display.PeakBrightness || '1000 nits',
      HBMBrightness: oldSpecs.Display.HBMBrightness || '1200 nits',
      AspectRatio: oldSpecs.Display.AspectRatio || '20:9',
    };
  }

  // Camera sections
  if (oldSpecs.KeySpecs?.RearCamera) {
    const rearCameras = oldSpecs.KeySpecs.RearCamera.split(' + ');
    newSpecs.RearCamera = {
      Camera: {
        Primary: rearCameras[0] || '48 MP',
        Secondary: rearCameras[1] || undefined,
        Tertiary: rearCameras[2] || undefined,
      },
    };
    // Remove undefined values
    Object.keys(newSpecs.RearCamera.Camera).forEach((key) => {
      if (newSpecs.RearCamera.Camera[key] === undefined) {
        delete newSpecs.RearCamera.Camera[key];
      }
    });
  }

  if (oldSpecs.KeySpecs?.FrontCamera) {
    newSpecs.FrontCamera = {
      Camera: oldSpecs.KeySpecs.FrontCamera,
    };
  }

  // Battery section
  if (oldSpecs.Battery) {
    newSpecs.Battery = {
      ...oldSpecs.Battery,
      BatteryChargingTime:
        oldSpecs.Battery.BatteryChargingTime || '60 minutes to 100%',
    };
  }

  // SoundAudio section
  newSpecs.SoundAudio = oldSpecs.SoundAudio || {
    Loudspeakers: 'Stereo',
    HeadphoneConnection: 'USB Type-C',
    SoundTechnology: 'Dolby Atmos',
  };

  // NetworkConnectivity section
  const networkConnectivity = {};
  if (oldSpecs.Network) {
    networkConnectivity.NetworkSupport = oldSpecs.Network.NetworkSupport;
    networkConnectivity.VoLTE = oldSpecs.Network.VoLTE ? 'Yes' : 'No';
  }
  if (oldSpecs.Bluetooth)
    networkConnectivity.Bluetooth = `v${oldSpecs.Bluetooth}`;
  if (oldSpecs.GPS)
    networkConnectivity.GPS =
      oldSpecs.GPS === true ? 'GPS, GLONASS' : oldSpecs.GPS;
  if (oldSpecs.NFC) networkConnectivity.NFC = oldSpecs.NFC ? 'Yes' : 'No';

  networkConnectivity.SIMSlot = networkConnectivity.SIMSlot || 'Dual SIM';
  networkConnectivity.SIMType = networkConnectivity.SIMType || 'Nano SIM';
  networkConnectivity.WiFi = networkConnectivity.WiFi || 'Wi-Fi 6';

  if (Object.keys(networkConnectivity).length > 0) {
    newSpecs.NetworkConnectivity = networkConnectivity;
  }

  // Sensors section
  newSpecs.Sensors = oldSpecs.Sensors || {
    Fingerprint: 'Side-mounted',
    FingerprintSensorType: 'Capacitive',
    FingerprintSensorPosition: 'Side',
    OtherSensors: ['Accelerometer', 'Gyroscope', 'Proximity'],
  };

  // Remove KeySpecs
  delete newSpecs.KeySpecs;

  return newSpecs;
}

// Update phones.json
const phonesPath = path.join(__dirname, 'phones-upload', 'phones.json');
const phonesData = JSON.parse(fs.readFileSync(phonesPath, 'utf8'));

phonesData.forEach((phone) => {
  if (phone.specs) {
    phone.specs = transformSpecs(phone.specs);
  }
});

fs.writeFileSync(phonesPath, JSON.stringify(phonesData, null, 2));
console.log('Updated phones.json');

// Update upcoming.json
const upcomingPath = path.join(__dirname, 'upcoming-upload', 'upcoming.json');
const upcomingData = JSON.parse(fs.readFileSync(upcomingPath, 'utf8'));

upcomingData.forEach((phone) => {
  if (phone.specs) {
    phone.specs = transformSpecs(phone.specs);
  }
});

fs.writeFileSync(upcomingPath, JSON.stringify(upcomingData, null, 2));
console.log('Updated upcoming.json');

console.log('Bulk upload files updated successfully!');
