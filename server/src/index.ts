import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/db';
import logger from './utils/logger';
const errorHandler = require('./middleware/errorHandler.js');
import './models/User';
import './models/Vehicle';
import './models/HamaliProfile';
import './models/Booking';
import './models/Payment';
import './models/Complaint';
import './models/Message';
import './models/ScheduledBooking';
import './models/Referral';
import './models/Notification';
import './models/Review';

// The live route implementations currently exist in the .js files.
// The .ts route files are partial stubs and break the runtime when ts-node
// prefers TS extensions, so mount the working routers explicitly here.
const authRouter = require('./routes/auth.js');
const adminRouter = require('./routes/admin.js');
const bookingsRouter = require('./routes/bookings.js');
const driverRouter = require('./routes/driver.js');
const hamaliRouter = require('./routes/hamali.js');
const paymentRouter = require('./routes/payments.js');
const complaintRouter = require('./routes/complaints.js');
const profileRouter = require('./routes/profile.js');
const vehiclesRouter = require('./routes/vehicles.js');
const customerRouter = require('./routes/customer.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.set('io', io);

// Mount routes in order specified
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/driver', driverRouter);
app.use('/api/hamali', hamaliRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/complaints', complaintRouter);
app.use('/api/profile', profileRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api', customerRouter);

// Error Handler MUST be last
app.use(errorHandler);

// Socket.io logic
import setupSocket from './socket';
setupSocket(io);

// Connect DB and start server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
});
