import React, { useState, useEffect } from 'react';
import { dictionaryAPI } from '../services/api';

interface DictionaryOption {
  code: string;
  name: string;
  value: string;
}

interface DictionarySelectProps {
  typeCode: string;
  value?: string;
  onChange: (value: string, option?: DictionaryOption) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const DictionarySelect: React.FC<DictionarySelectProps> = ({
  typeCode,
  value,
  onChange,
  placeholder = '请选择',
  className = '',
  disabled = false
}) => {
  const [options, setOptions] = useState<DictionaryOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        const response = await dictionaryAPI.getItems(typeCode);
        if (response.data.success) {
          setOptions(response.data.data);
        }
      } catch (error) {
        console.error('获取字典选项失败:', error);
      } finally {
        setLoading(false);
      }
    };

    if (typeCode) {
      fetchOptions();
    }
  }, [typeCode]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    const selectedOption = options.find(option => option.code === selectedValue);
    onChange(selectedValue, selectedOption);
  };

  return (
    <select
      value={value || ''}
      onChange={handleChange}
      disabled={disabled || loading}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      <option value="">{loading ? '加载中...' : placeholder}</option>
      {options.map((option) => (
        <option key={option.code} value={option.code}>
          {option.name}
        </option>
      ))}
    </select>
  );
};

export default DictionarySelect;