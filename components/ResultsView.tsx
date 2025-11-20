import React, { useRef, useState } from 'react';
import { SearchResult, ResultCluster, ClusterItem, Memory } from '../types';
import html2canvas from 'html2canvas'; // Note: In a real setup, would need to add this package. I will simulate or use simple method.

interface ResultsViewProps {
  result: SearchResult | null;
  isLoading: boolean;
  memories: Memory[];
}

export const ResultsView: React.FC<ResultsViewProps> = ({ result, isLoading, memories }) => {
  const [shareModalCluster, setShareModalCluster] = useState<ResultCluster | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6 mt-8 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-slate-200 rounded-xl"></div>
          <div className="h-32 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="mt-6 pb-32">
      {/* Direct Answer */}
      {result.directAnswer && (
        <div className="bg-gradient-to-r from-brand-50 to-white p-6 rounded-2xl mb-8 border border-brand-100 shadow-sm">
          <div className="flex gap-3">
            <div className="mt-1 text-brand-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <p className="text-slate-800 leading-relaxed font-medium">{result.directAnswer}</p>
          </div>
        </div>
      )}

      {/* Clusters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {result.clusters.map((cluster, idx) => (
          <ClusterCard 
            key={idx} 
            cluster={cluster} 
            onShare={() => setShareModalCluster(cluster)}
          />
        ))}
      </div>

      {shareModalCluster && (
        <ShareModal 
          cluster={shareModalCluster}
          memories={memories} 
          onClose={() => setShareModalCluster(null)} 
        />
      )}
    </div>
  );
};

const ClusterCard: React.FC<{ cluster: ResultCluster; onShare: () => void }> = ({ cluster, onShare }) => {
  const getIcon = (dim: string) => {
    switch(dim.toLowerCase()) {
      case 'people': return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
      case 'action': return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 13 9 20 9"></polyline><path d="M13 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path></svg>;
      case 'time': return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
      default: return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-brand-600">
          <span className="p-1.5 bg-brand-50 rounded-lg">
            {getIcon(cluster.dimension)}
          </span>
          <h4 className="font-bold text-sm uppercase tracking-wide">{cluster.title}</h4>
        </div>
        <button onClick={onShare} className="text-slate-400 hover:text-brand-600" title="Share Card">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
        </button>
      </div>
      
      <ul className="space-y-3 flex-grow">
        {cluster.items.map((item, i) => (
          <li key={i} className="text-sm text-slate-600 leading-snug pl-3 border-l-2 border-slate-100">
            <span className="font-medium text-slate-900 block mb-0.5">{item.snippet}</span>
            {item.relevance && <span className="text-xs text-slate-400">{item.relevance}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

const ShareModal: React.FC<{ cluster: ResultCluster; memories: Memory[]; onClose: () => void }> = ({ cluster, memories, onClose }) => {
  
  const getItemDate = (memoryId: string) => {
      const m = memories.find(x => x.id === memoryId);
      if (!m) return "";
      const d = new Date(m.timestamp);
      const now = new Date();
      const isThisYear = d.getFullYear() === now.getFullYear();
      return d.toLocaleString('zh-CN', { 
          month: 'short', 
          day: 'numeric', 
          ...(isThisYear ? {} : { year: 'numeric' })
      });
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-pulse-slow-in">
        {/* Header */}
        <div className="p-4 flex justify-end">
           <button onClick={onClose} className="text-slate-400 hover:text-slate-800">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
           </button>
        </div>

        {/* Shareable Content Area */}
        <div className="px-8 pb-10 share-target bg-white">
          <div className="flex flex-col items-center text-center">
            <div className="h-12 w-12 bg-brand-500 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-brand-200">
              <span className="text-xl font-bold">{cluster.title.charAt(0)}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">{cluster.title}</h2>
            <p className="text-xs font-medium text-brand-600 uppercase tracking-widest mb-8">{cluster.dimension} 集合</p>
            
            <div className="w-full space-y-4 text-left">
              {cluster.items.map((item, i) => (
                <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                   <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold text-brand-400 uppercase">{getItemDate(item.memoryId)}</span>
                   </div>
                   <p className="text-sm font-medium text-slate-800">{item.snippet}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t w-full flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold tracking-tight">FlashMemo</span>
              <span className="text-[10px]">生成于 {new Date().toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="bg-slate-50 p-4 border-t text-center">
          <button 
            className="text-brand-600 font-semibold text-sm hover:underline"
            onClick={() => {
              alert("图片已生成! (模拟)");
              onClose();
            }}
          >
            保存图片
          </button>
        </div>
      </div>
    </div>
  );
};