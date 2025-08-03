import 'dotenv/config';
import express from "express";
import authenticate from "./authenticate";
import { createGame } from "./handlers/CreateGame";
import { makeRequestHandler } from "./handlers/makeHandler";

const app = express();

app.use(express.json());

// CORS middleware to handle preflight requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    // In development, allow any origin from the LAN network
    if (origin && (origin.includes('192.168.') || origin.includes('localhost'))) {
      res.header('Access-Control-Allow-Origin', origin);
    }
  } else {
    // In production, use strict allowed origins
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [];

    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

app.use('/games', authenticate);

app.post('/games', makeRequestHandler(createGame));

const port = parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOST || '0.0.0.0'; // Bind to all network interfaces

app.listen(port, host, () => {
  console.log(`🚀 Server is running on http://${host}:${port}`);
});
