const ResumeParser = require('../services/resumeParser');
const Resume = require('../models/Resume');
const fs = require('fs').promises;
const path = require('path');

class ResumeController {
  async uploadResume(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No resume file uploaded',
        });
      }

      const userId = req.user.id;
      const geminiApiKey = req.user.geminiApiKey;
      const filePath = req.file.path;
      const fileName = req.file.originalname;

      // Initialize resume parser with user's Gemini API key
      const resumeParser = new ResumeParser(geminiApiKey);

      // Parse resume and extract data
      const extractedData = await resumeParser.parseResume(filePath);

      // Save resume metadata and extracted data to database
      const resume = await Resume.create({
        userId,
        fileName,
        filePath,
        extractedData,
      });

      res.status(200).json({
        success: true,
        message: 'Resume processed successfully',
        data: {
          resumeId: resume.id,
          fileName: resume.fileName,
          uploadedAt: resume.uploadedAt,
          extractedData: resume.extractedData,
        },
      });
    } catch (error) {
      console.error('Resume upload error:', error);

      // Clean up uploaded file if processing failed
      if (req.file && req.file.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to process resume',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  async getResumes(req, res) {
    try {
      const userId = req.user.id;

      const resumes = await Resume.find({ userId })
        .select('id fileName uploadedAt extractedData')
        .sort({ uploadedAt: -1 });

      res.status(200).json({
        success: true,
        data: resumes,
      });
    } catch (error) {
      console.error('Get resumes error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  async getResume(req, res) {
    try {
      const userId = req.user.id;
      const resumeId = req.params.id;

      const resume = await Resume.findOne({
        _id: resumeId,
        userId,
      }).select('id fileName uploadedAt extractedData');

      if (!resume) {
        return res.status(404).json({
          success: false,
          message: 'Resume not found',
        });
      }

      res.status(200).json({
        success: true,
        data: resume,
      });
    } catch (error) {
      console.error('Get resume error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  async deleteResume(req, res) {
    try {
      const userId = req.user.id;
      const resumeId = req.params.id;

      // Find resume and check ownership
      const resume = await Resume.findOne({
        _id: resumeId,
        userId,
      });

      if (!resume) {
        return res.status(404).json({
          success: false,
          message: 'Resume not found',
        });
      }

      // Delete file from storage
      try {
        await fs.unlink(resume.filePath);
      } catch (unlinkError) {
        console.warn('Error deleting file from storage:', unlinkError);
        // Continue with database deletion even if file deletion fails
      }

      // Delete from database
      await Resume.findByIdAndDelete(resumeId);

      res.status(200).json({
        success: true,
        message: 'Resume deleted successfully',
      });
    } catch (error) {
      console.error('Delete resume error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  async reparseResume(req, res) {
    try {
      const userId = req.user.id;
      const resumeId = req.params.id;
      const geminiApiKey = req.user.geminiApiKey;

      // Find resume and check ownership
      const resume = await Resume.findOne({
        _id: resumeId,
        userId,
      });

      if (!resume) {
        return res.status(404).json({
          success: false,
          message: 'Resume not found',
        });
      }

      // Check if file still exists
      try {
        await fs.access(resume.filePath);
      } catch (accessError) {
        return res.status(404).json({
          success: false,
          message: 'Resume file not found on server',
        });
      }

      // Re-parse resume
      const resumeParser = new ResumeParser(geminiApiKey);
      const extractedData = await resumeParser.parseResume(resume.filePath);

      // Update database with new extracted data
      const updatedResume = await Resume.findByIdAndUpdate(
        resumeId,
        { extractedData },
        { new: true, select: 'id fileName uploadedAt extractedData' }
      );

      res.status(200).json({
        success: true,
        message: 'Resume re-parsed successfully',
        data: {
          resumeId: updatedResume.id,
          fileName: updatedResume.fileName,
          uploadedAt: updatedResume.uploadedAt,
          extractedData: updatedResume.extractedData,
        },
      });
    } catch (error) {
      console.error('Reparse resume error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to re-parse resume',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

module.exports = new ResumeController();
