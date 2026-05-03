const express = require('express')
const protect = require('../middleware/auth.js')
const roleGuard = require('../middleware/roleGuard.js')
const asyncHandler = require('../utils/asyncHandler')
const HamaliProfile = require('../models/HamaliProfile')
const Booking = require('../models/Booking')
const haversine = require('../utils/haversine')
const findBooking = require('../utils/findBooking')

const router = express.Router()

const getUserId = (req) => String(req.user?.userId || req.user?.id || req.user?._id || '')
const ok = (res, data = {}, extra = {}, status = 200) => res.status(status).json({ success: true, data, ...extra })
const fail = (res, message, status = 400, data = {}) => res.status(status).json({ success: false, message, data })

const getProfile = (userId) => HamaliProfile.findOne({ workerId: userId }).populate('workerId', 'name phone email profilePhoto rating isActive isKYCApproved')
const sumFare = (docs) => docs.reduce((sum, booking) => sum + Number(booking.finalFare || booking.estimatedFare || 0), 0)

router.get('/incoming', protect, roleGuard('hamali'), asyncHandler(async (req, res) => {
  const profile = await getProfile(getUserId(req))
  if (!profile) {
    return ok(res, { profile: null, bookings: [] }, { profile: null, bookings: [] })
  }

  const workerCoords = profile.currentLocation?.coordinates || [80.6480, 16.5062]
  const bookings = await Booking.find({
    bookingType: 'hamali',
    status: 'pending',
    rejectedBy: { $ne: getUserId(req) },
  })
    .populate('customerId', 'name profilePhoto rating phone')
    .sort({ createdAt: -1 })
    .limit(50)

  const nearby = bookings
    .filter((booking) => booking.pickup?.lat != null && booking.pickup?.lng != null)
    .map((booking) => {
      const distance = haversine(workerCoords, [booking.pickup.lng, booking.pickup.lat])
      return { ...booking.toObject(), distance: Math.round(distance * 10) / 10 }
    })
    .filter((booking) => booking.distance <= 50)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 20)

  return ok(res, { profile, bookings: nearby }, { profile, bookings: nearby })
}))

router.put('/bookings/:id/accept', protect, roleGuard('hamali'), asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const booking = await findBooking(req.params.id)
  if (!booking) return fail(res, 'Booking not found', 404)
  if (booking.bookingType !== 'hamali') return fail(res, 'This booking is not a hamali booking', 400)
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

router.put('/bookings/:id/reject', protect, roleGuard('hamali'), asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const booking = await findBooking(req.params.id)
  if (!booking) return fail(res, 'Booking not found', 404)
  if (booking.bookingType !== 'hamali') return fail(res, 'This booking is not a hamali booking', 400)

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

router.put('/bookings/:id/start', protect, roleGuard('hamali'), asyncHandler(async (req, res) => {
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

router.put('/bookings/:id/complete', protect, roleGuard('hamali'), asyncHandler(async (req, res) => {
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

router.put('/location', protect, roleGuard('hamali'), asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const { lat, lng } = req.body || {}
  if (lat == null || lng == null) return fail(res, 'lat and lng required', 400)

  const profile = await HamaliProfile.findOneAndUpdate(
    { workerId: userId },
    { 'currentLocation.coordinates': [Number(lng), Number(lat)] },
    { new: true }
  )

  if (!profile) return fail(res, 'Profile not found. Complete your profile first.', 404)
  return ok(res, { profile }, { profile })
}))

router.put('/availability', protect, roleGuard('hamali'), asyncHandler(async (req, res) => {
  const { isAvailable } = req.body || {}
  if (typeof isAvailable !== 'boolean') return fail(res, 'isAvailable must be boolean', 400)

  const profile = await HamaliProfile.findOneAndUpdate(
    { workerId: getUserId(req) },
    { isAvailable },
    { new: true }
  ).populate('workerId', 'name phone email profilePhoto rating isActive isKYCApproved')

  if (!profile) return fail(res, 'Profile not found. Complete your profile first.', 404)
  return ok(res, { profile }, { profile })
}))

router.get('/earnings', protect, roleGuard('hamali'), asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayOfWeek = now.getDay()
  const diffToMonday = (dayOfWeek + 6) % 7
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - diffToMonday)
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const baseQuery = { providerId: userId, status: 'completed', bookingType: 'hamali' }
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

router.get('/bookings', protect, roleGuard('hamali'), asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1))
  const limit = Math.max(1, Number(req.query.limit || 10))
  const skip = (page - 1) * limit
  const query = { providerId: getUserId(req), bookingType: 'hamali' }
  if (req.query.status) query.status = req.query.status

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate('customerId', 'name phone profilePhoto rating')
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

router.get('/profile/mine', protect, roleGuard('hamali'), asyncHandler(async (req, res) => {
  const profile = await getProfile(getUserId(req))
  return ok(res, { profile: profile || null }, { profile: profile || null })
}))

router.post('/profile', protect, roleGuard('hamali'), asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const existing = await HamaliProfile.findOne({ workerId: userId })
  if (existing) return fail(res, 'Profile already exists. Use PUT to update it.', 409)

  const profile = await HamaliProfile.create({
    workerId: userId,
    teamSize: Number(req.body?.teamSize || 1),
    ratePerJob: Number(req.body?.ratePerJob || 200),
    ratePerHour: Number(req.body?.ratePerHour || 70),
    skills: Array.isArray(req.body?.skills) ? req.body.skills : [],
    city: req.body?.city || '',
    area: req.body?.area || '',
    isAvailable: Boolean(req.body?.isAvailable),
    currentLocation: req.body?.currentLocation || { type: 'Point', coordinates: [80.6480, 16.5062] },
  })

  return ok(res, { profile }, { profile }, 201)
}))

router.put(['/profile', '/profile/mine'], protect, roleGuard('hamali'), asyncHandler(async (req, res) => {
  const update = {}
  const allowedFields = ['teamSize', 'ratePerJob', 'ratePerHour', 'skills', 'city', 'area', 'currentLocation', 'isAvailable']
  for (const field of allowedFields) {
    if (req.body?.[field] !== undefined) update[field] = req.body[field]
  }

  const profile = await HamaliProfile.findOneAndUpdate(
    { workerId: getUserId(req) },
    { $set: update, $setOnInsert: { workerId: getUserId(req) } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).populate('workerId', 'name phone email profilePhoto rating isActive isKYCApproved')

  return ok(res, { profile }, { profile })
}))

module.exports = router
