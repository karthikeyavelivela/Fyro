const express = require('express')
const crypto = require('crypto')
const protect = require('../middleware/auth.js')
const roleGuard = require('../middleware/roleGuard.js')
const asyncHandler = require('../utils/asyncHandler')
const Booking = require('../models/Booking')
const Payment = require('../models/Payment')

const router = express.Router()

const getUserId = (req) => String(req.user?.userId || req.user?.id || req.user?._id || '')
const ok = (res, data = {}, extra = {}, status = 200) => res.status(status).json({ success: true, data, ...extra })
const fail = (res, message, status = 400, data = {}) => res.status(status).json({ success: false, message, data })

router.post('/create-order', protect, roleGuard('customer'), asyncHandler(async (req, res) => {
  const { bookingId } = req.body || {}
  if (!bookingId) return fail(res, 'bookingId required', 400)

  const booking = await Booking.findOne({ bookingId })
  if (!booking) return fail(res, 'Booking not found', 404)
  if (String(booking.customerId) !== getUserId(req)) return fail(res, 'Forbidden', 403)
  if (booking.status !== 'completed') return fail(res, 'Booking must be completed before payment', 400)
  if (booking.paymentStatus === 'paid') return fail(res, 'Booking already paid', 400)

  const amount = Number(booking.finalFare || booking.estimatedFare || 0)
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  const isRealKey = keyId && keySecret && !keyId.startsWith('your_') && !keySecret.startsWith('your_')
  let orderId = `mock_${Date.now()}`

  if (isRealKey) {
    const Razorpay = require('razorpay')
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: bookingId,
    })
    orderId = order.id
    booking.razorpayOrderId = orderId
    await booking.save()
  }

  return ok(res, { orderId, amount, currency: 'INR', key: keyId || 'mock' }, {
    orderId,
    amount,
    currency: 'INR',
    key: keyId || 'mock',
  })
}))

router.post('/verify', protect, roleGuard('customer'), asyncHandler(async (req, res) => {
  const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {}
  const booking = await Booking.findOne({ bookingId })
  if (!booking) return fail(res, 'Booking not found', 404)
  if (String(booking.customerId) !== getUserId(req)) return fail(res, 'Forbidden', 403)

  const keySecret = process.env.RAZORPAY_KEY_SECRET
  const isRealKey = keySecret && !keySecret.startsWith('your_')
  if (isRealKey && razorpaySignature) {
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    if (expected !== razorpaySignature) {
      return fail(res, 'Invalid payment signature', 400)
    }
  }

  booking.paymentStatus = 'paid'
  booking.razorpayOrderId = razorpayOrderId || booking.razorpayOrderId
  booking.razorpayPaymentId = razorpayPaymentId || booking.razorpayPaymentId
  booking.paidAt = new Date()
  await booking.save()

  const payment = await Payment.create({
    bookingId: booking._id,
    customerId: booking.customerId,
    providerId: booking.providerId,
    amount: Number(booking.finalFare || booking.estimatedFare || 0),
    currency: 'INR',
    razorpayOrderId: razorpayOrderId || '',
    razorpayPaymentId: razorpayPaymentId || '',
    razorpaySignature: razorpaySignature || '',
    status: 'captured',
  })

  const io = req.app.get('io')
  io?.to(`booking:${bookingId}`).emit('payment:confirmed', { bookingId })
  if (booking.providerId) io?.to(`user:${booking.providerId}`).emit('payment:confirmed', { bookingId })

  return ok(res, { payment }, { payment })
}))

router.get('/my', protect, asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const page = Math.max(1, Number(req.query.page || 1))
  const limit = Math.max(1, Number(req.query.limit || 10))
  const skip = (page - 1) * limit

  const query = req.user.role === 'customer'
    ? { customerId: userId }
    : req.user.role === 'admin'
      ? {}
      : { $or: [{ customerId: userId }, { providerId: userId }] }

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('bookingId')
      .populate('customerId', 'name phone email')
      .populate('providerId', 'name phone email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(query),
  ])

  return ok(res, { payments, total, page, pages: Math.ceil(total / limit) }, {
    payments,
    total,
    page,
    pages: Math.ceil(total / limit),
  })
}))

router.get('/receipt/:bookingId', protect, asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ bookingId: req.params.bookingId })
    .populate('customerId', 'name email phone')
    .populate('providerId', 'name phone')
    .populate('vehicleId')

  if (!booking) return fail(res, 'Booking not found', 404)

  const userId = getUserId(req)
  const isCustomer = String(booking.customerId?._id || booking.customerId) === userId
  const isProvider = String(booking.providerId?._id || booking.providerId || '') === userId
  const isAdmin = req.user.role === 'admin'

  if (!isCustomer && !isProvider && !isAdmin) return fail(res, 'Forbidden', 403)
  return ok(res, { receipt: booking }, { receipt: booking })
}))

module.exports = router
