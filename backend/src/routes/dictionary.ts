import express, { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { DictionaryItem, DictionaryType, IDictionaryItem, IDictionaryType } from '../models/Dictionary';
import DeliveryTemplate from '../models/DeliveryTemplate';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// 获取字典类型列表
router.get('/types', async (req: Request, res: Response): Promise<void> => {
  try {
    const types = await DictionaryType.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    console.error('获取字典类型失败:', error);
    res.status(500).json({
      success: false,
      message: '获取字典类型失败'
    });
  }
});

// 根据类型代码获取字典项
router.get('/items/:typeCode', [
  param('typeCode').notEmpty().withMessage('字典类型代码不能为空')
], async (req: Request, res: Response): Promise<void> => {
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

    const { typeCode } = req.params;
    const { parentCode } = req.query;

    const query: any = { 
      code: new RegExp(`^${typeCode}_`),
      isActive: true 
    };
    
    if (parentCode) {
      query.parentCode = parentCode;
    }

    const items = await DictionaryItem.find(query).sort({ sort: 1, createdAt: 1 });
    
    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('获取字典项失败:', error);
    res.status(500).json({
      success: false,
      message: '获取字典项失败'
    });
  }
});

// 获取发货模板列表
router.get('/delivery-templates', [
  query('deliveryType').optional().isString()
], async (req: Request, res: Response): Promise<void> => {
  try {
    const { deliveryType } = req.query;
    
    const query: any = { isActive: true };
    if (deliveryType) {
      query.deliveryType = deliveryType;
    }

    const templates = await DeliveryTemplate.find(query).sort({ isDefault: -1, createdAt: -1 });
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('获取发货模板失败:', error);
    res.status(500).json({
      success: false,
      message: '获取发货模板失败'
    });
  }
});

// 管理员接口 - 创建字典类型
router.post('/admin/types', [
  authMiddleware,
  body('typeCode').notEmpty().withMessage('字典类型代码不能为空'),
  body('typeName').notEmpty().withMessage('字典类型名称不能为空')
], async (req: Request, res: Response): Promise<void> => {
  try {
    // 检查权限
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: '权限不足'
      });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      });
      return;
    }

    const { typeCode, typeName, description } = req.body;

    // 检查类型代码是否已存在
    const existingType = await DictionaryType.findOne({ typeCode });
    if (existingType) {
      res.status(400).json({
        success: false,
        message: '字典类型代码已存在'
      });
      return;
    }

    const newType = new DictionaryType({
      typeCode,
      typeName,
      description
    });

    await newType.save();

    res.status(201).json({
      success: true,
      data: newType,
      message: '字典类型创建成功'
    });
  } catch (error) {
    console.error('创建字典类型失败:', error);
    res.status(500).json({
      success: false,
      message: '创建字典类型失败'
    });
  }
});

// 管理员接口 - 创建字典项
router.post('/admin/items', [
  authMiddleware,
  body('code').notEmpty().withMessage('字典项代码不能为空'),
  body('name').notEmpty().withMessage('字典项名称不能为空'),
  body('value').notEmpty().withMessage('字典项值不能为空')
], async (req: Request, res: Response): Promise<void> => {
  try {
    // 检查权限
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: '权限不足'
      });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      });
      return;
    }

    const { code, name, value, description, sort, parentCode, extra } = req.body;

    // 检查代码是否已存在
    const existingItem = await DictionaryItem.findOne({ code });
    if (existingItem) {
      res.status(400).json({
        success: false,
        message: '字典项代码已存在'
      });
      return;
    }

    const newItem = new DictionaryItem({
      code,
      name,
      value,
      description,
      sort: sort || 0,
      parentCode,
      extra
    });

    await newItem.save();

    res.status(201).json({
      success: true,
      data: newItem,
      message: '字典项创建成功'
    });
  } catch (error) {
    console.error('创建字典项失败:', error);
    res.status(500).json({
      success: false,
      message: '创建字典项失败'
    });
  }
});

export default router;