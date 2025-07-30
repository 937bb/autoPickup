"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const Product_1 = __importDefault(require("../models/Product"));
const Order_1 = __importDefault(require("../models/Order"));
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// 为所有路由处理函数添加 Promise<void> 返回类型
// 并将 return res.status().json() 改为 res.status().json(); return;
/**
 * @route GET /api/merchants/profile
 * @desc 获取商户信息
 * @access Private (Merchant)
 */
router.get('/profile', auth_1.authMiddleware, auth_1.merchantMiddleware, async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user.userId).select('-password');
        if (!user) {
            res.status(404).json({
                success: false,
                message: '用户不存在'
            });
            return;
        }
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        console.error('获取商户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
/**
 * @route PUT /api/merchants/profile
 * @desc 更新商户信息
 * @access Private (Merchant)
 */
router.put('/profile', auth_1.authMiddleware, auth_1.merchantMiddleware, [
    (0, express_validator_1.body)('merchantInfo.companyName')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('公司名称长度必须在2-100个字符之间'),
    (0, express_validator_1.body)('merchantInfo.contactPerson')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('联系人姓名长度必须在2-50个字符之间'),
    (0, express_validator_1.body)('merchantInfo.phone')
        .optional()
        .matches(/^1[3-9]\d{9}$/)
        .withMessage('手机号格式不正确')
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
        const { merchantInfo } = req.body;
        const user = await User_1.default.findByIdAndUpdate(req.user.userId, { $set: { merchantInfo } }, { new: true, runValidators: true }).select('-password');
        if (!user) {
            res.status(404).json({
                success: false,
                message: '用户不存在'
            });
            return;
        }
        res.json({
            success: true,
            message: '商户信息更新成功',
            data: user
        });
    }
    catch (error) {
        console.error('更新商户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
/**
 * @route GET /api/merchants/products
 * @desc 获取商户产品列表
 * @access Private (Merchant)
 */
router.get('/products', auth_1.authMiddleware, auth_1.merchantMiddleware, [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
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
        const merchantId = req.user.userId;
        const skip = (page - 1) * limit;
        const [products, total] = await Promise.all([
            Product_1.default.find({ merchantId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Product_1.default.countDocuments({ merchantId })
        ]);
        res.json({
            success: true,
            data: {
                products,
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
        console.error('获取商户产品列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
/**
 * @route POST /api/merchants/products
 * @desc 创建产品
 * @access Private (Merchant)
 */
router.post('/products', auth_1.authMiddleware, auth_1.merchantMiddleware, [
    (0, express_validator_1.body)('name')
        .isLength({ min: 2, max: 100 })
        .withMessage('产品名称长度必须在2-100个字符之间'),
    (0, express_validator_1.body)('description')
        .isLength({ min: 10, max: 1000 })
        .withMessage('产品描述长度必须在10-1000个字符之间'),
    (0, express_validator_1.body)('category')
        .isIn(['影视', '软件', '游戏', '教程', '素材', '其他'])
        .withMessage('产品分类无效'),
    (0, express_validator_1.body)('deliveryType')
        .isIn(['netdisk', 'account', 'code', 'text', 'file'])
        .withMessage('发货类型无效'),
    (0, express_validator_1.body)('price')
        .isFloat({ min: 0 })
        .withMessage('价格必须是非负数'),
    (0, express_validator_1.body)('stock')
        .isInt({ min: 0 })
        .withMessage('库存必须是非负整数')
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
        const productData = {
            ...req.body,
            merchantId: req.user.userId
        };
        const product = new Product_1.default(productData);
        await product.save();
        res.status(201).json({
            success: true,
            message: '产品创建成功',
            data: product
        });
    }
    catch (error) {
        console.error('创建产品错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
/**
 * @route PUT /api/merchants/products/:id
 * @desc 更新产品
 * @access Private (Merchant)
 */
router.put('/products/:id', auth_1.authMiddleware, auth_1.merchantMiddleware, async (req, res) => {
    try {
        const merchantId = req.user.userId;
        const product = await Product_1.default.findOneAndUpdate({ _id: req.params.id, merchantId }, req.body, { new: true, runValidators: true });
        if (!product) {
            res.status(404).json({
                success: false,
                message: '产品不存在或无权限'
            });
            return;
        }
        res.json({
            success: true,
            message: '产品更新成功',
            data: product
        });
    }
    catch (error) {
        console.error('更新产品错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
/**
 * @route DELETE /api/merchants/products/:id
 * @desc 删除产品
 * @access Private (Merchant)
 */
router.delete('/products/:id', auth_1.authMiddleware, auth_1.merchantMiddleware, async (req, res) => {
    try {
        const merchantId = req.user.userId;
        const product = await Product_1.default.findOneAndUpdate({ _id: req.params.id, merchantId }, { isActive: false }, { new: true });
        if (!product) {
            res.status(404).json({
                success: false,
                message: '产品不存在或无权限'
            });
            return;
        }
        res.json({
            success: true,
            message: '产品删除成功'
        });
    }
    catch (error) {
        console.error('删除产品错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
/**
 * @route GET /api/merchants/dashboard
 * @desc 获取商户仪表板数据
 * @access Private (Merchant)
 */
router.get('/dashboard', auth_1.authMiddleware, auth_1.merchantMiddleware, async (req, res) => {
    try {
        const merchantId = req.user.userId;
        // 获取统计数据
        const [productCount, orderStats, recentOrders] = await Promise.all([
            Product_1.default.countDocuments({ merchantId, isActive: true }),
            Order_1.default.aggregate([
                { $match: { merchantId: merchantId } },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$totalAmount' }
                    }
                }
            ]),
            Order_1.default.find({ merchantId })
                .populate('productId', 'name')
                .sort({ createdAt: -1 })
                .limit(10)
        ]);
        // 构建统计数据
        const stats = {
            totalProducts: productCount,
            totalOrders: 0,
            totalRevenue: 0,
            pendingOrders: 0,
            deliveredOrders: 0
        };
        orderStats.forEach(stat => {
            stats.totalOrders += stat.count;
            stats.totalRevenue += stat.totalAmount;
            if (stat._id === 'pending') {
                stats.pendingOrders = stat.count;
            }
            else if (stat._id === 'delivered') {
                stats.deliveredOrders = stat.count;
            }
        });
        res.json({
            success: true,
            data: {
                stats,
                recentOrders
            }
        });
    }
    catch (error) {
        console.error('获取仪表板数据错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
exports.default = router;
//# sourceMappingURL=merchants.js.map