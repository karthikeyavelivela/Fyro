require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const helmet = require('helmet')
const connectDB = require('./src/config/db')
const logger = require('./src/utils/logger')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
})

app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.set('io', io)

// Routes
app.use('/api/auth', require('./src/routes/auth'))
app.use('/api', require('./src/routes/customer'))
app.use('/api/driver', require('./src/routes/driver'))
app.use('/api/hamali', require('./src/routes/hamali'))
app.use('/api/payments', require('./src/routes/payments'))
app.use('/api/complaints', require('./src/routes/complaints'))
app.use('/api/bookings', require('./src/routes/messages'))
app.use('/api/admin', require('./src/routes/admin'))

// Socket.io
require('./src/socket')(io)

// Global error handler
app.use((err, req, res, next) => {
  logger.error(err.message)
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' })
})

const PORT = process.env.PORT || 5000
connectDB().then(() => {
  server.listen(PORT, () => logger.info(`Server running on port ${PORT}`))
})
