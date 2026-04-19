import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  bookingId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  revieweeId: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  type: 'customer_to_provider' | 'provider_to_customer';
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  revieweeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true },
  comment: String,
  type: { type: String, enum: ['customer_to_provider', 'provider_to_customer'], required: true }
}, { timestamps: true });

export default mongoose.model<IReview>('Review', ReviewSchema);
