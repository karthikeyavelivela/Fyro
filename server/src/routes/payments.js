const express = require('express')
const crypto = require('crypto')
const protect = require('../middleware/auth.js')
const roleGuard = require('../middleware/roleGuard.js')
const Booking = require('../models/Booking')
const Payment = require('../models/Payment')
const logger = require('../utils/logger.js')

const router = express.Router()

// POST /api/payments/create-order
router.post('/create-order', protect, roleGuard('customer'), async (req, res) => {
  try {
    const { bookingId } = req.body
    if (!bookingId) return res.status(400).json({ success: false, message: 'bookingId required' })

    const booking = await Booking.findOne({ bookingId })
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' })

    if (booking.customerId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Booking must be completed before payment' })
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Booking already paid' })
    }

    const amount = booking.finalFare || booking.estimatedFare

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    const isRealKey = keyId && !keyId.startsWith('your_')

    let orderId

    if (isRealKey) {
      const Razorpay = require('razorpay')
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: bookingId
      })
      orderId = order.id
      booking.razorpayOrderId = orderId
      await booking.save()
    } else {
      orderId = 'mock_' + Date.now()
    }

    return res.json({
      success: true,
      orderId,
      amount,
      currency: 'INR',
      key: keyId || 'mock'
    })
  } catch (err) {
    logger.error('POST payments/create-order: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// POST /api/payments/verify
router.post('/verify', protect, roleGuard('customer'), async (req, res) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body

    const booking = await Booking.findOne({ bookingId })
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' })

    if (booking.customerId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET
    const isRealKey = keySecret && !keySecret.startsWith('your_')

    if (isRealKey && razorpaySignature) {
      const expected = crypto
        .createHmac('sha256', keySecret)
        .update(razorpayOrderId + '|' + razorpayPaymentId)
        .digest('hex')

      if (expected !== razorpaySignature) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature' })
      }
    }

    booking.paymentStatus = 'paid'
    booking.razorpayOrderId = razorpayOrderId || booking.razorpayOrderId
    booking.razorpayPaymentId = razorpayPaymentId
    booking.paidAt = new Date()
    await booking.save()

    await Payment.create({
      bookingId: booking._id,
      customerId: booking.customerId,
      providerId: booking.providerId,
      amount: booking.finalFare || booking.estimatedFare,
      currency: 'INR',
      razorpayOrderId: razorpayOrderId || '',
      razorpayPaymentId: razorpayPaymentId || '',
      razorpaySignature: razorpaySignature || '',
      status: 'captured'
    })

    const io = req.app.get('io')
    io.to(`booking:${bookingId}`).emit('payment:confirmed', { bookingId })
    if (booking.providerId) {
      io.to(`user:${booking.providerId}`).emit('payment:confirmed', { bookingId })
    }

    return res.json({ success: true })
  } catch (err) {
    logger.error('POST payments/verify: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// GET /api/payments/my
router.get('/my', protect, roleGuard('customer'), async (req, res) => {
  try {
    const { page = 1 } = req.query
    const limit = 10
    const skip = (parseInt(page) - 1) * limit

    const [payments, total] = await Promise.all([
      Payment.find({ customerId: req.user.userId })
        .populate('bookingId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments({ customerId: req.user.userId })
    ])

    return res.json({
      success: true,
      payments,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    })
  } catch (err) {
    logger.error('GET payments/my: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// GET /api/payments/receipt/:bookingId
router.get('/receipt/:bookingId', protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId })
      .populate('customerId', 'name email phone')
      .populate('providerId', 'name phone')
      .populate('vehicleId')

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' })

    const userId = req.user.userId
    const isCustomer = booking.customerId && booking.customerId._id.toString() === userId
    const isProvider = booking.providerId && booking.providerId._id.toString() === userId
    const isAdmin = req.user.role === 'admin'

    if (!isCustomer && !isProvider && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    return res.json({ success: true, receipt: booking })
  } catch (err) {
    logger.error('GET payments/receipt/:bookingId: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router
