const crypto = require('crypto');

const generateVerifyToken = (identityId) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hmacSignature = crypto
    .createHmac('sha256', process.env.IDENTITY_VERIFY_SECRET)
    .update(rawToken + identityId.toString())
    .digest('hex');

  const verifyUrl = `${process.env.CLIENT_URL}/verify/${rawToken}.${hmacSignature}`;

  return { rawToken, hmacSignature, verifyUrl };
};

module.exports = generateVerifyToken;
