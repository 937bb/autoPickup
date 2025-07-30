import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import PickupCode from '../models/PickupCode';
import Product from '../models/Product';
import User from '../models/User';
import PickupRecord from '../models/PickupRecord';
import { authMiddleware } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// 提货限制：每个IP每分钟最多5次提货请求
const pickupLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 5,
  message: { success: false, message: '提货请求过于频繁，请稍后再试' }
});

/**
 * @route POST /api/pickup/verify
 * @desc 验证提货码
 * @access Public
 */
router.post('/verify', 
  pickupLimiter,
  [
    body('code')
      .notEmpty()
      .withMessage('提货码不能为空')
      .isLength({ min: 6, max: 20 })
      .withMessage('提货码格式不正确')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // 验证输入
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
        return;
      }

      const { code } = req.body;

      // 查找提货码
      const pickupCode = await PickupCode.findOne({ 
        code: code.toUpperCase(),
        isActive: true,
        isDeleted: { $ne: true }
      })
        .populate('productId', 'name description price')
        .populate('merchantId', 'username');

      if (!pickupCode) {
        res.status(404).json({
          success: false,
          message: '提货码无效或不存在'
        });
        return;
      }

      // 检查是否过期
      if (pickupCode.expiresAt && new Date() > pickupCode.expiresAt) {
        res.status(400).json({
          success: false,
          message: '提货码已过期'
        });
        return;
      }

      // 检查使用次数限制
      if (pickupCode.usageLimit && pickupCode.usedCount >= pickupCode.usageLimit) {
        res.status(400).json({
          success: false,
          message: '提货码使用次数已达上限'
        });
        return;
      }

      // 返回提货码信息（不包含敏感数据）
      res.json({
        success: true,
        data: {
          pickupCode: {
            code: pickupCode.code,
            _id: pickupCode._id,
            usageLimit: pickupCode.usageLimit,
            usedCount: pickupCode.usedCount,
            expiresAt: pickupCode.expiresAt
          },
          product: pickupCode.productId,
          merchant: pickupCode.merchantId
        }
      });

    } catch (error) {
      console.error('验证提货码错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * @route POST /api/pickup/confirm
 * @desc 确认提货
 * @access Private (Customer)
 */
router.post('/confirm',
  authMiddleware,
  pickupLimiter,
  [
    body('code')
      .notEmpty()
      .withMessage('提货码不能为空')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // 验证输入
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
        return;
      }

      const { code } = req.body;
      const userId = req.user!.userId;

      // 查找提货码
      const pickupCode = await PickupCode.findOne({ 
        code: code.toUpperCase(),
        isActive: true,
        isDeleted: { $ne: true }
      })
        .populate('productId', 'name description price')
        .populate('merchantId', 'username');

      if (!pickupCode) {
        res.status(404).json({
          success: false,
          message: '提货码无效或不存在'
        });
        return;
      }

      // 检查是否过期
      if (pickupCode.expiresAt && new Date() > pickupCode.expiresAt) {
        res.status(400).json({
          success: false,
          message: '提货码已过期'
        });
        return;
      }

      // 检查使用次数限制
      if (pickupCode.usageLimit && pickupCode.usedCount >= pickupCode.usageLimit) {
        res.status(400).json({
          success: false,
          message: '提货码使用次数已达上限'
        });
        return;
      }

      // 检查用户是否已经使用过这个提货码
      const existingRecord = await PickupRecord.findOne({
        pickupCodeId: pickupCode._id,
        userId: userId
      });

      if (existingRecord) {
        res.status(400).json({
          success: false,
          message: '您已经使用过这个提货码'
        });
        return;
      }

      // 创建提货记录
      const pickupRecord = new PickupRecord({
        pickupCodeId: pickupCode._id,
        userId: userId,
        productId: pickupCode.productId._id,
        merchantId: pickupCode.merchantId._id,
        status: 'confirmed'
      });

      await pickupRecord.save();

      // 更新提货码使用次数
      pickupCode.usedCount += 1;
      await pickupCode.save();

      // 更新产品销量
      await Product.findByIdAndUpdate(
        pickupCode.productId._id,
        { $inc: { sales: 1 } }
      );

      res.json({
        success: true,
        message: '提货确认成功',
        data: {
          pickupCode: {
            code: pickupCode.code,
            usedCount: pickupCode.usedCount,
            usageLimit: pickupCode.usageLimit
          },
          product: pickupCode.productId,
          merchant: pickupCode.merchantId,
          confirmedAt: new Date()
        }
      });

    } catch (error) {
      console.error('确认提货错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * @route GET /api/pickup/records
 * @desc 获取用户的提货记录
 * @access Private (Customer)
 */
router.get('/records',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [records, total] = await Promise.all([
        PickupRecord.find({ userId })
          .populate({
            path: 'pickupCodeId',
            select: 'code'
          })
          .populate({
            path: 'productId',
            select: 'name description'
          })
          .populate({
            path: 'merchantId',
            select: 'username'
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        PickupRecord.countDocuments({ userId })
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          records,
          pagination: {
            current: page,
            total: totalPages,
            limit,
            totalItems: total,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      console.error('获取提货记录错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

export default router;