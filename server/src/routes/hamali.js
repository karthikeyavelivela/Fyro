const express = require('express')
const protect = require('../middleware/auth.js')
const roleGuard = require('../middleware/roleGuard.js')
const HamaliProfile = require('../models/HamaliProfile')
const Booking = require('../models/Booking')
const haversine = require('../utils/haversine')
const findBooking = require('../utils/findBooking')
const logger = require('../utils/logger.js')

const router = express.Router()

// GET /api/hamali/incoming
router.get('/incoming', protect, roleGuard('hamali'), async (req, res) => {
  try {
    const profile = await HamaliProfile.findOne({ workerId: req.user.userId })
    if (!profile) return res.json({ success: true, bookings: [], profile: null })

    const workerCoords = profile.currentLocation && profile.currentLocation.coordinates
      ? profile.currentLocation.coordinates
      : [80.6480, 16.5062]

    const bookings = await Booking.find({
      bookingType: 'hamali',
      status: 'pending',
      rejectedBy: { $ne: req.user.userId }
    })
      .populate('customerId', 'name profilePhoto rating')
      .sort({ createdAt: -1 })
      .limit(50)

    const nearby = bookings
      .filter(b => b.pickup && b.pickup.lng != null && b.pickup.lat != null)
      .map(b => {
        const dist = haversine(workerCoords, [b.pickup.lng, b.pickup.lat])
        return { ...b.toObject(), distance: Math.round(dist * 10) / 10 }
      })
      .filter(b => b.distance <= 8)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20)

    return res.json({ success: true, bookings: nearby })
  } catch (err) {
    logger.error('GET hamali/incoming: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// PUT /api/hamali/bookings/:id/accept
router.put('/bookings/:id/accept', protect, roleGuard('hamali'), async (req, res) => {
  try {
    const booking = await findBooking(req.params.id)
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' })

    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Booking is no longer pending' })
    }
    if (booking.bookingType !== 'hamali') {
      return res.status(400).json({ success: false, message: 'This booking is not a hamali booking' })
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
    logger.error('PUT hamali/bookings/:id/accept: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// PUT /api/hamali/bookings/:id/reject
router.put('/bookings/:id/reject', protect, roleGuard('hamali'), async (req, res) => {
  try {
    const booking = await findBooking(req.params.id)
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' })

    if (booking.bookingType !== 'hamali') {
      return res.status(400).json({ success: false, message: 'This booking is not a hamali booking' })
    }

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
    logger.error('PUT hamali/bookings/:id/reject: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// PUT /api/hamali/bookings/:id/start
router.put('/bookings/:id/start', protect, roleGuard('hamali'), async (req, res) => {
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
    logger.error('PUT hamali/bookings/:id/start: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// PUT /api/hamali/bookings/:id/complete
router.put('/bookings/:id/complete', protect, roleGuard('hamali'), async (req, res) => {
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
    logger.error('PUT hamali/bookings/:id/complete: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// PUT /api/hamali/location
router.put('/location', protect, roleGuard('hamali'), async (req, res) => {
  try {
    const { lat, lng } = req.body
    if (lat == null || lng == null) return res.status(400).json({ success: false, message: 'lat and lng required' })

    await HamaliProfile.findOneAndUpdate(
      { workerId: req.user.userId },
      { 'currentLocation.coordinates': [parseFloat(lng), parseFloat(lat)] }
    )

    return res.json({ success: true })
  } catch (err) {
    logger.error('PUT hamali/location: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// PUT /api/hamali/availability
router.put('/availability', protect, roleGuard('hamali'), async (req, res) => {
  try {
    const { isAvailable } = req.body
    if (isAvailable == null) return res.status(400).json({ success: false, message: 'isAvailable required' })

    await HamaliProfile.findOneAndUpdate(
      { workerId: req.user.userId },
      { isAvailable: Boolean(isAvailable) }
    )

    return res.json({ success: true })
  } catch (err) {
    logger.error('PUT hamali/availability: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// GET /api/hamali/earnings
router.get('/earnings', protect, roleGuard('hamali'), async (req, res) => {
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

    const baseQuery = { providerId: userId, status: 'completed', bookingType: 'hamali' }

    const sumFare = (docs) => docs.reduce((sum, b) => sum + (b.finalFare || 0), 0)

    const [todayBookings, weekBookings, monthBookings, allBookings] = await Promise.all([
      Booking.find({ ...baseQuery, completedAt: { $gte: startOfToday } }),
      Booking.find({ ...baseQuery, completedAt: { $gte: startOfWeek } }),
      Booking.find({ ...baseQuery, completedAt: { $gte: startOfMonth } }),
      Booking.find(baseQuery)
    ])

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
    logger.error('GET hamali/earnings: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// GET /api/hamali/bookings
router.get('/bookings', protect, roleGuard('hamali'), async (req, res) => {
  try {
    const { page = 1, status } = req.query
    const limit = 10
    const skip = (parseInt(page) - 1) * limit

    const query = { providerId: req.user.userId, bookingType: 'hamali' }
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
    logger.error('GET hamali/bookings: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// GET /api/hamali/profile/mine
router.get('/profile/mine', protect, roleGuard('hamali'), async (req, res) => {
  try {
    const profile = await HamaliProfile.findOne({ workerId: req.user.userId })
    return res.json({ success: true, profile: profile || null })
  } catch (err) {
    logger.error('GET hamali/profile/mine: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// POST /api/hamali/profile
router.post('/profile', protect, roleGuard('hamali'), async (req, res) => {
  try {
    const existing = await HamaliProfile.findOne({ workerId: req.user.userId })
    if (existing) return res.status(409).json({ success: false, message: 'Profile already exists. Use PUT to update.' })

    const profile = await HamaliProfile.create({ ...req.body, workerId: req.user.userId })
    return res.status(201).json({ success: true, profile })
  } catch (err) {
    logger.error('POST hamali/profile: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// PUT /api/hamali/profile
router.put('/profile', protect, roleGuard('hamali'), async (req, res) => {
  try {
    const profile = await HamaliProfile.findOneAndUpdate(
      { workerId: req.user.userId },
      { $set: req.body },
      { new: true }
    )
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' })
    return res.json({ success: true, profile })
  } catch (err) {
    logger.error('PUT hamali/profile: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router
