const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'Full name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Full name cannot exceed 50 characters']
  },
  subordinates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  avatar: {
    filename: {
      type: String,
      default: null
    },
    originalName: {
      type: String,
      default: null
    },
    path: {
      type: String,
      default: null
    },
    size: {
      type: Number,
      default: null
    },
    mimeType: {
      type: String,
      required: false,
    },
    fileExtension: {
      type: String,
      required: false, // Changed to false since it should be optional
      enum: ['.png', '.jpg', '.jpeg', null] // Added null to enum
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  contactNumber: {
    type: String,
    default: null,
    match: [/^\+[1-9]\d{1,3}[1-9]\d{6,14}$/, 'Please enter a valid contact number']
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    default: null
  },
  role: {
    type: String,
    enum: ['admin', 'employee', 'supervisor'],
    default: 'employee'
  },
  designation: {
    type: String,
    default: null
  },
  expoPushToken: {
    type: String,
    default: null
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
