import mongoose, { Document, Schema } from 'mongoose';

// 字典项接口
export interface IDictionaryItem extends Document {
  code: string;           // 字典项代码
  name: string;           // 字典项名称
  value: string;          // 字典项值
  description?: string;   // 描述
  sort: number;          // 排序
  isActive: boolean;     // 是否启用
  parentCode?: string;   // 父级代码（用于层级字典）
  extra?: any;           // 扩展字段
  createdAt: Date;
  updatedAt: Date;
}

// 字典类型接口
export interface IDictionaryType extends Document {
  typeCode: string;      // 字典类型代码
  typeName: string;      // 字典类型名称
  description?: string;  // 描述
  isActive: boolean;     // 是否启用
  createdAt: Date;
  updatedAt: Date;
}

// 字典项模式
const DictionaryItemSchema: Schema = new Schema({
  code: {
    type: String,
    required: [true, '字典项代码是必需的'],
    trim: true,
    maxlength: [50, '字典项代码最多50个字符']
  },
  name: {
    type: String,
    required: [true, '字典项名称是必需的'],
    trim: true,
    maxlength: [100, '字典项名称最多100个字符']
  },
  value: {
    type: String,
    required: [true, '字典项值是必需的'],
    trim: true,
    maxlength: [200, '字典项值最多200个字符']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, '描述最多500个字符']
  },
  sort: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  parentCode: {
    type: String,
    trim: true
  },
  extra: {
    type: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// 字典类型模式
const DictionaryTypeSchema: Schema = new Schema({
  typeCode: {
    type: String,
    required: [true, '字典类型代码是必需的'],
    unique: true,
    trim: true,
    maxlength: [50, '字典类型代码最多50个字符']
  },
  typeName: {
    type: String,
    required: [true, '字典类型名称是必需的'],
    trim: true,
    maxlength: [100, '字典类型名称最多100个字符']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, '描述最多500个字符']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// 索引
DictionaryItemSchema.index({ code: 1 });
DictionaryItemSchema.index({ parentCode: 1 });
DictionaryItemSchema.index({ isActive: 1 });
DictionaryItemSchema.index({ sort: 1 });

// typeCode已经有unique: true，会自动创建索引，不需要手动创建
DictionaryTypeSchema.index({ isActive: 1 });

export const DictionaryItem = mongoose.model<IDictionaryItem>('DictionaryItem', DictionaryItemSchema);
export const DictionaryType = mongoose.model<IDictionaryType>('DictionaryType', DictionaryTypeSchema);