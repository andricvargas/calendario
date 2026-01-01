import { Router, Request, Response } from 'express';
import { ValidarTotpUseCase } from '../../src/application/use-cases/ValidarTotpUseCase.js';
import { TotpValidator } from '../../src/infrastructure/totp/TotpValidator.js';

const router = Router();

const totpValidator = new TotpValidator(
  process.env.TOTP_SECRET_SEED || 'JBSWY3DPEHPK3PXP'
);
const validarTotpUseCase = new ValidarTotpUseCase(totpValidator);

router.post('/validate-totp', (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      console.error('[authRoutes] Token no proporcionado o inválido');
      return res.status(400).json({ error: 'Token requerido' });
    }

    console.log('[authRoutes] Validando token TOTP...');
    const isValid = validarTotpUseCase.execute(token);
    console.log('[authRoutes] Resultado de validación:', isValid);

    if (isValid) {
      (req.session as any).authenticated = true;
      console.log('[authRoutes] Autenticación exitosa');
      return res.json({ success: true, message: 'Autenticación exitosa' });
    } else {
      console.log('[authRoutes] Token inválido');
      return res.status(401).json({ error: 'Token inválido' });
    }
  } catch (error: any) {
    console.error('[authRoutes] Error en validación TOTP:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  (req.session as any) = undefined;
  res.json({ success: true, message: 'Sesión cerrada' });
});

router.get('/status', (req: Request, res: Response) => {
  try {
    // Respuesta rápida sin logs excesivos para evitar saturación
    const isAuthenticated = req.session?.authenticated === true;
    
    res.json({
      authenticated: isAuthenticated,
    });
  } catch (error: any) {
    // Solo loguear errores reales, no problemas menores
    if (error.message && !error.message.includes('session')) {
      console.error('[authRoutes] Error en GET /status:', error.message);
    }
    // Si hay un error, asumir que no está autenticado en lugar de devolver 500
    res.json({
      authenticated: false,
    });
  }
});

export default router;

