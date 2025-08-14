import { useState, useEffect } from 'react';

// Temporary replacement for @github/spark/hooks useKV
// This provides localStorage-based persistence for Cloudflare deployment
export function useKV<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const stored = localStorage.getItem(`momfood_${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const updateState = (value: T) => {
    setState(value);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`momfood_${key}`, JSON.stringify(value));
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    }
  };

  return [state, updateState];
}