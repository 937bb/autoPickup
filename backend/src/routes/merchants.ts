import express, { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import Product from '../models/Product';
import Order from '../models/Order';
import User from '../models/User';
import { authMiddleware, merchantMiddleware } from '../middleware/auth';

const router = express.Router();

// 为所有路由处理函数添加 Promise<void> 返回类型
// 并将 return res.status().json() 改为 res.status().json(); return;

/**
 * @route GET /api/merchants/profile
 * @desc 获取商户信息
 * @access Private (Merchant)
 */
router.get('/profile',
  authMiddleware,
  merchantMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await User.findById(req.user!.userId).select('-password');
      
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

    } catch (error) {
      console.error('获取商户信息错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * @route PUT /api/merchants/profile
 * @desc 更新商户信息
 * @access Private (Merchant)
 */
router.put('/profile',
  authMiddleware,
  merchantMiddleware,
  [
    body('merchantInfo.companyName')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('公司名称长度必须在2-100个字符之间'),
    body('merchantInfo.contactPerson')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('联系人姓名长度必须在2-50个字符之间'),
    body('merchantInfo.phone')
      .optional()
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('手机号格式不正确')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
        return;
      }

      const { merchantInfo } = req.body;
      
      const user = await User.findByIdAndUpdate(
        req.user!.userId,
        { $set: { merchantInfo } },
        { new: true, runValidators: true }
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
        message: '商户信息更新成功',
        data: user
      });

    } catch (error) {
      console.error('更新商户信息错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * @route GET /api/merchants/products
 * @desc 获取商户产品列表
 * @access Private (Merchant)
 */
router.get('/products',
  authMiddleware,
  merchantMiddleware,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
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
      const merchantId = req.user!.userId;

      const skip = (page - 1) * limit;
      const [products, total] = await Promise.all([
        Product.find({ merchantId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Product.countDocuments({ merchantId })
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

    } catch (error) {
      console.error('获取商户产品列表错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * @route POST /api/merchants/products
 * @desc 创建产品
 * @access Private (Merchant)
 */
router.post('/products',
  authMiddleware,
  merchantMiddleware,
  [
    body('name')
      .isLength({ min: 2, max: 100 })
      .withMessage('产品名称长度必须在2-100个字符之间'),
    body('description')
      .isLength({ min: 10, max: 1000 })
      .withMessage('产品描述长度必须在10-1000个字符之间'),
    body('category')
      .isIn(['影视', '软件', '游戏', '教程', '素材', '其他'])
      .withMessage('产品分类无效'),
    body('deliveryType')
      .isIn(['netdisk', 'account', 'code', 'text', 'file'])
      .withMessage('发货类型无效'),
    body('price')
      .isFloat({ min: 0 })
      .withMessage('价格必须是非负数'),
    body('stock')
      .isInt({ min: 0 })
      .withMessage('库存必须是非负整数')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
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
        merchantId: req.user!.userId
      };

      const product = new Product(productData);
      await product.save();

      res.status(201).json({
        success: true,
        message: '产品创建成功',
        data: product
      });

    } catch (error) {
      console.error('创建产品错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * @route PUT /api/merchants/products/:id
 * @desc 更新产品
 * @access Private (Merchant)
 */
router.put('/products/:id',
  authMiddleware,
  merchantMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const merchantId = req.user!.userId;
      
      const product = await Product.findOneAndUpdate(
        { _id: req.params.id, merchantId },
        req.body,
        { new: true, runValidators: true }
      );

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

    } catch (error) {
      console.error('更新产品错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * @route DELETE /api/merchants/products/:id
 * @desc 删除产品
 * @access Private (Merchant)
 */
router.delete('/products/:id',
  authMiddleware,
  merchantMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const merchantId = req.user!.userId;
      
      const product = await Product.findOneAndUpdate(
        { _id: req.params.id, merchantId },
        { isActive: false },
        { new: true }
      );

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

    } catch (error) {
      console.error('删除产品错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * @route GET /api/merchants/dashboard
 * @desc 获取商户仪表板数据
 * @access Private (Merchant)
 */
router.get('/dashboard',
  authMiddleware,
  merchantMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const merchantId = req.user!.userId;
      
      // 获取统计数据
      const [productCount, orderStats, recentOrders] = await Promise.all([
        Product.countDocuments({ merchantId, isActive: true }),
        Order.aggregate([
          { $match: { merchantId: merchantId } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalAmount: { $sum: '$totalAmount' }
            }
          }
        ]),
        Order.find({ merchantId })
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
        } else if (stat._id === 'delivered') {
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

    } catch (error) {
      console.error('获取仪表板数据错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

export default router;