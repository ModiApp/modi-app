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
  console.log("authenticate: Authenticating request", req.headers);
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const decodedToken = await auth.verifyIdToken(token);
  req.userId = decodedToken.uid;
  next();
};

export default authenticate;
