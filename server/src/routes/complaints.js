const express = require('express')
const protect = require('../middleware/auth')
const roleGuard = require('../middleware/roleGuard')
const Complaint = require('../models/Complaint')
const Booking = require('../models/Booking')
const { generateComplaintId } = require('../utils/generateId')
const logger = require('../utils/logger')

const router = express.Router()

// POST /api/complaints
router.post('/', protect, roleGuard('customer'), async (req, res) => {
  try {
    const { bookingId, category, description, againstUserId } = req.body

    if (!bookingId || !category || !description) {
      return res.status(400).json({ success: false, message: 'bookingId, category, description are required' })
    }

    const validCategories = ['overcharging', 'no_show', 'behaviour', 'goods_damage', 'payment_issue', 'other']
    if (!validCategories.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category' })
    }

    const booking = await Booking.findOne({ bookingId })
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' })

    if (booking.customerId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only file complaints for completed bookings' })
    }

    const againstUser = againstUserId || booking.providerId
    if (!againstUser) return res.status(400).json({ success: false, message: 'No provider associated with booking' })

    const complaintId = await generateComplaintId()

    const complaint = await Complaint.create({
      complaintId,
      bookingId: booking._id,
      raisedBy: req.user.userId,
      againstUser,
      category,
      description,
      status: 'open'
    })

    booking.hasComplaint = true
    await booking.save()

    return res.status(201).json({ success: true, complaint })
  } catch (err) {
    logger.error('POST complaints: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// GET /api/complaints/my
router.get('/my', protect, async (req, res) => {
  try {
    const { page = 1 } = req.query
    const limit = 10
    const skip = (parseInt(page) - 1) * limit

    const query = {
      $or: [
        { raisedBy: req.user.userId },
        { againstUser: req.user.userId }
      ]
    }

    const [complaints, total] = await Promise.all([
      Complaint.find(query)
        .populate('bookingId', 'bookingId bookingType status')
        .populate('againstUser', 'name role profilePhoto')
        .populate('raisedBy', 'name role profilePhoto')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Complaint.countDocuments(query)
    ])

    return res.json({
      success: true,
      complaints,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    })
  } catch (err) {
    logger.error('GET complaints/my: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// GET /api/complaints/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ complaintId: req.params.id })
      .populate('bookingId')
      .populate('raisedBy', 'name phone email role profilePhoto')
      .populate('againstUser', 'name phone email role profilePhoto')

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' })

    const isOwner = complaint.raisedBy._id.toString() === req.user.userId
    const isAdmin = req.user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    return res.json({ success: true, complaint })
  } catch (err) {
    logger.error('GET complaints/:id: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router
