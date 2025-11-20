import React, { useEffect, useState } from 'react';
import { generateSuggestions } from '../services/geminiService';
import { Memory } from '../types';

interface SmartSuggestionsProps {
  memories: Memory[];
  onSelect: (query: string) => void;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ memories, onSelect }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (memories.length > 0) {
      setLoading(true);
      generateSuggestions(memories)
        .then(setSuggestions)
        .catch(() => setSuggestions(["我今天做了什么？", "显示我提到的人", "查看最近的购物"]))
        .finally(() => setLoading(false));
    }
  }, [memories.length]); // Only regen when count changes significantly or on mount

  if (suggestions.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">智能建议</h3>
      <div className="flex flex-wrap gap-2">
        {loading ? (
             <div className="h-8 w-24 bg-slate-200 rounded-full animate-pulse"></div>
        ) : (
          suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(s)}
              className="bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50 text-sm px-4 py-2 rounded-full transition-all shadow-sm active:scale-95"
            >
              {s}
            </button>
          ))
        )}
      </div>
    </div>
  );
};