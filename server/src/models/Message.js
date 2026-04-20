const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'system'], default: 'text' },
  readAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema)
