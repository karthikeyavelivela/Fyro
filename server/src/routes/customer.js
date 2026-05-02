const express = require('express')
const protect = require('../middleware/auth.js')
const roleGuard = require('../middleware/roleGuard.js')
const Vehicle = require('../models/Vehicle')
const HamaliProfile = require('../models/HamaliProfile')
const Booking = require('../models/Booking')
const User = require('../models/User')
const Message = require('../models/Message')
const haversine = require('../utils/haversine')
const findBooking = require('../utils/findBooking')
const { calculateFare } = require('../utils/fareEngine')
const { generateBookingId } = require('../utils/generateId')
const logger = require('../utils/logger.js')
const bcrypt = require('bcrypt')

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

const router = express.Router()

// GET /api/vehicles/available
router.get('/vehicles/available', asyncHandler(async (req, res, next) => {
  const lat = parseFloat(req.query.lat) || 16.5062
  const lng = parseFloat(req.query.lng) || 80.648
  const type = req.query.type
  const radius = parseFloat(req.query.radius) || 15

  const query = { isAvailable: true, isVerified: true }
  if (type && type !== 'all') query.type = type

  const vehicles = await Vehicle.find(query)
    .populate('driverId', 'name phone profilePhoto rating isActive')

  const haversineDist = (a,b,c,d) => {
    const R=6371,dl=(c-a)*Math.PI/180,dn=(d-b)*Math.PI/180
    const x=Math.sin(dl/2)**2+Math.cos(a*Math.PI/180)*
      Math.cos(c*Math.PI/180)*Math.sin(dn/2)**2
    return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))
  }

  const nearby = vehicles
    .filter(v => {
      if (!v.driverId?.isActive) return false
      const [vLng, vLat] = v.currentLocation?.coordinates || [lng, lat]
      return haversineDist(lat, lng, vLat, vLng) <= radius
    })
    .map(v => {
      const [vLng, vLat] = v.currentLocation?.coordinates || [lng, lat]
      return {
        ...v.toObject(),
        distanceKm: haversineDist(lat, lng, vLat, vLng).toFixed(1)
      }
    })
    .sort((a, b) => Number(a.distanceKm) - Number(b.distanceKm))

  return res.json({ success: true, data: nearby })
}))

// GET /api/hamali/available
router.get('/hamali/available', async (req, res) => {
  try {
    const { lat, lng, radius = 8 } = req.query
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat and lng are required' })

    const customerCoords = [parseFloat(lng), parseFloat(lat)]
    const radiusKm = parseFloat(radius)

    const profiles = await HamaliProfile.find({ isAvailable: true, isVerified: true })
      .populate('workerId', 'name rating profilePhoto isKYCApproved isActive')

    const results = profiles
      .filter(p => p.currentLocation && p.currentLocation.coordinates && p.currentLocation.coordinates.length === 2)
      .map(p => {
        const dist = haversine(customerCoords, p.currentLocation.coordinates)
        return { ...p.toObject(), distance: Math.round(dist * 10) / 10 }
      })
      .filter(p => p.distance <= radiusKm && p.workerId?.isActive !== false)
      .sort((a, b) => a.distance - b.distance)

    return res.json({ success: true, profiles: results })
  } catch (err) {
    logger.error('hamali/available: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// POST /api/bookings
router.post('/bookings', protect, roleGuard('customer'), asyncHandler(async (req, res, next) => {
  const userId = req.user.userId || req.user.id || req.user._id
  const {
    bookingType, pickup, dropoff,
    vehicleType, scheduledAt, hamaliDetails
  } = req.body

  if (!pickup?.lat || !pickup?.lng || !pickup?.address) {
    return res.status(400).json({
      success: false, data: null,
      message: 'Pickup location required'
    })
  }

  // Generate bookingId
  const count = await Booking.countDocuments()
  const year = new Date().getFullYear()
  const bookingId = `FY-${year}-${String(count + 1).padStart(4, '0')}`

  // Generate 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString()
  const otpHash = await bcrypt.hash(otp, 10)

  // Calculate fare
  const haversineDist = (a,b,c,d) => {
    const R=6371,dl=(c-a)*Math.PI/180,dn=(d-b)*Math.PI/180
    const x=Math.sin(dl/2)**2+Math.cos(a*Math.PI/180)*
      Math.cos(c*Math.PI/180)*Math.sin(dn/2)**2
    return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))
  }
  
  const distanceKm = haversineDist(
    pickup.lat, pickup.lng,
    dropoff?.lat || pickup.lat,
    dropoff?.lng || pickup.lng
  )
  const fareBreakdown = calculateFare({
    bookingType, vehicleType, distanceKm,
    teamSize: hamaliDetails?.teamSize || 1,
    estimatedHours: hamaliDetails?.estimatedHours || 1,
    floorNumber: hamaliDetails?.floorNumber || 0,
    heavyGoods: hamaliDetails?.heavyGoods || false
  })

  const booking = await Booking.create({
    bookingId,
    customerId: userId,
    bookingType,
    status: 'pending',
    pickup, dropoff,
    vehicleType,
    hamaliDetails,
    scheduledAt: scheduledAt || new Date(),
    distanceKm,
    estimatedFare: fareBreakdown.total,
    finalFare: fareBreakdown.total,
    fareBreakdown,
    otp: otpHash,
    paymentStatus: 'pending'
  })

  // Dispatch to nearby providers via socket
  const io = req.app.get('io')
  if (bookingType === 'transport') {
    const vehicles = await Vehicle.find({
      isAvailable: true, isVerified: true,
      ...(vehicleType ? { type: vehicleType } : {})
    }).populate('driverId', 'name isActive')

    vehicles.forEach(v => {
      if (!v.driverId || v.driverId.isActive === false) return
      const coords = v.currentLocation?.coordinates || [80.648, 16.506]
      const dist = haversineDist(pickup.lat, pickup.lng, coords[1], coords[0])
      if (dist <= 15) {
        io?.to(`user:${v.driverId._id}`)
          .emit('booking:new', {
            ...booking.toObject(),
            distanceKm: dist.toFixed(1),
            otp // send plain OTP to customer
          })
      }
    })
  } else {
    const profiles = await HamaliProfile.find({ isAvailable: true })
      .populate('workerId', 'name isActive')
    profiles.forEach(p => {
      if (!p.workerId?.isActive) return
      const coords = p.currentLocation?.coordinates || [80.648, 16.506]
      const dist = haversineDist(pickup.lat, pickup.lng, coords[1], coords[0])
      if (dist <= 10) {
        io?.to(`user:${p.workerId._id}`)
          .emit('booking:new', booking.toObject())
      }
    })
  }

  return res.status(201).json({
    success: true,
    data: { ...booking.toObject(), otp }, // return plain OTP once
    message: 'Booking created'
  })
}))

// GET /api/bookings/my
router.get('/bookings/my', protect, roleGuard('customer'), async (req, res) => {
  try {
    const { page = 1, status, search } = req.query
    const limit = 10
    const skip = (parseInt(page) - 1) * limit

    const query = { customerId: req.user.userId }
    if (status) query.status = status
    if (search) query.bookingId = { $regex: search, $options: 'i' }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('providerId', 'name phone profilePhoto rating')
        .populate('vehicleId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query)
    ])

    return res.json({
      success: true,
      bookings,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    })
  } catch (err) {
    logger.error('GET /bookings/my: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// GET /api/bookings/:id/messages
router.get('/bookings/:id/messages', protect, roleGuard('customer', 'driver', 'hamali', 'admin'), async (req, res) => {
  try {
    const booking = await findBooking(req.params.id)
    if (!booking) return res.status(404).json({ success: false, data: null, message: 'Booking not found' })

    const userId = req.user.userId
    const isAdmin = req.user.role === 'admin'
    const isCustomer = booking.customerId?.toString() === userId
    const isProvider = booking.providerId?.toString() === userId

    if (!isAdmin && !isCustomer && !isProvider) {
      return res.status(403).json({ success: false, data: null, message: 'Not authorized to view these messages' })
    }

    const messages = await Message.find({ bookingId: booking._id })
      .populate('senderId', 'name profilePhoto role')
      .sort({ createdAt: 1 })

    return res.json({ success: true, data: messages, messages })
  } catch (err) {
    logger.error('GET /bookings/:id/messages: ' + err.message)
    return res.status(500).json({ success: false, data: null, message: 'Server error' })
  }
})

// POST /api/bookings/:id/messages
router.post('/bookings/:id/messages', protect, roleGuard('customer', 'driver', 'hamali', 'admin'), async (req, res) => {
  try {
    const content = String(req.body?.content || '').trim()
    if (!content) {
      return res.status(400).json({ success: false, data: null, message: 'Content required' })
    }

    const booking = await findBooking(req.params.id)
    if (!booking) return res.status(404).json({ success: false, data: null, message: 'Booking not found' })

    const userId = req.user.userId
    const isAdmin = req.user.role === 'admin'
    const isCustomer = booking.customerId?.toString() === userId
    const isProvider = booking.providerId?.toString() === userId

    if (!isAdmin && !isCustomer && !isProvider) {
      return res.status(403).json({ success: false, data: null, message: 'Not authorized' })
    }

    const message = await Message.create({
      bookingId: booking._id,
      senderId: userId,
      content,
      type: 'text'
    })

    const populated = await Message.findById(message._id).populate('senderId', 'name profilePhoto role')
    const io = req.app.get('io')
    io?.to(`booking:${booking.bookingId}`).emit('message:new', populated)
    io?.to(booking.bookingId).emit('message:new', populated)
    io?.to(`booking:${req.params.id}`).emit('message:new', populated)
    io?.to(req.params.id).emit('message:new', populated)

    return res.status(201).json({ success: true, data: populated, message: populated })
  } catch (err) {
    logger.error('POST /bookings/:id/messages: ' + err.message)
    return res.status(500).json({ success: false, data: null, message: 'Server error' })
  }
})

// GET /api/bookings/:id
router.get('/bookings/:id', protect, roleGuard('customer', 'driver', 'hamali', 'admin'), async (req, res) => {
  try {
    const booking = await findBooking(req.params.id)
      .populate('customerId', 'name phone profilePhoto rating')
      .populate('providerId', 'name phone profilePhoto rating')
      .populate('vehicleId')

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' })

    const userId = req.user.userId
    const isAdmin = req.user.role === 'admin'
    const isCustomer = booking.customerId && booking.customerId._id.toString() === userId
    const isProvider = booking.providerId && booking.providerId._id.toString() === userId

    if (!isAdmin && !isCustomer && !isProvider) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    return res.json({ success: true, booking, data: { booking } })
  } catch (err) {
    logger.error('GET /bookings/:id: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// PUT /api/bookings/:id/cancel
router.put('/bookings/:id/cancel', protect, roleGuard('customer'), async (req, res) => {
  try {
    const booking = await findBooking(req.params.id)
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' })

    if (booking.customerId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    if (!['pending', 'accepted'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel at this stage' })
    }

    booking.status = 'cancelled'
    await booking.save()

    const io = req.app.get('io')
    if (booking.providerId) {
      io.to(`user:${booking.providerId}`).emit('booking:cancelled', { bookingId: booking.bookingId })
    }
    io.to(`booking:${booking.bookingId}`).emit('booking:status_update', { status: 'cancelled', booking })

    return res.json({ success: true, booking })
  } catch (err) {
    logger.error('PUT /bookings/:id/cancel: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// POST /api/bookings/:id/rate
router.post('/bookings/:id/rate', protect, roleGuard('customer'), async (req, res) => {
  try {
    const { rating, review } = req.body
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' })
    }

    const booking = await findBooking(req.params.id)
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' })

    if (booking.customerId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only rate completed bookings' })
    }

    booking.customerRating = rating
    if (review) booking.customerReview = review
    await booking.save()

    if (booking.providerId) {
      const provider = await User.findById(booking.providerId)
      if (provider) {
        const newTotal = provider.totalRatings + 1
        provider.rating = (provider.rating * provider.totalRatings + rating) / newTotal
        provider.totalRatings = newTotal
        await provider.save()
      }
    }

    return res.json({ success: true, message: 'Rating submitted' })
  } catch (err) {
    logger.error('POST /bookings/:id/rate: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// POST /api/bookings/:id/counter-accept
router.post('/bookings/:id/counter-accept', protect, roleGuard('customer'), async (req, res) => {
  try {
    const booking = await findBooking(req.params.id)
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' })

    if (booking.customerId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    if (!booking.counterOffer) {
      return res.status(400).json({ success: false, message: 'No counter offer to accept' })
    }

    booking.finalFare = booking.counterOffer
    await booking.save()

    const io = req.app.get('io')
    io.to(`booking:${booking.bookingId}`).emit('booking:status_update', {
      status: booking.status,
      booking,
      counterAccepted: true
    })

    return res.json({ success: true, booking })
  } catch (err) {
    logger.error('POST /bookings/:id/counter-accept: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router
