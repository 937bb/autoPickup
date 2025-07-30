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
// 提货记录模式
const PickupRecordSchema = new mongoose_1.Schema({
    pickupCodeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'PickupCode',
        required: [true, '提货码ID是必需的']
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, '用户ID是必需的']
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
exports.default = mongoose_1.default.model('PickupRecord', PickupRecordSchema);
//# sourceMappingURL=PickupRecord.js.map