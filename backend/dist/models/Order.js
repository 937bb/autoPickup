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
// 订单模式
const OrderSchema = new mongoose_1.Schema({
    orderNumber: {
        type: String,
        required: [true, '订单号是必需的'],
        unique: true,
        uppercase: true
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
        type: mongoose_1.Schema.Types.Mixed
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
OrderSchema.pre('save', async function (next) {
    if (!this.orderNumber) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        this.orderNumber = `AP${timestamp}${random}`;
    }
    next();
});
exports.default = mongoose_1.default.model('Order', OrderSchema);
//# sourceMappingURL=Order.js.map