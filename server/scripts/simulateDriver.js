// Usage: node scripts/simulateDriver.js FY-2025-0009
// Connects as driver socket, simulates movement from pickup to dropoff
// Emits driver:location_update every 4 seconds
// Prints progress to console

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { io } = require('socket.io-client')

const bookingId = process.argv[2]
if (!bookingId) {
  console.error('Usage: node scripts/simulateDriver.js <bookingId>')
  process.exit(1)
}

// Vijayawada route simulation points (MG Road to Benz Circle)
const route = [
  [80.6480, 16.5062],
  [80.6490, 16.5070],
  [80.6500, 16.5080],
  [80.6510, 16.5090],
  [80.6520, 16.5100],
  [80.6530, 16.5110],
  [80.6540, 16.5120],
]

const socket = io(process.env.CLIENT_URL?.replace('3000', '5000') || 'http://localhost:5000', {
  transports: ['websocket']
})

socket.on('connect', () => {
  console.log('Connected to socket server')
  socket.emit('join:booking', { bookingId })

  let step = 0
  const interval = setInterval(() => {
    if (step >= route.length) {
      console.log('Route completed')
      clearInterval(interval)
      socket.disconnect()
      process.exit(0)
    }

    const [lng, lat] = route[step]
    socket.emit('driver:location_update', { bookingId, lat, lng })
    console.log(`Step ${step + 1}/${route.length}: lat=${lat}, lng=${lng}`)
    step++
  }, 4000)
})

socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message)
  process.exit(1)
})
