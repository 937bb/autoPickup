"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// 提货码模式
const PickupCodeSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, '产品ID是必需的']
    },
    merchantId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
    },
    deletedAt: {
        type: Date,
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
// 索引
// code已经有unique: true，会自动创建索引，不需要手动创建
PickupCodeSchema.index({ productId: 1 });
PickupCodeSchema.index({ merchantId: 1 });
PickupCodeSchema.index({ expiresAt: 1 });
// 虚拟字段：是否已过期
PickupCodeSchema.virtual('isExpired').get(function () {
    if (!this.expiresAt)
        return false;
    return new Date() > this.expiresAt;
});
// 虚拟字段：是否可用
PickupCodeSchema.virtual('isAvailable').get(function () {
    if (!this.isActive)
        return false;
    if (this.isExpired)
        return false;
    if (this.usageLimit && this.usedCount >= this.usageLimit)
        return false;
    return true;
});
// 确保虚拟字段被序列化
PickupCodeSchema.set('toJSON', { virtuals: true });
PickupCodeSchema.set('toObject', { virtuals: true });
// 静态方法：生成随机提货码
PickupCodeSchema.statics.generateCode = function () {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
// 静态方法：创建带提货码的实例
PickupCodeSchema.statics.createWithCode = async function (data) {
    // 修复：通过 this 调用静态方法，并进行正确的类型转换
    const PickupCodeModel = this;
    const code = PickupCodeModel.generateCode();
    // 计算过期时间
    let expiresAt;
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
exports.default = mongoose_1.default.model('PickupCode', PickupCodeSchema);
//# sourceMappingURL=PickupCode.js.map