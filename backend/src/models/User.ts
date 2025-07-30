import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// 用户接口
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'merchant' | 'customer';
  isActive: boolean;
  merchantInfo?: {
    companyName: string;
    contactPerson: string;
    phone: string;
    address: string;
    businessLicense?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// 用户模式
const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: [true, '用户名是必需的'],
    unique: true,
    trim: true,
    minlength: [3, '用户名至少3个字符'],
    maxlength: [20, '用户名最多20个字符']
  },
  email: {
    type: String,
    required: [true, '邮箱是必需的'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '密码是必需的'],
    minlength: [6, '密码至少6个字符']
  },
  role: {
    type: String,
    enum: ['admin', 'merchant', 'customer'],
    default: 'customer'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  merchantInfo: {
    companyName: String,
    contactPerson: String,
    phone: String,
    address: String,
    businessLicense: String
  }
}, {
  timestamps: true
});

// 密码加密中间件
UserSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// 密码比较方法
// 在User schema中添加调试
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  console.log('🔐 比较密码...');
  try {
    const result = await bcrypt.compare(candidatePassword, this.password);
    console.log('密码比较结果:', result);
    return result;
  } catch (error) {
    console.error('密码比较错误:', error);
    return false;
  }
};

export default mongoose.model<IUser>('User', UserSchema);