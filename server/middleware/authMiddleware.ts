import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  session?: {
    authenticated?: boolean;
  };
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.session?.authenticated) {
    next();
  } else {
    res.status(401).json({ error: 'No autenticado' });
  }
}

