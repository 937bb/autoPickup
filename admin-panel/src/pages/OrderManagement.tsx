import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { orderAPI } from '../services/api';
import { Order as OrderType, Product } from '../types'; // 重命名导入的 Order 类型

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await orderAPI.getOrders({
        status: statusFilter || undefined,
        page: currentPage,
        limit: 20
      });
      if (response.success && response.data) {
        setOrders(response.data.orders);
        setTotalPages(response.data.totalPages);
      }
    } catch (error: any) {
      toast.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, currentPage]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await orderAPI.updateOrderStatus(orderId, newStatus);
      if (response.success) {
        toast.success('订单状态更新成功');
        fetchOrders();
      } else {
        toast.error(response.message || '更新失败');
      }
    } catch (error: any) {
      toast.error('更新订单状态失败');
    }
  };

  // 修复：使用正确的属性名
  const filteredOrders = orders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.customer?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">订单管理</h1>
          <p className="text-gray-600 mt-1">管理平台上的所有订单</p>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单号或客户邮箱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">所有状态</option>
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>

          <button
            onClick={fetchOrders}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            刷新
          </button>
        </div>
      </div>

      {/* 订单列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    订单信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    客户信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    商品信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金额
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                      <div className="text-sm text-gray-500">数量: {order.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* 修复：使用正确的属性名 */}
                      <div className="text-sm text-gray-900">{order.customer?.email || '未知'}</div>
                      <div className="text-sm text-gray-500">{order.customer?.phone || '未提供'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* 修复：正确处理 product 类型 */}
                      <div className="text-sm text-gray-900">
                        {typeof order.product === 'object' ? order.product.name : '未知商品'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {typeof order.product === 'object' ? order.product.category : '未知分类'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">¥{order.totalAmount.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800' // expired
                      }`}>
                        {order.status === 'completed' ? '已完成' : 
                         order.status === 'pending' ? '待处理' : 
                         order.status === 'cancelled' ? '已取消' : '已过期'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(order._id, 'completed')}
                            className="text-green-600 hover:text-green-900"
                            title="标记为已完成"
                          >
                            完成
                          </button>
                        )}
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(order._id, 'cancelled')}
                            className="text-red-600 hover:text-red-900"
                            title="取消订单"
                          >
                            取消
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;

// 移除本地 Order 接口定义，使用从 types 导入的 OrderType
// interface Order {
//   _id: string;
//   orderNumber: string;
//   product: Product | string;
//   customer: {
//     email?: string;
//     phone?: string;
//     name?: string;
//   };
//   totalAmount: number;
//   quantity: number;
//   status: 'pending' | 'completed' | 'cancelled' | 'expired';
//   createdAt: string;
//   updatedAt: string;
// }