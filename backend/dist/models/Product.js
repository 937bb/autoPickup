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
// 产品模式
const ProductSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
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
        type: mongoose_1.Schema.Types.Mixed
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
ProductSchema.virtual('status').get(function () {
    return this.isActive ? 'active' : 'inactive';
});
// 确保虚拟字段在JSON序列化时包含
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });
exports.default = mongoose_1.default.model('Product', ProductSchema);
//# sourceMappingURL=Product.js.map