import mongoose, { Document, Schema } from 'mongoose';

// 产品接口
export interface IProduct extends Document {
  name: string;
  description: string;
  categoryCode: string;        // 使用字典代码
  deliveryTypeCode: string;    // 使用字典代码
  price: number;
  stock: number;
  merchantId: mongoose.Types.ObjectId;
  isActive: boolean;
  images: string[];
  tags: string[];
  sales: number;
  deliveryTemplateCode?: string; // 使用模板代码
  deliveryData?: any;          // 发货数据
  createdAt: Date;
  updatedAt: Date;
}

// 产品模式
const ProductSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, '产品名称是必需的'],
    trim: true,
    maxlength: [100, '产品名称最多100个字符']
  },
  description: {
    type: String,
    required: [true, '产品描述是必需的'],
    maxlength: [1000, '产品描述最多1000个字符']
  },
  categoryCode: {
    type: String,
    required: [true, '产品分类是必需的'],
    trim: true
  },
  deliveryTypeCode: {
    type: String,
    required: [true, '发货类型是必需的'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, '价格是必需的'],
    min: [0, '价格不能为负数']
  },
  stock: {
    type: Number,
    required: [true, '库存是必需的'],
    min: [0, '库存不能为负数'],
    default: 0
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
  images: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: [20, '标签最多20个字符']
  }],
  sales: {
    type: Number,
    default: 0,
    min: [0, '销量不能为负数']
  },
  deliveryTemplateCode: {
    type: String,
    trim: true
  },
  deliveryData: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// 索引
ProductSchema.index({ merchantId: 1 });
ProductSchema.index({ categoryCode: 1 });
ProductSchema.index({ deliveryTypeCode: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ name: 'text', description: 'text' });

// 在ProductSchema中添加虚拟字段
ProductSchema.virtual('status').get(function() {
  return this.isActive ? 'active' : 'inactive';
});

// 确保虚拟字段在JSON序列化时包含
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

export default mongoose.model<IProduct>('Product', ProductSchema);