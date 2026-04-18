const mongoose = require('mongoose')

const locationSchema = new mongoose.Schema({
  address: { type: String, default: '' },
  lat: { type: Number },
  lng: { type: Number }
}, { _id: false })

const fareBreakdownSchema = new mongoose.Schema({
  baseFare: { type: Number, default: 0 },
  distanceFare: { type: Number, default: 0 },
  hourlyFare: { type: Number, default: 0 },
  floorSurcharge: { type: Number, default: 0 },
  heavySurcharge: { type: Number, default: 0 },
  returnLoadDiscount: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  gst: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
}, { _id: false })

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  bookingType: { type: String, enum: ['transport', 'hamali'], required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  pickup: locationSchema,
  dropoff: locationSchema,
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  vehicleType: { type: String, default: '' },
  hamaliDetails: {
    type: { type: String, enum: ['loading', 'unloading', 'both'] },
    teamSize: { type: Number, default: 1 },
    estimatedHours: { type: Number, default: 1 },
    floorNumber: { type: Number, default: 0 },
    heavyGoods: { type: Boolean, default: false },
    goodsDescription: { type: String, default: '' }
  },
  scheduledAt: { type: Date },
  acceptedAt: { type: Date },
  startedAt: { type: Date },
  completedAt: { type: Date },
  distanceKm: { type: Number, default: 0 },
  estimatedFare: { type: Number, default: 0 },
  finalFare: { type: Number, default: 0 },
  fareBreakdown: fareBreakdownSchema,
  counterOffer: { type: Number },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  paidAt: { type: Date },
  customerRating: { type: Number, min: 1, max: 5 },
  providerRating: { type: Number, min: 1, max: 5 },
  customerReview: { type: String, default: '' },
  providerReview: { type: String, default: '' },
  hasComplaint: { type: Boolean, default: false }
}, { timestamps: true })

module.exports = mongoose.model('Booking', bookingSchema)
