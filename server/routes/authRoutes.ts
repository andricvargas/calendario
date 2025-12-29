import { Router, Request, Response } from 'express';
import { ValidarTotpUseCase } from '../../src/application/use-cases/ValidarTotpUseCase';
import { TotpValidator } from '../../src/infrastructure/totp/TotpValidator';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

const totpValidator = new TotpValidator(
  process.env.TOTP_SECRET_SEED || 'JBSWY3DPEHPK3PXP'
);
const validarTotpUseCase = new ValidarTotpUseCase(totpValidator);

router.post('/validate-totp', (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token requerido' });
  }

  const isValid = validarTotpUseCase.execute(token);

  if (isValid) {
    (req.session as any).authenticated = true;
    res.json({ success: true, message: 'Autenticación exitosa' });
  } else {
    res.status(401).json({ error: 'Token inválido' });
  }
});

router.post('/logout', (req: AuthenticatedRequest, res: Response) => {
  req.session = undefined;
  res.json({ success: true, message: 'Sesión cerrada' });
});

router.get('/status', (req: AuthenticatedRequest, res: Response) => {
  res.json({
    authenticated: req.session?.authenticated || false,
  });
});

export default router;

