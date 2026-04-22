const crypto = require('crypto');

// Generates PAW-YYYY-XXXX style PINs
// Example: PAW-2024-A3F9
// My design: year-prefixed so old PINs are distinguishable;
// 4-char hex suffix gives 65,536 combinations per year — enough for MVP,
// collision-checked before saving in pet controller.

const generatePetPin = () => {
  const year   = new Date().getFullYear();
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `PAW-${year}-${suffix}`;
};

// Numeric PIN for SMS verification (6 digits)
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

module.exports = { generatePetPin, generateOtp };