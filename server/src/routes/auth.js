const express = require('express')
const rateLimit = require('express-rate-limit')
const { body, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Vehicle = require('../models/Vehicle')
const HamaliProfile = require('../models/HamaliProfile')
const protect = require('../middleware/auth')
const logger = require('../utils/logger')

const router = express.Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many requests, please try again later' }
})

function signToken(user) {
  return jwt.sign(
    { userId: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

function setTokenCookie(res, token) {
  res.cookie('fyro_token', token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  })
}

function userResponse(user) {
  return {
    id: user._id,
    name: user.name,
    role: user.role,
    email: user.email,
    phone: user.phone,
    profilePhoto: user.profilePhoto,
    language: user.language
  }
}

// POST /api/auth/register
router.post('/register', authLimiter, [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().isLength({ min: 10, max: 15 }).withMessage('Valid phone is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['customer', 'driver', 'hamali', 'admin']).withMessage('Invalid role'),
  body('language').optional().isIn(['en', 'hi', 'te'])
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg })
    }

    const { name, email, phone, password, role, language } = req.body

    const existingEmail = await User.findOne({ email: email.toLowerCase() })
    if (existingEmail) return res.status(409).json({ success: false, message: 'Email already in use' })

    const existingPhone = await User.findOne({ phone })
    if (existingPhone) return res.status(409).json({ success: false, message: 'Phone already in use' })

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role,
      language: language || 'en'
    })

    if (role === 'driver') {
      await Vehicle.create({
        driverId: user._id,
        type: 'mini_truck',
        registrationNumber: 'PENDING-' + user._id.toString().slice(-6),
        capacityTons: 1,
        isAvailable: false,
        currentLocation: { type: 'Point', coordinates: [80.6480, 16.5062] }
      })
    }

    if (role === 'hamali') {
      await HamaliProfile.create({
        workerId: user._id,
        teamSize: 1,
        ratePerJob: 200,
        ratePerHour: 70,
        city: 'Vijayawada',
        isAvailable: false,
        currentLocation: { type: 'Point', coordinates: [80.6480, 16.5062] }
      })
    }

    const token = signToken(user)
    setTokenCookie(res, token)

    return res.status(201).json({ success: true, user: userResponse(user) })
  } catch (err) {
    logger.error('Register error: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// POST /api/auth/login
router.post('/login', authLimiter, [
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg })
    }

    const { email, phone, password } = req.body
    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Email or phone is required' })
    }

    const query = email
      ? { email: email.toLowerCase() }
      : { phone }

    const user = await User.findOne(query)
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' })

    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated' })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' })

    const token = signToken(user)
    setTokenCookie(res, token)

    return res.json({ success: true, user: userResponse(user) })
  } catch (err) {
    logger.error('Login error: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('fyro_token')
  return res.json({ success: true })
})

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash')
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    return res.json({ success: true, user })
  } catch (err) {
    logger.error('Me error: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router
