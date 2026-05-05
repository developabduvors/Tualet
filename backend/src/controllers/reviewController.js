const prisma = require('../config/prisma');
const { formatReview } = require('../utils/serializers');
const { recalculateToiletRating } = require('../utils/ratings');

async function createReview(req, res, next) {
  try {
    const userId = req.user.id;
    const toiletId = Number(req.body.toiletId);
    const rating = Number(req.body.rating);
    const comment = req.body.comment || null;
    const quickFeedback = Array.isArray(req.body.quick_feedback)
      ? req.body.quick_feedback
      : [];

    if (!toiletId || Number.isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'toiletId and rating (1-5) are required'
      });
    }

    const review = await prisma.$transaction(async (tx) => {
      const toilet = await tx.toilet.findUnique({
        where: { id: toiletId }
      });

      if (!toilet) {
        const error = new Error('Toilet not found');
        error.statusCode = 404;
        throw error;
      }

      const createdReview = await tx.review.upsert({
        where: {
          userId_toiletId: {
            userId,
            toiletId
          }
        },
        update: {
          rating,
          comment,
          quick_feedback: JSON.stringify(quickFeedback)
        },
        create: {
          userId,
          toiletId,
          rating,
          comment,
          quick_feedback: JSON.stringify(quickFeedback)
        }
      });

      await recalculateToiletRating(tx, toiletId);

      return createdReview;
    });

    return res.status(201).json({
      success: true,
      message: 'Review saved successfully',
      data: formatReview(review)
    });
  } catch (error) {
    next(error);
  }
}

async function deleteReview(req, res, next) {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const role = req.user.role;

    await prisma.$transaction(async (tx) => {
      const review = await tx.review.findUnique({ where: { id } });

      if (!review) {
        const error = new Error('Review not found');
        error.statusCode = 404;
        throw error;
      }

      if (review.userId !== userId && role !== 'ADMIN') {
        const error = new Error('Unauthorized to delete this review');
        error.statusCode = 403;
        throw error;
      }

      await tx.review.delete({ where: { id } });
      await recalculateToiletRating(tx, review.toiletId);
    });

    return res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function getToiletReviews(req, res, next) {
  try {
    const toiletId = Number(req.params.toiletId);

    const reviews = await prisma.review.findMany({
      where: { toiletId },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      count: reviews.length,
      data: reviews.map(formatReview)
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReview,
  getToiletReviews,
  deleteReview
};
