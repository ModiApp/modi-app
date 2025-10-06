import { useEffect, useRef } from "react";

export function useWarmUpServer() {
  const calledWarmUpServer = useRef(false);
  useEffect(() => {
    if (calledWarmUpServer.current) return;
    calledWarmUpServer.current = true;
    console.log('Warming up server');
    fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/`).then(() => {
      console.log('Server warmed up');
    }).catch((error) => {
      console.error('Failed to warm up server', error);
    });
  }, []);
}