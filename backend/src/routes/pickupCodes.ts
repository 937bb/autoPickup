import express, { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { authMiddleware, merchantMiddleware } from '../middleware/auth';
import PickupCode from '../models/PickupCode';
import Product from '../models/Product';

const router = express.Router();

/**
 * @route GET /api/pickup-codes/product/:productId
 * @desc 获取商品的提货码列表
 * @access Private (Merchant)
 */
router.get('/product/:productId',
  authMiddleware,
  merchantMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;
      const merchantId = req.user!.userId;

      // 验证商品是否属于当前商户
      const product = await Product.findOne({
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
      const pickupCodes = await PickupCode.find({
        productId,
        merchantId
      }).sort({ createdAt: -1 });

      res.json({
        success: true,
        data: pickupCodes
      });
    } catch (error) {
      console.error('获取提货码列表错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * @route POST /api/pickup-codes/product/:productId
 * @desc 为商品创建新的提货码
 * @access Private (Merchant)
 */
router.post('/product/:productId',
  authMiddleware,
  merchantMiddleware,
  [
    body('type').isIn(['usage', 'time']).withMessage('提货码类型无效'),
    body('usageLimit').optional().isInt({ min: 1 }).withMessage('使用次数必须大于0'),
    body('expiresAt').optional().isISO8601().withMessage('过期时间格式无效')
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

      const { productId } = req.params;
      const { type, usageLimit, expiresAt } = req.body;
      const merchantId = req.user!.userId;

      // 验证商品是否属于当前商户
      const product = await Product.findOne({
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
      const existingCodesCount = await PickupCode.countDocuments({ productId });
      if (existingCodesCount >= 20) {
        res.status(400).json({
          success: false,
          message: '每个商品最多只能创建20个提货码'
        });
        return;
      }

      // 创建提货码
      const data: any = {
        productId: new mongoose.Types.ObjectId(productId),
        merchantId: new mongoose.Types.ObjectId(merchantId)
      };

      if (type === 'usage' && usageLimit) {
        data.usageLimit = usageLimit;
      } else if (type === 'time' && expiresAt) {
        data.expiresAt = new Date(expiresAt);
      }

      const pickupCode = await PickupCode.createWithCode(data);

      res.status(201).json({
        success: true,
        message: '提货码创建成功',
        data: pickupCode
      });
    } catch (error) {
      console.error('创建提货码错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * @route PUT /api/pickup-codes/:codeId
 * @desc 更新提货码信息
 * @access Private (Merchant)
 */
router.put('/:codeId',
  authMiddleware,
  merchantMiddleware,
  [
    body('isActive').optional().isBoolean().withMessage('状态必须是布尔值'),
    body('usageLimit').optional().isInt({ min: 1 }).withMessage('使用次数必须大于0'),
    body('expiresAt').optional().isISO8601().withMessage('过期时间格式无效')
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

      const { codeId } = req.params;
      const { isActive, usageLimit, expiresAt } = req.body;
      const merchantId = req.user!.userId;

      // 查找并验证提货码所有权
      const pickupCode = await PickupCode.findOne({
        _id: codeId,
        merchantId
      });

      if (!pickupCode) {
        res.status(404).json({
          success: false,
          message: '提货码不存在或无权访问'
        });
        return;
      }

      // 更新提货码信息
      if (isActive !== undefined) pickupCode.isActive = isActive;
      if (usageLimit) pickupCode.usageLimit = usageLimit;
      if (expiresAt) pickupCode.expiresAt = new Date(expiresAt);

      await pickupCode.save();

      res.json({
        success: true,
        message: '提货码更新成功',
        data: pickupCode
      });
    } catch (error) {
      console.error('更新提货码错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * @route DELETE /api/pickup-codes/:codeId
 * @desc 删除提货码
 * @access Private (Merchant)
 */
router.delete('/:codeId',
  authMiddleware,
  merchantMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { codeId } = req.params;
      const merchantId = req.user!.userId;

      // 查找并验证提货码所有权
      const pickupCode = await PickupCode.findOne({
        _id: codeId,
        merchantId
      });

      if (!pickupCode) {
        res.status(404).json({
          success: false,
          message: '提货码不存在或无权访问'
        });
        return;
      }

      // 删除提货码
      await PickupCode.deleteOne({ _id: codeId });

      res.json({
        success: true,
        message: '提货码删除成功'
      });
    } catch (error) {
      console.error('删除提货码错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

export default router;