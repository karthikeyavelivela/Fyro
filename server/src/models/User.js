const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['customer', 'driver', 'hamali', 'admin'], required: true },
  profilePhoto: { type: String, default: '' },
  language: { type: String, enum: ['en', 'hi', 'te'], default: 'en' },
  isVerified: { type: Boolean, default: false },
  isKYCApproved: { type: Boolean, default: false },
  rating: { type: Number, default: 5.0 },
  totalRatings: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

module.exports = mongoose.models.User || mongoose.model('User', userSchema)
