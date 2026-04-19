import mongoose, { Document, Schema } from 'mongoose';

export interface IComplaint extends Document {
  complaintId: string;
  bookingId: mongoose.Types.ObjectId;
  raisedBy: mongoose.Types.ObjectId;
  againstUser?: mongoose.Types.ObjectId;
  category: 'overcharging' | 'no_show' | 'behaviour' | 'goods_damage' | 'payment_issue' | 'other';
  description: string;
  status: 'open' | 'under_review' | 'resolved' | 'rejected';
  adminNote?: string;
  attachments: string[];
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>({
  complaintId: { type: String, required: true, unique: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  raisedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  againstUser: { type: Schema.Types.ObjectId, ref: 'User' },
  category: { 
    type: String, 
    enum: ['overcharging', 'no_show', 'behaviour', 'goods_damage', 'payment_issue', 'other'],
    required: true
  },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['open', 'under_review', 'resolved', 'rejected'],
    default: 'open'
  },
  adminNote: String,
  attachments: [String],
  resolvedAt: Date
}, { timestamps: true });

export default mongoose.model<IComplaint>('Complaint', ComplaintSchema);
