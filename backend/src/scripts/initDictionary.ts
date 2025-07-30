import mongoose from 'mongoose';
import { DictionaryType, DictionaryItem } from '../models/Dictionary';
import DeliveryTemplate from '../models/DeliveryTemplate';
import dotenv from 'dotenv';

dotenv.config();

async function initDictionary() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('数据库连接成功');

    // 清除现有数据
    await DictionaryType.deleteMany({});
    await DictionaryItem.deleteMany({});
    await DeliveryTemplate.deleteMany({});

    // 创建字典类型
    const types = [
      {
        typeCode: 'PRODUCT_CATEGORY',
        typeName: '商品分类',
        description: '商品分类字典'
      },
      {
        typeCode: 'DELIVERY_TYPE',
        typeName: '发货类型',
        description: '发货类型字典'
      }
    ];

    await DictionaryType.insertMany(types);
    console.log('字典类型创建成功');

    // 创建商品分类字典项
    const categories = [
      { code: 'PRODUCT_CATEGORY_MOVIE', name: '影视', value: 'movie', sort: 1 },
      { code: 'PRODUCT_CATEGORY_SOFTWARE', name: '软件', value: 'software', sort: 2 },
      { code: 'PRODUCT_CATEGORY_GAME', name: '游戏', value: 'game', sort: 3 },
      { code: 'PRODUCT_CATEGORY_TUTORIAL', name: '教程', value: 'tutorial', sort: 4 },
      { code: 'PRODUCT_CATEGORY_MATERIAL', name: '素材', value: 'material', sort: 5 },
      { code: 'PRODUCT_CATEGORY_OTHER', name: '其他', value: 'other', sort: 6 }
    ];

    await DictionaryItem.insertMany(categories);
    console.log('商品分类字典项创建成功');

    // 创建发货类型字典项
    const deliveryTypes = [
      { code: 'DELIVERY_TYPE_NETDISK', name: '网盘链接', value: 'netdisk', sort: 1 },
      { code: 'DELIVERY_TYPE_ACCOUNT', name: '账号密码', value: 'account', sort: 2 },
      { code: 'DELIVERY_TYPE_CODE', name: '兑换码', value: 'code', sort: 3 },
      { code: 'DELIVERY_TYPE_TEXT', name: '文本内容', value: 'text', sort: 4 },
      { code: 'DELIVERY_TYPE_FILE', name: '文件下载', value: 'file', sort: 5 }
    ];

    await DictionaryItem.insertMany(deliveryTypes);
    console.log('发货类型字典项创建成功');

    // 创建发货模板
    const templates = [
      {
        templateCode: 'TEMPLATE_NETDISK',
        templateName: '网盘链接模板',
        deliveryType: 'netdisk',
        isDefault: true,
        fields: [
          {
            name: 'link',
            label: '网盘链接',
            type: 'url',
            required: true,
            placeholder: '请输入网盘分享链接',
            validation: {
              pattern: '^https?://.*'
            }
          },
          {
            name: 'password',
            label: '提取码',
            type: 'text',
            required: false,
            placeholder: '请输入提取码（如有）',
            validation: {
              maxLength: 10
            }
          },
          {
            name: 'expiry',
            label: '有效期',
            type: 'text',
            required: false,
            placeholder: '请输入有效期说明',
            defaultValue: '永久有效'
          }
        ]
      },
      {
        templateCode: 'TEMPLATE_ACCOUNT',
        templateName: '账号密码模板',
        deliveryType: 'account',
        isDefault: true,
        fields: [
          {
            name: 'username',
            label: '账号',
            type: 'text',
            required: true,
            placeholder: '请输入账号'
          },
          {
            name: 'password',
            label: '密码',
            type: 'password',
            required: true,
            placeholder: '请输入密码'
          },
          {
            name: 'note',
            label: '使用说明',
            type: 'textarea',
            required: false,
            placeholder: '请输入使用说明'
          }
        ]
      },
      {
        templateCode: 'TEMPLATE_CODE',
        templateName: '兑换码模板',
        deliveryType: 'code',
        isDefault: true,
        fields: [
          {
            name: 'code',
            label: '兑换码',
            type: 'text',
            required: true,
            placeholder: '请输入兑换码'
          },
          {
            name: 'instructions',
            label: '使用说明',
            type: 'textarea',
            required: true,
            placeholder: '请输入兑换说明'
          },
          {
            name: 'expiry',
            label: '有效期',
            type: 'text',
            required: false,
            placeholder: '请输入有效期',
            defaultValue: '永久有效'
          }
        ]
      },
      {
        templateCode: 'TEMPLATE_TEXT',
        templateName: '文本内容模板',
        deliveryType: 'text',
        isDefault: true,
        fields: [
          {
            name: 'content',
            label: '内容',
            type: 'textarea',
            required: true,
            placeholder: '请输入文本内容'
          },
          {
            name: 'description',
            label: '说明',
            type: 'textarea',
            required: false,
            placeholder: '请输入内容说明'
          }
        ]
      },
      {
        templateCode: 'TEMPLATE_FILE',
        templateName: '文件下载模板',
        deliveryType: 'file',
        isDefault: true,
        fields: [
          {
            name: 'filename',
            label: '文件名',
            type: 'text',
            required: true,
            placeholder: '请输入文件名'
          },
          {
            name: 'download_url',
            label: '下载链接',
            type: 'url',
            required: true,
            placeholder: '请输入下载链接',
            validation: {
              pattern: '^https?://.*'
            }
          }
        ]
      }
    ];

    await DeliveryTemplate.insertMany(templates);
    console.log('发货模板创建成功');

    console.log('字典数据初始化完成');
    process.exit(0);
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  }
}

initDictionary();