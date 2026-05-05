const prisma = require('../config/prisma');
const { generateToken } = require('../utils/jwt');
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

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
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

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
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
  getMe
};
