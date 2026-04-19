import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User';
import Vehicle from './models/Vehicle';
import HamaliProfile from './models/HamaliProfile';
import Booking from './models/Booking';
import Payment from './models/Payment';
import Complaint from './models/Complaint';
import Message from './models/Message';
import Notification from './models/Notification';
import logger from './utils/logger';

dotenv.config();

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fyro');
};

const runSeed = async () => {
  try {
    await connectDB();
    logger.info('Connected to DB. Clearing collections...');

    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await HamaliProfile.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});
    await Complaint.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});

    logger.info('Collections cleared. Seeding users...');

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash('Test@1234', salt);

    // Users
    const admin = await User.create({
      name: 'FYRO Admin', email: 'admin@fyro.com', phone: '9000000000',
      passwordHash: await bcrypt.hash('Admin@1234', salt), role: 'admin',
      isVerified: true, isKYCApproved: true, referralCode: 'FYRO-ADMIN'
    });

    const c1 = await User.create({ name: 'Arjun Reddy', email: 'customer1@fyro.com', phone: '9876543210', passwordHash, role: 'customer', isVerified: true, isKYCApproved: true, referralCode: 'FYRO-C1' });
    const c2 = await User.create({ name: 'Priya Sharma', email: 'customer2@fyro.com', phone: '9876543211', passwordHash, role: 'customer', isVerified: true, isKYCApproved: true, referralCode: 'FYRO-C2' });
    const c3 = await User.create({ name: 'Mohammed Irfan', email: 'customer3@fyro.com', phone: '9876543212', passwordHash, role: 'customer', isVerified: true, isKYCApproved: true, referralCode: 'FYRO-C3' });

    const d1 = await User.create({ name: 'Ravi Kumar', email: 'driver1@fyro.com', phone: '9876543213', passwordHash, role: 'driver', isVerified: true, isKYCApproved: true, referralCode: 'FYRO-D1' });
    const d2 = await User.create({ name: 'Suresh Babu', email: 'driver2@fyro.com', phone: '9876543214', passwordHash, role: 'driver', isVerified: true, isKYCApproved: true, referralCode: 'FYRO-D2' });
    const d3 = await User.create({ name: 'Venkat Rao', email: 'driver3@fyro.com', phone: '9876543215', passwordHash, role: 'driver', isVerified: true, isKYCApproved: true, referralCode: 'FYRO-D3' });

    const h1 = await User.create({ name: 'Ramesh Kumar', email: 'hamali1@fyro.com', phone: '9876543216', passwordHash, role: 'hamali', isVerified: true, isKYCApproved: true, referralCode: 'FYRO-H1' });
    const h2 = await User.create({ name: 'Mahesh Team', email: 'hamali2@fyro.com', phone: '9876543217', passwordHash, role: 'hamali', isVerified: true, isKYCApproved: true, referralCode: 'FYRO-H2' });

    logger.info('Seeding vehicles and hamali profiles...');

    await Vehicle.create([
      { driverId: d1._id, type: 'mini_truck', registrationNumber: 'AP39AB1234', capacityTons: 1, isAvailable: true, isVerified: true, currentLocation: { type: 'Point', coordinates: [80.652, 16.508] } },
      { driverId: d2._id, type: 'tempo', registrationNumber: 'AP39CD5678', capacityTons: 2.5, isAvailable: true, isVerified: true, currentLocation: { type: 'Point', coordinates: [80.645, 16.502] } },
      { driverId: d3._id, type: 'truck_407', registrationNumber: 'AP39EF9012', capacityTons: 4, isAvailable: true, isVerified: true, currentLocation: { type: 'Point', coordinates: [80.658, 16.514] } }
    ]);

    await HamaliProfile.create([
      { workerId: h1._id, teamSize: 1, ratePerJob: 220, ratePerHour: 70, isAvailable: true, isVerified: true, currentLocation: { type: 'Point', coordinates: [80.648, 16.506] }, area: 'Governorpet' },
      { workerId: h2._id, teamSize: 3, ratePerJob: 380, ratePerHour: 130, isAvailable: true, isVerified: true, currentLocation: { type: 'Point', coordinates: [80.652, 16.510] }, area: 'Auto Nagar' }
    ]);

    logger.info('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding DB', error);
    process.exit(1);
  }
};

runSeed();
