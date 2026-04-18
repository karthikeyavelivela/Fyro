const mongoose = require('mongoose')

// Counter model for atomic sequence generation
const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 }
})

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema)

async function nextId(name) {
  const year = new Date().getFullYear()
  const counterName = `${name}_${year}`
  const result = await Counter.findOneAndUpdate(
    { name: counterName },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  )
  return result.seq
}

async function generateBookingId() {
  const year = new Date().getFullYear()
  const seq = await nextId('booking')
  return `FY-${year}-${String(seq).padStart(4, '0')}`
}

async function generateComplaintId() {
  const year = new Date().getFullYear()
  const seq = await nextId('complaint')
  return `CMP-${year}-${String(seq).padStart(4, '0')}`
}

module.exports = { generateBookingId, generateComplaintId }
