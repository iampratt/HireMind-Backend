const fs = require('fs').promises;
const path = require('path');
const Resume = require('../models/Resume');

/**
 * Clean up orphaned resume files in the uploads directory
 * Files are considered orphaned if they exist in the filesystem but not in the database
 */
async function cleanupOrphanedFiles() {
  try {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';

    // Check if upload directory exists
    try {
      await fs.access(uploadDir);
    } catch (error) {
      console.log('Upload directory does not exist, nothing to clean up');
      return;
    }

    // Get all files in upload directory
    const files = await fs.readdir(uploadDir);
    const resumeFiles = files.filter(
      (file) =>
        file.startsWith('resume-') &&
        (file.endsWith('.pdf') ||
          file.endsWith('.doc') ||
          file.endsWith('.docx') ||
          file.endsWith('.txt'))
    );

    if (resumeFiles.length === 0) {
      console.log('No resume files found in uploads directory');
      return;
    }

    // Get all file paths from database
    const resumes = await Resume.find({}, 'filePath');
    const dbFilePaths = new Set(resumes.map((resume) => resume.filePath));

    let deletedCount = 0;
    let errorCount = 0;

    // Check each file in uploads directory
    for (const file of resumeFiles) {
      const filePath = path.join(uploadDir, file);

      // Check if file exists in database
      if (!dbFilePaths.has(filePath)) {
        try {
          await fs.unlink(filePath);
          console.log(`Deleted orphaned file: ${file}`);
          deletedCount++;
        } catch (error) {
          console.error(`Error deleting orphaned file ${file}:`, error.message);
          errorCount++;
        }
      }
    }

    console.log(
      `Cleanup completed: ${deletedCount} files deleted, ${errorCount} errors`
    );
  } catch (error) {
    console.error('Error during file cleanup:', error);
  }
}

/**
 * Get statistics about files in uploads directory
 */
async function getFileStats() {
  try {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';

    try {
      await fs.access(uploadDir);
    } catch (error) {
      return { totalFiles: 0, orphanedFiles: 0, directoryExists: false };
    }

    const files = await fs.readdir(uploadDir);
    const resumeFiles = files.filter(
      (file) =>
        file.startsWith('resume-') &&
        (file.endsWith('.pdf') ||
          file.endsWith('.doc') ||
          file.endsWith('.docx') ||
          file.endsWith('.txt'))
    );

    const resumes = await Resume.find({}, 'filePath');
    const dbFilePaths = new Set(resumes.map((resume) => resume.filePath));

    let orphanedCount = 0;
    for (const file of resumeFiles) {
      const filePath = path.join(uploadDir, file);
      if (!dbFilePaths.has(filePath)) {
        orphanedCount++;
      }
    }

    return {
      totalFiles: resumeFiles.length,
      orphanedFiles: orphanedCount,
      directoryExists: true,
    };
  } catch (error) {
    console.error('Error getting file stats:', error);
    return {
      totalFiles: 0,
      orphanedFiles: 0,
      directoryExists: false,
      error: error.message,
    };
  }
}

module.exports = {
  cleanupOrphanedFiles,
  getFileStats,
};
