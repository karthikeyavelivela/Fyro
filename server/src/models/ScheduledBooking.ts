import mongoose, { Document, Schema } from 'mongoose';

export interface IScheduledBooking extends Document {
  customerId: mongoose.Types.ObjectId;
  bookingData: any;
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  recurringDays?: number[];
  nextRunAt: Date;
  lastRunAt?: Date;
  isActive: boolean;
  totalExecutions: number;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledBookingSchema = new Schema<IScheduledBooking>({
  customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  bookingData: { type: Schema.Types.Mixed, required: true },
  isRecurring: { type: Boolean, default: false },
  recurringPattern: { type: String, enum: ['daily', 'weekly', 'monthly'] },
  recurringDays: [Number],
  nextRunAt: { type: Date, required: true },
  lastRunAt: Date,
  isActive: { type: Boolean, default: true },
  totalExecutions: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model<IScheduledBooking>('ScheduledBooking', ScheduledBookingSchema);
