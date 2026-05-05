const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function comparePassword(password, storedPassword) {
  if (!storedPassword || !storedPassword.includes(':')) {
    return false;
  }

  const [salt, originalHash] = storedPassword.split(':');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(originalHash, 'hex')
  );
}

module.exports = {
  hashPassword,
  comparePassword
};
