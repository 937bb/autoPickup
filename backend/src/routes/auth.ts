import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from '../middleware/auth'; // 添加这个导入

const router = express.Router();

// 登录限制：每个IP每15分钟最多5次登录尝试
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5,
  message: { message: '登录尝试过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * @route POST /api/auth/register
 * @desc 用户注册
 * @access Public
 */
router.post('/register',
  [
    body('username')
      .isLength({ min: 3, max: 20 })
      .withMessage('用户名长度必须在3-20个字符之间')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('用户名只能包含字母、数字和下划线'),
    body('email')
      .isEmail()
      .withMessage('请输入有效的邮箱地址')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('密码至少6个字符')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('密码必须包含大小写字母和数字'),
    body('role')
      .optional()
      .isIn(['merchant', 'customer'])
      .withMessage('角色只能是merchant或customer')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // 验证输入
      // 在注册路由中优化错误响应
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array()
        });
        return;
      }

      const { username, email, password, role = 'customer', merchantInfo } = req.body;

      // 检查用户是否已存在
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          message: '用户名或邮箱已存在'
        });
        return;
      }

      // 创建新用户
      const user = new User({
        username,
        email,
        password,
        role,
        merchantInfo: role === 'merchant' ? merchantInfo : undefined
      });

      await user.save();

      // 生成JWT token
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        }
      });

    } catch (error) {
      console.error('注册错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * @route POST /api/auth/login
 * @desc 用户登录
 * @access Public
 */
router.post('/login',
  loginLimiter,
  [
    body('username')
      .notEmpty()
      .withMessage('用户名不能为空'),
    body('password')
      .notEmpty()
      .withMessage('密码不能为空')
  ],
  async (req: Request, res: Response): Promise<void> => {
    console.log('🚀 登录接口被调用');
    console.log('请求体:', JSON.stringify(req.body, null, 2));
    
    try {
      // 验证输入
      console.log('📝 开始验证输入...');
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ 输入验证失败:', errors.array());
        res.status(400).json({
          success: false,
          message: '输入验证失败',
          errors: errors.array().map((err: any) => {
            if (err.type === 'field') {
              return {
                field: err.path,
                message: err.msg,
                value: err.value
              };
            }
            return {
              field: 'unknown',
              message: err.msg,
              value: undefined
            };
          })
        });
        return;
      }
      console.log('✅ 输入验证通过');

      const { username, password } = req.body;
      console.log('👤 登录用户名:', username);

      // 查找用户
      console.log('🔍 开始查找用户...');
      const user = await User.findOne({
        $or: [{ username }, { email: username }]
      }).select('+password');
      
      if (!user) {
        console.log('❌ 用户不存在');
        res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
        return;
      }
      
      console.log('✅ 找到用户:', {
        id: user._id,
        username: user.username,
        role: user.role,
        isActive: user.isActive
      });

      if (!user.isActive) {
        console.log('❌ 用户未激活');
        res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
        return;
      }

      // 验证密码
      console.log('🔐 开始验证密码...');
      const isPasswordValid = await user.comparePassword(password);
      console.log('密码验证结果:', isPasswordValid);
      
      if (!isPasswordValid) {
        console.log('❌ 密码验证失败');
        res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
        return;
      }
      console.log('✅ 密码验证通过');

      // 检查JWT_SECRET
      console.log('🔑 检查JWT_SECRET...');
      if (!process.env.JWT_SECRET) {
        console.log('❌ JWT_SECRET未设置');
        res.status(500).json({
          success: false,
          message: '服务器配置错误'
        });
        return;
      }
      console.log('✅ JWT_SECRET已设置');

      // 生成JWT token
      console.log('🎫 开始生成token...');
      const tokenPayload = { userId: user._id, role: user.role };
      console.log('Token payload:', tokenPayload);
      
      const token = jwt.sign(
        tokenPayload,
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );
      
      if (!token) {
        console.log('❌ Token生成失败');
        res.status(500).json({
          success: false,
          message: '登录失败，请重试'
        });
        return;
      }
      
      console.log('✅ Token生成成功，长度:', token.length);

      // 准备响应数据
      console.log('📦 准备响应数据...');
      const responseData = {
        success: true,
        message: '登录成功',
        data: {
          token,
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            merchantInfo: user.merchantInfo,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      };
      
      console.log('📤 发送响应:', {
        success: responseData.success,
        message: responseData.message,
        hasToken: !!responseData.data.token,
        tokenLength: responseData.data.token.length,
        userId: responseData.data.user._id
      });
      
      res.status(200).json(responseData);
      console.log('✅ 响应已发送');
      // 在发送响应前检查
      if (res.headersSent) {
        console.log('❌ 响应已经发送过了！');
        return;
      }
      
      console.log('📤 准备发送响应...');
      res.json(responseData);
      console.log('✅ 响应发送完成');
      console.log('✅ res.json() 调用完成');
      
      // 添加这个检查
      if (res.headersSent) {
        console.log('✅ 响应头已发送');
      } else {
        console.log('❌ 响应头未发送');
      }

    } catch (error) {
      console.error('💥 登录过程中发生错误:', error);
      console.error('错误堆栈:', error instanceof Error ? error.stack : 'No stack trace available');
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * @route POST /api/auth/refresh
 * @desc 刷新token
 * @access Private
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: '未提供token'
      });
      return;
    }

    // 验证token（即使过期也要能解析）
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, { ignoreExpiration: true }) as any;
    
    // 查找用户
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用'
      });
      return;
    }

    // 生成新token
    const newToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: { token: newToken }
    });

  } catch (error) {
    console.error('刷新token错误:', error);
    res.status(401).json({
      success: false,
      message: 'token无效'
    });
  }
});

/**
 * @route GET /api/auth/me
 * @desc 获取当前用户信息
 * @access Private
 */
router.get('/me',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('=== ME接口调试信息 ===');
      console.log('req.user:', req.user);
      console.log('userId:', req.user?.userId);
      
      const user = await User.findById(req.user!.userId).select('-password');
      console.log('查找到的用户:', user ? '存在' : '不存在');
      
      if (!user) {
        console.log('用户不存在，userId:', req.user?.userId);
        res.status(404).json({
          success: false,
          message: '用户不存在'
        });
        return;
      }

      console.log('返回用户数据:', {
        id: user._id,
        username: user.username,
        role: user.role
      });
      
      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      console.error('获取用户信息错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

/**
 * @route POST /api/auth/logout
 * @desc 用户登出
 * @access Private
 */
router.post('/logout',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // 这里可以添加token黑名单逻辑，目前只返回成功响应
      res.json({
        success: true,
        message: '登出成功'
      });
    } catch (error) {
      console.error('登出错误:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
);

// 添加测试登录接口
router.post('/test-login', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('测试登录接口被调用');
    
    // 直接返回一个测试token
    const testToken = jwt.sign(
      { userId: 'test123', role: 'merchant' },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: '测试登录成功',
      data: {
        token: testToken,
        user: {
          _id: 'test123',
          username: 'testuser',
          email: 'test@example.com',
          role: 'merchant'
        }
      }
    });
    
  } catch (error) {
    console.error('测试登录错误:', error);
    res.status(500).json({
      success: false,
      message: '测试登录失败'
    });
  }
});

export default router;
      