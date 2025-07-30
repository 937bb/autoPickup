import mongoose, { Document, Schema } from 'mongoose';

// 发货模板字段接口
export interface ITemplateField {
  name: string;           // 字段名称
  label: string;          // 字段标签
  type: 'text' | 'url' | 'password' | 'file' | 'textarea' | 'number';
  required: boolean;      // 是否必填
  placeholder?: string;   // 占位符
  validation?: {          // 验证规则
    pattern?: string;     // 正则表达式
    minLength?: number;   // 最小长度
    maxLength?: number;   // 最大长度
    min?: number;         // 最小值
    max?: number;         // 最大值
  };
  defaultValue?: string;  // 默认值
  options?: string[];     // 选项（用于select类型）
}

// 发货模板接口
export interface IDeliveryTemplate extends Document {
  templateCode: string;   // 模板代码
  templateName: string;   // 模板名称
  deliveryType: string;   // 发货类型
  fields: ITemplateField[]; // 模板字段
  description?: string;   // 描述
  isActive: boolean;      // 是否启用
  isDefault: boolean;     // 是否默认模板
  createdAt: Date;
  updatedAt: Date;
}

// 发货模板模式
const DeliveryTemplateSchema: Schema = new Schema({
  templateCode: {
    type: String,
    required: [true, '模板代码是必需的'],
    unique: true,
    trim: true,
    maxlength: [50, '模板代码最多50个字符']
  },
  templateName: {
    type: String,
    required: [true, '模板名称是必需的'],
    trim: true,
    maxlength: [100, '模板名称最多100个字符']
  },
  deliveryType: {
    type: String,
    required: [true, '发货类型是必需的'],
    trim: true
  },
  fields: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    label: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['text', 'url', 'password', 'file', 'textarea', 'number'],
      required: true
    },
    required: {
      type: Boolean,
      default: true
    },
    placeholder: {
      type: String,
      trim: true
    },
    validation: {
      pattern: String,
      minLength: Number,
      maxLength: Number,
      min: Number,
      max: Number
    },
    defaultValue: {
      type: String,
      trim: true
    },
    options: [String]
  }],
  description: {
    type: String,
    trim: true,
    maxlength: [500, '描述最多500个字符']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// 索引
DeliveryTemplateSchema.index({ templateCode: 1 });
DeliveryTemplateSchema.index({ deliveryType: 1 });
DeliveryTemplateSchema.index({ isActive: 1 });
DeliveryTemplateSchema.index({ isDefault: 1 });

export default mongoose.model<IDeliveryTemplate>('DeliveryTemplate', DeliveryTemplateSchema);