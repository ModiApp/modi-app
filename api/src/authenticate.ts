import { RequestHandler } from "express";
import { auth } from "./firebase";

declare global {
  namespace Express {
    interface Request extends AuthenticatedRequest {}
  }
}

export interface AuthenticatedRequest {
  userId: string;
}

/**
 * Get the authenticated user from firebase auth
 */
const authenticate: RequestHandler = async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log(`[AUTH] Authorization header: "${authHeader}"`);
  const token = authHeader?.split(" ")[1];
  console.log(`[AUTH] Extracted token (first 50 chars): "${token?.substring(0, 50)}"`);
  if (!token || token === 'undefined' || token === 'null') {
    console.log('[AUTH] No valid token provided');
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.userId = decodedToken.uid;
    next();
  } catch (error: any) {
    console.error('[AUTH] Token verification failed:', error.message);
    res.status(401).json({ error: "Unauthorized", details: error.message });
  }
};

export default authenticate;
