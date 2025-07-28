import { Request, Response } from 'express';
import { createGameLogic } from './gameLogic/createGame';

export const createGame = async (req: Request, res: Response) => {
  const userId = req.user?.uid;
  if (!userId) {
    return res.status(401).json({ error: "User is not authenticated" });
  }

  try {
    const result = await createGameLogic(userId);
    res.json(result);
  } catch (error) {
    console.error("CreateGame: Error creating game:", error);
    res.status(500).json({ error: "Error creating game" });
  }
}; 