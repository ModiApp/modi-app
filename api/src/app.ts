import cors from 'cors';
import express from 'express';
import { cert, initializeApp } from 'firebase-admin/app';
import helmet from 'helmet';
import { createGame } from './createGame';
import { authMiddleware } from './middleware/auth';

// Initialize Firebase Admin with environment variables
// If FIREBASE_PROJECT_ID is set, use environment variables
// Otherwise, it will try to use default credentials (GCP, etc.)
if (process.env.FIREBASE_PROJECT_ID) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
} else {
  // Use default credentials (works on GCP, local development, etc.)
  initializeApp();
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.post('/api/games', authMiddleware, createGame);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Express server running on port ${PORT}`);
});

export default app; 