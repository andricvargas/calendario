import { Request, Response, NextFunction } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    sessionID?: string;
    session?: {
      authenticated?: boolean;
    };
  }
}

export type AuthenticatedRequest = Request;

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  console.log(`[requireAuth] Verificando autenticación para ${req.method} ${req.path}`);
  console.log(`[requireAuth] Session ID: ${req.sessionID}`);
  console.log(`[requireAuth] Session data:`, req.session);
  console.log(`[requireAuth] Authenticated: ${req.session?.authenticated}`);
  
  if (req.session?.authenticated) {
    console.log(`[requireAuth] Autenticación exitosa`);
    next();
  } else {
    console.log(`[requireAuth] Error: No autenticado`);
    res.status(401).json({ error: 'No autenticado', sessionId: req.sessionID });
  }
}

