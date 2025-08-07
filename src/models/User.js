const mongoose = require('mongoose');
require('./Resume'); // Import Resume model to register it

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    geminiApiKey: {
      type: String,
      required: [true, 'Gemini API key is required'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        return ret;
      },
      virtuals: true,
    },
    toObject: { virtuals: true },
  }
);

// Virtual for resumes relationship
userSchema.virtual('resumes', {
  ref: 'Resume',
  localField: '_id',
  foreignField: 'userId',
});

module.exports = mongoose.model('User', userSchema);
