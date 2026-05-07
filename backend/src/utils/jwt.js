const jwt = require('jsonwebtoken');

const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      phone: user.phone,
      role: user.role,
      type: 'access'
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
      type: 'refresh'
    },
    process.env.JWT_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

function generateTokens(user) {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user)
  };
}

function verifyRefreshToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.type !== 'refresh') {
    const error = new Error('Invalid refresh token');
    error.statusCode = 401;
    throw error;
  }
  return decoded;
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyRefreshToken
};
