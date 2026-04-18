const mongoose = require('mongoose')

const complaintSchema = new mongoose.Schema({
  complaintId: { type: String, required: true, unique: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  againstUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: {
    type: String,
    enum: ['overcharging', 'no_show', 'behaviour', 'goods_damage', 'payment_issue', 'other'],
    required: true
  },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['open', 'under_review', 'resolved', 'rejected'],
    default: 'open'
  },
  adminNote: { type: String, default: '' },
  attachments: [String],
  resolvedAt: { type: Date }
}, { timestamps: true })

module.exports = mongoose.model('Complaint', complaintSchema)
