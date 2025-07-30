import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { productAPI } from '../services/api';
import { Product } from '../types';
import PickupCodeManager from '../components/PickupCodeManager';

const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!productId) return;
      
      setLoading(true);
      try {
        const response = await productAPI.getProductById(productId);
        if (response.success) {
          setProduct(response.data || null); // 修改这里，处理可能的undefined情况
        } else {
          toast.error(response.message || '获取商品详情失败');
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || '获取商品详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">加载中...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">商品不存在</h3>
        <p className="text-gray-500 mb-4">未找到该商品或您没有权限查看</p>
        <button
          onClick={() => navigate('/products')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          返回商品列表
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 返回按钮和标题 */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/products')}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-gray-600 mt-1">商品详情和提货码管理</p>
        </div>
      </div>

      {/* 商品详情卡片 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">商品信息</h2>
        
        {/* 商品图片 */}
        {product.images && product.images.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">商品图片</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={`http://localhost:3001${image}`}
                    alt={`商品图片 ${index + 1}`}
                    className="w-full h-40 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      console.error('图片加载失败:', `http://localhost:3001${image}`);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 商品基本信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">商品名称</label>
            <p className="mt-1 text-sm text-gray-900 font-medium">{product.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">分类</label>
            <p className="mt-1 text-sm text-gray-900">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                {product.categoryCode && product.categoryCode.name ? product.categoryCode.name : (product.category || '未分类')}
              </span>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">价格</label>
            <p className="mt-1 text-lg text-blue-600 font-bold">¥{product.price}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">库存</label>
            <p className="mt-1 text-sm text-gray-900">{product.stock}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">销量</label>
            <p className="mt-1 text-sm text-gray-900">{product.sales}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">状态</label>
            <p className="mt-1">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {product.status === 'active' ? '上架' : '下架'}
              </span>
            </p>
          </div>
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700">商品描述</label>
            <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">{product.description}</p>
          </div>
          
          {/* 发货模板数据 */}
          {product.deliveryData && (
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">发货模板数据</label>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(product.deliveryData).map(([key, value]) => (
                    <div key={key} className={key === 'link' || key === 'password' ? 'col-span-full flex flex-col' : 'flex justify-between'}>
                      <span className="font-medium text-gray-700">{key}:</span>
                      <span className="text-gray-900 break-all mt-1">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 提货码管理组件 */}
      <div className="mb-8">
        <PickupCodeManager productId={productId || ''} />
      </div>
    </div>
  );
};

export default ProductDetail;