const mongoose = require('mongoose')

const vehicleSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['mini_truck', 'tempo', 'truck_407', 'truck_1ton', 'truck_2ton', 'heavy'],
    required: true
  },
  registrationNumber: { type: String, required: true, unique: true },
  capacityTons: { type: Number, default: 1 },
  photos: [String],
  isAvailable: { type: Boolean, default: false },
  currentLocation: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [80.6480, 16.5062] }
  },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true })

vehicleSchema.index({ currentLocation: '2dsphere' })

module.exports = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema)
