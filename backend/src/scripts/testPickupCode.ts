import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PickupCode from '../models/PickupCode';
import Product from '../models/Product';
import User from '../models/User';

// 加载环境变量
dotenv.config();

async function testPickupCode() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/autopickup');
    console.log('✅ 数据库连接成功');

    // 查看所有提货码
    console.log('\n=== 查看所有提货码 ===');
    const allCodes = await PickupCode.find({}).populate('productId', 'name').populate('merchantId', 'username');
    console.log(`总共有 ${allCodes.length} 个提货码`);
    
    allCodes.forEach((code: any, index) => {
      console.log(`${index + 1}. 提货码: ${code.code}`);
      console.log(`   商品: ${code.productId?.name || '未知商品'}`);
      console.log(`   商户: ${code.merchantId?.username || '未知商户'}`);
      console.log(`   状态: ${code.isActive ? '激活' : '禁用'}`);
      console.log(`   已删除: ${code.isDeleted ? '是' : '否'}`);
      console.log(`   使用次数: ${code.usedCount}/${code.usageLimit || '无限制'}`);
      console.log(`   过期时间: ${code.expiresAt ? code.expiresAt.toLocaleString() : '永不过期'}`);
      console.log(`   创建时间: ${code.createdAt.toLocaleString()}`);
      console.log('---');
    });

    // 查看有效的提货码
    console.log('\n=== 查看有效的提货码 ===');
    const validCodes = await PickupCode.find({
      isActive: true,
      isDeleted: { $ne: true }
    });
    console.log(`有效提货码数量: ${validCodes.length}`);
    
    if (validCodes.length > 0) {
      const testCode = validCodes[0];
      console.log(`\n测试提货码: ${testCode.code}`);
      
      // 测试验证逻辑
      console.log('\n=== 测试验证逻辑 ===');
      
      // 检查是否过期
      const isExpired = testCode.expiresAt && new Date() > testCode.expiresAt;
      console.log(`是否过期: ${isExpired ? '是' : '否'}`);
      
      // 检查使用次数限制
      const isUsageLimitReached = testCode.usageLimit && testCode.usedCount >= testCode.usageLimit;
      console.log(`使用次数是否达到上限: ${isUsageLimitReached ? '是' : '否'}`);
      
      // 检查是否可用
      const isAvailable = testCode.isActive && !isExpired && !isUsageLimitReached && !testCode.isDeleted;
      console.log(`是否可用: ${isAvailable ? '是' : '否'}`);
    }

    // 如果没有提货码，创建一个测试提货码
    if (allCodes.length === 0) {
      console.log('\n=== 创建测试提货码 ===');
      
      // 查找第一个商品和商户
      const product = await Product.findOne({});
      const merchant = await User.findOne({ role: 'merchant' });
      
      if (product && merchant) {
        const testPickupCode = await PickupCode.createWithCode({
          productId: product._id as mongoose.Types.ObjectId,
          merchantId: merchant._id as mongoose.Types.ObjectId,
          usageLimit: 10
        });
        
        console.log(`创建测试提货码成功: ${testPickupCode.code}`);
        console.log(`商品: ${product.name}`);
        console.log(`商户: ${merchant.username}`);
      } else {
        console.log('❌ 没有找到商品或商户，无法创建测试提货码');
      }
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ 数据库连接已关闭');
  }
}

// 运行测试
testPickupCode();