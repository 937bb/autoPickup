"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = exports.merchantMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
/**
 * 认证中间件
 * 验证JWT token并设置req.user
 */
const authMiddleware = async (req, res, next) => {
    try {
        console.log('=== 认证中间件调试 ===');
        const authHeader = req.headers.authorization;
        console.log('Authorization头:', authHeader);
        const token = authHeader?.replace('Bearer ', '');
        console.log('提取的token:', token ? '存在' : '不存在');
        if (!token) {
            console.log('未提供token');
            res.status(401).json({
                success: false,
                message: '未提供认证token'
            });
            return;
        }
        // 验证token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        console.log('解码的token:', decoded);
        // 查找用户
        const user = await User_1.default.findById(decoded.userId);
        console.log('中间件查找用户:', user ? '存在' : '不存在');
        if (!user || !user.isActive) {
            console.log('用户不存在或未激活');
            res.status(401).json({
                success: false,
                message: '用户不存在或已被禁用'
            });
            return;
        }
        // 设置用户信息
        req.user = {
            userId: decoded.userId,
            role: decoded.role
        };
        console.log('设置req.user:', req.user);
        next();
    }
    catch (error) {
        console.error('认证中间件错误:', error);
        res.status(401).json({
            success: false,
            message: 'token无效或已过期'
        });
    }
};
exports.authMiddleware = authMiddleware;
/**
 * 商户权限中间件
 * 确保用户是商户或管理员
 */
const merchantMiddleware = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: '未认证'
        });
        return;
    }
    if (req.user.role !== 'merchant' && req.user.role !== 'admin') {
        res.status(403).json({
            success: false,
            message: '权限不足，需要商户权限'
        });
        return;
    }
    next();
};
exports.merchantMiddleware = merchantMiddleware;
/**
 * 管理员权限中间件
 * 确保用户是管理员
 */
const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: '未认证'
        });
        return;
    }
    if (req.user.role !== 'admin') {
        res.status(403).json({
            success: false,
            message: '权限不足，需要管理员权限'
        });
        return;
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
//# sourceMappingURL=auth.js.map