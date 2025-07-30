import React, { useState, useEffect, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { productAPI, dictionaryAPI } from '../services/api';
import { Product, ProductFormData } from '../types';
import DictionarySelect from './DictionarySelect';

const schema = yup.object({
  name: yup.string().required('请输入商品名称'),
  description: yup.string().required('请输入商品描述'),
  category: yup.string().required('请选择商品分类'),
  price: yup.number().positive('价格必须大于0').required('请输入价格'),
  stock: yup.number().integer('库存必须是整数').min(0, '库存不能小于0').required('请输入库存'),
  deliveryType: yup.string().required('请选择发货类型'),
  deliveryTemplate: yup.string().optional(),
  deliveryData: yup.object().optional(), // 添加发货数据字段
  tags: yup.array().of(yup.string()),
});

type FormData = yup.InferType<typeof schema>;

interface ProductModalProps {
  isOpen: boolean;
  product?: Product | null;
  onClose: () => void;
  onSave: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, product, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
  const [deliveryTemplates, setDeliveryTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateFieldValues, setTemplateFieldValues] = useState<Record<string, any>>({}); // 添加这行

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      price: 0,
      stock: 0,
      deliveryType: '',
      deliveryTemplate: '',
      tags: [],
    },
  });

  const deliveryType = watch('deliveryType');

  // 渲染模板字段的函数（移到组件内部）
  const renderTemplateField = (field: any) => {
    const fieldValue = templateFieldValues[field.name] || field.defaultValue || '';
    
    const updateFieldValue = (value: any) => {
      setTemplateFieldValues((prev: Record<string, any>) => ({
        ...prev,
        [field.name]: value
      }));
    };

    switch (field.type) {
      case 'text':
      case 'url':
      case 'number':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && '*'}
            </label>
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              value={fieldValue}
              onChange={(e) => updateFieldValue(e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );
      
      case 'password':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && '*'}
            </label>
            <input
              type="password"
              value={fieldValue}
              onChange={(e) => updateFieldValue(e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );
      
      case 'textarea':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && '*'}
            </label>
            <textarea
              value={fieldValue}
              onChange={(e) => updateFieldValue(e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );
      
      case 'file':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && '*'}
            </label>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  updateFieldValue(file.name);
                }
              }}
              required={field.required}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  // 获取发货模板
  // 在fetchDeliveryTemplates函数中添加更多调试信息
  // 修复fetchDeliveryTemplates函数 - 添加类型转换
  const fetchDeliveryTemplates = async (deliveryType: string) => {
    try {
      
      // 转换发货类型格式：DELIVERY_TYPE_NETDISK -> netdisk
      let convertedType = deliveryType;
      if (deliveryType.startsWith('DELIVERY_TYPE_')) {
        convertedType = deliveryType.replace('DELIVERY_TYPE_', '').toLowerCase();
      }
      const response = await dictionaryAPI.getDeliveryTemplates(convertedType);
      
      if (response.data.success) {
        
        setDeliveryTemplates(response.data.data);
        
        // 编辑模式：优先使用产品的现有模板 - 修复字段名
        if (product && ((product as any).deliveryTemplateCode || product.deliveryTemplate)) {
          const templateCode = (product as any).deliveryTemplateCode || product.deliveryTemplate;

          
          const existingTemplate = response.data.data.find((t: any) => {
            return t.templateCode === templateCode;
          });
          if (existingTemplate) {
            setSelectedTemplate(existingTemplate);
            setValue('deliveryTemplate', existingTemplate.templateCode);
            return;
          } else {
          }
        }
        
        // 新建模式或找不到现有模板时：使用默认模板
        const defaultTemplate = response.data.data.find((t: any) => t.isDefault);
        if (defaultTemplate) {
          setSelectedTemplate(defaultTemplate);
          setValue('deliveryTemplate', defaultTemplate.templateCode);
        }
      } else {
      }
    } catch (error) {
      console.error('❌ 获取发货模板失败:', error);
    }
  };

  // 处理发货类型变化
  // 修复handleDeliveryTypeChange函数
  const handleDeliveryTypeChange = (value: string, option?: any) => {
    setValue('deliveryType', value);
    if (option) {
      // 使用option.value而不是value，因为value可能是完整的代码
      fetchDeliveryTemplates(option.value || value);
    }
  };
  
  // 修复useEffect中的发货类型获取
  useEffect(() => {
    if (product) {
      
      // 修复reset调用中的字段映射
      reset({
        name: product.name,
        description: product.description,
        category: product.categoryCode?.code || product.category || '',
        price: product.price,
        stock: product.stock,
        deliveryType: product.deliveryTypeCode?.code || product.deliveryType || '',
        // 修复第210-235行的deliveryTemplateCode错误
        deliveryTemplate: (product as any).deliveryTemplateCode || product.deliveryTemplate || '', // 修复字段名
        tags: product.tags || [],
        });
        setTags(product.tags || []);
        
        // 添加更详细的图片设置逻辑
        const imageArray = product.images || [];
        setExistingImages(imageArray);
        
        // 如果产品有发货数据，设置模板字段值
        if (product.deliveryData) {
          setTemplateFieldValues(product.deliveryData);
        }
      
      // 如果有发货类型，获取对应的模板
      const deliveryTypeValue = product.deliveryTypeCode?.code || product.deliveryType;
      if (deliveryTypeValue) {
        fetchDeliveryTemplates(deliveryTypeValue);
      }
    } else {
      reset({
        name: '',
        description: '',
        category: '',
        price: 0,
        stock: 0,
        deliveryType: '',
        deliveryTemplate: '',
        tags: [],
      });
      setTags([]);
      setExistingImages([]);
      setTemplateFieldValues({});
      setSelectedTemplate(null);
      setDeliveryTemplates([]);
    }
  }, [product, reset]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      setValue('tags', newTags);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    setValue('tags', newTags);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = images.length + existingImages.length;
    
    if (totalImages + files.length > 5) {
      toast.error('最多只能上传5张图片');
      return;
    }

    setImages(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviewUrls(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeNewImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    const imageToRemove = existingImages[index];
    setImagesToRemove(prev => [...prev, imageToRemove]);
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      
      // 添加基本字段
      Object.keys(data).forEach(key => {
        if (key !== 'tags' && data[key as keyof FormData] !== undefined) {
          formData.append(key, String(data[key as keyof FormData]));
        }
      });
      
      // 添加标签
      if (tags.length > 0) {
        formData.append('tags', JSON.stringify(tags));
      }
      
      // 添加模板字段数据
      if (selectedTemplate && Object.keys(templateFieldValues).length > 0) {
        formData.append('deliveryData', JSON.stringify(templateFieldValues));
      }
      
      // 添加图片
      images.forEach((image) => {
        formData.append('images', image);
      });
      
      // 添加要删除的图片
      if (imagesToRemove.length > 0) {
        formData.append('imagesToRemove', JSON.stringify(imagesToRemove));
      }
      
      let response;
      if (product) {
        response = await productAPI.updateProduct(product._id, formData);
      } else {
        response = await productAPI.createProduct(formData);
      }
      
      if (response.success) {
        toast.success(product ? '商品更新成功' : '商品创建成功');
        onSave();
        onClose();
      } else {
        toast.error(response.message || '操作失败');
      }
    } catch (error: any) {
      console.error('提交失败:', error);
      toast.error(error.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {product ? '编辑商品' : '添加商品'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 商品名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                商品名称 *
              </label>
              <input
                type="text"
                {...register('name')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="请输入商品名称"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* 商品描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                商品描述 *
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="请输入商品描述"
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* 商品分类 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                商品分类 *
              </label>
              <DictionarySelect
                typeCode="PRODUCT_CATEGORY"
                value={watch('category')}
                onChange={(value) => setValue('category', value)}
                placeholder="请选择商品分类"
                className={errors.category ? 'border-red-500' : ''}
              />
              {errors.category && (
                <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
              )}
            </div>

            {/* 发货类型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                发货类型 *
              </label>
              <DictionarySelect
                typeCode="DELIVERY_TYPE"
                value={watch('deliveryType')}
                onChange={handleDeliveryTypeChange}
                // 修复第440-450行的JSX语法错误
                placeholder="请选择发货类型"
                className={errors.deliveryType ? 'border-red-500' : ''}
              />
              {errors.deliveryType && (
                <p className="text-red-500 text-sm mt-1">{errors.deliveryType.message}</p>
              )}
            </div>  {/* 移除多余的 )} */}

            {/* 发货模板选择 */}
            {deliveryTemplates.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  发货模板
                </label>
                {/* 添加调试信息 */}
                <div className="text-xs text-gray-500 mb-2">
                  调试信息: 模板数量={deliveryTemplates.length}, 选中模板={selectedTemplate?.templateCode || '无'}
                </div>
                <select
                  value={selectedTemplate?.templateCode || ''}
                  onChange={(e) => {
                    const template = deliveryTemplates.find(t => t.templateCode === e.target.value);
                    setSelectedTemplate(template);
                    setValue('deliveryTemplate', e.target.value);
                    // 修复第465-470行的deliveryTemplateCode错误
                    // 只在新建模式或切换到不同模板时重置字段值
                    const currentTemplateCode = product?.deliveryTemplate; // 使用正确的属性名
                    if (!product || (currentTemplateCode !== e.target.value)) {
                      setTemplateFieldValues({});
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择发货模板</option>
                  {deliveryTemplates.map((template) => (
                    <option key={template.templateCode} value={template.templateCode}>
                      {template.templateName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 模板字段填写区域 - 添加更多调试信息 */}
            <div className="text-xs text-gray-500 mb-2">
              fields={selectedTemplate?.fields ? selectedTemplate.fields.length : 0}个字段
            </div>
            {selectedTemplate && selectedTemplate.fields && selectedTemplate.fields.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">发货信息填写</h4>
                <div className="space-y-4">
                  {selectedTemplate.fields.map((field: any) => {
                    return renderTemplateField(field);
                  })}
                </div>
              </div>
            )}

            {/* 价格和库存 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  价格 *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('price', { valueAsNumber: true })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  库存 *
                </label>
                <input
                  type="number"
                  {...register('stock', { valueAsNumber: true })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.stock ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.stock && (
                  <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>
                )}
              </div>
            </div>

            {/* 商品图片 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                商品图片 (最多5张)
              </label>
              
              {/* 现有图片显示 */}
              {existingImages.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    现有图片 ({existingImages.length}张)
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {existingImages.map((image, index) => {
                      
                      return (
                        <div key={index} className="relative group">
                          <img
                            src={`${process.env.REACT_APP_IMG_URL || 'http://localhost:3001'}${image}`}
                            alt={`现有图片 ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setExistingImages(prev => prev.filter((_, i) => i !== index));
                              setImagesToRemove(prev => [...prev, image]);
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* 上传新图片 */}
              {(images.length + existingImages.length) < 5 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {existingImages.length > 0 ? '新增图片' : '上传图片'}
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <PhotoIcon className="w-12 h-12 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        点击选择图片或拖拽到此处
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        支持 JPG、PNG 格式，最多 {5 - images.length - existingImages.length} 张
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* 新上传图片预览 */}
              {imagePreviewUrls.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    新上传图片 ({imagePreviewUrls.length}张)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`新图片 ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>  {/* 添加这个闭合标签来闭合商品图片部分 */}

            {/* 标签 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                商品标签
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入标签后按回车添加"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  添加
                </button>
              </div>
            </div>

            {/* Submit buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>  {/* Add this closing div tag for the mt-3 div */}
      </div>
    </div>
  );
};

export default ProductModal;