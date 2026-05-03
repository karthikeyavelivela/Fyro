const express = require('express')
const protect = require('../middleware/auth.js')
const asyncHandler = require('../utils/asyncHandler')
const Complaint = require('../models/Complaint')
const Booking = require('../models/Booking')
const { generateComplaintId } = require('../utils/generateId')

const router = express.Router()

const getUserId = (req) => String(req.user?.userId || req.user?.id || req.user?._id || '')
const ok = (res, data = {}, extra = {}, status = 200) => res.status(status).json({ success: true, data, ...extra })
const fail = (res, message, status = 400, data = {}) => res.status(status).json({ success: false, message, data })

router.post('/', protect, asyncHandler(async (req, res) => {
  const { bookingId, category, description, againstUserId } = req.body || {}
  if (!bookingId || !category || !description) {
    return fail(res, 'bookingId, category, and description are required', 400)
  }

  const validCategories = ['overcharging', 'no_show', 'behaviour', 'goods_damage', 'payment_issue', 'other']
  if (!validCategories.includes(category)) return fail(res, 'Invalid category', 400)

  const booking = await Booking.findOne({ $or: [{ bookingId }, { _id: bookingId }] })
  if (!booking) return fail(res, 'Booking not found', 404)

  const userId = getUserId(req)
  const isParticipant = [booking.customerId, booking.providerId].filter(Boolean).some((id) => String(id) === userId)
  const isAdmin = req.user.role === 'admin'
  if (!isParticipant && !isAdmin) return fail(res, 'Forbidden', 403)

  const againstUser = againstUserId || (String(booking.customerId) === userId ? booking.providerId : booking.customerId)
  if (!againstUser) return fail(res, 'No counterparty found for this booking', 400)

  const complaint = await Complaint.create({
    complaintId: await generateComplaintId(),
    bookingId: booking._id,
    raisedBy: userId,
    againstUser,
    category,
    description,
    status: 'open',
    attachments: Array.isArray(req.body?.evidence) ? req.body.evidence : [],
  })

  booking.hasComplaint = true
  await booking.save()

  return ok(res, { complaint }, { complaint }, 201)
}))

router.get('/my', protect, asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const page = Math.max(1, Number(req.query.page || 1))
  const limit = Math.max(1, Number(req.query.limit || 10))
  const skip = (page - 1) * limit

  const query = req.user.role === 'admin'
    ? {}
    : { $or: [{ raisedBy: userId }, { againstUser: userId }] }

  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .populate('bookingId', 'bookingId bookingType status finalFare')
      .populate('againstUser', 'name role profilePhoto phone email')
      .populate('raisedBy', 'name role profilePhoto phone email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Complaint.countDocuments(query),
  ])

  return ok(res, { complaints, total, page, pages: Math.ceil(total / limit) }, {
    complaints,
    total,
    page,
    pages: Math.ceil(total / limit),
  })
}))

router.get('/:id', protect, asyncHandler(async (req, res) => {
  const complaint = await Complaint.findOne({ $or: [{ complaintId: req.params.id }, { _id: req.params.id }] })
    .populate('bookingId')
    .populate('raisedBy', 'name phone email role profilePhoto')
    .populate('againstUser', 'name phone email role profilePhoto')

  if (!complaint) return fail(res, 'Complaint not found', 404)

  const userId = getUserId(req)
  const isOwner = String(complaint.raisedBy?._id || complaint.raisedBy) === userId
  const isCounterparty = String(complaint.againstUser?._id || complaint.againstUser) === userId
  const isAdmin = req.user.role === 'admin'
  if (!isOwner && !isCounterparty && !isAdmin) return fail(res, 'Forbidden', 403)

  return ok(res, { complaint }, { complaint })
}))

module.exports = router
