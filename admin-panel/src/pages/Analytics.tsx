import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  CubeIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { statsAPI } from '../services/api';

const Analytics: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMerchants: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    monthlyGrowth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await statsAPI.getDashboardStats();
        if (response.success && response.data) {
          // 修复：直接使用response.data，而不是response.data.stats
          setStats({
            totalUsers: response.data.totalUsers || 0,
            totalMerchants: response.data.totalMerchants || 0,
            totalProducts: response.data.totalProducts || 0,
            totalOrders: response.data.totalOrders || 0,
            totalRevenue: response.data.totalRevenue || 0,
            monthlyGrowth: 15 // 临时硬编码，后续可从API获取
          });
        }
      } catch (error) {
        console.error('获取统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: '总用户数',
      value: stats.totalUsers,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-100'
    },
    {
      title: '商户数量',
      value: stats.totalMerchants,
      icon: CubeIcon,
      color: 'bg-green-500',
      bgColor: 'bg-green-100'
    },
    {
      title: '商品总数',
      value: stats.totalProducts,
      icon: ShoppingBagIcon,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-100'
    },
    {
      title: '订单总数',
      value: stats.totalOrders,
      icon: ChartBarIcon,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-100'
    },
    {
      title: '总收入',
      value: `¥${stats.totalRevenue.toFixed(2)}`,
      icon: CurrencyDollarIcon,
      color: 'bg-red-500',
      bgColor: 'bg-red-100'
    },
    {
      title: '月增长率',
      value: `${stats.monthlyGrowth}%`,
      icon: ArrowTrendingUpIcon,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-100'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">数据分析</h1>
        <p className="text-gray-600 mt-1">平台运营数据总览</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className={`p-3 ${stat.bgColor} rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">用户增长趋势</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            图表功能开发中...
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">收入统计</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            图表功能开发中...
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;