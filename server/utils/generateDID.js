const crypto = require('crypto');
const Identity = require('../models/Identity');

const generateDID = async () => {
  let isUnique = false;
  let digitalIDNumber;

  while (!isUnique) {
    const randomNum = crypto.randomInt(0, 999999);
    const padded = String(randomNum).padStart(6, '0');
    digitalIDNumber = `DID-POLY-${padded}`;

    const existing = await Identity.findOne({ digitalIDNumber });
    if (!existing) {
      isUnique = true;
    }
  }

  return digitalIDNumber;
};

module.exports = generateDID;
