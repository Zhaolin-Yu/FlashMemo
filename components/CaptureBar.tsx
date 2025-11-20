
import React, { useState, useRef } from 'react';
import { analyzeInput } from '../services/geminiService';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleTextSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    // Text mode: Instant save, process later
    const timestamp = customDate ? customDate.getTime() : Date.now();
    
    const newMemory: Memory = {
        id: generateId(),
        rawContent: text,
        processedContent: text, // Default to raw for now
        timestamp: timestamp,
        tags: {}, // Empty tags
        status: 'pending'
    };

    saveMemory(newMemory);
    setText('');
    onMemoryAdded();
    triggerSuccess();
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
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' }); // Standard browser container
        processAudio(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("无法访问麦克风。");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Audio mode: Must process immediately to get text transcription
  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64Content = base64data.split(',')[1];
        const mimeType = base64data.split(';')[0].split(':')[1];

        // Use custom date if dev mode set it, else now
        const timestamp = customDate ? customDate.getTime() : Date.now();
        const contextDate = new Date(timestamp);

        const result = await analyzeInput({ mimeType, data: base64Content }, contextDate);

        const newMemory: Memory = {
            id: generateId(),
            rawContent: "[语音记录]",
            processedContent: result.processedContent,
            timestamp: timestamp,
            tags: result.tags,
            status: 'processed'
        };

        saveMemory(newMemory);
        onMemoryAdded();
        triggerSuccess();
      };
    } catch (error) {
      console.error("Audio processing failed", error);
      alert("语音处理失败，请重试。");
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerSuccess = () => {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="max-w-2xl mx-auto flex flex-col gap-2">
        
        {/* Status Indicators */}
        {isProcessing && (
          <div className="text-xs text-brand-600 font-medium animate-pulse text-center">
            AI 正在转录语音...
          </div>
        )}
        
        {showSuccess && !isProcessing && (
           <div className="text-xs text-emerald-600 font-medium text-center animate-bounce">
             ✨ 记忆已记录
           </div>
        )}
        
        {isDeveloperMode && customDate && (
           <div className="text-xs text-amber-600 font-mono text-center">
             记录时间设定为: {customDate.toLocaleString('zh-CN')}
           </div>
        )}

        <form onSubmit={handleTextSubmit} className="relative flex items-center gap-2">
          <input 
            type="text" 
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isProcessing || isRecording}
            placeholder={isRecording ? "正在听..." : "捕捉一个想法 (Enter 速记)..."}
            className="w-full bg-slate-100 text-slate-800 rounded-full px-5 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50 transition-all shadow-inner"
          />
          
          {text.length > 0 ? (
            <button 
              type="submit"
              disabled={isProcessing}
              className="absolute right-2 p-2 bg-brand-600 text-white rounded-full hover:bg-brand-700 disabled:bg-slate-300 transition-colors shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`absolute right-2 p-2 rounded-full transition-all shadow-md ${isRecording ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200' : 'bg-white text-brand-600 hover:bg-brand-50 border border-slate-100'}`}
            >
              {isRecording ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
              )}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
