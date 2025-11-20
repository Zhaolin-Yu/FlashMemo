
import { Memory } from '../types';

const STORAGE_KEY = 'flashmemo_data_v1';

export const getMemories = (): Memory[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    // Backwards compatibility: ensure status exists
    return parsed.map((m: Memory) => ({
      ...m,
      status: m.status || 'processed'
    }));
  } catch (e) {
    console.error("Failed to load memories", e);
    return [];
  }
};

export const saveMemory = (memory: Memory): void => {
  const current = getMemories();
  const updated = [memory, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const updateMemory = (memory: Memory): void => {
  const current = getMemories();
  const index = current.findIndex(m => m.id === memory.id);
  if (index !== -1) {
    current[index] = memory;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  }
};

export const clearMemories = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};
