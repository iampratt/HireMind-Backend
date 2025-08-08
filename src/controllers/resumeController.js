const ResumeParser = require('../services/resumeParser');
const Resume = require('../models/Resume');
const fs = require('fs').promises;
const path = require('path');
const { cleanupOrphanedFiles, getFileStats } = require('../utils/fileCleanup');

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

      // Delete the uploaded file after successful data extraction
      try {
        await fs.unlink(filePath);
        console.log(`Resume file deleted after processing: ${fileName}`);
      } catch (unlinkError) {
        console.error(
          'Error deleting resume file after processing:',
          unlinkError
        );
        // Don't fail the request if file deletion fails
      }

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

      // Delete file from storage (if it still exists)
      try {
        await fs.access(resume.filePath);
        await fs.unlink(resume.filePath);
        console.log(`Resume file deleted: ${resume.fileName}`);
      } catch (unlinkError) {
        console.warn('File not found or already deleted:', unlinkError.message);
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
          message:
            'Resume file not found on server. The file may have been automatically cleaned up after processing.',
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

  async cleanupFiles(req, res) {
    try {
      // Only allow cleanup in development or by admin users
      if (process.env.NODE_ENV === 'production' && !req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.',
        });
      }

      await cleanupOrphanedFiles();

      res.status(200).json({
        success: true,
        message: 'File cleanup completed successfully',
      });
    } catch (error) {
      console.error('File cleanup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup files',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  async getFileStats(req, res) {
    try {
      // Only allow stats in development or by admin users
      if (process.env.NODE_ENV === 'production' && !req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.',
        });
      }

      const stats = await getFileStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Get file stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get file statistics',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }
}

module.exports = new ResumeController();
