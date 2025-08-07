const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRequest, authSchemas } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// POST /api/auth/signup
router.post(
  '/signup',
  validateRequest(authSchemas.signup),
  authController.signup
);

// POST /api/auth/login
router.post('/login', validateRequest(authSchemas.login), authController.login);

// GET /api/auth/profile
router.get('/profile', authenticateToken, authController.getProfile);

module.exports = router;
