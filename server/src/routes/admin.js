const express = require('express')
const protect = require('../middleware/auth.js')
const roleGuard = require('../middleware/roleGuard.js')
const User = require('../models/User')
const Booking = require('../models/Booking')
const Complaint = require('../models/Complaint')
const Vehicle = require('../models/Vehicle')
const HamaliProfile = require('../models/HamaliProfile')
const logger = require('../utils/logger.js')

const router = express.Router()

// All routes require admin
router.use(protect, roleGuard('admin'))

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [
      customerCount,
      driverCount,
      hamaliCount,
      adminCount,
      bookingsToday,
      completedToday,
      openComplaints,
      pendingKYC,
      recentBookings,
      recentComplaints
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'driver' }),
      User.countDocuments({ role: 'hamali' }),
      User.countDocuments({ role: 'admin' }),
      Booking.countDocuments({ createdAt: { $gte: startOfToday } }),
      Booking.find({ status: 'completed', completedAt: { $gte: startOfToday } }).select('finalFare'),
      Complaint.countDocuments({ status: 'open' }),
      User.countDocuments({ isKYCApproved: false, role: { $in: ['driver', 'hamali'] } }),
      Booking.find().sort({ createdAt: -1 }).limit(10)
        .populate('customerId', 'name')
        .populate('providerId', 'name'),
      Complaint.find().sort({ createdAt: -1 }).limit(5)
        .populate('raisedBy', 'name')
        .populate('againstUser', 'name')
    ])

    const revenueToday = completedToday.reduce((sum, b) => sum + (b.finalFare || 0), 0)

    const recentActivity = [
      ...recentBookings.map(b => ({ type: 'booking', data: b, createdAt: b.createdAt })),
      ...recentComplaints.map(c => ({ type: 'complaint', data: c, createdAt: c.createdAt }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return res.json({
      success: true,
      stats: {
        totalUsers: {
          customer: customerCount,
          driver: driverCount,
          hamali: hamaliCount,
          admin: adminCount,
          total: customerCount + driverCount + hamaliCount + adminCount
        },
        bookingsToday,
        revenueToday,
        openComplaints,
        pendingKYC,
        recentActivity
      }
    })
  } catch (err) {
    logger.error('GET admin/stats: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { role, search, page = 1 } = req.query
    const limit = 20
    const skip = (parseInt(page) - 1) * limit

    const query = {}
    if (role) query.role = role
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }

    const [users, total] = await Promise.all([
      User.find(query).select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query)
    ])

    return res.json({
      success: true,
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    })
  } catch (err) {
    logger.error('GET admin/users: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// GET /api/admin/bookings
router.get('/bookings', async (req, res) => {
  try {
    const { status, bookingType, startDate, endDate, page = 1 } = req.query
    const limit = 20
    const skip = (parseInt(page) - 1) * limit

    const query = {}
    if (status) query.status = status
    if (bookingType) query.bookingType = bookingType
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('customerId', 'name phone email')
        .populate('providerId', 'name phone email')
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
    logger.error('GET admin/bookings: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// GET /api/admin/complaints
router.get('/complaints', async (req, res) => {
  try {
    const { status, page = 1 } = req.query
    const limit = 20
    const skip = (parseInt(page) - 1) * limit

    const query = {}
    if (status) query.status = status

    // Open first, then by date
    const [complaints, total] = await Promise.all([
      Complaint.find(query)
        .populate('raisedBy', 'name phone email role')
        .populate('againstUser', 'name phone email role')
        .populate('bookingId', 'bookingId bookingType status finalFare')
        .sort({ status: 1, createdAt: -1 })
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
    logger.error('GET admin/complaints: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// PUT /api/admin/complaints/:id
router.put('/complaints/:id', async (req, res) => {
  try {
    const { status, adminNote } = req.body

    const complaint = await Complaint.findOne({ complaintId: req.params.id })
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' })

    const validStatuses = ['open', 'under_review', 'resolved', 'rejected']
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' })
    }

    if (status) complaint.status = status
    if (adminNote) complaint.adminNote = adminNote
    if (status === 'resolved' || status === 'rejected') {
      complaint.resolvedAt = new Date()
    }

    await complaint.save()

    const io = req.app.get('io')
    io.to(`user:${complaint.raisedBy}`).emit('complaint:updated', complaint)

    return res.json({ success: true, complaint })
  } catch (err) {
    logger.error('PUT admin/complaints/:id: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// PUT /api/admin/kyc/:userId
router.put('/kyc/:userId', async (req, res) => {
  try {
    const { approved, reason } = req.body

    const user = await User.findById(req.params.userId)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    user.isKYCApproved = Boolean(approved)
    await user.save()

    if (approved) {
      if (user.role === 'driver') {
        await Vehicle.findOneAndUpdate(
          { driverId: user._id },
          { isVerified: true }
        )
      } else if (user.role === 'hamali') {
        await HamaliProfile.findOneAndUpdate(
          { workerId: user._id },
          { isVerified: true }
        )
      }
    }

    const io = req.app.get('io')
    io.to(`user:${user._id}`).emit('kyc:updated', {
      approved,
      reason: reason || '',
      userId: user._id
    })

    return res.json({ success: true, user: { id: user._id, name: user.name, isKYCApproved: user.isKYCApproved } })
  } catch (err) {
    logger.error('PUT admin/kyc/:userId: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// PUT /api/admin/users/:id/deactivate
router.put('/users/:id/deactivate', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    user.isActive = false
    await user.save()

    return res.json({ success: true, message: 'User deactivated' })
  } catch (err) {
    logger.error('PUT admin/users/:id/deactivate: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router
