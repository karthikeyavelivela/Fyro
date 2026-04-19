import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  bookingId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content?: string;
  type: 'text' | 'system' | 'image' | 'location';
  mediaUrl?: string;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: String,
  type: { type: String, enum: ['text', 'system', 'image', 'location'], default: 'text' },
  mediaUrl: String,
  readAt: Date
}, { timestamps: true });

export default mongoose.model<IMessage>('Message', MessageSchema);
