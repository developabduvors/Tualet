const prisma = require('../config/prisma');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const { hashPassword, comparePassword } = require('../utils/password');
const { sanitizeUser } = require('../utils/serializers');

const ALLOWED_ROLES = ['USER', 'OWNER', 'ADMIN'];

async function register(req, res, next) {
  try {
    const { name, phone, password } = req.body;
    const role = (req.body.role || 'USER').toUpperCase();

    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'name, phone and password are required'
      });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'role must be USER or OWNER'
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { phone }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this phone already exists'
      });
    }

    const user = await prisma.user.create({
      data: {
        name,
        phone,
        password: hashPassword(password),
        role
      }
    });

    const { accessToken, refreshToken } = generateTokens(user);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      accessToken,
      refreshToken,
      data: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'phone and password are required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user || !comparePassword(password, user.password)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid phone or password'
      });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    return res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      data: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.body.refreshToken;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'refreshToken is required'
      });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Foydalanuvchini DB'dan qayta o'qish — rol o'zgargan bo'lsa
    // yangi access token avtomatik yangi roli bilan chiqadi.
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    return res.json({
      success: true,
      message: 'Tokens refreshed',
      accessToken,
      refreshToken: newRefreshToken,
      data: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      data: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  refresh,
  getMe
};
