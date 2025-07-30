"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const User_1 = __importDefault(require("../models/User"));
const Product_1 = __importDefault(require("../models/Product"));
const Order_1 = __importDefault(require("../models/Order"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
/**
 * @route GET /api/admin/dashboard
 * @desc 获取管理员仪表板数据
 * @access Private (Admin)
 */
router.get('/dashboard', auth_1.authMiddleware, auth_1.adminMiddleware, async (req, res) => {
    try {
        // 获取统计数据
        const [userStats, productStats, orderStats, recentOrders] = await Promise.all([
            User_1.default.aggregate([
                {
                    $group: {
                        _id: '$role',
                        count: { $sum: 1 }
                    }
                }
            ]),
            Product_1.default.aggregate([
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 },
                        totalStock: { $sum: '$stock' }
                    }
                }
            ]),
            Order_1.default.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$totalAmount' }
                    }
                }
            ]),
            Order_1.default.find()
                .populate('productId', 'name')
                .populate('merchantId', 'username')
                .sort({ createdAt: -1 })
                .limit(10)
        ]);
        // 构建统计数据
        const stats = {
            totalUsers: 0,
            totalMerchants: 0,
            totalCustomers: 0,
            totalProducts: 0,
            totalOrders: 0,
            totalRevenue: 0,
            pendingOrders: 0,
            deliveredOrders: 0
        };
        userStats.forEach(stat => {
            stats.totalUsers += stat.count;
            if (stat._id === 'merchant') {
                stats.totalMerchants = stat.count;
            }
            else if (stat._id === 'customer') {
                stats.totalCustomers = stat.count;
            }
        });
        productStats.forEach(stat => {
            stats.totalProducts += stat.count;
        });
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
                recentOrders,
                productStats,
                userStats
            }
        });
    }
    catch (error) {
        console.error('获取管理员仪表板数据错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
/**
 * @route GET /api/admin/users
 * @desc 获取用户列表
 * @access Private (Admin)
 */
router.get('/users', auth_1.authMiddleware, auth_1.adminMiddleware, [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    (0, express_validator_1.query)('role').optional().isIn(['admin', 'merchant', 'customer']).withMessage('角色值无效')
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
        const role = req.query.role;
        const query = {};
        if (role) {
            query.role = role;
        }
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            User_1.default.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User_1.default.countDocuments(query)
        ]);
        res.json({
            success: true,
            data: {
                users,
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
        console.error('获取用户列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
/**
 * @route PUT /api/admin/users/:id/status
 * @desc 更新用户状态
 * @access Private (Admin)
 */
router.put('/users/:id/status', auth_1.authMiddleware, auth_1.adminMiddleware, async (req, res) => {
    try {
        const { isActive } = req.body;
        const user = await User_1.default.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-password');
        if (!user) {
            res.status(404).json({
                success: false,
                message: '用户不存在'
            });
            return;
        }
        res.json({
            success: true,
            message: '用户状态更新成功',
            data: user
        });
    }
    catch (error) {
        console.error('更新用户状态错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map