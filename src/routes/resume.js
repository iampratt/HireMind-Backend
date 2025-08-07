const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');
const { authenticateToken } = require('../middleware/auth');
const { uploadResume, handleUploadError } = require('../middleware/upload');

// All resume routes require authentication
router.use(authenticateToken);

// POST /api/resume/upload
router.post(
  '/upload',
  uploadResume,
  handleUploadError,
  resumeController.uploadResume
);

// GET /api/resume
router.get('/', resumeController.getResumes);

// GET /api/resume/:id
router.get('/:id', resumeController.getResume);

// DELETE /api/resume/:id
router.delete('/:id', resumeController.deleteResume);

// POST /api/resume/:id/reparse
router.post('/:id/reparse', resumeController.reparseResume);

module.exports = router;
