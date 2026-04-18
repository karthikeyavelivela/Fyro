const mongoose = require('mongoose')
const logger = require('../utils/logger')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function connectDB(attempt = 1) {
  try {
    const uri = process.env.MONGODB_URI
    if (!uri) throw new Error('MONGODB_URI is not defined in environment')

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000
    })

    logger.info('MongoDB connected successfully')

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected')
    })

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error: ' + err.message)
    })
  } catch (err) {
    const delay = Math.min(attempt * 2000, 30000)
    logger.error(`MongoDB connection failed (attempt ${attempt}): ${err.message}. Retrying in ${delay}ms...`)
    if (attempt >= 10) {
      logger.error('Max MongoDB reconnect attempts reached. Exiting.')
      process.exit(1)
    }
    await sleep(delay)
    return connectDB(attempt + 1)
  }
}

module.exports = connectDB
