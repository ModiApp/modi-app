import { API_BASE_URL } from '@/config/api';
import { useEffect, useRef } from "react";

export function useWarmUpServer() {
  const calledWarmUpServer = useRef(false);
  useEffect(() => {
    if (calledWarmUpServer.current) return;
    calledWarmUpServer.current = true;
    fetch(`${API_BASE_URL}/`).then(() => {
    }).catch((error) => {
      console.error('Failed to warm up server', error);
    });
  }, []);
}