const express = require('express');
const {
  createReview,
  getToiletReviews
} = require('../controllers/reviewController');
const {
  authenticateToken,
  authorizeRoles
} = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/toilet/:toiletId', getToiletReviews);
router.post('/', authenticateToken, authorizeRoles('USER'), createReview);

module.exports = router;
