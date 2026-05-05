const express = require('express');
const {
  createToilet,
  getAllToilets,
  getNearbyToilets,
  getToiletById,
  updateToilet,
  deleteToilet
} = require('../controllers/toiletController');
const {
  authenticateToken,
  authorizeRoles
} = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', getAllToilets);
router.get('/nearby', getNearbyToilets);
router.get('/:id', getToiletById);

router.post('/', authenticateToken, authorizeRoles('OWNER'), createToilet);
router.put('/:id', authenticateToken, updateToilet);
router.delete('/:id', authenticateToken, deleteToilet);

module.exports = router;
