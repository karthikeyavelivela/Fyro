import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email?: string;
  phone: string;
  passwordHash: string;
  role: 'customer' | 'driver' | 'hamali' | 'admin';
  profilePhoto?: string;
  language: 'en' | 'hi' | 'te';
  isVerified: boolean;
  isKYCApproved: boolean;
  rating: number;
  totalRatings: number;
  isActive: boolean;
  fcmToken?: string;
  referralCode: string;
  referredBy?: mongoose.Types.ObjectId;
  referralEarnings: number;
  walletBalance: number;
  savedAddresses: Array<{
    label: string;
    address: string;
    lat: number;
    lng: number;
    isDefault: boolean;
  }>;
  emergencyContact?: {
    name: string;
    phone: string;
  };
  preferences: {
    notifications: {
      bookingUpdates: boolean;
      promotions: boolean;
      chat: boolean;
    };
    defaultVehicleType?: string;
    defaultPaymentMethod?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['customer', 'driver', 'hamali', 'admin'], required: true },
  profilePhoto: { type: String },
  language: { type: String, enum: ['en', 'hi', 'te'], default: 'en' },
  isVerified: { type: Boolean, default: false },
  isKYCApproved: { type: Boolean, default: false },
  rating: { type: Number, default: 5.0 },
  totalRatings: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  fcmToken: { type: String },
  referralCode: { type: String, required: true, unique: true },
  referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
  referralEarnings: { type: Number, default: 0 },
  walletBalance: { type: Number, default: 0 },
  savedAddresses: [{
    label: String,
    address: String,
    lat: Number,
    lng: Number,
    isDefault: { type: Boolean, default: false }
  }],
  emergencyContact: {
    name: String,
    phone: String
  },
  preferences: {
    notifications: {
      bookingUpdates: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
      chat: { type: Boolean, default: true }
    },
    defaultVehicleType: String,
    defaultPaymentMethod: String
  }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
