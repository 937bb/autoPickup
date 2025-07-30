import React, { useState, useEffect } from 'react';
import { pickupCodeAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  HashtagIcon
} from '@heroicons/react/24/outline';

interface PickupCode {
  _id: string;
  code: string;
  productId: string;
  merchantId: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  isExpired: boolean;
  isAvailable: boolean;
}

interface PickupCodeManagerProps {
  productId: string;
}

const PickupCodeManager: React.FC<PickupCodeManagerProps> = ({ productId }) => {
  const [codes, setCodes] = useState<PickupCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState<PickupCode | null>(null);
  
  // 新增提货码表单状态
  const [codeType, setCodeType] = useState<'usage' | 'time'>('usage');
  const [usageLimit, setUsageLimit] = useState(10);
  const [expiresAt, setExpiresAt] = useState('');
  
  // 加载提货码列表
  const loadCodes = async () => {
    setLoading(true);
    try {
      const response = await pickupCodeAPI.getProductCodes(productId);
      if (response.success) {
        setCodes(response.data);
      } else {
        toast.error(response.message || '加载提货码失败');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || '加载提货码失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 初始加载
  useEffect(() => {
    if (productId) {
      loadCodes();
    }
  }, [productId]);
  
  // 创建提货码
  const handleCreateCode = async () => {
    try {
      const data: any = { type: codeType };
      
      if (codeType === 'usage') {
        data.usageLimit = usageLimit;
      } else if (codeType === 'time') {
        if (!expiresAt) {
          toast.error('请选择过期时间');
          return;
        }
        data.expiresAt = expiresAt;
      }
      
      const response = await pickupCodeAPI.createCode(productId, data);
      if (response.success) {
        toast.success('提货码创建成功');
        loadCodes();
        setShowAddModal(false);
        resetForm();
      } else {
        toast.error(response.message || '创建提货码失败');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || '创建提货码失败');
    }
  };
  
  // 更新提货码
  const handleUpdateCode = async () => {
    if (!selectedCode) return;
    
    try {
      const data: any = {};
      
      if (codeType === 'usage') {
        data.usageLimit = usageLimit;
      } else if (codeType === 'time') {
        if (!expiresAt) {
          toast.error('请选择过期时间');
          return;
        }
        data.expiresAt = expiresAt;
      }
      
      const response = await pickupCodeAPI.updateCode(selectedCode._id, data);
      if (response.success) {
        toast.success('提货码更新成功');
        loadCodes();
        setShowEditModal(false);
        setSelectedCode(null);
      } else {
        toast.error(response.message || '更新提货码失败');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || '更新提货码失败');
    }
  };
  
  // 删除提货码
  const handleDeleteCode = async (codeId: string) => {
    if (!window.confirm('确定要删除这个提货码吗？')) return; // 修改这一行，使用 window.confirm
    
    try {
      const response = await pickupCodeAPI.deleteCode(codeId);
      if (response.success) {
        toast.success('提货码删除成功');
        loadCodes();
      } else {
        toast.error(response.message || '删除提货码失败');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || '删除提货码失败');
    }
  };
  
  // 切换提货码状态
  const handleToggleStatus = async (code: PickupCode) => {
    try {
      const response = await pickupCodeAPI.updateCode(code._id, { isActive: !code.isActive });
      if (response.success) {
        toast.success(`提货码${code.isActive ? '禁用' : '启用'}成功`);
        loadCodes();
      } else {
        toast.error(response.message || '操作失败');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || '操作失败');
    }
  };
  
  // 打开编辑模态框
  const openEditModal = (code: PickupCode) => {
    setSelectedCode(code);
    
    if (code.usageLimit) {
      setCodeType('usage');
      setUsageLimit(code.usageLimit);
    } else if (code.expiresAt) {
      setCodeType('time');
      // 将日期格式化为YYYY-MM-DDThh:mm
      const date = new Date(code.expiresAt);
      setExpiresAt(date.toISOString().slice(0, 16));
    }
    
    setShowEditModal(true);
  };
  
  // 重置表单
  const resetForm = () => {
    setCodeType('usage');
    setUsageLimit(10);
    // 设置默认过期时间为7天后
    const defaultExpireDate = new Date();
    defaultExpireDate.setDate(defaultExpireDate.getDate() + 7);
    setExpiresAt(defaultExpireDate.toISOString().slice(0, 16));
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">提货码管理</h2>
        
        {codes.length < 20 ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-1" />
            添加提货码
          </button>
        ) : (
          <span className="text-orange-500 text-sm">
            已达到最大提货码数量限制 (20个)
          </span>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : codes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂无提货码，点击"添加提货码"按钮创建
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  提货码
                </th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  使用情况
                </th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {codes.map((code) => (
                <tr key={code._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <HashtagIcon className="w-5 h-5 text-blue-500 mr-2" />
                      <span className="font-mono font-medium">{code.code}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {code.usageLimit && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <HashtagIcon className="w-3 h-3 mr-1" />
                          使用次数: {code.usageLimit}次
                        </span>
                      )}
                      {code.expiresAt ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          到期时间: {new Date(code.expiresAt).toLocaleDateString()}
                        </span>
                      ) : !code.usageLimit && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          永久有效
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {code.usageLimit ? (
                      <div className="text-sm">
                        <div className="text-gray-900">{code.usedCount} / {code.usageLimit}</div>
                        <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                          <div 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ width: `${(code.usedCount / code.usageLimit) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-900">
                        已使用: {code.usedCount}次
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {!code.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        已禁用
                      </span>
                    ) : code.isExpired ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        已过期
                      </span>
                    ) : code.usageLimit && code.usedCount >= code.usageLimit ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        已用完
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        可用
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {new Date(code.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleStatus(code)}
                        className={`p-1 rounded-full ${code.isActive ? 'text-red-600 hover:bg-red-100' : 'text-green-600 hover:bg-green-100'}`}
                        title={code.isActive ? '禁用' : '启用'}
                      >
                        {code.isActive ? <XCircleIcon className="w-5 h-5" /> : <CheckCircleIcon className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => openEditModal(code)}
                        className="p-1 rounded-full text-blue-600 hover:bg-blue-100"
                        title="编辑"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCode(code._id)}
                        className="p-1 rounded-full text-red-600 hover:bg-red-100"
                        title="删除"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* 添加提货码模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">添加提货码</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  提货码类型
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-blue-600"
                      checked={codeType === 'usage'}
                      onChange={() => setCodeType('usage')}
                    />
                    <span className="ml-2 text-gray-700">使用次数限制</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-blue-600"
                      checked={codeType === 'time'}
                      onChange={() => {
                        setCodeType('time');
                        // 如果当前没有设置过期时间，设置默认值
                        if (!expiresAt) {
                          const defaultExpireDate = new Date();
                          defaultExpireDate.setDate(defaultExpireDate.getDate() + 7);
                          setExpiresAt(defaultExpireDate.toISOString().slice(0, 16));
                        }
                      }}
                    />
                    <span className="ml-2 text-gray-700">时间限制</span>
                  </label>
                </div>
              </div>
              
              {codeType === 'usage' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    使用次数
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    过期时间
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleCreateCode}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 编辑提货码模态框 */}
      {showEditModal && selectedCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">编辑提货码</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                提货码
              </label>
              <div className="px-3 py-2 bg-gray-100 rounded-md font-mono">
                {selectedCode.code}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  提货码类型
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-blue-600"
                      checked={codeType === 'usage'}
                      onChange={() => setCodeType('usage')}
                    />
                    <span className="ml-2 text-gray-700">使用次数限制</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-blue-600"
                      checked={codeType === 'time'}
                      onChange={() => setCodeType('time')}
                    />
                    <span className="ml-2 text-gray-700">时间限制</span>
                  </label>
                </div>
              </div>
              
              {codeType === 'usage' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    使用次数
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    过期时间
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedCode(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleUpdateCode}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PickupCodeManager;