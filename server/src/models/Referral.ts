import mongoose, { Document, Schema } from 'mongoose';

export interface IReferral extends Document {
  referrerId: mongoose.Types.ObjectId;
  refereeId: mongoose.Types.ObjectId;
  code: string;
  status: 'pending' | 'completed';
  rewardAmount: number;
  rewardPaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralSchema = new Schema<IReferral>({
  referrerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  refereeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  code: { type: String, required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  rewardAmount: { type: Number, default: 50 },
  rewardPaid: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model<IReferral>('Referral', ReferralSchema);
