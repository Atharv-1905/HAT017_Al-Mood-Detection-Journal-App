const mongoose = require('mongoose');

/**
 * User Schema for MindTrace AI+
 * Includes basic credentials and behavioral personalization data.
 */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      trim: true,
      maxLength: 50,
    },
    full_name: {
      type: String,
      trim: true,
      maxLength: 100,
    },
    firstName: {
      type: String,
      trim: true,
      maxLength: 50,
    },
    lastName: {
      type: String,
      trim: true,
      maxLength: 50,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    dob: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    interests: {
      type: [String],
      default: [],
    },
    freeTimeActivities: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Optional: Virtual for full name
userSchema.virtual('fullName').get(function () {
  return this.full_name || `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.username;
});

module.exports = mongoose.model('User', userSchema);
