const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { authenticateToken } = require('../middleware/auth');

// All job routes require authentication
router.use(authenticateToken);

// GET /api/jobs/search
router.get('/search', jobController.searchJobs);

// GET /api/jobs/:jobId/details
router.get('/:jobId/details', jobController.getJobDetails);

// GET /api/jobs/recommendations
router.get('/recommendations', jobController.getJobRecommendations);

// GET /api/jobs/recommendations/:resumeId
router.get('/recommendations/:resumeId', jobController.getJobRecommendations);

module.exports = router;
