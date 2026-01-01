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
  // TEMPORALMENTE COMENTADO PARA DEBUG - Siempre permitir acceso
  // console.log(`[requireAuth] Verificando autenticación para ${req.method} ${req.path}`);
  // console.log(`[requireAuth] Session ID: ${req.sessionID}`);
  // console.log(`[requireAuth] Session data:`, req.session);
  // console.log(`[requireAuth] Authenticated: ${req.session?.authenticated}`);
  // console.log(`[requireAuth] Cookies:`, req.headers.cookie);
  
  // if (req.session?.authenticated) {
  //   console.log(`[requireAuth] Autenticación exitosa`);
  //   next();
  // } else {
  //   console.log(`[requireAuth] Error: No autenticado`);
  //   res.status(401).json({ error: 'No autenticado', sessionId: req.sessionID });
  // }
  
  // TEMPORALMENTE: Siempre permitir acceso
  next();
}

