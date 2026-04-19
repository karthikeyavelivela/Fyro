import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  bookingId: string;
  customerId: mongoose.Types.ObjectId;
  providerId?: mongoose.Types.ObjectId;
  bookingType: 'transport' | 'hamali';
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  pickup: {
    address: string;
    lat: number;
    lng: number;
    landmark?: string;
  };
  dropoff?: {
    address: string;
    lat: number;
    lng: number;
    landmark?: string;
  };
  vehicleId?: mongoose.Types.ObjectId;
  vehicleType?: string;
  hamaliDetails?: {
    type: 'loading' | 'unloading' | 'both';
    estimatedHours?: number;
    goodsDescription?: string;
    floorNumber: number;
    heavyGoods: boolean;
    teamSize: number;
  };
  scheduledAt?: Date;
  acceptedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  isScheduled: boolean;
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  recurringDays?: number[];
  distanceKm?: number;
  estimatedFare: number;
  finalFare?: number;
  counterOffer?: number;
  counterOfferedBy?: mongoose.Types.ObjectId;
  counterOfferAccepted?: boolean;
  fareBreakdown?: {
    baseFare: number;
    distanceFare: number;
    hourlyFare: number;
    floorSurcharge: number;
    heavySurcharge: number;
    returnLoadDiscount: number;
    subtotal: number;
    gst: number;
    total: number;
  };
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'razorpay' | 'wallet' | 'cash';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: Date;
  otp?: string;
  otpVerified: boolean;
  customerRating?: number;
  providerRating?: number;
  customerReview?: string;
  providerReview?: string;
  hasComplaint: boolean;
  cancelReason?: string;
  cancelledBy?: mongoose.Types.ObjectId;
  proofOfDelivery: string[];
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>({
  bookingId: { type: String, required: true, unique: true },
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  providerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  bookingType: { type: String, enum: ['transport', 'hamali'], required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  pickup: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    landmark: String
  },
  dropoff: {
    address: String,
    lat: Number,
    lng: Number,
    landmark: String
  },
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
  vehicleType: String,
  hamaliDetails: {
    type: { type: String, enum: ['loading', 'unloading', 'both'] },
    estimatedHours: Number,
    goodsDescription: String,
    floorNumber: { type: Number, default: 0 },
    heavyGoods: { type: Boolean, default: false },
    teamSize: Number
  },
  scheduledAt: Date,
  acceptedAt: Date,
  startedAt: Date,
  completedAt: Date,
  isScheduled: { type: Boolean, default: false },
  isRecurring: { type: Boolean, default: false },
  recurringPattern: { type: String, enum: ['daily', 'weekly', 'monthly'] },
  recurringDays: [Number],
  distanceKm: Number,
  estimatedFare: { type: Number, required: true },
  finalFare: Number,
  counterOffer: Number,
  counterOfferedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  counterOfferAccepted: Boolean,
  fareBreakdown: {
    baseFare: { type: Number, default: 0 },
    distanceFare: { type: Number, default: 0 },
    hourlyFare: { type: Number, default: 0 },
    floorSurcharge: { type: Number, default: 0 },
    heavySurcharge: { type: Number, default: 0 },
    returnLoadDiscount: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentMethod: { type: String, enum: ['razorpay', 'wallet', 'cash'], default: 'razorpay' },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  paidAt: Date,
  otp: String,
  otpVerified: { type: Boolean, default: false },
  customerRating: Number,
  providerRating: Number,
  customerReview: String,
  providerReview: String,
  hasComplaint: { type: Boolean, default: false },
  cancelReason: String,
  cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  proofOfDelivery: [String]
}, { timestamps: true });

export default mongoose.model<IBooking>('Booking', BookingSchema);
