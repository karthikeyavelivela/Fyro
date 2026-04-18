const Message = require('../models/Message')
const logger = require('../utils/logger')

module.exports = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`)

    socket.on('join:user', ({ userId }) => {
      socket.join(`user:${userId}`)
    })

    socket.on('join:booking', ({ bookingId }) => {
      socket.join(`booking:${bookingId}`)
    })

    socket.on('driver:location_update', ({ bookingId, lat, lng }) => {
      socket.to(`booking:${bookingId}`)
            .emit('driver:location', { lat, lng, updatedAt: Date.now() })
    })

    socket.on('message:send', async ({ bookingId, senderId, content }) => {
      try {
        const msg = await Message.create({ bookingId, senderId, content, type: 'text' })
        const populated = await Message.findById(msg._id)
          .populate('senderId', 'name profilePhoto role')
        io.to(`booking:${bookingId}`).emit('message:new', populated)
      } catch (err) {
        logger.error('Socket message error: ' + err.message)
      }
    })

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`)
    })
  })
}
