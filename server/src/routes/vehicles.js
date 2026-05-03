const express = require('express')
const protect = require('../middleware/auth.js')
const roleGuard = require('../middleware/roleGuard.js')
const asyncHandler = require('../utils/asyncHandler')
const Vehicle = require('../models/Vehicle')
const haversine = require('../utils/haversine')

const router = express.Router()

const getUserId = (req) => String(req.user?.userId || req.user?.id || req.user?._id || '')
const ok = (res, data = {}, extra = {}, status = 200) => res.status(status).json({ success: true, data, ...extra })
const fail = (res, message, status = 400, data = {}) => res.status(status).json({ success: false, message, data })

router.get('/available', protect, asyncHandler(async (req, res) => {
  const lat = Number(req.query.lat)
  const lng = Number(req.query.lng)
  if (Number.isNaN(lat) || Number.isNaN(lng)) return fail(res, 'lat and lng are required', 400)

  const radius = Number(req.query.radius || 50)
  const type = req.query.type
  const query = { isAvailable: true }
  if (type && type !== 'all') query.type = type

  const vehicles = await Vehicle.find(query).populate('driverId', 'name phone profilePhoto rating isActive')
  const availableVehicles = vehicles
    .filter((vehicle) => vehicle.driverId?.isActive !== false)
    .map((vehicle) => {
      const coords = vehicle.currentLocation?.coordinates || [80.6480, 16.5062]
      const distanceKm = haversine([lng, lat], coords)
      return { ...vehicle.toObject(), distanceKm: Math.round(distanceKm * 10) / 10 }
    })
    .filter((vehicle) => vehicle.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm)

  return ok(res, { vehicles: availableVehicles }, { vehicles: availableVehicles })
}))

router.get('/mine', protect, roleGuard('driver'), asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ driverId: getUserId(req) }).populate('driverId', 'name phone profilePhoto rating isActive')
  return ok(res, { vehicle: vehicle || null }, { vehicle: vehicle || null })
}))

router.post('/', protect, roleGuard('driver'), asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const existing = await Vehicle.findOne({ driverId: userId })
  if (existing) return fail(res, 'Vehicle already exists. Use PUT to update it.', 409)

  const vehicle = await Vehicle.create({
    driverId: userId,
    type: req.body?.type,
    registrationNumber: req.body?.registrationNumber,
    capacityTons: Number(req.body?.capacityTons || 1),
    photos: Array.isArray(req.body?.photos) ? req.body.photos : [],
    isAvailable: Boolean(req.body?.isAvailable),
    currentLocation: req.body?.currentLocation || { type: 'Point', coordinates: [80.6480, 16.5062] },
  })

  return ok(res, { vehicle }, { vehicle }, 201)
}))

router.put('/:id', protect, roleGuard('driver'), asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id)
  if (!vehicle) return fail(res, 'Vehicle not found', 404)
  if (String(vehicle.driverId) !== getUserId(req)) return fail(res, 'Forbidden', 403)

  const allowedFields = ['type', 'registrationNumber', 'capacityTons', 'photos', 'isAvailable', 'currentLocation']
  for (const field of allowedFields) {
    if (req.body?.[field] !== undefined) vehicle[field] = req.body[field]
  }

  await vehicle.save()
  return ok(res, { vehicle }, { vehicle })
}))

module.exports = router
