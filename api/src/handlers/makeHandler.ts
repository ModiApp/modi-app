import { AuthenticatedRequest } from "@/authenticate";
import { RequestHandler } from "express";


export function makeRequestHandler<ReqBody, ResBody>(handler: (input: ReqBody & AuthenticatedRequest & Record<string, any>) => Promise<ResBody>): RequestHandler<{}, ResBody, ReqBody> {
  return async (req, res, next) => {
    try {
      const input = { ...(req.body as any), ...(req.params as any) } as ReqBody;
      const userId = req.userId;
      const result = await handler({ ...input, userId });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}