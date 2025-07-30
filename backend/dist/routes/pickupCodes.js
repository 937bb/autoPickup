"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = require("../middleware/auth");
const PickupCode_1 = __importDefault(require("../models/PickupCode"));
const Product_1 = __importDefault(require("../models/Product"));
const router = express_1.default.Router();
/**
 * @route GET /api/pickup-codes/product/:productId
 * @desc 获取商品的提货码列表
 * @access Private (Merchant)
 */
router.get('/product/:productId', auth_1.authMiddleware, auth_1.merchantMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;
        const merchantId = req.user.userId;
        // 验证商品是否属于当前商户
        const product = await Product_1.default.findOne({
            _id: productId,
            merchantId
        });
        if (!product) {
            res.status(404).json({
                success: false,
                message: '商品不存在或无权访问'
            });
            return;
        }
        // 获取提货码列表
        const pickupCodes = await PickupCode_1.default.find({
            productId,
            merchantId,
            isDeleted: { $ne: true }
        }).sort({ createdAt: -1 });
        res.json({
            success: true,
            data: pickupCodes
        });
    }
    catch (error) {
        console.error('获取提货码列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
/**
 * @route POST /api/pickup-codes/product/:productId
 * @desc 为商品创建新的提货码
 * @access Private (Merchant)
 */
router.post('/product/:productId', auth_1.authMiddleware, auth_1.merchantMiddleware, [
    (0, express_validator_1.body)('type').isIn(['usage', 'time']).withMessage('提货码类型无效'),
    (0, express_validator_1.body)('usageLimit').optional().isInt({ min: 1 }).withMessage('使用次数必须大于0'),
    (0, express_validator_1.body)('expiresAt').optional().isISO8601().withMessage('过期时间格式无效')
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
        const { productId } = req.params;
        const { type, usageLimit, expiresAt } = req.body;
        const merchantId = req.user.userId;
        // 验证商品是否属于当前商户
        const product = await Product_1.default.findOne({
            _id: productId,
            merchantId
        });
        if (!product) {
            res.status(404).json({
                success: false,
                message: '商品不存在或无权访问'
            });
            return;
        }
        // 检查提货码数量限制
        const existingCodesCount = await PickupCode_1.default.countDocuments({ productId });
        if (existingCodesCount >= 20) {
            res.status(400).json({
                success: false,
                message: '每个商品最多只能创建20个提货码'
            });
            return;
        }
        // 创建提货码
        const data = {
            productId: new mongoose_1.default.Types.ObjectId(productId),
            merchantId: new mongoose_1.default.Types.ObjectId(merchantId)
        };
        if (type === 'usage' && usageLimit) {
            data.usageLimit = usageLimit;
        }
        else if (type === 'time' && expiresAt) {
            data.expiresAt = new Date(expiresAt);
        }
        const pickupCode = await PickupCode_1.default.createWithCode(data);
        res.status(201).json({
            success: true,
            message: '提货码创建成功',
            data: pickupCode
        });
    }
    catch (error) {
        console.error('创建提货码错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
/**
 * @route PUT /api/pickup-codes/:codeId
 * @desc 更新提货码信息
 * @access Private (Merchant)
 */
router.put('/:codeId', auth_1.authMiddleware, auth_1.merchantMiddleware, [
    (0, express_validator_1.body)('isActive').optional().isBoolean().withMessage('状态必须是布尔值'),
    (0, express_validator_1.body)('usageLimit').optional().isInt({ min: 1 }).withMessage('使用次数必须大于0'),
    (0, express_validator_1.body)('expiresAt').optional().isISO8601().withMessage('过期时间格式无效')
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
        const { codeId } = req.params;
        const { isActive, usageLimit, expiresAt } = req.body;
        const merchantId = req.user.userId;
        // 查找并验证提货码所有权
        const pickupCode = await PickupCode_1.default.findOne({
            _id: codeId,
            merchantId,
            isDeleted: { $ne: true }
        });
        if (!pickupCode) {
            res.status(404).json({
                success: false,
                message: '提货码不存在或无权访问'
            });
            return;
        }
        // 更新提货码信息
        if (isActive !== undefined)
            pickupCode.isActive = isActive;
        if (usageLimit)
            pickupCode.usageLimit = usageLimit;
        if (expiresAt)
            pickupCode.expiresAt = new Date(expiresAt);
        await pickupCode.save();
        res.json({
            success: true,
            message: '提货码更新成功',
            data: pickupCode
        });
    }
    catch (error) {
        console.error('更新提货码错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
/**
 * @route DELETE /api/pickup-codes/:codeId
 * @desc 删除提货码
 * @access Private (Merchant)
 */
router.delete('/:codeId', auth_1.authMiddleware, auth_1.merchantMiddleware, async (req, res) => {
    try {
        const { codeId } = req.params;
        const merchantId = req.user.userId;
        // 查找并验证提货码所有权
        const pickupCode = await PickupCode_1.default.findOne({
            _id: codeId,
            merchantId,
            isDeleted: { $ne: true }
        });
        if (!pickupCode) {
            res.status(404).json({
                success: false,
                message: '提货码不存在或无权访问'
            });
            return;
        }
        // 软删除提货码
        await PickupCode_1.default.updateOne({ _id: codeId }, {
            isDeleted: true,
            deletedAt: new Date(),
            isActive: false
        });
        res.json({
            success: true,
            message: '提货码删除成功'
        });
    }
    catch (error) {
        console.error('删除提货码错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
exports.default = router;
//# sourceMappingURL=pickupCodes.js.map