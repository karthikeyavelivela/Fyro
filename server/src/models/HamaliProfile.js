const mongoose = require('mongoose')

const hamaliProfileSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  teamSize: { type: Number, default: 1 },
  ratePerJob: { type: Number, default: 200 },
  ratePerHour: { type: Number, default: 70 },
  skills: [String],
  city: { type: String, default: '' },
  area: { type: String, default: '' },
  currentLocation: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [80.6480, 16.5062] }
  },
  isAvailable: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  totalJobsDone: { type: Number, default: 0 }
}, { timestamps: true })

hamaliProfileSchema.index({ currentLocation: '2dsphere' })

module.exports = mongoose.model('HamaliProfile', hamaliProfileSchema)
