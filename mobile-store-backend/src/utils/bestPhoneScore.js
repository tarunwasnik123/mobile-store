function getNumber(value) {
  if (!value) return 0;
  const match = value.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

function calculateBestScore(phone) {
  let score = 0;

  // 1️⃣ Performance (30)
  const ram = getNumber(phone.specs?.Performance?.RAM);
  const fabrication = getNumber(phone.specs?.Performance?.Fabrication);
  if (ram >= 16) score += 20;
  else if (ram >= 12) score += 15;
  else if (ram >= 8) score += 10;

  if (fabrication && fabrication <= 4) score += 10;

  // 2️⃣ Camera (25)
  const rearCam = getNumber(phone.specs?.RearCamera?.Camera?.Primary);
  const frontCam = getNumber(phone.specs?.FrontCamera?.Camera);
  if (rearCam >= 200) score += 15;
  else if (rearCam >= 108) score += 10;
  else if (rearCam >= 64) score += 7;

  if (frontCam >= 32) score += 5;
  else if (frontCam >= 16) score += 3;

  // 3️⃣ Display (15)
  const refresh = getNumber(phone.specs?.Display?.RefreshRate);
  if (refresh >= 144) score += 10;
  else if (refresh >= 120) score += 8;

  if (phone.specs?.Display?.Type?.includes('AMOLED')) score += 5;

  // 4️⃣ Battery (15)
  const battery = getNumber(phone.specs?.Battery?.Capacity);
  if (battery >= 6000) score += 10;
  else if (battery >= 5000) score += 7;

  if (phone.specs?.Battery?.QuickCharging) score += 5;

  // 5️⃣ Software & Newness (10)
  const releaseDate = new Date(phone.specs?.General?.ReleaseDate);
  const diffMonths =
    (Date.now() - releaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

  if (diffMonths <= 6) score += 10;
  else if (diffMonths <= 12) score += 6;

  // 6️⃣ Price-to-Value (5)
  if (phone.price < 30000) score += 5;
  else if (phone.price < 50000) score += 3;

  return score;
}

module.exports = { calculateBestScore };
