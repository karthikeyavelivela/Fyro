const express = require('express')
const bcrypt = require('bcryptjs')
const protect = require('../middleware/auth.js')
const roleGuard = require('../middleware/roleGuard.js')
const asyncHandler = require('../utils/asyncHandler')
const Booking = require('../models/Booking')
const Vehicle = require('../models/Vehicle')
const HamaliProfile = require('../models/HamaliProfile')
const Message = require('../models/Message')
const User = require('../models/User')
const haversine = require('../utils/haversine')
const findBooking = require('../utils/findBooking')
const { calculateFare } = require('../utils/fareEngine')
const { generateBookingId } = require('../utils/generateId')

const router = express.Router()

const getUserId = (req) => String(req.user?.userId || req.user?.id || req.user?._id || '')
const ok = (res, data = {}, extra = {}, status = 200) => res.status(status).json({ success: true, data, ...extra })
const fail = (res, message, status = 400, data = {}) => res.status(status).json({ success: false, message, data })

const getBookingParticipants = (booking, userId) => {
  const normalizedUserId = String(userId)
  return {
    isAdmin: false,
    isCustomer: String(booking.customerId?._id || booking.customerId || '') === normalizedUserId,
    isProvider: String(booking.providerId?._id || booking.providerId || '') === normalizedUserId,
  }
}

const populateBooking = (query) => query
  .populate('customerId', 'name phone email profilePhoto rating')
  .populate('providerId', 'name phone email profilePhoto rating')
  .populate('vehicleId')

router.get('/my', protect, roleGuard('customer'), asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1))
  const limit = Math.max(1, Number(req.query.limit || 10))
  const skip = (page - 1) * limit

  const statusFilters = Array.isArray(req.query.status)
    ? req.query.status.filter(Boolean)
    : req.query.status
      ? [req.query.status]
      : []

  const query = { customerId: getUserId(req) }
  if (statusFilters.length === 1) query.status = statusFilters[0]
  if (statusFilters.length > 1) query.status = { $in: statusFilters }
  if (req.query.search) query.bookingId = { $regex: String(req.query.search), $options: 'i' }

  const [bookings, total] = await Promise.all([
    populateBooking(Booking.find(query))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(query),
  ])

  return ok(res, { bookings, total, page, pages: Math.ceil(total / limit) }, {
    bookings,
    total,
    page,
    pages: Math.ceil(total / limit),
  })
}))

router.post('/', protect, roleGuard('customer'), asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const bookingType = req.body?.bookingType || req.body?.type
  const pickup = req.body?.pickup
  const dropoff = req.body?.dropoff

  if (!['transport', 'hamali'].includes(bookingType)) {
    return fail(res, 'bookingType must be transport or hamali', 400)
  }
  if (!pickup?.address || pickup?.lat == null || pickup?.lng == null) {
    return fail(res, 'Pickup location required', 400)
  }
  if (bookingType === 'transport' && (!dropoff?.address || dropoff?.lat == null || dropoff?.lng == null)) {
    return fail(res, 'Dropoff location required', 400)
  }

  const distanceKm = bookingType === 'transport'
    ? haversine([pickup.lng, pickup.lat], [dropoff.lng, dropoff.lat])
    : 0

  const hamaliDetails = bookingType === 'hamali'
    ? {
        type: req.body?.hamaliDetails?.type || req.body?.jobType || 'loading',
        teamSize: Number(req.body?.hamaliDetails?.teamSize || req.body?.teamSize || 1),
        estimatedHours: Number(req.body?.hamaliDetails?.estimatedHours || req.body?.estimatedHours || req.body?.hours || 1),
        floorNumber: Number(req.body?.hamaliDetails?.floorNumber || req.body?.floorNumber || 0),
        heavyGoods: Boolean(req.body?.hamaliDetails?.heavyGoods || req.body?.heavyGoods),
        goodsDescription: req.body?.hamaliDetails?.goodsDescription || req.body?.goodsDescription || '',
      }
    : undefined

  const fareBreakdown = calculateFare({
    bookingType,
    vehicleType: req.body?.vehicleType,
    distanceKm,
    teamSize: hamaliDetails?.teamSize,
    estimatedHours: hamaliDetails?.estimatedHours,
    floorNumber: hamaliDetails?.floorNumber,
    heavyGoods: hamaliDetails?.heavyGoods,
  })

  const otp = String(Math.floor(1000 + Math.random() * 9000))
  const otpHash = await bcrypt.hash(otp, 10)

  const booking = await Booking.create({
    bookingId: await generateBookingId(),
    customerId: userId,
    bookingType,
    status: 'pending',
    pickup,
    dropoff,
    vehicleType: req.body?.vehicleType || '',
    hamaliDetails,
    scheduledAt: req.body?.scheduledAt || new Date(),
    distanceKm,
    estimatedFare: Number(req.body?.fare || fareBreakdown.total),
    finalFare: Number(req.body?.fare || fareBreakdown.total),
    fareBreakdown,
    paymentStatus: 'pending',
    otp: otpHash,
  })

  const io = req.app.get('io')
  if (bookingType === 'transport') {
    const vehicles = await Vehicle.find({
      isAvailable: true,
      ...(req.body?.vehicleType ? { type: req.body.vehicleType } : {}),
    }).populate('driverId', 'name isActive')

    vehicles.forEach((vehicle) => {
      if (!vehicle.driverId?.isActive) return
      const coords = vehicle.currentLocation?.coordinates || [80.6480, 16.5062]
      const distance = haversine([pickup.lng, pickup.lat], coords)
      if (distance <= 50) {
        io?.to(`user:${vehicle.driverId._id}`).emit('new_booking', booking.toObject())
        io?.to(`user:${vehicle.driverId._id}`).emit('booking:new', booking.toObject())
      }
    })
  } else {
    const profiles = await HamaliProfile.find({ isAvailable: true }).populate('workerId', 'name isActive')
    profiles.forEach((profile) => {
      if (!profile.workerId?.isActive) return
      const coords = profile.currentLocation?.coordinates || [80.6480, 16.5062]
      const distance = haversine([pickup.lng, pickup.lat], coords)
      if (distance <= 50) {
        io?.to(`user:${profile.workerId._id}`).emit('new_booking', booking.toObject())
        io?.to(`user:${profile.workerId._id}`).emit('booking:new', booking.toObject())
      }
    })
  }

  return ok(res, { booking: { ...booking.toObject(), otp } }, { booking: { ...booking.toObject(), otp } }, 201)
}))

router.get('/:id/messages', protect, asyncHandler(async (req, res) => {
  const booking = await findBooking(req.params.id)
  if (!booking) return fail(res, 'Booking not found', 404)

  const userId = getUserId(req)
  const isAdmin = req.user.role === 'admin'
  const { isCustomer, isProvider } = getBookingParticipants(booking, userId)
  if (!isAdmin && !isCustomer && !isProvider) {
    return fail(res, 'Not authorized to view these messages', 403)
  }

  const messages = await Message.find({ bookingId: booking._id })
    .populate('senderId', 'name profilePhoto role')
    .sort({ createdAt: 1 })

  return ok(res, { messages }, { messages })
}))

router.post('/:id/messages', protect, asyncHandler(async (req, res) => {
  const content = String(req.body?.content || '').trim()
  if (!content) return fail(res, 'Content required', 400)

  const booking = await findBooking(req.params.id)
  if (!booking) return fail(res, 'Booking not found', 404)

  const userId = getUserId(req)
  const isAdmin = req.user.role === 'admin'
  const { isCustomer, isProvider } = getBookingParticipants(booking, userId)
  if (!isAdmin && !isCustomer && !isProvider) return fail(res, 'Not authorized', 403)

  const message = await Message.create({
    bookingId: booking._id,
    senderId: userId,
    content,
    type: 'text',
  })

  const populated = await Message.findById(message._id).populate('senderId', 'name profilePhoto role')
  const io = req.app.get('io')
  io?.to(`booking:${booking.bookingId}`).emit('message:new', populated)
  io?.to(booking.bookingId).emit('message:new', populated)
  io?.to(`booking:${req.params.id}`).emit('message:new', populated)
  io?.to(req.params.id).emit('message:new', populated)

  return ok(res, { message: populated }, { message: populated }, 201)
}))

router.get('/:id', protect, asyncHandler(async (req, res) => {
  const booking = await populateBooking(findBooking(req.params.id))
  if (!booking) return fail(res, 'Booking not found', 404)

  const userId = getUserId(req)
  const isAdmin = req.user.role === 'admin'
  const { isCustomer, isProvider } = getBookingParticipants(booking, userId)
  if (!isAdmin && !isCustomer && !isProvider) return fail(res, 'Forbidden', 403)

  return ok(res, { booking }, { booking })
}))

router.put('/:id/cancel', protect, roleGuard('customer'), asyncHandler(async (req, res) => {
  const booking = await findBooking(req.params.id)
  if (!booking) return fail(res, 'Booking not found', 404)
  if (String(booking.customerId) !== getUserId(req)) return fail(res, 'Forbidden', 403)
  if (!['pending', 'accepted'].includes(booking.status)) return fail(res, 'Cannot cancel at this stage', 400)

  booking.status = 'cancelled'
  await booking.save()

  const io = req.app.get('io')
  if (booking.providerId) io?.to(`user:${booking.providerId}`).emit('booking:cancelled', { bookingId: booking.bookingId })
  io?.to(`booking:${booking.bookingId}`).emit('booking:status_update', { status: 'cancelled', booking })

  return ok(res, { booking }, { booking })
}))

router.post('/:id/rate', protect, roleGuard('customer'), asyncHandler(async (req, res) => {
  const rating = Number(req.body?.rating)
  const review = String(req.body?.review || '')
  if (!rating || rating < 1 || rating > 5) return fail(res, 'Rating must be between 1 and 5', 400)

  const booking = await findBooking(req.params.id)
  if (!booking) return fail(res, 'Booking not found', 404)
  if (String(booking.customerId) !== getUserId(req)) return fail(res, 'Forbidden', 403)
  if (booking.status !== 'completed') return fail(res, 'Can only rate completed bookings', 400)

  booking.customerRating = rating
  booking.customerReview = review
  await booking.save()

  if (booking.providerId) {
    const provider = await User.findById(booking.providerId)
    if (provider) {
      const newTotal = Number(provider.totalRatings || 0) + 1
      provider.rating = ((Number(provider.rating || 0) * Number(provider.totalRatings || 0)) + rating) / newTotal
      provider.totalRatings = newTotal
      await provider.save()
    }
  }

  return ok(res, { booking }, { booking, message: 'Rating submitted' })
}))

router.put('/:id/counter-offer', protect, roleGuard('customer'), asyncHandler(async (req, res) => {
  const booking = await findBooking(req.params.id)
  if (!booking) return fail(res, 'Booking not found', 404)
  if (String(booking.customerId) !== getUserId(req)) return fail(res, 'Forbidden', 403)

  const action = String(req.body?.action || '').toLowerCase()
  if (!['accept', 'decline'].includes(action)) return fail(res, 'action must be accept or decline', 400)
  if (!booking.counterOffer) return fail(res, 'No counter offer to respond to', 400)

  if (action === 'accept') {
    booking.finalFare = booking.counterOffer
  } else {
    booking.counterOffer = undefined
    booking.counterOfferedBy = undefined
  }
  await booking.save()

  const io = req.app.get('io')
  io?.to(`booking:${booking.bookingId}`).emit('booking:status_update', { status: booking.status, booking, counterAction: action })

  return ok(res, { booking }, { booking })
}))

module.exports = router
