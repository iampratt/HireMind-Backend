#!/usr/bin/env node

/**
 * Standalone script to clean up resume files
 * Run with: node scripts/cleanup-files.js
 */

const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');

// Database connection (you'll need to set this up)
const DATABASE_URL =
  process.env.DATABASE_URL || 'mongodb://localhost:27017/hiremind';

// Resume model (simplified for standalone script)
const resumeSchema = new mongoose.Schema({
  filePath: String,
});

const Resume = mongoose.model('Resume', resumeSchema);

/**
 * Clean up orphaned resume files in the uploads directory
 */
async function cleanupOrphanedFiles() {
  try {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';

    console.log('🔍 Starting file cleanup...');
    console.log(`📁 Upload directory: ${uploadDir}`);

    // Check if upload directory exists
    try {
      await fs.access(uploadDir);
    } catch (error) {
      console.log('❌ Upload directory does not exist, nothing to clean up');
      return;
    }

    // Connect to database
    console.log('🔌 Connecting to database...');
    await mongoose.connect(DATABASE_URL);
    console.log('✅ Connected to database');

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

    console.log(
      `📊 Found ${resumeFiles.length} resume files in uploads directory`
    );

    if (resumeFiles.length === 0) {
      console.log('✅ No resume files found in uploads directory');
      return;
    }

    // Get all file paths from database
    const resumes = await Resume.find({}, 'filePath');
    const dbFilePaths = new Set(resumes.map((resume) => resume.filePath));

    console.log(`📊 Found ${resumes.length} resume records in database`);

    let deletedCount = 0;
    let errorCount = 0;

    // Check each file in uploads directory
    for (const file of resumeFiles) {
      const filePath = path.join(uploadDir, file);

      // Check if file exists in database
      if (!dbFilePaths.has(filePath)) {
        try {
          await fs.unlink(filePath);
          console.log(`🗑️  Deleted orphaned file: ${file}`);
          deletedCount++;
        } catch (error) {
          console.error(
            `❌ Error deleting orphaned file ${file}:`,
            error.message
          );
          errorCount++;
        }
      } else {
        console.log(`✅ File exists in database: ${file}`);
      }
    }

    console.log(`\n📈 Cleanup Summary:`);
    console.log(`   - Total files found: ${resumeFiles.length}`);
    console.log(`   - Files deleted: ${deletedCount}`);
    console.log(`   - Errors: ${errorCount}`);
    console.log(
      `   - Files kept: ${resumeFiles.length - deletedCount - errorCount}`
    );
  } catch (error) {
    console.error('❌ Error during file cleanup:', error);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
  }
}

/**
 * Get statistics about files in uploads directory
 */
async function getFileStats() {
  try {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';

    console.log('📊 Getting file statistics...');

    try {
      await fs.access(uploadDir);
    } catch (error) {
      console.log('❌ Upload directory does not exist');
      return { totalFiles: 0, orphanedFiles: 0, directoryExists: false };
    }

    // Connect to database
    await mongoose.connect(DATABASE_URL);

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

    const stats = {
      totalFiles: resumeFiles.length,
      orphanedFiles: orphanedCount,
      directoryExists: true,
    };

    console.log('📊 File Statistics:');
    console.log(`   - Total resume files: ${stats.totalFiles}`);
    console.log(`   - Orphaned files: ${stats.orphanedFiles}`);
    console.log(`   - Database records: ${resumes.length}`);

    return stats;
  } catch (error) {
    console.error('❌ Error getting file stats:', error);
    return {
      totalFiles: 0,
      orphanedFiles: 0,
      directoryExists: false,
      error: error.message,
    };
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

// Main execution
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'stats':
      await getFileStats();
      break;
    case 'cleanup':
      await cleanupOrphanedFiles();
      break;
    default:
      console.log('Usage: node scripts/cleanup-files.js [command]');
      console.log('Commands:');
      console.log('  stats    - Show file statistics');
      console.log('  cleanup  - Clean up orphaned files');
      console.log('');
      console.log('Examples:');
      console.log('  node scripts/cleanup-files.js stats');
      console.log('  node scripts/cleanup-files.js cleanup');
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  cleanupOrphanedFiles,
  getFileStats,
};
