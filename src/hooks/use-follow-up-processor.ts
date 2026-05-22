'use client';

import { useEffect, useRef } from 'react';

export function useFollowUpProcessor() {
  const processingRef = useRef(false);

  const processQueue = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      await fetch('/api/run-automation', { method: 'POST' });
    } catch (error) {
      console.error('Queue processor error:', error);
    } finally {
      processingRef.current = false;
    }
  };

  useEffect(() => {
    const interval = setInterval(processQueue, 1000 * 60);
    processQueue();
    return () => clearInterval(interval);
  }, []);
}
