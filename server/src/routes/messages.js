const express = require('express')
const protect = require('../middleware/auth.js')
const roleGuard = require('../middleware/roleGuard.js')
const Message = require('../models/Message')
const Booking = require('../models/Booking')
const logger = require('../utils/logger.js')

const router = express.Router()

// GET /api/bookings/:id/messages
router.get('/:id/messages', protect, roleGuard('customer', 'driver', 'hamali', 'admin'), async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.id })
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' })

    const userId = req.user.userId
    const isAdmin = req.user.role === 'admin'
    const isCustomer = booking.customerId && booking.customerId.toString() === userId
    const isProvider = booking.providerId && booking.providerId.toString() === userId

    if (!isAdmin && !isCustomer && !isProvider) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    const messages = await Message.find({ bookingId: booking._id })
      .populate('senderId', 'name profilePhoto role')
      .sort({ createdAt: 1 })

    return res.json({ success: true, messages })
  } catch (err) {
    logger.error('GET /:id/messages: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// POST /api/bookings/:id/messages
router.post('/:id/messages', protect, roleGuard('customer', 'driver', 'hamali'), async (req, res) => {
  try {
    const { content } = req.body
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' })
    }

    const booking = await Booking.findOne({ bookingId: req.params.id })
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' })

    const userId = req.user.userId
    const isCustomer = booking.customerId && booking.customerId.toString() === userId
    const isProvider = booking.providerId && booking.providerId.toString() === userId

    if (!isCustomer && !isProvider) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    const msg = await Message.create({
      bookingId: booking._id,
      senderId: userId,
      content: content.trim(),
      type: 'text'
    })

    const populated = await Message.findById(msg._id)
      .populate('senderId', 'name profilePhoto role')

    const io = req.app.get('io')
    io.to(`booking:${req.params.id}`).emit('message:new', populated)

    return res.status(201).json({ success: true, message: populated })
  } catch (err) {
    logger.error('POST /:id/messages: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router
