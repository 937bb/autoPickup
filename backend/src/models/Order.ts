import mongoose, { Document, Schema } from 'mongoose';

// 订单接口
export interface IOrder extends Document {
  orderNumber: string;
  productId: mongoose.Types.ObjectId;
  merchantId: mongoose.Types.ObjectId;
  pickupKey: string;
  quantity: number;
  totalAmount: number;
  status: 'pending' | 'delivered' | 'expired' | 'cancelled';
  deliveryData?: any;
  customerInfo?: {
    email?: string;
    phone?: string;
    note?: string;
  };
  pickedUpAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 订单模式
const OrderSchema: Schema = new Schema({
  orderNumber: {
    type: String,
    required: [true, '订单号是必需的'],
    unique: true,
    uppercase: true
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
  pickupKey: {
    type: String,
    required: [true, '提货密钥是必需的'],
    unique: true,
    minlength: [8, '提货密钥至少8个字符']
  },
  quantity: {
    type: Number,
    required: [true, '数量是必需的'],
    min: [1, '数量至少为1'],
    default: 1
  },
  totalAmount: {
    type: Number,
    required: [true, '总金额是必需的'],
    min: [0, '总金额不能为负数']
  },
  status: {
    type: String,
    enum: ['pending', 'delivered', 'expired', 'cancelled'],
    default: 'pending'
  },
  deliveryData: {
    type: Schema.Types.Mixed
  },
  customerInfo: {
    email: String,
    phone: String,
    note: String
  },
  pickedUpAt: Date,
  expiresAt: {
    type: Date,
    required: [true, '过期时间是必需的']
  }
}, {
  timestamps: true
});

// 生成订单号
OrderSchema.pre<IOrder>('save', async function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.orderNumber = `AP${timestamp}${random}`;
  }
  next();
});

export default mongoose.model<IOrder>('Order', OrderSchema);