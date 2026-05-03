const express = require('express')
const protect = require('../middleware/auth.js')
const asyncHandler = require('../utils/asyncHandler')
const User = require('../models/User')
const Booking = require('../models/Booking')

const router = express.Router()

const getUserId = (req) => String(req.user?.userId || req.user?.id || req.user?._id || '')
const ok = (res, data = {}, extra = {}, status = 200) => res.status(status).json({ success: true, data, ...extra })
const fail = (res, message, status = 400, data = {}) => res.status(status).json({ success: false, message, data })

router.get('/me', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(getUserId(req)).select('-passwordHash')
  if (!user) return fail(res, 'User not found', 404)

  const tripCount = await Booking.countDocuments({
    status: 'completed',
    $or: [{ customerId: user._id }, { providerId: user._id }],
  })

  const profile = {
    id: user._id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    rating: Number(user.rating || 0),
    tripCount,
    language: user.language,
    profilePhoto: user.profilePhoto || '',
    isKYCApproved: Boolean(user.isKYCApproved),
  }

  return ok(res, { user: profile }, { user: profile })
}))

router.put('/me', protect, asyncHandler(async (req, res) => {
  const update = {}
  if (req.body?.name !== undefined) update.name = String(req.body.name).trim()
  if (req.body?.phone !== undefined) update.phone = String(req.body.phone).trim()
  if (req.body?.language !== undefined) update.language = req.body.language

  if (update.phone) {
    const existingPhone = await User.findOne({ phone: update.phone, _id: { $ne: getUserId(req) } })
    if (existingPhone) return fail(res, 'Phone already in use', 400)
  }

  const user = await User.findByIdAndUpdate(getUserId(req), update, { new: true, runValidators: true }).select('-passwordHash')
  if (!user) return fail(res, 'User not found', 404)

  const tripCount = await Booking.countDocuments({
    status: 'completed',
    $or: [{ customerId: user._id }, { providerId: user._id }],
  })

  const profile = {
    id: user._id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    rating: Number(user.rating || 0),
    tripCount,
    language: user.language,
    profilePhoto: user.profilePhoto || '',
    isKYCApproved: Boolean(user.isKYCApproved),
  }

  return ok(res, { user: profile }, { user: profile })
}))

module.exports = router
