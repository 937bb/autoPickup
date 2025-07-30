"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const Order_1 = __importDefault(require("../models/Order"));
const Product_1 = __importDefault(require("../models/Product"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = express_1.default.Router();
// 提货限制：每个IP每分钟最多5次提货请求
const pickupLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1分钟
    max: 5,
    message: { message: '提货请求过于频繁，请稍后再试' }
});
/**
 * @route POST /api/pickup/verify
 * @desc 验证提货密钥
 * @access Public
 */
router.post('/verify', pickupLimiter, [
    (0, express_validator_1.body)('pickupKey')
        .notEmpty()
        .withMessage('提货密钥不能为空')
        .isLength({ min: 8 })
        .withMessage('提货密钥格式不正确')
], async (req, res) => {
    try {
        // 验证输入
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: '输入验证失败',
                errors: errors.array()
            });
            return;
        }
        const { pickupKey } = req.body;
        // 查找订单
        const order = await Order_1.default.findOne({
            pickupKey,
            status: 'pending',
            expiresAt: { $gt: new Date() }
        }).populate('productId', 'name description deliveryType');
        if (!order) {
            res.status(404).json({
                success: false,
                message: '提货密钥无效或已过期'
            });
            return;
        }
        // 返回订单信息（不包含敏感数据）
        res.json({
            success: true,
            data: {
                orderNumber: order.orderNumber,
                product: order.productId,
                quantity: order.quantity,
                totalAmount: order.totalAmount,
                expiresAt: order.expiresAt
            }
        });
    }
    catch (error) {
        console.error('验证提货密钥错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
/**
 * @route POST /api/pickup/confirm
 * @desc 确认提货并获取商品
 * @access Public
 */
router.post('/confirm', pickupLimiter, [
    (0, express_validator_1.body)('pickupKey')
        .notEmpty()
        .withMessage('提货密钥不能为空'),
    (0, express_validator_1.body)('customerInfo.email')
        .optional()
        .isEmail()
        .withMessage('邮箱格式不正确')
], async (req, res) => {
    try {
        // 验证输入
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: '输入验证失败',
                errors: errors.array()
            });
            return;
        }
        const { pickupKey, customerInfo } = req.body;
        // 查找并锁定订单
        const order = await Order_1.default.findOne({
            pickupKey,
            status: 'pending',
            expiresAt: { $gt: new Date() }
        }).populate('productId');
        if (!order) {
            res.status(404).json({
                success: false,
                message: '提货密钥无效或已过期'
            });
            return;
        }
        // 更新订单状态
        order.status = 'delivered';
        order.pickedUpAt = new Date();
        if (customerInfo) {
            order.customerInfo = customerInfo; // ✅ 修复：使用正确的属性名
        }
        await order.save();
        // 更新产品销量
        await Product_1.default.findByIdAndUpdate(order.productId, { $inc: { sales: order.quantity } });
        res.json({
            success: true,
            message: '提货成功',
            data: {
                orderNumber: order.orderNumber,
                product: order.productId,
                deliveryData: order.deliveryData,
                pickedUpAt: order.pickedUpAt
            }
        });
    }
    catch (error) {
        console.error('确认提货错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
/**
 * @route GET /api/pickup/status/:orderNumber
 * @desc 查询订单状态
 * @access Public
 */
router.get('/status/:orderNumber', async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const order = await Order_1.default.findOne({ orderNumber })
            .populate('productId', 'name')
            .select('-deliveryData -pickupKey');
        if (!order) {
            res.status(404).json({
                success: false,
                message: '订单不存在'
            });
            return;
        }
        res.json({
            success: true,
            data: {
                orderNumber: order.orderNumber,
                product: order.productId,
                status: order.status,
                quantity: order.quantity,
                totalAmount: order.totalAmount,
                createdAt: order.createdAt,
                expiresAt: order.expiresAt,
                pickedUpAt: order.pickedUpAt
            }
        });
    }
    catch (error) {
        console.error('查询订单状态错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
/**
 * @route GET /api/pickup/records
 * @desc 获取客户取货记录（根据邮箱或手机号）
 * @access Public
 */
router.get('/records', [
    (0, express_validator_1.query)('email').optional().isEmail().withMessage('邮箱格式无效'),
    (0, express_validator_1.query)('phone').optional().isMobilePhone('zh-CN').withMessage('手机号格式无效'),
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 50 }).withMessage('每页数量必须在1-50之间')
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
        const { email, phone } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        if (!email && !phone) {
            res.status(400).json({
                success: false,
                message: '请提供邮箱或手机号'
            });
            return;
        }
        // 构建查询条件
        const query = {
            status: 'completed',
            $or: []
        };
        if (email) {
            query.$or.push({ 'customer.email': email });
        }
        if (phone) {
            query.$or.push({ 'customer.phone': phone });
        }
        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            Order_1.default.find(query)
                .populate('product', 'name category deliveryType')
                .populate('merchant', 'username merchantInfo.companyName')
                .sort({ pickedUpAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order_1.default.countDocuments(query)
        ]);
        const totalPages = Math.ceil(total / limit);
        res.json({
            success: true,
            message: '获取取货记录成功',
            data: {
                records: orders,
                pagination: {
                    current: page,
                    total: totalPages,
                    limit,
                    totalItems: total
                }
            }
        });
    }
    catch (error) {
        console.error('获取取货记录失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
exports.default = router;
//# sourceMappingURL=pickup.js.map