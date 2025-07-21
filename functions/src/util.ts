import { auth } from "firebase-admin";

const adminAuth = auth();

export async function getUsername(userId: string): Promise<string> {
  const user = await adminAuth.getUser(userId);
  return user.displayName || "Unknown Player";
}