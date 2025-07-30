"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../models/User"));
const Product_1 = __importDefault(require("../models/Product"));
const Order_1 = __importDefault(require("../models/Order"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
/**
 * @route GET /api/stats/dashboard
 * @desc 获取管理员仪表板统计数据
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
        // 处理统计数据
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
                totalUsers: stats.totalUsers,
                totalMerchants: stats.totalMerchants,
                totalProducts: stats.totalProducts,
                totalOrders: stats.totalOrders,
                totalRevenue: stats.totalRevenue,
                recentOrders,
                topProducts: [] // 可以后续添加热门产品统计
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
 * @route GET /api/stats/merchant
 * @desc 获取商户仪表板统计数据
 * @access Private (Merchant)
 */
router.get('/merchant', auth_1.authMiddleware, auth_1.merchantMiddleware, async (req, res) => {
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
        // 处理订单统计数据
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
                totalProducts: stats.totalProducts,
                totalOrders: stats.totalOrders,
                totalRevenue: stats.totalRevenue,
                pendingOrders: stats.pendingOrders,
                recentOrders
            }
        });
    }
    catch (error) {
        console.error('获取商户仪表板数据错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
exports.default = router;
//# sourceMappingURL=stats.js.map