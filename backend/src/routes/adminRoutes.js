const express = require('express');
const { getAllUsers, deleteUser, getStats } = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes here require ADMIN role
router.use(authenticateToken, authorizeRoles('ADMIN'));

router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.get('/stats', getStats);

module.exports = router;
