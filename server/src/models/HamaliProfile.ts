import mongoose, { Document, Schema } from 'mongoose';

export interface IHamaliProfile extends Document {
  workerId: mongoose.Types.ObjectId;
  teamSize: number;
  ratePerJob: number;
  ratePerHour: number;
  skills: string[];
  city?: string;
  area?: string;
  currentLocation: {
    type: string;
    coordinates: number[];
  };
  isAvailable: boolean;
  isVerified: boolean;
  totalJobsDone: number;
  aadhaarNumber?: string;
  aadhaarPhoto?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HamaliProfileSchema = new Schema<IHamaliProfile>({
  workerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  teamSize: { type: Number, default: 1 },
  ratePerJob: { type: Number, default: 0 },
  ratePerHour: { type: Number, default: 0 },
  skills: [{ type: String }],
  city: { type: String },
  area: { type: String },
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  isAvailable: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  totalJobsDone: { type: Number, default: 0 },
  aadhaarNumber: { type: String },
  aadhaarPhoto: { type: String }
}, { timestamps: true });

HamaliProfileSchema.index({ currentLocation: '2dsphere' });

export default mongoose.model<IHamaliProfile>('HamaliProfile', HamaliProfileSchema);
