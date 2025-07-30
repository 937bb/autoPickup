"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const Dictionary_1 = require("../models/Dictionary");
const DeliveryTemplate_1 = __importDefault(require("../models/DeliveryTemplate"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// 获取字典类型列表
router.get('/types', async (req, res) => {
    try {
        const types = await Dictionary_1.DictionaryType.find({ isActive: true }).sort({ createdAt: -1 });
        res.json({
            success: true,
            data: types
        });
    }
    catch (error) {
        console.error('获取字典类型失败:', error);
        res.status(500).json({
            success: false,
            message: '获取字典类型失败'
        });
    }
});
// 根据类型代码获取字典项
router.get('/items/:typeCode', [
    (0, express_validator_1.param)('typeCode').notEmpty().withMessage('字典类型代码不能为空')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: '参数验证失败',
                errors: errors.array()
            });
            return;
        }
        const { typeCode } = req.params;
        const { parentCode } = req.query;
        const query = {
            code: new RegExp(`^${typeCode}_`),
            isActive: true
        };
        if (parentCode) {
            query.parentCode = parentCode;
        }
        const items = await Dictionary_1.DictionaryItem.find(query).sort({ sort: 1, createdAt: 1 });
        res.json({
            success: true,
            data: items
        });
    }
    catch (error) {
        console.error('获取字典项失败:', error);
        res.status(500).json({
            success: false,
            message: '获取字典项失败'
        });
    }
});
// 获取发货模板列表
router.get('/delivery-templates', [
    (0, express_validator_1.query)('deliveryType').optional().isString()
], async (req, res) => {
    try {
        const { deliveryType } = req.query;
        const query = { isActive: true };
        if (deliveryType) {
            query.deliveryType = deliveryType;
        }
        const templates = await DeliveryTemplate_1.default.find(query).sort({ isDefault: -1, createdAt: -1 });
        res.json({
            success: true,
            data: templates
        });
    }
    catch (error) {
        console.error('获取发货模板失败:', error);
        res.status(500).json({
            success: false,
            message: '获取发货模板失败'
        });
    }
});
// 管理员接口 - 创建字典类型
router.post('/admin/types', [
    auth_1.authMiddleware,
    (0, express_validator_1.body)('typeCode').notEmpty().withMessage('字典类型代码不能为空'),
    (0, express_validator_1.body)('typeName').notEmpty().withMessage('字典类型名称不能为空')
], async (req, res) => {
    try {
        // 检查权限
        if (req.user?.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: '权限不足'
            });
            return;
        }
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: '参数验证失败',
                errors: errors.array()
            });
            return;
        }
        const { typeCode, typeName, description } = req.body;
        // 检查类型代码是否已存在
        const existingType = await Dictionary_1.DictionaryType.findOne({ typeCode });
        if (existingType) {
            res.status(400).json({
                success: false,
                message: '字典类型代码已存在'
            });
            return;
        }
        const newType = new Dictionary_1.DictionaryType({
            typeCode,
            typeName,
            description
        });
        await newType.save();
        res.status(201).json({
            success: true,
            data: newType,
            message: '字典类型创建成功'
        });
    }
    catch (error) {
        console.error('创建字典类型失败:', error);
        res.status(500).json({
            success: false,
            message: '创建字典类型失败'
        });
    }
});
// 管理员接口 - 创建字典项
router.post('/admin/items', [
    auth_1.authMiddleware,
    (0, express_validator_1.body)('code').notEmpty().withMessage('字典项代码不能为空'),
    (0, express_validator_1.body)('name').notEmpty().withMessage('字典项名称不能为空'),
    (0, express_validator_1.body)('value').notEmpty().withMessage('字典项值不能为空')
], async (req, res) => {
    try {
        // 检查权限
        if (req.user?.role !== 'admin') {
            res.status(403).json({
                success: false,
                message: '权限不足'
            });
            return;
        }
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: '参数验证失败',
                errors: errors.array()
            });
            return;
        }
        const { code, name, value, description, sort, parentCode, extra } = req.body;
        // 检查代码是否已存在
        const existingItem = await Dictionary_1.DictionaryItem.findOne({ code });
        if (existingItem) {
            res.status(400).json({
                success: false,
                message: '字典项代码已存在'
            });
            return;
        }
        const newItem = new Dictionary_1.DictionaryItem({
            code,
            name,
            value,
            description,
            sort: sort || 0,
            parentCode,
            extra
        });
        await newItem.save();
        res.status(201).json({
            success: true,
            data: newItem,
            message: '字典项创建成功'
        });
    }
    catch (error) {
        console.error('创建字典项失败:', error);
        res.status(500).json({
            success: false,
            message: '创建字典项失败'
        });
    }
});
exports.default = router;
//# sourceMappingURL=dictionary.js.map