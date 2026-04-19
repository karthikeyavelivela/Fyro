const mongoose = require('mongoose')
const Booking = require('../models/Booking')

// Lookup booking by either FY-2025-0001 bookingId string or MongoDB _id
function findBooking(id, populate = '') {
  const isObjectId = mongoose.Types.ObjectId.isValid(id) && id.length === 24
  const query = isObjectId
    ? { _id: id }
    : { bookingId: id }

  let q = Booking.findOne(query)
  if (populate) q = q.populate(populate)
  return q
}

module.exports = findBooking
