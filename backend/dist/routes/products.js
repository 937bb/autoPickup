"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const Product_1 = __importDefault(require("../models/Product"));
const PickupCode_1 = __importDefault(require("../models/PickupCode"));
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const mongoose_1 = __importDefault(require("mongoose")); // Add this import
const Dictionary_1 = require("../models/Dictionary");
const router = express_1.default.Router();
// 确保上传目录存在
const uploadDir = 'uploads/products';
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// 配置文件上传
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(new Error('只允许上传图片文件'));
        }
    }
});
/**
 * @route GET /api/products
 * @desc 获取产品列表（公开，支持分页）
 * @access Public
 */
router.get('/', [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    (0, express_validator_1.query)('category').optional().isString().withMessage('分类必须是字符串'),
    (0, express_validator_1.query)('search').optional().isString().withMessage('搜索关键词必须是字符串'),
    (0, express_validator_1.query)('status').optional().isIn(['active', 'inactive', 'all']).withMessage('状态筛选无效'),
    (0, express_validator_1.query)('sortBy').optional().isIn(['latest', 'price_asc', 'price_desc', 'sales']).withMessage('排序方式无效')
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
        const limit = parseInt(req.query.limit) || 12;
        const category = req.query.category;
        const search = req.query.search;
        const status = req.query.status || 'active';
        const sortBy = req.query.sortBy || 'latest';
        // 构建查询条件
        const query = {};
        // 根据status参数筛选商品状态
        if (status === 'active') {
            query.isActive = true;
        }
        else if (status === 'inactive') {
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
        let sortOptions = {};
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
            Product_1.default.find(query)
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
            Product_1.default.countDocuments(query)
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
    }
    catch (error) {
        console.error('获取产品列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
// 添加更新产品的路由
router.put('/:id', auth_1.authMiddleware, upload.array('images', 5), async (req, res) => {
    try {
        const { existingImages = [], tags = [], ...productData } = req.body;
        const files = req.files;
        // 处理新上传的图片
        const newImages = files ? files.map(file => `/uploads/products/${file.filename}`) : [];
        // 合并已存在的图片和新上传的图片
        const allImages = [...(Array.isArray(existingImages) ? existingImages : [existingImages].filter(Boolean)), ...newImages];
        const processedTags = Array.isArray(tags) ? tags : (tags ? tags.split(',').map((tag) => tag.trim()) : []);
        const product = await Product_1.default.findByIdAndUpdate(req.params.id, {
            ...productData,
            images: allImages,
            tags: processedTags
        }, { new: true });
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
 * @route GET /api/products/:id
 * @desc 获取单个产品详情
 * @access Public
 */
router.get('/:id', async (req, res) => {
    try {
        const product = await Product_1.default.findById(req.params.id)
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
            Dictionary_1.DictionaryItem.findOne({ code: product.categoryCode }),
            Dictionary_1.DictionaryItem.findOne({ code: product.deliveryTypeCode })
        ]);
        // 构建返回数据
        const productData = product.toObject();
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
    }
    catch (error) {
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
router.get('/meta/categories', async (req, res) => {
    try {
        const categories = await Product_1.default.distinct('category', { isActive: true });
        res.json({
            success: true,
            data: categories
        });
    }
    catch (error) {
        console.error('获取分类列表错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
exports.default = router;
// 验证分类代码是否有效
const validateCategoryCode = async (value) => {
    const category = await Dictionary_1.DictionaryItem.findOne({
        code: value,
        isActive: true
    });
    if (!category) {
        throw new Error('无效的商品分类');
    }
    return true;
};
// 验证发货类型代码是否有效
const validateDeliveryTypeCode = async (value) => {
    const deliveryType = await Dictionary_1.DictionaryItem.findOne({
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
router.post('/', auth_1.authMiddleware, upload.array('images', 5), [
    (0, express_validator_1.body)('name')
        .isLength({ min: 2, max: 100 })
        .withMessage('产品名称长度必须在2-100个字符之间'),
    (0, express_validator_1.body)('description')
        .isLength({ min: 10, max: 1000 })
        .withMessage('产品描述长度必须在10-1000个字符之间'),
    (0, express_validator_1.body)('category')
        .custom(validateCategoryCode)
        .withMessage('产品分类无效'),
    (0, express_validator_1.body)('deliveryType')
        .custom(validateDeliveryTypeCode)
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
        const { generatePickupCode = false, pickupCodeConfig = {}, tags = [], deliveryData, ...productData } = req.body;
        const merchantId = req.user.userId;
        const files = req.files;
        // 处理上传的图片
        const images = files ? files.map(file => `/uploads/products/${file.filename}`) : [];
        // 处理标签
        let parsedTags = [];
        if (typeof tags === 'string') {
            try {
                parsedTags = JSON.parse(tags);
            }
            catch {
                parsedTags = [tags];
            }
        }
        else if (Array.isArray(tags)) {
            parsedTags = tags;
        }
        // 处理发货数据
        let parsedDeliveryData = null;
        if (deliveryData) {
            try {
                parsedDeliveryData = typeof deliveryData === 'string'
                    ? JSON.parse(deliveryData)
                    : deliveryData;
            }
            catch (error) {
                console.error('解析发货数据失败:', error);
            }
        }
        // 创建产品 - 正确映射字段名
        const product = new Product_1.default({
            name: productData.name,
            description: productData.description,
            categoryCode: productData.category, // 前端的category映射到数据库的categoryCode
            deliveryTypeCode: productData.deliveryType, // 前端的deliveryType映射到数据库的deliveryTypeCode
            price: productData.price,
            stock: productData.stock,
            deliveryTemplateCode: productData.deliveryTemplate,
            merchantId: new mongoose_1.default.Types.ObjectId(merchantId),
            tags: parsedTags,
            images,
            deliveryData: parsedDeliveryData
        });
        await product.save();
        // 如果需要生成提货码
        if (generatePickupCode) {
            const { usageLimit, expiresInDays } = pickupCodeConfig;
            await PickupCode_1.default.createWithCode({
                productId: new mongoose_1.default.Types.ObjectId(product._id),
                merchantId: new mongoose_1.default.Types.ObjectId(merchantId),
                usageLimit,
                expiresInDays
            });
        }
        res.status(201).json({
            success: true,
            message: '产品创建成功',
            data: product
        });
    }
    catch (error) {
        console.error('创建产品失败:', error);
        res.status(500).json({
            success: false,
            message: '创建产品失败',
            error: error.message
        });
    }
});
// 添加状态更新路由
router.put('/:id/status', auth_1.authMiddleware, [
    (0, express_validator_1.body)('status').isIn(['active', 'inactive']).withMessage('状态值无效')
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
        const { status } = req.body;
        const isActive = status === 'active';
        const product = await Product_1.default.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
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
    }
    catch (error) {
        console.error('更新产品状态错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});
//# sourceMappingURL=products.js.map