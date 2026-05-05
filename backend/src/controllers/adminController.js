const prisma = require('../config/prisma');
const { sanitizeUser } = require('../utils/serializers');

async function getAllUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      count: users.length,
      data: users.map(sanitizeUser)
    });
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    
    await prisma.user.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function getStats(req, res, next) {
  try {
    const [userCount, toiletCount, reviewCount] = await Promise.all([
      prisma.user.count(),
      prisma.toilet.count(),
      prisma.review.count()
    ]);

    return res.json({
      success: true,
      data: {
        users: userCount,
        toilets: toiletCount,
        reviews: reviewCount
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllUsers,
  deleteUser,
  getStats
};
