"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * @Descripttion:
 * @version:
 * @Author: 937bb
 * @Date: 2025-07-30 21:19:30
 * @LastEditors: 937bb
 * @LastEditTime: 2025-07-30 21:40:48
 */
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const mongoose_1 = __importDefault(require("mongoose"));
// 导入路由
const auth_1 = __importDefault(require("./routes/auth"));
const products_1 = __importDefault(require("./routes/products"));
const orders_1 = __importDefault(require("./routes/orders"));
const merchants_1 = __importDefault(require("./routes/merchants"));
const pickupCodes_1 = __importDefault(require("./routes/pickupCodes"));
const pickupCodeVerify_1 = __importDefault(require("./routes/pickupCodeVerify"));
const admin_1 = __importDefault(require("./routes/admin"));
const stats_1 = __importDefault(require("./routes/stats")); // 添加统计路由导入
const dictionary_1 = __importDefault(require("./routes/dictionary"));
// 加载环境变量
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// 信任代理设置 - 解决express-rate-limit的X-Forwarded-For警告
app.set('trust proxy', 1);
// 安全中间件
app.use((0, cors_1.default)());
// 请求限制
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100 // 限制每个IP 15分钟内最多100个请求
});
app.use(limiter);
// 日志中间件
app.use((0, morgan_1.default)('combined'));
// 解析JSON
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// 静态文件服务 - 提供图片访问
app.use('/uploads', express_1.default.static('uploads'));
// 数据库连接
mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/autopickup')
    .then(() => console.log('✅ MongoDB连接成功'))
    .catch(err => console.error('❌ MongoDB连接失败:', err));
// 路由
app.use('/api/auth', auth_1.default);
app.use('/api/merchants', merchants_1.default);
app.use('/api/products', products_1.default);
app.use('/api/orders', orders_1.default);
// app.use('/api/customers', customerRoutes); // 删除这行
app.use('/api/dictionary', dictionary_1.default);
app.use('/api/pickup', pickupCodeVerify_1.default);
app.use('/api/pickup-codes', pickupCodes_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/stats', stats_1.default);
// 健康检查
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// 404处理
app.use('*', (req, res) => {
    res.status(404).json({ message: '接口不存在' });
});
// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
app.listen(PORT, () => {
    console.log(`🚀 服务器运行在端口 ${PORT}`);
});
//# sourceMappingURL=index.js.map