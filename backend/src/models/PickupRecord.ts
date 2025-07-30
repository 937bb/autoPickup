import mongoose, { Document, Schema } from 'mongoose';

// 提货记录接口
export interface IPickupRecord extends Document {
  pickupCodeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// 提货记录模式
const PickupRecordSchema: Schema = new Schema({
  pickupCodeId: {
    type: Schema.Types.ObjectId,
    ref: 'PickupCode',
    required: [true, '提货码ID是必需的']
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '用户ID是必需的']
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, '产品ID是必需的']
  },
  merchantId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '商户ID是必需的']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// 索引
PickupRecordSchema.index({ userId: 1 });
PickupRecordSchema.index({ pickupCodeId: 1 });
PickupRecordSchema.index({ productId: 1 });
PickupRecordSchema.index({ merchantId: 1 });
PickupRecordSchema.index({ createdAt: -1 });

// 复合索引：防止同一用户重复使用同一提货码
PickupRecordSchema.index({ pickupCodeId: 1, userId: 1 }, { unique: true });

export default mongoose.model<IPickupRecord>('PickupRecord', PickupRecordSchema);