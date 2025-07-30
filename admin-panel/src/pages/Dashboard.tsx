import React, { useState, useEffect, useCallback } from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  CubeIcon,
  ShoppingBagIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { statsAPI } from '../services/api';
import { DashboardStats, AdminDashboardStats, MerchantDashboardStats } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('admin_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      if (user?.role === 'admin') {
        const response = await statsAPI.getDashboardStats();
        if (response.success && response.data) {
          setStats(response.data);
        }
      } else {
        const response = await statsAPI.getMerchantStats(); // 修改方法名
        if (response.success && response.data) {
          setStats(response.data);
        }
      }
    } catch (error: any) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, fetchStats]);

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    trend?: number;
  }> = ({ title, value, icon, color, trend }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {typeof value === 'number' && title.includes('收入') 
              ? `¥${value.toLocaleString()}` 
              : typeof value === 'number' 
              ? value.toLocaleString() 
              : value
            }
          </p>
          {trend !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${
              trend >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend >= 0 ? (
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
              )}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">加载中...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          欢迎回来，{user?.username || '管理员'}
        </h1>
        <p className="text-gray-600 mt-1">
          {user?.role === 'admin' ? '平台运营概览' : '商户数据概览'}
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {user?.role === 'admin' ? (
          <>
            <StatCard
              title="总用户数"
              value={stats.totalUsers || 0}
              icon={<UserGroupIcon className="h-6 w-6 text-blue-600" />}
              color="bg-blue-100"
              trend={12}
            />
            <StatCard
              title="商户数量"
              value={stats.totalMerchants || 0}
              icon={<UserGroupIcon className="h-6 w-6 text-green-600" />}
              color="bg-green-100"
              trend={8}
            />
            <StatCard
              title="商品总数"
              value={stats.totalProducts}
              icon={<CubeIcon className="h-6 w-6 text-purple-600" />}
              color="bg-purple-100"
              trend={15}
            />
            <StatCard
              title="订单总数"
              value={stats.totalOrders}
              icon={<ShoppingBagIcon className="h-6 w-6 text-yellow-600" />}
              color="bg-yellow-100"
              trend={-3}
            />
          </>
        ) : (
          <>
            <StatCard
              title="我的商品"
              value={stats.totalProducts}
              icon={<CubeIcon className="h-6 w-6 text-blue-600" />}
              color="bg-blue-100"
            />
            <StatCard
              title="总订单"
              value={stats.totalOrders}
              icon={<ShoppingBagIcon className="h-6 w-6 text-green-600" />}
              color="bg-green-100"
            />
            <StatCard
              title="总收入"
              value={stats.totalRevenue}
              icon={<ChartBarIcon className="h-6 w-6 text-purple-600" />}
              color="bg-purple-100"
            />
            <StatCard
              title="待处理"
              value={stats.pendingOrders || 0}
              icon={<ShoppingBagIcon className="h-6 w-6 text-yellow-600" />}
              color="bg-yellow-100"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近订单 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">最近订单</h3>
          </div>
          <div className="p-6">
            {stats.recentOrders.length > 0 ? (
              <div className="space-y-4">
                {stats.recentOrders.slice(0, 5).map((order) => (
                  <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">
                        {typeof order.product === 'object' ? order.product.name : '商品已删除'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">¥{order.totalAmount}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {order.status === 'completed' ? '已完成' : 
                         order.status === 'pending' ? '待处理' : '已取消'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">暂无订单数据</p>
              </div>
            )}
          </div>
        </div>

        {/* 热门商品 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">热门商品</h3>
          </div>
          <div className="p-6">
            {stats.topProducts && stats.topProducts.length > 0 ? (
              <div className="space-y-4">
                {stats.topProducts.slice(0, 5).map((product, index) => (
                  <div key={product._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">¥{product.price}</p>
                      <p className="text-sm text-gray-600">销量: {product.sales}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">暂无商品数据</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <CubeIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">添加商品</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <ShoppingBagIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">查看订单</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <UserGroupIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">用户管理</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <ChartBarIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">数据报表</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;