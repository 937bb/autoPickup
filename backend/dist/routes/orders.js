"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const Order_1 = __importDefault(require("../models/Order"));
const Product_1 = __importDefault(require("../models/Product"));
const auth_1 = require("../middleware/auth");
const crypto_1 = __importDefault(require("crypto"));
const router = express_1.default.Router();
/**
 * @route POST /api/orders
 * @desc 创建订单（商户专用）
 * @access Private (Merchant)
 */
router.post('/', auth_1.authMiddleware, auth_1.merchantMiddleware, [
    (0, express_validator_1.body)('productId')
        .notEmpty()
        .withMessage('产品ID不能为空')
        .isMongoId()
        .withMessage('产品ID格式不正确'),
    (0, express_validator_1.body)('quantity')
        .isInt({ min: 1 })
        .withMessage('数量必须是正整数'),
    (0, express_validator_1.body)('customerInfo.email')
        .optional()
        .isEmail()
        .withMessage('邮箱格式不正确'),
    (0, express_validator_1.body)('expiresIn')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('过期天数必须在1-365之间')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: '输入验证失败',
                errors: errors.array()
            });
            return;
        }
        const { productId, quantity = 1, customerInfo, expiresIn = 30 } = req.body;
        const merchantId = req.user.userId;
        // 验证产品
        const product = await Product_1.default.findOne({
            _id: productId,
            merchantId,
            isActive: true
        });
        if (!product) {
            res.status(404).json({
                success: false,
                message: '产品不存在或无权限'
            });
            return;
        }
        // 检查库存
        if (product.stock < quantity) {
            res.status(400).json({
                success: false,
                message: '库存不足'
            });
            return;
        }
        // 生成提货密钥
        const pickupKey = crypto_1.default.randomBytes(16).toString('hex').toUpperCase();
        // 计算过期时间
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresIn);
        // 创建订单
        const order = new Order_1.default({
            productId,
            merchantId,
            pickupKey,
            quantity,
            totalAmount: product.price * quantity,
            customerInfo,
            expiresAt
        });
        await order.save();
        await order.populate('productId', 'name description');
        res.status(201).json({
            success: true,
            message: '订单创建成功',
            data: {
                orderNumber: order.orderNumber,
                pickupKey: order.pickupKey,
                product: order.productId,
                quantity: order.quantity,
                totalAmount: order.totalAmount,
                expiresAt: order.expiresAt,
                createdAt: order.createdAt
            }
        });
    }
    catch (error) {
        console.error('创建订单错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
/**
 * @route GET /api/orders
 * @desc 获取订单列表（商户专用）
 * @access Private (Merchant)
 */
router.get('/', auth_1.authMiddleware, auth_1.merchantMiddleware, [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    (0, express_validator_1.query)('status').optional().isIn(['pending', 'delivered', 'expired', 'cancelled']).withMessage('状态值无效')
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const merchantId = req.user.userId;
        // 构建查询条件
        const query = { merchantId };
        if (status) {
            query.status = status;
        }
        // 执行查询
        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            Order_1.default.find(query)
                .populate('productId', 'name description')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Order_1.default.countDocuments(query)
        ]);
        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    }
    catch (error) {
        console.error('获取订单列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
/**
 * @route PUT /api/orders/:id/delivery
 * @desc 更新订单发货数据
 * @access Private (Merchant)
 */
router.put('/:id/delivery', auth_1.authMiddleware, auth_1.merchantMiddleware, [
    (0, express_validator_1.body)('deliveryData')
        .notEmpty()
        .withMessage('发货数据不能为空')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                success: false,
                message: '输入验证失败',
                errors: errors.array()
            });
            return;
        }
        const { deliveryData } = req.body;
        const merchantId = req.user.userId;
        // 查找订单
        const order = await Order_1.default.findOne({
            _id: req.params.id,
            merchantId,
            status: 'pending'
        });
        if (!order) {
            res.status(404).json({
                success: false,
                message: '订单不存在或无权限'
            });
            return;
        }
        // 更新发货数据
        order.deliveryData = deliveryData;
        await order.save();
        res.json({
            success: true,
            message: '发货数据更新成功',
            data: {
                orderNumber: order.orderNumber,
                deliveryData: order.deliveryData
            }
        });
    }
    catch (error) {
        console.error('更新发货数据错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
exports.default = router;
//# sourceMappingURL=orders.js.map