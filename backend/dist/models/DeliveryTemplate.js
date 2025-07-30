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
// 发货模板模式
const DeliveryTemplateSchema = new mongoose_1.Schema({
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
// templateCode已经有unique: true，会自动创建索引，不需要手动创建
DeliveryTemplateSchema.index({ deliveryType: 1 });
DeliveryTemplateSchema.index({ isActive: 1 });
DeliveryTemplateSchema.index({ isDefault: 1 });
exports.default = mongoose_1.default.model('DeliveryTemplate', DeliveryTemplateSchema);
//# sourceMappingURL=DeliveryTemplate.js.map