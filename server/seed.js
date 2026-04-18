require('dotenv').config()
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')

// Models
const User = require('./src/models/User')
const Vehicle = require('./src/models/Vehicle')
const HamaliProfile = require('./src/models/HamaliProfile')
const Booking = require('./src/models/Booking')
const Payment = require('./src/models/Payment')
const Complaint = require('./src/models/Complaint')
const Message = require('./src/models/Message')

async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('MongoDB connected')
}

async function dropAll() {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
  // Also reset counters
  try {
    const Counter = mongoose.models.Counter
    if (Counter) await Counter.deleteMany({})
  } catch (_) {}
  console.log('All collections cleared')
}

async function seed() {
  await connectDB()
  await dropAll()

  const hash = await bcrypt.hash('Test@1234', 12)
  const adminHash = await bcrypt.hash('Admin@1234', 12)

  // ============ USERS ============
  const usersData = [
    { name: 'FYRO Admin',     email: 'admin@fyro.com',    phone: '9876543209', role: 'admin' },
    { name: 'Arjun Reddy',    email: 'customer1@fyro.com', phone: '9876543210', role: 'customer' },
    { name: 'Priya Sharma',   email: 'customer2@fyro.com', phone: '9876543211', role: 'customer' },
    { name: 'Mohammed Irfan', email: 'customer3@fyro.com', phone: '9100000003', role: 'customer' },
    { name: 'Ravi Kumar',     email: 'driver1@fyro.com',  phone: '9876543212', role: 'driver' },
    { name: 'Suresh Babu',    email: 'driver2@fyro.com',  phone: '9876543213', role: 'driver' },
    { name: 'Venkat Rao',     email: 'driver3@fyro.com',  phone: '9876543214', role: 'driver' },
    { name: 'Kiran Kumar',    email: 'driver4@fyro.com',  phone: '9200000004', role: 'driver' },
    { name: 'Prasad Naidu',   email: 'driver5@fyro.com',  phone: '9200000005', role: 'driver' },
    { name: 'Ramesh Kumar',   email: 'hamali1@fyro.com',  phone: '9876543215', role: 'hamali' },
    { name: 'Mahesh Team',    email: 'hamali2@fyro.com',  phone: '9876543216', role: 'hamali' },
    { name: 'Ganesh Group',   email: 'hamali3@fyro.com',  phone: '9300000003', role: 'hamali' },
    { name: 'Rajesh',         email: 'hamali4@fyro.com',  phone: '9300000004', role: 'hamali' },
  ]

  const users = await User.insertMany(usersData.map(u => ({
    ...u,
    passwordHash: u.role === 'admin' ? adminHash : hash,
    isVerified: true,
    isKYCApproved: true,
    language: 'te',
    rating: 4.5,
    totalRatings: 12,
    isActive: true
  })))

  const admin   = users[0]
  const c1      = users[1]  // Arjun
  const c2      = users[2]  // Priya
  const c3      = users[3]  // Irfan
  const d1      = users[4]  // Ravi
  const d2      = users[5]  // Suresh
  const d3      = users[6]  // Venkat
  const d4      = users[7]  // Kiran
  const d5      = users[8]  // Prasad
  const h1      = users[9]  // Ramesh
  const h2      = users[10] // Mahesh Team
  const h3      = users[11] // Ganesh Group
  const h4      = users[12] // Rajesh

  console.log('Users created:', users.length)

  // ============ VEHICLES ============
  const vehiclesData = [
    { driverId: d1._id, type: 'mini_truck', registrationNumber: 'AP16AB1234', capacityTons: 0.5, coordinates: [80.6520, 16.5080] },
    { driverId: d2._id, type: 'tempo',      registrationNumber: 'AP16AB2345', capacityTons: 1,   coordinates: [80.6450, 16.5020] },
    { driverId: d3._id, type: 'truck_407',  registrationNumber: 'AP16AB3456', capacityTons: 2.5, coordinates: [80.6580, 16.5140] },
    { driverId: d4._id, type: 'truck_1ton', registrationNumber: 'AP16AB4567', capacityTons: 4,   coordinates: [80.6400, 16.4980] },
    { driverId: d5._id, type: 'truck_2ton', registrationNumber: 'AP16AB5678', capacityTons: 8,   coordinates: [80.6620, 16.5200] },
  ]

  const vehicles = await Vehicle.insertMany(vehiclesData.map(v => ({
    driverId: v.driverId,
    type: v.type,
    registrationNumber: v.registrationNumber,
    capacityTons: v.capacityTons,
    isAvailable: true,
    isVerified: true,
    currentLocation: { type: 'Point', coordinates: v.coordinates }
  })))

  console.log('Vehicles created:', vehicles.length)

  // ============ HAMALI PROFILES ============
  const hamaliData = [
    { workerId: h1._id, teamSize: 1, ratePerJob: 220, ratePerHour: 70,  city: 'Vijayawada', area: 'Governorpet', coordinates: [80.6480, 16.5062] },
    { workerId: h2._id, teamSize: 3, ratePerJob: 380, ratePerHour: 130, city: 'Vijayawada', area: 'Auto Nagar',   coordinates: [80.6520, 16.5100] },
    { workerId: h3._id, teamSize: 6, ratePerJob: 650, ratePerHour: 220, city: 'Vijayawada', area: 'Benz Circle',  coordinates: [80.6440, 16.5040] },
    { workerId: h4._id, teamSize: 1, ratePerJob: 200, ratePerHour: 70,  city: 'Vijayawada', area: 'Patamata',     coordinates: [80.6560, 16.5120] },
  ]

  const hamaliProfiles = await HamaliProfile.insertMany(hamaliData.map(h => ({
    workerId: h.workerId,
    teamSize: h.teamSize,
    ratePerJob: h.ratePerJob,
    ratePerHour: h.ratePerHour,
    city: h.city,
    area: h.area,
    isAvailable: true,
    isVerified: true,
    currentLocation: { type: 'Point', coordinates: h.coordinates },
    totalJobsDone: 25
  })))

  console.log('Hamali profiles created:', hamaliProfiles.length)

  // ============ HELPER: fare calculation ============
  function transportFare(vehicleType, distanceKm, returnLoad = false) {
    const RATES = {
      mini_truck: { base: 80, perKm: 12 },
      tempo:      { base: 110, perKm: 16 },
      truck_407:  { base: 160, perKm: 22 },
      truck_1ton: { base: 220, perKm: 30 },
      truck_2ton: { base: 300, perKm: 40 },
    }
    const r = RATES[vehicleType]
    const baseFare = r.base
    const distanceFare = r.perKm * distanceKm
    const subtotalBefore = baseFare + distanceFare
    const returnLoadDiscount = returnLoad ? Math.round(subtotalBefore * 0.15) : 0
    const subtotal = subtotalBefore - returnLoadDiscount
    const gst = Math.round(subtotal * 0.18)
    const total = subtotal + gst
    return { baseFare, distanceFare, hourlyFare: 0, floorSurcharge: 0, heavySurcharge: 0, returnLoadDiscount, subtotal, gst, total }
  }

  function hamaliFare(teamSize, estimatedHours = 1, floorNumber = 0, heavyGoods = false) {
    const RATES = teamSize === 1 ? { base: 180, perHr: 70 }
                : teamSize <= 4  ? { base: 320, perHr: 130 }
                :                  { base: 550, perHr: 220 }
    const baseFare = RATES.base
    const hourlyFare = RATES.perHr * Math.max(0, estimatedHours - 1)
    const floorSurcharge = floorNumber > 0 ? 40 * floorNumber : 0
    const heavySurcharge = heavyGoods ? Math.round((baseFare + hourlyFare) * 0.25) : 0
    const subtotal = baseFare + hourlyFare + floorSurcharge + heavySurcharge
    const gst = Math.round(subtotal * 0.18)
    const total = subtotal + gst
    return { baseFare, distanceFare: 0, hourlyFare, floorSurcharge, heavySurcharge, returnLoadDiscount: 0, subtotal, gst, total }
  }

  const now = new Date()
  function daysAgo(d) { return new Date(now - d * 86400000) }
  function hoursAgo(h) { return new Date(now - h * 3600000) }

  // ============ BOOKINGS ============
  const f1 = transportFare('mini_truck', 8.2)
  const f2 = transportFare('tempo', 12.5)
  const f3 = transportFare('truck_407', 15.3)
  const f4 = transportFare('truck_1ton', 22.7)
  const f5 = hamaliFare(1, 2)
  const f6 = hamaliFare(3, 3)
  const f7 = transportFare('truck_2ton', 45.0)
  const f8 = transportFare('mini_truck', 11.0)

  const bookingsData = [
    // 0001: transport, completed, paid — Arjun→Ravi, mini_truck
    {
      bookingId: 'FY-2025-0001', customerId: c1._id, providerId: d1._id,
      bookingType: 'transport', status: 'completed',
      pickup: { address: 'MG Road, Vijayawada', lat: 16.5082, lng: 80.6480 },
      dropoff: { address: 'Benz Circle, Vijayawada', lat: 16.5162, lng: 80.6302 },
      vehicleId: vehicles[0]._id, vehicleType: 'mini_truck',
      distanceKm: 8.2, estimatedFare: f1.total, finalFare: f1.total,
      fareBreakdown: f1, paymentStatus: 'paid',
      acceptedAt: daysAgo(10), startedAt: daysAgo(10), completedAt: daysAgo(10),
      paidAt: daysAgo(10), customerRating: 5, customerReview: 'Excellent service!'
    },
    // 0002: transport, completed, paid — Priya→Suresh, tempo
    {
      bookingId: 'FY-2025-0002', customerId: c2._id, providerId: d2._id,
      bookingType: 'transport', status: 'completed',
      pickup: { address: 'Auto Nagar, Vijayawada', lat: 16.5042, lng: 80.6380 },
      dropoff: { address: 'Governorpet, Vijayawada', lat: 16.5122, lng: 80.6180 },
      vehicleId: vehicles[1]._id, vehicleType: 'tempo',
      distanceKm: 12.5, estimatedFare: f2.total, finalFare: f2.total,
      fareBreakdown: f2, paymentStatus: 'paid',
      acceptedAt: daysAgo(8), startedAt: daysAgo(8), completedAt: daysAgo(8),
      paidAt: daysAgo(8), customerRating: 4
    },
    // 0003: transport, completed, paid — Irfan→Venkat, truck_407
    {
      bookingId: 'FY-2025-0003', customerId: c3._id, providerId: d3._id,
      bookingType: 'transport', status: 'completed',
      pickup: { address: 'One Town, Vijayawada', lat: 16.5142, lng: 80.6220 },
      dropoff: { address: 'Moghalrajpuram, Vijayawada', lat: 16.4942, lng: 80.6560 },
      vehicleId: vehicles[2]._id, vehicleType: 'truck_407',
      distanceKm: 15.3, estimatedFare: f3.total, finalFare: f3.total,
      fareBreakdown: f3, paymentStatus: 'paid',
      acceptedAt: daysAgo(6), startedAt: daysAgo(6), completedAt: daysAgo(6),
      paidAt: daysAgo(6), hasComplaint: true
    },
    // 0004: transport, completed, paid — Arjun→Kiran, truck_1ton
    {
      bookingId: 'FY-2025-0004', customerId: c1._id, providerId: d4._id,
      bookingType: 'transport', status: 'completed',
      pickup: { address: 'Patamata, Vijayawada', lat: 16.5002, lng: 80.6580 },
      dropoff: { address: 'Vijayawada Railway Station, Vijayawada', lat: 16.5162, lng: 80.6202 },
      vehicleId: vehicles[3]._id, vehicleType: 'truck_1ton',
      distanceKm: 22.7, estimatedFare: f4.total, finalFare: f4.total,
      fareBreakdown: f4, paymentStatus: 'paid',
      acceptedAt: daysAgo(5), startedAt: daysAgo(5), completedAt: daysAgo(5),
      paidAt: daysAgo(5), hasComplaint: true
    },
    // 0005: hamali, completed, paid — Priya→Ramesh
    {
      bookingId: 'FY-2025-0005', customerId: c2._id, providerId: h1._id,
      bookingType: 'hamali', status: 'completed',
      pickup: { address: 'Governorpet, Vijayawada', lat: 16.5082, lng: 80.6480 },
      hamaliDetails: { type: 'loading', teamSize: 1, estimatedHours: 2, floorNumber: 0, heavyGoods: false },
      estimatedFare: f5.total, finalFare: f5.total,
      fareBreakdown: f5, paymentStatus: 'paid',
      acceptedAt: daysAgo(4), startedAt: daysAgo(4), completedAt: daysAgo(4),
      paidAt: daysAgo(4), hasComplaint: true
    },
    // 0006: hamali, completed, paid — Irfan→Mahesh Team
    {
      bookingId: 'FY-2025-0006', customerId: c3._id, providerId: h2._id,
      bookingType: 'hamali', status: 'completed',
      pickup: { address: 'Auto Nagar, Vijayawada', lat: 16.5042, lng: 80.6380 },
      hamaliDetails: { type: 'both', teamSize: 3, estimatedHours: 3, floorNumber: 1, heavyGoods: false },
      estimatedFare: f6.total, finalFare: f6.total,
      fareBreakdown: f6, paymentStatus: 'paid',
      acceptedAt: daysAgo(3), startedAt: daysAgo(3), completedAt: daysAgo(3),
      paidAt: daysAgo(3)
    },
    // 0007: transport, completed, pending payment — Arjun→Prasad, truck_2ton
    {
      bookingId: 'FY-2025-0007', customerId: c1._id, providerId: d5._id,
      bookingType: 'transport', status: 'completed',
      pickup: { address: 'Vijayawada Bus Stand, Vijayawada', lat: 16.5162, lng: 80.6202 },
      dropoff: { address: 'Guntur City Centre, Guntur', lat: 16.3067, lng: 80.4365 },
      vehicleId: vehicles[4]._id, vehicleType: 'truck_2ton',
      distanceKm: 45.0, estimatedFare: f7.total, finalFare: f7.total,
      fareBreakdown: f7, paymentStatus: 'pending',
      acceptedAt: daysAgo(2), startedAt: daysAgo(2), completedAt: daysAgo(2)
    },
    // 0008: transport, completed, pending payment — Priya→Ravi, mini_truck
    {
      bookingId: 'FY-2025-0008', customerId: c2._id, providerId: d1._id,
      bookingType: 'transport', status: 'completed',
      pickup: { address: 'Benz Circle, Vijayawada', lat: 16.5162, lng: 80.6302 },
      dropoff: { address: 'Penamaluru, Vijayawada', lat: 16.4802, lng: 80.6140 },
      vehicleId: vehicles[0]._id, vehicleType: 'mini_truck',
      distanceKm: 11.0, estimatedFare: f8.total, finalFare: f8.total,
      fareBreakdown: f8, paymentStatus: 'pending',
      acceptedAt: daysAgo(1), startedAt: daysAgo(1), completedAt: hoursAgo(6)
    },
    // 0009: transport, in_progress — Irfan→Suresh
    {
      bookingId: 'FY-2025-0009', customerId: c3._id, providerId: d2._id,
      bookingType: 'transport', status: 'in_progress',
      pickup: { address: 'MG Road, Vijayawada', lat: 16.5082, lng: 80.6480 },
      dropoff: { address: 'Krishna Lanka, Vijayawada', lat: 16.5222, lng: 80.6040 },
      vehicleId: vehicles[1]._id, vehicleType: 'tempo',
      distanceKm: 9.5,
      estimatedFare: transportFare('tempo', 9.5).total,
      finalFare: 0,
      fareBreakdown: transportFare('tempo', 9.5),
      paymentStatus: 'pending',
      acceptedAt: hoursAgo(2), startedAt: hoursAgo(1)
    },
    // 0010: transport, in_progress — Arjun→Venkat
    {
      bookingId: 'FY-2025-0010', customerId: c1._id, providerId: d3._id,
      bookingType: 'transport', status: 'in_progress',
      pickup: { address: 'Auto Nagar, Vijayawada', lat: 16.5042, lng: 80.6380 },
      dropoff: { address: 'Ajit Singh Nagar, Vijayawada', lat: 16.4882, lng: 80.6680 },
      vehicleId: vehicles[2]._id, vehicleType: 'truck_407',
      distanceKm: 13.2,
      estimatedFare: transportFare('truck_407', 13.2).total,
      finalFare: 0,
      fareBreakdown: transportFare('truck_407', 13.2),
      paymentStatus: 'pending',
      acceptedAt: hoursAgo(3), startedAt: hoursAgo(2)
    },
    // 0011: hamali, in_progress — Priya→Ganesh Group
    {
      bookingId: 'FY-2025-0011', customerId: c2._id, providerId: h3._id,
      bookingType: 'hamali', status: 'in_progress',
      pickup: { address: 'Benz Circle, Vijayawada', lat: 16.5162, lng: 80.6302 },
      hamaliDetails: { type: 'unloading', teamSize: 6, estimatedHours: 4, floorNumber: 2, heavyGoods: true },
      estimatedFare: hamaliFare(6, 4, 2, true).total,
      finalFare: 0,
      fareBreakdown: hamaliFare(6, 4, 2, true),
      paymentStatus: 'pending',
      acceptedAt: hoursAgo(4), startedAt: hoursAgo(3)
    },
    // 0012: transport, accepted — Irfan→Kiran
    {
      bookingId: 'FY-2025-0012', customerId: c3._id, providerId: d4._id,
      bookingType: 'transport', status: 'accepted',
      pickup: { address: 'Patamata, Vijayawada', lat: 16.5002, lng: 80.6580 },
      dropoff: { address: 'Penamaluru, Vijayawada', lat: 16.4802, lng: 80.6140 },
      vehicleId: vehicles[3]._id, vehicleType: 'truck_1ton',
      distanceKm: 18.5,
      estimatedFare: transportFare('truck_1ton', 18.5).total,
      finalFare: 0,
      fareBreakdown: transportFare('truck_1ton', 18.5),
      paymentStatus: 'pending',
      acceptedAt: hoursAgo(1)
    },
    // 0013: transport, accepted — Arjun→Prasad
    {
      bookingId: 'FY-2025-0013', customerId: c1._id, providerId: d5._id,
      bookingType: 'transport', status: 'accepted',
      pickup: { address: 'Governorpet, Vijayawada', lat: 16.5122, lng: 80.6180 },
      dropoff: { address: 'Moghalrajpuram, Vijayawada', lat: 16.4942, lng: 80.6560 },
      vehicleId: vehicles[4]._id, vehicleType: 'mini_truck',
      distanceKm: 7.8,
      estimatedFare: transportFare('mini_truck', 7.8).total,
      finalFare: 0,
      fareBreakdown: transportFare('mini_truck', 7.8),
      paymentStatus: 'pending',
      acceptedAt: hoursAgo(0.5)
    },
    // 0014: transport, pending — Priya, no provider
    {
      bookingId: 'FY-2025-0014', customerId: c2._id,
      bookingType: 'transport', status: 'pending',
      pickup: { address: 'One Town, Vijayawada', lat: 16.5142, lng: 80.6220 },
      dropoff: { address: 'Vijayawada Railway Station', lat: 16.5162, lng: 80.6202 },
      vehicleType: 'tempo',
      distanceKm: 5.2,
      estimatedFare: transportFare('tempo', 5.2).total,
      finalFare: 0,
      fareBreakdown: transportFare('tempo', 5.2),
      paymentStatus: 'pending'
    },
    // 0015: transport, pending — Irfan, no provider
    {
      bookingId: 'FY-2025-0015', customerId: c3._id,
      bookingType: 'transport', status: 'pending',
      pickup: { address: 'Auto Nagar, Vijayawada', lat: 16.5042, lng: 80.6380 },
      dropoff: { address: 'Benz Circle, Vijayawada', lat: 16.5162, lng: 80.6302 },
      vehicleType: 'mini_truck',
      distanceKm: 6.8,
      estimatedFare: transportFare('mini_truck', 6.8).total,
      finalFare: 0,
      fareBreakdown: transportFare('mini_truck', 6.8),
      paymentStatus: 'pending'
    },
    // 0016: transport, cancelled — Arjun
    {
      bookingId: 'FY-2025-0016', customerId: c1._id,
      bookingType: 'transport', status: 'cancelled',
      pickup: { address: 'MG Road, Vijayawada', lat: 16.5082, lng: 80.6480 },
      dropoff: { address: 'Patamata, Vijayawada', lat: 16.5002, lng: 80.6580 },
      vehicleType: 'truck_407',
      distanceKm: 10.0,
      estimatedFare: transportFare('truck_407', 10.0).total,
      finalFare: 0,
      fareBreakdown: transportFare('truck_407', 10.0),
      paymentStatus: 'pending'
    }
  ]

  const bookings = await Booking.insertMany(bookingsData)
  console.log('Bookings created:', bookings.length)

  // Convenience refs
  const b = {}
  bookings.forEach(bk => { b[bk.bookingId] = bk })

  // ============ PAYMENTS ============
  const paidBookingIds = ['FY-2025-0001','FY-2025-0002','FY-2025-0003','FY-2025-0004','FY-2025-0005','FY-2025-0006']

  const payments = await Payment.insertMany(paidBookingIds.map((id, i) => ({
    bookingId: b[id]._id,
    customerId: b[id].customerId,
    providerId: b[id].providerId,
    amount: b[id].finalFare,
    currency: 'INR',
    razorpayOrderId: `order_mock_fyro_${i + 1}`,
    razorpayPaymentId: `pay_mock_fyro_${i + 1}`,
    razorpaySignature: `sig_mock_fyro_${i + 1}`,
    status: 'captured'
  })))

  console.log('Payments created:', payments.length)

  // ============ COMPLAINTS ============
  const complaints = await Complaint.insertMany([
    {
      complaintId: 'CMP-2025-0001',
      bookingId: b['FY-2025-0003']._id,
      raisedBy: c3._id,
      againstUser: d3._id,
      category: 'behaviour',
      description: 'Driver was rude and handled goods carelessly',
      status: 'open'
    },
    {
      complaintId: 'CMP-2025-0002',
      bookingId: b['FY-2025-0005']._id,
      raisedBy: c2._id,
      againstUser: h1._id,
      category: 'overcharging',
      description: 'Charged more than the agreed fare',
      status: 'open'
    },
    {
      complaintId: 'CMP-2025-0003',
      bookingId: b['FY-2025-0004']._id,
      raisedBy: c3._id,
      againstUser: d4._id,
      category: 'goods_damage',
      description: 'Box was damaged during transport',
      adminNote: 'Compensation offered and accepted',
      status: 'resolved',
      resolvedAt: new Date()
    }
  ])

  console.log('Complaints created:', complaints.length)

  // ============ MESSAGES ============
  // For bookings 0009, 0010, 0011 (in_progress) and 0001, 0005 (completed)
  const messageSets = [
    { booking: b['FY-2025-0009'], customer: c3._id, provider: d2._id },
    { booking: b['FY-2025-0010'], customer: c1._id, provider: d3._id },
    { booking: b['FY-2025-0011'], customer: c2._id, provider: h3._id },
    { booking: b['FY-2025-0001'], customer: c1._id, provider: d1._id },
    { booking: b['FY-2025-0005'], customer: c2._id, provider: h1._id },
  ]

  const allMessages = []
  const t = (minutesAgo) => new Date(now - minutesAgo * 60000)

  messageSets.forEach(({ booking, customer, provider }) => {
    allMessages.push(
      { bookingId: booking._id, senderId: null,     content: 'Booking accepted by provider', type: 'system', createdAt: t(60) },
      { bookingId: booking._id, senderId: customer, content: 'Hello, where are you now?', type: 'text', createdAt: t(55) },
      { bookingId: booking._id, senderId: provider, content: "I'm on my way, 5 minutes", type: 'text', createdAt: t(52) },
      { bookingId: booking._id, senderId: customer, content: 'Please be careful with the boxes', type: 'text', createdAt: t(48) },
      { bookingId: booking._id, senderId: provider, content: 'Sure, I will handle them carefully', type: 'text', createdAt: t(44) },
      { bookingId: booking._id, senderId: provider, content: 'I have arrived at pickup location', type: 'text', createdAt: t(40) }
    )
  })

  // Fix system messages — senderId required by schema, use admin for system
  const cleanMessages = allMessages.map(m => ({
    ...m,
    senderId: m.senderId || admin._id
  }))

  const messages = await Message.insertMany(cleanMessages)
  console.log('Messages created:', messages.length)

  console.log('\nSeed completed successfully')
  await mongoose.connection.close()
  process.exit(0)
}

seed().catch(err => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
