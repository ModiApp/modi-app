import { RequestHandler } from "express";
import { getLanIp } from "./utils/getLanIPAddress";

// Helper function to check if origin matches a wildcard pattern
const matchesWildcardPattern = (origin: string, pattern: string): boolean => {
  if (pattern.includes('*')) {
    const regexPattern = pattern.replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(origin);
  }
  return origin === pattern;
};

export const cors: RequestHandler = (req, res, next) => {
  const origin = req.headers.origin;
  const isDevelopment = process.env.NODE_ENV !== 'production';

  if (isDevelopment) {
    // In development, allow any origin from the LAN network
    if (origin && (origin.includes(getLanIp()) || origin.includes('localhost'))) {
      res.header('Access-Control-Allow-Origin', origin);
    }
  } else {
    // In production, use strict allowed origins with wildcard support
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [];

    if (origin) {
      const isAllowed = allowedOrigins.some(allowedOrigin => 
        matchesWildcardPattern(origin, allowedOrigin)
      );
      
      if (isAllowed) {
        res.header('Access-Control-Allow-Origin', origin);
      }
    }
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  // Ensure caches/proxies don't reuse CORS headers across origins
  res.header('Vary', 'Origin');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    // Let the browser cache the preflight for a bit to cut down on OPTIONS calls
    res.header('Access-Control-Max-Age', '600'); // 10 minutes (Safari caps around this)
    res.sendStatus(200);
    return;
  }
  
  next();
};