const express = require('express');
const {
  createReview,
  getToiletReviews,
  deleteReview
} = require('../controllers/reviewController');
const {
  authenticateToken,
  authorizeRoles
} = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/toilet/:toiletId', getToiletReviews);
router.post('/', authenticateToken, authorizeRoles('USER'), createReview);
router.delete('/:id', authenticateToken, deleteReview);

module.exports = router;
