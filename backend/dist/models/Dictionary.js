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
exports.DictionaryType = exports.DictionaryItem = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// 字典项模式
const DictionaryItemSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.Mixed
    }
}, {
    timestamps: true
});
// 字典类型模式
const DictionaryTypeSchema = new mongoose_1.Schema({
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
exports.DictionaryItem = mongoose_1.default.model('DictionaryItem', DictionaryItemSchema);
exports.DictionaryType = mongoose_1.default.model('DictionaryType', DictionaryTypeSchema);
//# sourceMappingURL=Dictionary.js.map