import React, { useEffect, useState, useMemo, useRef } from 'react';
import { CaptureBar } from './components/CaptureBar';
import { SmartSuggestions } from './components/SmartSuggestions';
import { ResultsView } from './components/ResultsView';
import { DevTools } from './components/DevTools';
import { getMemories, clearMemories, updateMemory } from './services/storageService';
import { semanticSearch, analyzeInput } from './services/geminiService';
import { Memory, SearchResult } from './types';

// --- Memory Card Component ---
interface MemoryCardProps {
  memory: Memory;
  isPlaying: boolean;
  onPlay: (e: React.MouseEvent) => void;
  devMode: boolean;
}

const MemoryCard: React.FC<MemoryCardProps> = ({ memory, isPlaying, onPlay, devMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isPending = memory.status === 'pending';
  const hasAudio = !!memory.audioData;

  const formatMemoryDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isThisYear = date.getFullYear() === now.getFullYear();

    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      ...(isThisYear ? {} : { year: 'numeric' })
    });
  };

  return (
    <div 
      onClick={() => setIsExpanded(!isExpanded)}
      className={`
        rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden
        ${isPending 
          ? 'border-l-4 border-l-amber-300 border-r-slate-200 border-y-slate-200 bg-amber-50/30 hover:shadow-sm' 
          : 'border-slate-100 bg-white hover:shadow-md hover:border-brand-100'
        }
      `}
    >
      <div className="p-4">
        {/* Header: Date & Status */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
             <span className={`text-[10px] font-bold uppercase tracking-wider ${isPending ? 'text-amber-600' : 'text-slate-400'}`}>
               {formatMemoryDate(memory.timestamp)}
             </span>
             {isPending && (
               <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] rounded-full font-medium">
                 未整理
               </span>
             )}
             {devMode && <span className="font-mono text-[9px] text-slate-300">#{memory.id.slice(0,4)}</span>}
          </div>
          
          {/* Processed: Play Icon Indicator (Collapsed View) */}
          {!isPending && !isExpanded && hasAudio && (
             <button
                onClick={onPlay}
                className={`p-1.5 rounded-full transition-colors z-10 ${isPlaying ? 'bg-brand-100 text-brand-600 animate-pulse' : 'bg-slate-50 text-slate-400 hover:text-brand-500 hover:bg-brand-50'}`}
                title="播放录音"
             >
               {isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
               ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
               )}
             </button>
          )}
        </div>

        {/* Content Body */}
        <div className="space-y-3">
          
          {/* PENDING STATE */}
          {isPending && (
            <div className="flex items-start justify-between gap-4">
               <p className={`text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium transition-all ${isExpanded ? '' : 'line-clamp-3'}`}>
                  {memory.rawContent}
               </p>
               {hasAudio && (
                  <button 
                    onClick={onPlay}
                    className={`flex-shrink-0 p-3 rounded-full shadow-sm transition-colors ${isPlaying ? 'bg-brand-100 text-brand-600' : 'bg-white border border-slate-200 text-slate-500 hover:text-brand-600 hover:border-brand-200'}`}
                  >
                    {isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    )}
                  </button>
               )}
            </div>
          )}

          {/* PROCESSED STATE */}
          {!isPending && (
            <>
               {/* Main AI Content (Always Visible) */}
               <div>
                 {isExpanded && <span className="text-[10px] font-bold text-brand-300 uppercase tracking-widest block mb-1 animate-pulse">AI 整理</span>}
                 <p className={`text-slate-800 text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                   {memory.processedContent}
                 </p>
               </div>

               {/* Animated Expandable Area: Original Text */}
               <div 
                  className={`grid transition-[grid-template-rows] duration-500 ease-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
               >
                 <div className="overflow-hidden">
                    {/* Inner container adds opacity fade */}
                    <div className={`pt-3 transition-opacity duration-500 delay-75 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                       
                       {/* Original Content Section */}
                       <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">原始记录</span>
                             {hasAudio && (
                               <span className="text-[10px] text-brand-500 font-medium flex items-center gap-1">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                                 语音
                               </span>
                             )}
                          </div>
                          <div className="flex items-start justify-between gap-3">
                              <p className="text-xs text-slate-500 leading-relaxed italic whitespace-pre-wrap">{memory.rawContent}</p>
                              {hasAudio && (
                                 <button 
                                   onClick={onPlay}
                                   className={`p-1.5 rounded-md border transition-colors flex-shrink-0 ${isPlaying ? 'bg-brand-100 border-brand-200 text-brand-600' : 'bg-white border-slate-200 text-slate-400 hover:text-brand-500'}`}
                                 >
                                   {isPlaying ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                                   ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                   )}
                                 </button>
                              )}
                          </div>
                       </div>
                    </div>
                 </div>
               </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


// --- Main App Component ---
const App: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessingPending, setIsProcessingPending] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Dev Mode State
  const [devMode, setDevMode] = useState(false);
  const [customDate, setCustomDate] = useState<Date | null>(null);

  const refreshMemories = () => {
    const loaded = getMemories();
    // Sort by timestamp descending (newest first)
    const sorted = loaded.sort((a, b) => b.timestamp - a.timestamp);
    setMemories(sorted);
  };

  useEffect(() => {
    refreshMemories();
  }, []);

  // Memoize processed memories to pass to SmartSuggestions
  const processedMemories = useMemo(() => memories.filter(m => m.status === 'processed'), [memories]);

  const handleSearch = async (text: string) => {
    if (!text.trim()) {
        handleClearSearch();
        return;
    }
    
    setQuery(text);
    setIsSearching(true);
    try {
      const result = await semanticSearch(text, processedMemories);
      setSearchResult(result);
    } catch (error) {
      console.error("Search error", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setSearchResult(null);
    setIsSearching(false);
  };

  const handleBatchProcess = async () => {
    const pending = memories.filter(m => m.status === 'pending');
    if (pending.length === 0) return;

    setIsProcessingPending(true);
    try {
        for (const mem of pending) {
            const contextDate = new Date(mem.timestamp);
            let result;
            
            // Check if memory has audio data
            if (mem.audioData && mem.mimeType) {
               result = await analyzeInput({ mimeType: mem.mimeType, data: mem.audioData }, contextDate);
            } else {
               result = await analyzeInput(mem.rawContent, contextDate);
            }
            
            const updatedMem: Memory = {
                ...mem,
                processedContent: result.processedContent,
                tags: result.tags,
                status: 'processed'
            };
            updateMemory(updatedMem);
        }
        refreshMemories();
    } catch (e) {
        console.error("Batch processing failed", e);
        alert("部分记忆整理失败，请重试");
    } finally {
        setIsProcessingPending(false);
    }
  };

  const playAudio = (mem: Memory, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent toggling the card when clicking play
    if (!mem.audioData || !mem.mimeType) return;
    
    if (playingAudioId === mem.id && audioRef.current) {
        audioRef.current.pause();
        setPlayingAudioId(null);
        return;
    }

    if (audioRef.current) {
        audioRef.current.pause();
    }

    const audio = new Audio(`data:${mem.mimeType};base64,${mem.audioData}`);
    audioRef.current = audio;
    audio.onended = () => setPlayingAudioId(null);
    audio.play();
    setPlayingAudioId(mem.id);
  };

  const pendingCount = memories.filter(m => m.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans relative">
      
      {/* Header / Search Area */}
      <header className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-30 pt-8 pb-4 px-4 md:px-0 border-b border-slate-100 transition-all">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 
                onClick={handleClearSearch}
                className="text-2xl font-bold text-slate-900 tracking-tight cursor-pointer select-none"
            >
              Flash<span className="text-brand-600">Memo</span>
            </h1>
            <button 
                onClick={() => setDevMode(!devMode)}
                className={`p-1.5 rounded-md transition-colors ${devMode ? 'bg-brand-100 text-brand-700' : 'text-slate-300 hover:text-slate-500'}`}
                title="切换开发者模式"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
            </button>
          </div>

          <div className="relative group">
             {/* Back Button */}
             {(searchResult || isSearching || query) && (
                <button 
                    onClick={handleClearSearch}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all z-10"
                    title="清除搜索"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                </button>
             )}

             <input 
                type="text"
                maxLength={160}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                placeholder="询问你的记忆库..."
                className={`w-full bg-white border border-slate-200 text-lg py-4 rounded-2xl shadow-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all placeholder:text-slate-400 ${
                    (searchResult || isSearching || query) ? 'pl-14 pr-14' : 'px-5'
                }`}
             />
             
             {query ? (
                 <button 
                    onClick={() => handleSearch(query)}
                    disabled={isSearching}
                    className="absolute right-3 top-3 p-2 bg-brand-50 rounded-xl text-brand-600 hover:bg-brand-100 transition-colors disabled:opacity-50"
                 >
                    {isSearching ? (
                         <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    )}
                 </button>
             ) : (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 md:px-0 pb-32">
        
        {searchResult ? (
            <ResultsView 
              result={searchResult} 
              isLoading={isSearching} 
              memories={memories}
            />
        ) : (
            <div className="mt-8 animate-fade-in">
                {!isSearching && (
                    <SmartSuggestions 
                        memories={processedMemories} 
                        onSelect={handleSearch} 
                    />
                )}

                <div className="mt-8">
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h2 className="text-slate-400 font-bold text-xs uppercase tracking-wider">
                            {devMode ? `原始数据库 (${memories.length})` : '近期记忆'}
                        </h2>
                        <div className="flex items-center gap-3">
                            {pendingCount > 0 && (
                                <button 
                                    onClick={handleBatchProcess}
                                    disabled={isProcessingPending}
                                    className="flex items-center gap-1.5 text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-200 transition-colors disabled:opacity-60 font-semibold"
                                >
                                    {isProcessingPending ? (
                                        <>
                                            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>整理中 ({pendingCount})</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                            <span>AI 整理 ({pendingCount})</span>
                                        </>
                                    )}
                                </button>
                            )}
                            {devMode && (
                                <button onClick={() => { clearMemories(); refreshMemories(); }} className="text-xs text-red-400 hover:text-red-600">
                                    清空所有
                                </button>
                            )}
                        </div>
                    </div>

                    {memories.length === 0 ? (
                         <div className="text-center mt-12 opacity-50">
                            <div className="inline-block p-4 bg-slate-100 rounded-full mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path><path d="M8.5 8.5a2.12 2.12 0 1 1 3 3"></path><path d="M7.5 13.5a2.12 2.12 0 1 1 3 3"></path><path d="M10.5 16.5a2.12 2.12 0 1 1 3 3"></path></svg>
                            </div>
                            <p className="text-slate-500">暂无记忆。在下方捕捉你的第一个想法。</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {memories.map(m => (
                                <MemoryCard 
                                    key={m.id} 
                                    memory={m} 
                                    isPlaying={playingAudioId === m.id}
                                    onPlay={(e) => playAudio(m, e)}
                                    devMode={devMode}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}
      
      </main>

      <CaptureBar 
        onMemoryAdded={refreshMemories} 
        customDate={customDate} 
        isDeveloperMode={devMode} 
      />

      <DevTools 
        isOpen={devMode} 
        setCustomDate={setCustomDate} 
        customDate={customDate} 
        onRefresh={refreshMemories}
      />
    </div>
  );
};

export default App;