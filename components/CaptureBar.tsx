
import React, { useState, useRef, useEffect } from 'react';
import { saveMemory, generateId } from '../services/storageService';
import { Memory } from '../types';

interface CaptureBarProps {
  onMemoryAdded: () => void;
  customDate?: Date | null; // For developer mode
  isDeveloperMode: boolean;
}

export const CaptureBar: React.FC<CaptureBarProps> = ({ onMemoryAdded, customDate, isDeveloperMode }) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`; // Cap at 150px
    }
  }, [text]);

  const handleTextSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    // Text mode: Instant save, process later
    const timestamp = customDate ? customDate.getTime() : Date.now();
    
    const newMemory: Memory = {
        id: generateId(),
        rawContent: text,
        processedContent: text, 
        timestamp: timestamp,
        tags: {}, // Empty tags
        status: 'pending'
    };

    saveMemory(newMemory);
    setText('');
    onMemoryAdded();
    triggerSuccess();
    
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        saveAudioMemory(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("无法访问麦克风。");
    }
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const finishRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  // Save audio locally as pending, do NOT call AI yet
  const saveAudioMemory = async (blob: Blob) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        // Format: "data:audio/webm;base64,......"
        const splitData = base64data.split(',');
        const base64Content = splitData[1];
        const mimeType = splitData[0].split(':')[1].split(';')[0];

        const timestamp = customDate ? customDate.getTime() : Date.now();

        const newMemory: Memory = {
            id: generateId(),
            rawContent: "[语音记录]", // Placeholder until processed
            processedContent: "[语音记录] (待整理)",
            timestamp: timestamp,
            tags: {},
            status: 'pending',
            audioData: base64Content,
            mimeType: mimeType
        };

        saveMemory(newMemory);
        onMemoryAdded();
        triggerSuccess();
      };
    } catch (error) {
      console.error("Audio save failed", error);
      alert("保存语音失败");
    }
  };

  const triggerSuccess = () => {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="max-w-2xl mx-auto flex flex-col gap-2">
        
        {showSuccess && (
           <div className="text-xs text-emerald-600 font-medium text-center animate-bounce">
             ✨ 记忆已记录
           </div>
        )}
        
        {isDeveloperMode && customDate && (
           <div className="text-xs text-amber-600 font-mono text-center">
             记录时间设定为: {customDate.toLocaleString('zh-CN')}
           </div>
        )}

        {isRecording ? (
          <div className="flex items-center justify-between bg-slate-100 rounded-2xl px-2 py-2 min-h-[48px]">
            {/* Left: Pause/Resume */}
            <button 
              onClick={togglePause}
              className={`p-2.5 rounded-full transition-all ${isPaused ? 'bg-amber-100 text-amber-600' : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50'}`}
              title={isPaused ? "继续" : "暂停"}
            >
               {isPaused ? (
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
               ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
               )}
            </button>

            <div className="flex items-center gap-2 px-4">
                <div className={`h-2 w-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-red-500 animate-pulse'}`}></div>
                <span className="text-sm font-medium text-slate-600">{isPaused ? '已暂停' : '正在录音...'}</span>
            </div>

            {/* Right: Send/Finish */}
            <button 
              onClick={finishRecording}
              className="p-2.5 bg-brand-600 text-white rounded-full hover:bg-brand-700 shadow-md transition-all"
              title="完成并保存"
            >
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        ) : (
          <form onSubmit={handleTextSubmit} className="relative flex items-end gap-2">
            <textarea 
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="捕捉一个想法 (Enter 速记)..."
              rows={1}
              className="w-full bg-slate-100 text-slate-800 rounded-2xl px-5 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 transition-all shadow-inner resize-none overflow-hidden min-h-[48px]"
              style={{ lineHeight: '1.5' }}
            />
            
            {text.length > 0 ? (
              <button 
                type="submit"
                className="absolute right-2 bottom-2 p-2 bg-brand-600 text-white rounded-full hover:bg-brand-700 disabled:bg-slate-300 transition-colors shadow-md h-9 w-9 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="absolute right-2 bottom-2 p-2 bg-white text-brand-600 rounded-full hover:bg-brand-50 border border-slate-100 transition-all shadow-md h-9 w-9 flex items-center justify-center"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};