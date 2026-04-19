import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  bookingId?: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  providerId?: mongoose.Types.ObjectId;
  amount: number;
  currency: 'INR';
  type: 'booking' | 'refund' | 'referral' | 'wallet_topup';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: 'created' | 'captured' | 'failed' | 'refunded';
  invoiceNumber?: string;
  invoiceUrl?: string;
  receiptData?: any;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  providerId: { type: Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  type: { type: String, enum: ['booking', 'refund', 'referral', 'wallet_topup'], required: true },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  status: { type: String, enum: ['created', 'captured', 'failed', 'refunded'], required: true },
  invoiceNumber: { type: String, unique: true, sparse: true },
  invoiceUrl: String,
  receiptData: Schema.Types.Mixed
}, { timestamps: true });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
