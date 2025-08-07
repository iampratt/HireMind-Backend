const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
    },
    filePath: {
      type: String,
      required: [true, 'File path is required'],
    },
    extractedData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'uploadedAt', updatedAt: false },
  }
);

module.exports = mongoose.model('Resume', resumeSchema);
