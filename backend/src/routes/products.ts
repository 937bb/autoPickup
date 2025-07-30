import express, { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import Product from '../models/Product';
import PickupCode from '../models/PickupCode';
import { authMiddleware, merchantMiddleware } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose'; // Add this import
import { DictionaryItem } from '../models/Dictionary';

const router = express.Router();

// 确保上传目录存在
const uploadDir = 'uploads/products';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

/**
 * @route GET /api/products
 * @desc 获取产品列表（公开，支持分页）
 * @access Public
 */
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('category').optional().isString().withMessage('分类必须是字符串'),
    query('search').optional().isString().withMessage('搜索关键词必须是字符串'),
    query('status').optional().isIn(['active', 'inactive', 'all']).withMessage('状态筛选无效'),
    query('sortBy').optional().isIn(['latest', 'price_asc', 'price_desc', 'sales']).withMessage('排序方式无效')
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
      const limit = parseInt(req.query.limit as string) || 12;
      const category = req.query.category as string;
      const search = req.query.search as string;
      const status = req.query.status as string || 'active';
      const sortBy = req.query.sortBy as string || 'latest';

      // 构建查询条件
      const query: any = {};
      
      // 根据status参数筛选商品状态
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      }
      // status === 'all' 时不添加isActive条件，显示所有商品
      
      if (category) {
        query.category = category;
      }
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // 构建排序条件
      let sortOptions: any = {};
      switch (sortBy) {
        case 'price_asc':
          sortOptions = { price: 1 };
          break;
        case 'price_desc':
          sortOptions = { price: -1 };
          break;
        case 'sales':
          sortOptions = { sales: -1 };
          break;
        default:
          sortOptions = { createdAt: -1 };
      }

      const skip = (page - 1) * limit;
      
      const [products, total] = await Promise.all([
        Product.find(query)
          .populate('merchantId', 'username merchantInfo')
          .populate({
            path: 'categoryCode',
            select: 'name',
            model: 'DictionaryItem',
            localField: 'categoryCode',
            foreignField: 'code'
          })
          .populate({
            path: 'deliveryTypeCode', 
            select: 'name',
            model: 'DictionaryItem',
            localField: 'deliveryTypeCode',
            foreignField: 'code'
          })
          .sort(sortOptions)
          .skip(skip)
          .limit(limit),
        Product.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          products,
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
      console.error('获取产品列表错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

// 添加更新产品的路由
router.put('/:id',
  authMiddleware,
  upload.array('images', 5),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { existingImages = [], tags = [], ...productData } = req.body;
      const files = req.files as Express.Multer.File[];
      
      // 处理新上传的图片
      const newImages = files ? files.map(file => `/uploads/products/${file.filename}`) : [];
      
      // 合并已存在的图片和新上传的图片
      const allImages = [...(Array.isArray(existingImages) ? existingImages : [existingImages].filter(Boolean)), ...newImages];
      
      const processedTags = Array.isArray(tags) ? tags : (tags ? tags.split(',').map((tag: string) => tag.trim()) : []);

      const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
          ...productData,
          images: allImages,
          tags: processedTags
        },
        { new: true }
      );

      if (!product) {
        res.status(404).json({
          success: false,
          message: '产品不存在'
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
 * @route GET /api/products/:id
 * @desc 获取单个产品详情
 * @access Public
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('merchantId', 'username merchantInfo');
    
    if (!product) {
      res.status(404).json({
        success: false,
        message: '产品不存在'
      });
      return;
    }

    // 获取分类和发货类型的详细信息
    const [categoryItem, deliveryTypeItem] = await Promise.all([
      DictionaryItem.findOne({ code: product.categoryCode }),
      DictionaryItem.findOne({ code: product.deliveryTypeCode })
    ]);

    // 构建返回数据
    const productData: any = product.toObject();
    productData.categoryCode = categoryItem ? {
      _id: categoryItem._id,
      code: categoryItem.code,
      name: categoryItem.name
    } : null;
    productData.deliveryTypeCode = deliveryTypeItem ? {
      _id: deliveryTypeItem._id,
      code: deliveryTypeItem.code,
      name: deliveryTypeItem.name
    } : null;

    res.json({
      success: true,
      data: productData
    });

  } catch (error) {
    console.error('获取产品详情错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

/**
 * @route GET /api/products/meta/categories
 * @desc 获取产品分类列表
 * @access Public
 */
router.get('/meta/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    
    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('获取分类列表错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

export default router;


// 验证分类代码是否有效
const validateCategoryCode = async (value: string) => {
  const category = await DictionaryItem.findOne({ 
    code: value, 
    isActive: true 
  });
  if (!category) {
    throw new Error('无效的商品分类');
  }
  return true;
};

// 验证发货类型代码是否有效
const validateDeliveryTypeCode = async (value: string) => {
  const deliveryType = await DictionaryItem.findOne({ 
    code: value, 
    isActive: true 
  });
  if (!deliveryType) {
    throw new Error('无效的发货类型');
  }
  return true;
};

/**
 * @route POST /api/products
 * @desc 创建产品
 * @access Private (Merchant)
 */
// 完全替换第154-235行的旧路由
router.post('/',
  authMiddleware,
  upload.array('images', 5),
  [
    body('name')
      .isLength({ min: 2, max: 100 })
      .withMessage('产品名称长度必须在2-100个字符之间'),
    body('description')
      .isLength({ min: 10, max: 1000 })
      .withMessage('产品描述长度必须在10-1000个字符之间'),
    body('category')
      .custom(validateCategoryCode)
      .withMessage('产品分类无效'),
    body('deliveryType')
      .custom(validateDeliveryTypeCode)
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

      const { 
        generatePickupCode = false, 
        pickupCodeConfig = {}, 
        tags = [], 
        deliveryData,
        ...productData 
      } = req.body;
      const merchantId = req.user!.userId;
      const files = req.files as Express.Multer.File[];

      // 处理上传的图片
      const images = files ? files.map(file => `/uploads/products/${file.filename}`) : [];

      // 处理标签
      let parsedTags: string[] = [];
      if (typeof tags === 'string') {
        try {
          parsedTags = JSON.parse(tags);
        } catch {
          parsedTags = [tags];
        }
      } else if (Array.isArray(tags)) {
        parsedTags = tags;
      }

      // 处理发货数据
      let parsedDeliveryData = null;
      if (deliveryData) {
        try {
          parsedDeliveryData = typeof deliveryData === 'string' 
            ? JSON.parse(deliveryData) 
            : deliveryData;
        } catch (error) {
          console.error('解析发货数据失败:', error);
        }
      }

      // 创建产品 - 正确映射字段名
      const product = new Product({
        name: productData.name,
        description: productData.description,
        categoryCode: productData.category,        // 前端的category映射到数据库的categoryCode
        deliveryTypeCode: productData.deliveryType, // 前端的deliveryType映射到数据库的deliveryTypeCode
        price: productData.price,
        stock: productData.stock,
        deliveryTemplateCode: productData.deliveryTemplate,
        merchantId: new mongoose.Types.ObjectId(merchantId),
        tags: parsedTags,
        images,
        deliveryData: parsedDeliveryData
      });

      await product.save();

      // 如果需要生成提货码
      if (generatePickupCode) {
        const { usageLimit, expiresInDays } = pickupCodeConfig;
        await PickupCode.createWithCode({
          productId: new mongoose.Types.ObjectId(product._id as string),
          merchantId: new mongoose.Types.ObjectId(merchantId),
          usageLimit,
          expiresInDays
        });
      }

      res.status(201).json({
        success: true,
        message: '产品创建成功',
        data: product
      });
    } catch (error: any) {
      console.error('创建产品失败:', error);
      res.status(500).json({
        success: false,
        message: '创建产品失败',
        error: error.message
      });
    }
  }
);

// 添加状态更新路由
router.put('/:id/status',
  authMiddleware,
  [
    body('status').isIn(['active', 'inactive']).withMessage('状态值无效')
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

      const { status } = req.body;
      const isActive = status === 'active';

      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { isActive },
        { new: true }
      );

      if (!product) {
        res.status(404).json({
          success: false,
          message: '产品不存在'
        });
        return;
      }

      res.json({
        success: true,
        message: '状态更新成功',
        data: product
      });
    } catch (error) {
      console.error('更新产品状态错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);