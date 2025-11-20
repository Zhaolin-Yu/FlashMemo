
import React from 'react';
import { generateId, saveMemory } from '../services/storageService';
import { Memory } from '../types';

interface DevToolsProps {
  isOpen: boolean;
  setCustomDate: (date: Date | null) => void;
  customDate: Date | null;
  onRefresh: () => void;
}

export const DevTools: React.FC<DevToolsProps> = ({ isOpen, setCustomDate, customDate, onRefresh }) => {
  if (!isOpen) return null;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setCustomDate(new Date(e.target.value));
    } else {
      setCustomDate(null);
    }
  };

  const generateRandomMemory = () => {
    const subjects = ["老婆", "老板", "小明", "快递员", "张三", "产品经理"];
    const actions = ["买了", "遇见了", "需要", "完成了", "忘记了", "推荐了"];
    const objects = ["牛奶", "年度报告", "生日礼物", "钥匙", "电影票", "新手机"];
    const times = ["昨天", "上周", "明天早上", "下午五点", "这周末"];
    
    const r = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    
    // Chinese sentence structure
    const content = `我${r(times)}${r(actions)}${r(objects)}，是关于${r(subjects)}的。`;
    const randomTime = Date.now() - Math.floor(Math.random() * 1000000000);

    const mem: Memory = {
      id: generateId(),
      rawContent: content,
      processedContent: content,
      timestamp: randomTime,
      tags: {
        // Minimal tags for simulation, keeping keys English for consistency with system
        People: [subjects[Math.floor(Math.random() * subjects.length)]],
        Action: ["random_gen"]
      },
      status: 'processed' // Explicitly processed
    };
    saveMemory(mem);
    onRefresh();
  };

  return (
    <div className="fixed top-20 right-4 w-64 bg-slate-800 text-slate-200 rounded-lg p-4 shadow-2xl z-[40] text-xs">
      <h3 className="font-bold mb-3 text-slate-400 uppercase">开发者模式</h3>
      
      <div className="mb-4">
        <label className="block mb-1">模拟日期 (用于记录)</label>
        <input 
          type="datetime-local" 
          className="w-full bg-slate-700 rounded p-1 border border-slate-600"
          onChange={handleDateChange}
        />
        {customDate && <p className="mt-1 text-amber-400">生效中: {customDate.toLocaleString('zh-CN')}</p>}
      </div>

      <button 
        onClick={generateRandomMemory}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded transition-colors"
      >
        生成随机记忆
      </button>
    </div>
  );
};
