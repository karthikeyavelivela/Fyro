const express = require('express')
const protect = require('../middleware/auth')
const roleGuard = require('../middleware/roleGuard')
const Vehicle = require('../models/Vehicle')
const HamaliProfile = require('../models/HamaliProfile')
const Booking = require('../models/Booking')
const User = require('../models/User')
const haversine = require('../utils/haversine')
const findBooking = require('../utils/findBooking')
const { calculateFare } = require('../utils/fareEngine')
const { generateBookingId } = require('../utils/generateId')
const logger = require('../utils/logger')

const router = express.Router()

// GET /api/vehicles/available
router.get('/vehicles/available', async (req, res) => {
  try {
    const { lat, lng, type, radius = 15 } = req.query
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat and lng are required' })

    const customerCoords = [parseFloat(lng), parseFloat(lat)]
    const radiusKm = parseFloat(radius)

    const query = { isAvailable: true, isVerified: true }
    if (type) query.type = type

    const vehicles = await Vehicle.find(query).populate('driverId', 'name rating profilePhoto isKYCApproved isActive')

    const results = vehicles
      .filter(v => v.currentLocation && v.currentLocation.coordinates && v.currentLocation.coordinates.length === 2)
      .map(v => {
        const dist = haversine(customerCoords, v.currentLocation.coordinates)
        return { ...v.toObject(), distance: Math.round(dist * 10) / 10 }
      })
      .filter(v => v.distance <= radiusKm && v.driverId?.isActive !== false)
      .sort((a, b) => a.distance - b.distance)

    return res.json({ success: true, vehicles: results })
  } catch (err) {
    logger.error('vehicles/available: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

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
router.post('/bookings', protect, roleGuard('customer'), async (req, res) => {
  try {
    const {
      bookingType, pickup, dropoff, vehicleType,
      hamaliDetails, distanceKm, returnLoad, scheduledAt
    } = req.body

    if (!bookingType || !['transport', 'hamali'].includes(bookingType)) {
      return res.status(400).json({ success: false, message: 'Invalid bookingType' })
    }
    if (!pickup || !pickup.address || pickup.lat == null || pickup.lng == null) {
      return res.status(400).json({ success: false, message: 'pickup address, lat, lng required' })
    }

    let fareParams = {
      bookingType,
      vehicleType,
      distanceKm: distanceKm || 0,
      returnLoad: returnLoad || false
    }

    if (bookingType === 'hamali') {
      if (!hamaliDetails) return res.status(400).json({ success: false, message: 'hamaliDetails required' })
      fareParams.teamSize = hamaliDetails.teamSize || 1
      fareParams.estimatedHours = hamaliDetails.estimatedHours || 1
      fareParams.floorNumber = hamaliDetails.floorNumber || 0
      fareParams.heavyGoods = hamaliDetails.heavyGoods || false
    } else {
      if (!vehicleType) return res.status(400).json({ success: false, message: 'vehicleType required for transport' })
      if (!dropoff || !dropoff.address) return res.status(400).json({ success: false, message: 'dropoff required for transport' })
    }

    let fareResult
    try {
      fareResult = calculateFare(fareParams)
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message })
    }

    const pickupCoords = [pickup.lng, pickup.lat]
    let nearbyProviders = []

    if (bookingType === 'transport') {
      const vehicles = await Vehicle.find({ isAvailable: true, isVerified: true })
        .populate('driverId', 'name profilePhoto rating isActive')

      nearbyProviders = vehicles
        .filter(v => v.currentLocation?.coordinates?.length === 2 && v.driverId?.isActive !== false)
        .map(v => ({
          providerId: v.driverId._id,
          vehicle: v,
          distanceKm: haversine(pickupCoords, v.currentLocation.coordinates)
        }))
        .filter(item => item.distanceKm <= 15)
    } else {
      const profiles = await HamaliProfile.find({ isAvailable: true, isVerified: true })
        .populate('workerId', 'name profilePhoto rating isActive')

      nearbyProviders = profiles
        .filter(p => p.currentLocation?.coordinates?.length === 2 && p.workerId?.isActive !== false)
        .map(p => ({
          providerId: p.workerId._id,
          profile: p,
          distanceKm: haversine(pickupCoords, p.currentLocation.coordinates)
        }))
        .filter(item => item.distanceKm <= 8)
    }

    if (nearbyProviders.length === 0) {
      return res.status(400).json({ success: false, data: null, message: 'No providers available in your area' })
    }

    const bookingId = await generateBookingId()

    const bookingData = {
      bookingId,
      customerId: req.user.userId,
      bookingType,
      status: 'pending',
      pickup,
      fareBreakdown: fareResult,
      estimatedFare: fareResult.total,
      distanceKm: distanceKm || 0
    }

    if (bookingType === 'transport') {
      bookingData.dropoff = dropoff
      bookingData.vehicleType = vehicleType
    } else {
      bookingData.hamaliDetails = {
        type: hamaliDetails.type || 'both',
        teamSize: hamaliDetails.teamSize || 1,
        estimatedHours: hamaliDetails.estimatedHours || 1,
        floorNumber: hamaliDetails.floorNumber || 0,
        heavyGoods: hamaliDetails.heavyGoods || false,
        goodsDescription: hamaliDetails.goodsDescription || ''
      }
    }

    if (scheduledAt) bookingData.scheduledAt = new Date(scheduledAt)

    const booking = await Booking.create(bookingData)

    // Notify nearby providers via socket
    const io = req.app.get('io')
    nearbyProviders.forEach(provider => {
      io.to(`user:${provider.providerId}`).emit('booking:new', {
        bookingId: booking.bookingId,
        pickup: booking.pickup,
        dropoff: booking.dropoff,
        fare: booking.estimatedFare,
        vehicleType: booking.vehicleType,
        distanceKm: Math.round(provider.distanceKm * 10) / 10,
        bookingType: booking.bookingType,
        customerId: { name: req.user.name },
        booking
      })
    })

    return res.status(201).json({ success: true, booking })
  } catch (err) {
    logger.error('POST /bookings: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

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

    return res.json({ success: true, booking })
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
