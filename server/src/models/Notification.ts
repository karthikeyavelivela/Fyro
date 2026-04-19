import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'booking' | 'payment' | 'complaint' | 'promo' | 'system';
  title: string;
  body: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['booking', 'payment', 'complaint', 'promo', 'system'], required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  data: Schema.Types.Mixed,
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<INotification>('Notification', NotificationSchema);
