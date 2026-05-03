const express = require('express')
const protect = require('../middleware/auth.js')
const roleGuard = require('../middleware/roleGuard.js')
const asyncHandler = require('../utils/asyncHandler')
const Vehicle = require('../models/Vehicle')
const Booking = require('../models/Booking')
const haversine = require('../utils/haversine')
const findBooking = require('../utils/findBooking')

const router = express.Router()

const getUserId = (req) => String(req.user?.userId || req.user?.id || req.user?._id || '')
const ok = (res, data = {}, extra = {}, status = 200) => res.status(status).json({ success: true, data, ...extra })
const fail = (res, message, status = 400, data = {}) => res.status(status).json({ success: false, message, data })

const getVehicleForDriver = (userId) =>
  Vehicle.findOne({ driverId: userId }).populate('driverId', 'name phone profilePhoto rating isActive')

const sumFare = (docs) => docs.reduce((sum, booking) => sum + Number(booking.finalFare || booking.estimatedFare || 0), 0)

router.get('/incoming', protect, roleGuard('driver'), asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const vehicle = await getVehicleForDriver(userId)

  if (!vehicle) {
    return ok(res, { vehicle: null, bookings: [] }, { vehicle: null, bookings: [] })
  }

  const driverCoords = vehicle.currentLocation?.coordinates || [80.6480, 16.5062]
  const bookings = await Booking.find({
    bookingType: 'transport',
    status: 'pending',
    rejectedBy: { $ne: userId },
  })
    .populate('customerId', 'name profilePhoto rating phone')
    .sort({ createdAt: -1 })
    .limit(50)

  const nearby = bookings
    .filter((booking) => booking.pickup?.lat != null && booking.pickup?.lng != null)
    .map((booking) => {
      const distance = haversine(driverCoords, [booking.pickup.lng, booking.pickup.lat])
      return { ...booking.toObject(), distance: Math.round(distance * 10) / 10 }
    })
    .filter((booking) => booking.distance <= 50)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 20)

  return ok(res, { vehicle, bookings: nearby }, { vehicle, bookings: nearby })
}))

router.put('/bookings/:id/accept', protect, roleGuard('driver'), asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const booking = await findBooking(req.params.id)
  if (!booking) return fail(res, 'Booking not found', 404)
  if (booking.bookingType !== 'transport') return fail(res, 'This booking is not a transport booking', 400)
  if (booking.status !== 'pending') return fail(res, 'Booking is no longer pending', 400)

  const counterOffer = req.body?.counterOffer
  booking.status = 'accepted'
  booking.providerId = userId
  booking.acceptedAt = new Date()

  if (counterOffer != null) {
    const maxAllowed = Number(booking.estimatedFare || 0) + 50
    const minAllowed = Math.max(0, Number(booking.estimatedFare || 0) - 50)
    if (Number(counterOffer) > maxAllowed || Number(counterOffer) < minAllowed) {
      return fail(res, `Counter offer must be between Rs.${minAllowed} and Rs.${maxAllowed}`, 400)
    }
    booking.counterOffer = Number(counterOffer)
    booking.counterOfferedBy = userId
  }

  await booking.save()

  const io = req.app.get('io')
  io?.to(`user:${booking.customerId}`).emit('booking:accepted', booking)
  io?.to(`booking:${booking.bookingId}`).emit('booking:status_update', { status: 'accepted', booking })

  return ok(res, { booking }, { booking })
}))

router.put('/bookings/:id/reject', protect, roleGuard('driver'), asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const booking = await findBooking(req.params.id)
  if (!booking) return fail(res, 'Booking not found', 404)
  if (booking.bookingType !== 'transport') return fail(res, 'This booking is not a transport booking', 400)

  booking.status = 'pending'
  booking.providerId = undefined
  if (!booking.rejectedBy.some((id) => String(id) === userId)) {
    booking.rejectedBy.push(userId)
  }
  await booking.save()

  const io = req.app.get('io')
  io?.to(`user:${booking.customerId}`).emit('booking:rejected', {
    bookingId: booking.bookingId,
    message: 'Provider declined',
  })

  return ok(res, { booking }, { booking, message: 'Booking rejected' })
}))

router.put('/bookings/:id/start', protect, roleGuard('driver'), asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const booking = await findBooking(req.params.id)
  if (!booking) return fail(res, 'Booking not found', 404)
  if (booking.status !== 'accepted') return fail(res, 'Booking must be accepted first', 400)
  if (String(booking.providerId) !== userId) return fail(res, 'Forbidden', 403)

  booking.status = 'in_progress'
  booking.startedAt = new Date()
  await booking.save()

  const io = req.app.get('io')
  io?.to(`user:${booking.customerId}`).emit('booking:status_update', { status: 'in_progress', booking })
  io?.to(`booking:${booking.bookingId}`).emit('booking:status_update', { status: 'in_progress', booking })

  return ok(res, { booking }, { booking })
}))

router.put('/bookings/:id/complete', protect, roleGuard('driver'), asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const booking = await findBooking(req.params.id)
  if (!booking) return fail(res, 'Booking not found', 404)
  if (booking.status !== 'in_progress') return fail(res, 'Booking must be in progress', 400)
  if (String(booking.providerId) !== userId) return fail(res, 'Forbidden', 403)

  booking.status = 'completed'
  booking.completedAt = new Date()
  booking.finalFare = booking.finalFare || booking.estimatedFare
  await booking.save()

  const io = req.app.get('io')
  io?.to(`user:${booking.customerId}`).emit('booking:status_update', { status: 'completed', booking })
  io?.to(`booking:${booking.bookingId}`).emit('booking:status_update', { status: 'completed', booking })

  return ok(res, { booking }, { booking })
}))

router.put('/location', protect, roleGuard('driver'), asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const { lat, lng } = req.body || {}
  if (lat == null || lng == null) return fail(res, 'lat and lng required', 400)

  const vehicle = await Vehicle.findOneAndUpdate(
    { driverId: userId },
    { 'currentLocation.coordinates': [Number(lng), Number(lat)] },
    { new: true }
  )

  if (!vehicle) return fail(res, 'Vehicle not found. Add your vehicle first.', 404)
  return ok(res, { vehicle }, { vehicle })
}))

router.put('/availability', protect, roleGuard('driver'), asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const { isAvailable } = req.body || {}
  if (typeof isAvailable !== 'boolean') return fail(res, 'isAvailable must be boolean', 400)

  const vehicle = await Vehicle.findOneAndUpdate(
    { driverId: userId },
    { isAvailable },
    { new: true }
  ).populate('driverId', 'name phone profilePhoto rating isActive')

  if (!vehicle) return fail(res, 'Vehicle not found. Add your vehicle first.', 404)
  return ok(res, { vehicle }, { vehicle })
}))

router.get('/earnings', protect, roleGuard('driver'), asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayOfWeek = now.getDay()
  const diffToMonday = (dayOfWeek + 6) % 7
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - diffToMonday)
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const baseQuery = { providerId: userId, status: 'completed', bookingType: 'transport' }
  const [todayBookings, weekBookings, monthBookings, allBookings] = await Promise.all([
    Booking.find({ ...baseQuery, completedAt: { $gte: startOfToday } }),
    Booking.find({ ...baseQuery, completedAt: { $gte: startOfWeek } }),
    Booking.find({ ...baseQuery, completedAt: { $gte: startOfMonth } }),
    Booking.find(baseQuery).sort({ completedAt: -1 }),
  ])

  const last7days = []
  for (let index = 6; index >= 0; index -= 1) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - index)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayStart.getDate() + 1)
    const dayBookings = allBookings.filter((booking) => booking.completedAt >= dayStart && booking.completedAt < dayEnd)
    last7days.push({
      date: dayStart.toISOString().split('T')[0],
      amount: sumFare(dayBookings),
      count: dayBookings.length,
    })
  }

  const earnings = {
    today: sumFare(todayBookings),
    thisWeek: sumFare(weekBookings),
    thisMonth: sumFare(monthBookings),
    allTime: sumFare(allBookings),
    todayCount: todayBookings.length,
    weekCount: weekBookings.length,
    tripCount: allBookings.length,
    last7days,
  }

  return ok(res, { earnings }, { earnings })
}))

router.get('/bookings', protect, roleGuard('driver'), asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const page = Math.max(1, Number(req.query.page || 1))
  const limit = Math.max(1, Number(req.query.limit || 10))
  const skip = (page - 1) * limit
  const query = { providerId: userId, bookingType: 'transport' }
  if (req.query.status) query.status = req.query.status

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate('customerId', 'name phone profilePhoto rating')
      .populate('vehicleId')
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

router.get('/vehicles/mine', protect, roleGuard('driver'), asyncHandler(async (req, res) => {
  const vehicle = await getVehicleForDriver(getUserId(req))
  return ok(res, { vehicle: vehicle || null }, { vehicle: vehicle || null })
}))

router.post('/vehicles', protect, roleGuard('driver'), asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const existing = await Vehicle.findOne({ driverId: userId })
  if (existing) return fail(res, 'Vehicle already exists. Use PUT to update it.', 409)

  const payload = {
    driverId: userId,
    type: req.body?.type,
    registrationNumber: req.body?.registrationNumber,
    capacityTons: Number(req.body?.capacityTons || 1),
    photos: Array.isArray(req.body?.photos) ? req.body.photos : [],
    isAvailable: Boolean(req.body?.isAvailable),
    currentLocation: req.body?.currentLocation || { type: 'Point', coordinates: [80.6480, 16.5062] },
  }

  const vehicle = await Vehicle.create(payload)
  return ok(res, { vehicle }, { vehicle }, 201)
}))

router.put('/vehicles/:id', protect, roleGuard('driver'), asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const vehicle = await Vehicle.findById(req.params.id)
  if (!vehicle) return fail(res, 'Vehicle not found', 404)
  if (String(vehicle.driverId) !== userId) return fail(res, 'Forbidden', 403)

  const allowedFields = ['type', 'registrationNumber', 'capacityTons', 'photos', 'isAvailable', 'currentLocation']
  for (const field of allowedFields) {
    if (req.body?.[field] !== undefined) {
      vehicle[field] = req.body[field]
    }
  }

  await vehicle.save()
  return ok(res, { vehicle }, { vehicle })
}))

module.exports = router
