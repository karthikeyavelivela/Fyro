const express = require('express')
const protect = require('../middleware/auth.js')
const roleGuard = require('../middleware/roleGuard.js')
const Vehicle = require('../models/Vehicle')
const Booking = require('../models/Booking')
const haversine = require('../utils/haversine')
const findBooking = require('../utils/findBooking')
const logger = require('../utils/logger.js')

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

const router = express.Router()

// GET /api/driver/incoming
router.get('/incoming', protect, roleGuard('driver'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ driverId: req.user.userId })
    if (!vehicle) return res.json({ success: true, bookings: [], vehicle: null })

    const driverCoords = vehicle.currentLocation && vehicle.currentLocation.coordinates
      ? vehicle.currentLocation.coordinates
      : [80.6480, 16.5062]

    const bookings = await Booking.find({
      bookingType: 'transport',
      status: 'pending',
      rejectedBy: { $ne: req.user.userId }
    })
      .populate('customerId', 'name profilePhoto rating')
      .sort({ createdAt: -1 })
      .limit(50)

    const nearby = bookings
      .filter(b => b.pickup && b.pickup.lng != null && b.pickup.lat != null)
      .map(b => {
        const dist = haversine(driverCoords, [b.pickup.lng, b.pickup.lat])
        return { ...b.toObject(), distance: Math.round(dist * 10) / 10 }
      })
      .filter(b => b.distance <= 15)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20)

    return res.json({ success: true, bookings: nearby })
  } catch (err) {
    logger.error('GET driver/incoming: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// PUT /api/driver/bookings/:id/accept
router.put('/bookings/:id/accept', protect, roleGuard('driver'), async (req, res) => {
  try {
    const booking = await findBooking(req.params.id)
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' })

    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Booking is no longer pending' })
    }
    if (booking.bookingType !== 'transport') {
      return res.status(400).json({ success: false, message: 'This booking is not a transport booking' })
    }

    const { counterOffer } = req.body

    booking.status = 'accepted'
    booking.providerId = req.user.userId
    booking.acceptedAt = new Date()

    if (counterOffer != null) {
      const maxAllowed = booking.estimatedFare + 50
      const minAllowed = booking.estimatedFare - 50
      if (counterOffer > maxAllowed || counterOffer < minAllowed) {
        return res.status(400).json({ success: false, message: `Counter offer must be between ₹${minAllowed} and ₹${maxAllowed}` })
      }
      booking.counterOffer = counterOffer
      booking.counterOfferedBy = req.user.userId
    }

    await booking.save()

    const io = req.app.get('io')
    io.to(`user:${booking.customerId}`).emit('booking:accepted', booking)
    io.to(`booking:${booking.bookingId}`).emit('booking:status_update', { status: 'accepted', booking })

    return res.json({ success: true, booking })
  } catch (err) {
    logger.error('PUT driver/bookings/:id/accept: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// PUT /api/driver/bookings/:id/reject
router.put('/bookings/:id/reject', protect, roleGuard('driver'), async (req, res) => {
  try {
    const booking = await findBooking(req.params.id)
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' })

    if (booking.bookingType !== 'transport') {
      return res.status(400).json({ success: false, message: 'This booking is not a transport booking' })
    }

    // Return to pending so other drivers can accept
    booking.status = 'pending'
    booking.providerId = undefined
    if (!booking.rejectedBy.some(id => id.toString() === req.user.userId)) {
      booking.rejectedBy.push(req.user.userId)
    }
    await booking.save()

    const io = req.app.get('io')
    io.to(`user:${booking.customerId}`).emit('booking:rejected', {
      bookingId: booking.bookingId,
      message: 'Provider declined'
    })

    return res.json({ success: true, message: 'Booking rejected' })
  } catch (err) {
    logger.error('PUT driver/bookings/:id/reject: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// PUT /api/driver/bookings/:id/start
router.put('/bookings/:id/start', protect, roleGuard('driver'), async (req, res) => {
  try {
    const booking = await findBooking(req.params.id)
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' })

    if (booking.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Booking must be accepted first' })
    }
    if (booking.providerId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    booking.status = 'in_progress'
    booking.startedAt = new Date()
    await booking.save()

    const io = req.app.get('io')
    io.to(`user:${booking.customerId}`).emit('booking:status_update', { status: 'in_progress', booking })
    io.to(`booking:${booking.bookingId}`).emit('booking:status_update', { status: 'in_progress', booking })

    return res.json({ success: true, booking })
  } catch (err) {
    logger.error('PUT driver/bookings/:id/start: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// PUT /api/driver/bookings/:id/complete
router.put('/bookings/:id/complete', protect, roleGuard('driver'), async (req, res) => {
  try {
    const booking = await findBooking(req.params.id)
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' })

    if (booking.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Booking must be in progress' })
    }
    if (booking.providerId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    booking.status = 'completed'
    booking.completedAt = new Date()
    booking.finalFare = booking.finalFare || booking.estimatedFare
    await booking.save()

    const io = req.app.get('io')
    io.to(`user:${booking.customerId}`).emit('booking:status_update', { status: 'completed', booking })
    io.to(`booking:${booking.bookingId}`).emit('booking:status_update', { status: 'completed', booking })

    return res.json({ success: true, booking })
  } catch (err) {
    logger.error('PUT driver/bookings/:id/complete: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// PUT /api/driver/location
router.put('/location', protect, roleGuard('driver'), async (req, res) => {
  try {
    const { lat, lng } = req.body
    if (lat == null || lng == null) return res.status(400).json({ success: false, message: 'lat and lng required' })

    await Vehicle.findOneAndUpdate(
      { driverId: req.user.userId },
      { 'currentLocation.coordinates': [parseFloat(lng), parseFloat(lat)] }
    )

    return res.json({ success: true })
  } catch (err) {
    logger.error('PUT driver/location: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// PUT /api/driver/availability
router.put('/availability', protect, roleGuard('driver'), asyncHandler(async (req, res, next) => {
  const { isAvailable } = req.body
  if (typeof isAvailable !== 'boolean') {
    return res.status(400).json({
      success: false, data: null,
      message: 'isAvailable must be boolean'
    })
  }
  const userId = req.user.userId || req.user.id || req.user._id

  let vehicle = await Vehicle.findOneAndUpdate(
    { driverId: userId },
    { isAvailable },
    { new: true, runValidators: false }
  )
  if (!vehicle) {
    vehicle = await Vehicle.create({
      driverId: userId,
      isAvailable,
      currentLocation: {
        type: 'Point',
        coordinates: [80.648, 16.506]
      }
    })
  }
  return res.json({ success: true, data: vehicle })
}))

// GET /api/driver/earnings
router.get('/earnings', protect, roleGuard('driver'), async (req, res) => {
  try {
    const userId = req.user.userId
    const now = new Date()

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dayOfWeek = now.getDay()
    const diffToMonday = (dayOfWeek + 6) % 7
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - diffToMonday)
    startOfWeek.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const baseQuery = { providerId: userId, status: 'completed' }

    const sumFare = (docs) => docs.reduce((sum, b) => sum + (b.finalFare || 0), 0)

    const [todayBookings, weekBookings, monthBookings, allBookings] = await Promise.all([
      Booking.find({ ...baseQuery, completedAt: { $gte: startOfToday } }),
      Booking.find({ ...baseQuery, completedAt: { $gte: startOfWeek } }),
      Booking.find({ ...baseQuery, completedAt: { $gte: startOfMonth } }),
      Booking.find(baseQuery)
    ])

    // last 7 days daily breakdown
    const last7 = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayStart.getDate() + 1)
      const dayBookings = allBookings.filter(b =>
        b.completedAt >= dayStart && b.completedAt < dayEnd
      )
      last7.push({
        date: dayStart.toISOString().split('T')[0],
        amount: sumFare(dayBookings),
        count: dayBookings.length
      })
    }

    return res.json({
      success: true,
      earnings: {
        today: sumFare(todayBookings),
        thisWeek: sumFare(weekBookings),
        thisMonth: sumFare(monthBookings),
        allTime: sumFare(allBookings),
        todayCount: todayBookings.length,
        weekCount: weekBookings.length,
        last7days: last7
      }
    })
  } catch (err) {
    logger.error('GET driver/earnings: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// GET /api/driver/bookings
router.get('/bookings', protect, roleGuard('driver'), async (req, res) => {
  try {
    const { page = 1, status } = req.query
    const limit = 10
    const skip = (parseInt(page) - 1) * limit

    const query = { providerId: req.user.userId, bookingType: 'transport' }
    if (status) query.status = status

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('customerId', 'name phone profilePhoto rating')
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
    logger.error('GET driver/bookings: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// GET /api/driver/vehicles/mine
router.get('/vehicles/mine', protect, roleGuard('driver'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ driverId: req.user.userId })
    return res.json({ success: true, vehicle: vehicle || null })
  } catch (err) {
    logger.error('GET driver/vehicles/mine: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// POST /api/driver/vehicles
router.post('/vehicles', protect, roleGuard('driver'), async (req, res) => {
  try {
    const existing = await Vehicle.findOne({ driverId: req.user.userId })
    if (existing) return res.status(409).json({ success: false, message: 'Vehicle already exists. Use PUT to update.' })

    const vehicle = await Vehicle.create({ ...req.body, driverId: req.user.userId })
    return res.status(201).json({ success: true, vehicle })
  } catch (err) {
    logger.error('POST driver/vehicles: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// PUT /api/driver/vehicles/:id
router.put('/vehicles/:id', protect, roleGuard('driver'), async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' })
    if (vehicle.driverId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    const allowed = ['type', 'registrationNumber', 'capacityTons', 'photos']
    allowed.forEach(field => {
      if (req.body[field] != null) vehicle[field] = req.body[field]
    })
    await vehicle.save()

    return res.json({ success: true, vehicle })
  } catch (err) {
    logger.error('PUT driver/vehicles/:id: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router
