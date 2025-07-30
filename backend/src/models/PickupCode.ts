import mongoose, { Document, Schema, Model } from 'mongoose';

// 提货码接口
export interface IPickupCode extends Document {
  code: string;
  productId: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // 虚拟属性
  isExpired: boolean;
  isAvailable: boolean;
}

// 静态方法接口
export interface IPickupCodeModel extends Model<IPickupCode> {
  generateCode(): string;
  createWithCode(data: {
    productId: mongoose.Types.ObjectId;
    merchantId: mongoose.Types.ObjectId;
    usageLimit?: number;
    expiresInDays?: number;
  }): Promise<IPickupCode>;
}

// 提货码模式
const PickupCodeSchema: Schema = new Schema({
  code: {
    type: String,
    required: [true, '提货码是必需的'],
    unique: true,
    trim: true,
    uppercase: true,
    minlength: [6, '提货码至少6位'],
    maxlength: [20, '提货码最多20位']
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
  isActive: {
    type: Boolean,
    default: true
  },
  usageLimit: {
    type: Number,
    min: [1, '使用次数限制必须大于0'],
    default: null
  },
  usedCount: {
    type: Number,
    default: 0,
    min: [0, '使用次数不能为负数']
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// 索引
PickupCodeSchema.index({ code: 1 });
PickupCodeSchema.index({ productId: 1 });
PickupCodeSchema.index({ merchantId: 1 });
PickupCodeSchema.index({ expiresAt: 1 });

// 虚拟字段：是否已过期
PickupCodeSchema.virtual('isExpired').get(function(this: IPickupCode) {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// 虚拟字段：是否可用
PickupCodeSchema.virtual('isAvailable').get(function(this: IPickupCode) {
  if (!this.isActive) return false;
  if (this.isExpired) return false;
  if (this.usageLimit && this.usedCount >= this.usageLimit) return false;
  return true;
});

// 确保虚拟字段被序列化
PickupCodeSchema.set('toJSON', { virtuals: true });
PickupCodeSchema.set('toObject', { virtuals: true });

// 静态方法：生成随机提货码
PickupCodeSchema.statics.generateCode = function(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// 静态方法：创建带提货码的实例
PickupCodeSchema.statics.createWithCode = async function(data: {
  productId: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  usageLimit?: number;
  expiresInDays?: number;
}): Promise<IPickupCode> {
  // 修复：通过 this 调用静态方法，并进行正确的类型转换
  const PickupCodeModel = this as IPickupCodeModel;
  const code = PickupCodeModel.generateCode();
  
  // 计算过期时间
  let expiresAt: Date | undefined;
  if (data.expiresInDays && data.expiresInDays > 0) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);
  }
  
  const pickupCode = new this({
    code,
    productId: data.productId,
    merchantId: data.merchantId,
    usageLimit: data.usageLimit,
    expiresAt
  });
  
  return await pickupCode.save();
};

export default mongoose.model<IPickupCode, IPickupCodeModel>('PickupCode', PickupCodeSchema);