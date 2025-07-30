import express, { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import Order from '../models/Order';
import Product from '../models/Product';
import { authMiddleware, merchantMiddleware } from '../middleware/auth';
import crypto from 'crypto';

const router = express.Router();

/**
 * @route POST /api/orders
 * @desc 创建订单（商户专用）
 * @access Private (Merchant)
 */
router.post('/',
  authMiddleware,
  merchantMiddleware,
  [
    body('productId')
      .notEmpty()
      .withMessage('产品ID不能为空')
      .isMongoId()
      .withMessage('产品ID格式不正确'),
    body('quantity')
      .isInt({ min: 1 })
      .withMessage('数量必须是正整数'),
    body('customerInfo.email')
      .optional()
      .isEmail()
      .withMessage('邮箱格式不正确'),
    body('expiresIn')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('过期天数必须在1-365之间')
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

      const { productId, quantity = 1, customerInfo, expiresIn = 30 } = req.body;
      const merchantId = req.user!.userId;

      // 验证产品
      const product = await Product.findOne({ 
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
      const pickupKey = crypto.randomBytes(16).toString('hex').toUpperCase();
      
      // 计算过期时间
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresIn);

      // 创建订单
      const order = new Order({
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

    } catch (error) {
      console.error('创建订单错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * @route GET /api/orders
 * @desc 获取订单列表（商户专用）
 * @access Private (Merchant)
 */
router.get('/',
  authMiddleware,
  merchantMiddleware,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('status').optional().isIn(['pending', 'delivered', 'expired', 'cancelled']).withMessage('状态值无效')
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
      const status = req.query.status as string;
      const merchantId = req.user!.userId;

      // 构建查询条件
      const query: any = { merchantId };
      if (status) {
        query.status = status;
      }

      // 执行查询
      const skip = (page - 1) * limit;
      const [orders, total] = await Promise.all([
        Order.find(query)
          .populate('productId', 'name description')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Order.countDocuments(query)
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

    } catch (error) {
      console.error('获取订单列表错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * @route PUT /api/orders/:id/delivery
 * @desc 更新订单发货数据
 * @access Private (Merchant)
 */
router.put('/:id/delivery',
  authMiddleware,
  merchantMiddleware,
  [
    body('deliveryData')
      .notEmpty()
      .withMessage('发货数据不能为空')
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

      const { deliveryData } = req.body;
      const merchantId = req.user!.userId;

      // 查找订单
      const order = await Order.findOne({ 
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

    } catch (error) {
      console.error('更新发货数据错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

export default router;