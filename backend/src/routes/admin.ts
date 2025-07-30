import express, { Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import User from '../models/User';
import Product from '../models/Product';
import Order from '../models/Order';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = express.Router();

/**
 * @route GET /api/admin/dashboard
 * @desc 获取管理员仪表板数据
 * @access Private (Admin)
 */
router.get('/dashboard',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // 获取统计数据
      const [userStats, productStats, orderStats, recentOrders] = await Promise.all([
        User.aggregate([
          {
            $group: {
              _id: '$role',
              count: { $sum: 1 }
            }
          }
        ]),
        Product.aggregate([
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 },
              totalStock: { $sum: '$stock' }
            }
          }
        ]),
        Order.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalAmount: { $sum: '$totalAmount' }
            }
          }
        ]),
        Order.find()
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
        } else if (stat._id === 'customer') {
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
        } else if (stat._id === 'delivered') {
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

    } catch (error) {
      console.error('获取管理员仪表板数据错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * @route GET /api/admin/users
 * @desc 获取用户列表
 * @access Private (Admin)
 */
router.get('/users',
  authMiddleware,
  adminMiddleware,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('role').optional().isIn(['admin', 'merchant', 'customer']).withMessage('角色值无效')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: '参数验证失败',
          errors: errors.array()
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const role = req.query.role as string;

      const query: any = {};
      if (role) {
        query.role = role;
      }

      const skip = (page - 1) * limit;
      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        User.countDocuments(query)
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

    } catch (error) {
      console.error('获取用户列表错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * @route PUT /api/admin/users/:id/status
 * @desc 更新用户状态
 * @access Private (Admin)
 */
router.put('/users/:id/status',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { isActive } = req.body;
      
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive },
        { new: true }
      ).select('-password');

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

    } catch (error) {
      console.error('更新用户状态错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

export default router;