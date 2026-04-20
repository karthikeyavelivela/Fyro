const express = require('express')
const rateLimit = require('express-rate-limit')
const { body, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User.js')
const Vehicle = require('../models/Vehicle.js')
const HamaliProfile = require('../models/HamaliProfile.js')
const protect = require('../middleware/auth.js')
const logger = require('../utils/logger.js')

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
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'strict',
    path: '/'
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
  body('name').notEmpty().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid Indian mobile number is required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
    .withMessage('Password must include uppercase, lowercase, number, and special character'),
  body('role').isIn(['customer', 'driver', 'hamali']).withMessage('Invalid role'),
  body('language').isIn(['en', 'hi', 'te']).withMessage('Invalid language')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg })
    }

    const { name, email, phone, password, role, language } = req.body

    const existingEmail = await User.findOne({ email: email.toLowerCase() })
    if (existingEmail) return res.status(400).json({ success: false, data: null, message: 'Email already registered' })

    const existingPhone = await User.findOne({ phone })
    if (existingPhone) return res.status(400).json({ success: false, data: null, message: 'Phone already registered' })

    const passwordHash = await bcrypt.hash(password, 12)

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
        isAvailable: false,
        currentLocation: { type: 'Point', coordinates: [80.6480, 16.5062] }
      })
    }

    if (role === 'hamali') {
      await HamaliProfile.create({
        workerId: user._id,
        teamSize: 1,
        city: 'Vijayawada',
        isAvailable: false,
        currentLocation: { type: 'Point', coordinates: [80.6480, 16.5062] }
      })
    }

    const token = signToken(user)
    setTokenCookie(res, token)

    const sanitizedUser = userResponse(user)
    return res.status(201).json({ success: true, data: { user: sanitizedUser }, user: sanitizedUser })
  } catch (err) {
    logger.error('Register error: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// POST /api/auth/login
router.post('/login', authLimiter, [
  body('identifier').notEmpty().withMessage('Email or phone is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg })
    }

    const { identifier, password } = req.body
    const normalizedIdentifier = String(identifier).trim().toLowerCase()

    const user = await User.findOne({
      $or: [{ email: normalizedIdentifier }, { phone: String(identifier).trim() }]
    })
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' })

    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated' })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' })

    const token = signToken(user)
    setTokenCookie(res, token)

    const sanitizedUser = userResponse(user)
    return res.json({ success: true, data: { user: sanitizedUser }, user: sanitizedUser })
  } catch (err) {
    logger.error('Login error: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('fyro_token', { path: '/' })
  return res.json({ success: true, message: 'Logged out' })
})

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash')
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    return res.json({ success: true, data: { user }, user })
  } catch (err) {
    logger.error('Me error: ' + err.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router
