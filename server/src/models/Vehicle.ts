import mongoose, { Document, Schema } from 'mongoose';

export interface IVehicle extends Document {
  driverId: mongoose.Types.ObjectId;
  type: 'mini_truck' | 'tempo' | 'truck_407' | 'truck_1ton' | 'truck_2ton' | 'heavy';
  registrationNumber?: string;
  capacityTons?: number;
  photos: string[];
  isAvailable: boolean;
  currentLocation: {
    type: string;
    coordinates: number[];
  };
  isVerified: boolean;
  insuranceExpiry?: Date;
  pollutionExpiry?: Date;
  totalTrips: number;
  totalEarnings: number;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>({
  driverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { 
    type: String, 
    enum: ['mini_truck', 'tempo', 'truck_407', 'truck_1ton', 'truck_2ton', 'heavy'],
    required: true
  },
  registrationNumber: { type: String, unique: true, sparse: true },
  capacityTons: { type: Number },
  photos: [{ type: String }],
  isAvailable: { type: Boolean, default: false },
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  isVerified: { type: Boolean, default: false },
  insuranceExpiry: { type: Date },
  pollutionExpiry: { type: Date },
  totalTrips: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 }
}, { timestamps: true });

VehicleSchema.index({ currentLocation: '2dsphere' });

export default mongoose.model<IVehicle>('Vehicle', VehicleSchema);
