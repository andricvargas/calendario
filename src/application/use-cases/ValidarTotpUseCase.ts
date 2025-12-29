import { TotpValidator } from '@infrastructure/totp/TotpValidator';

export class ValidarTotpUseCase {
  constructor(private totpValidator: TotpValidator) {}

  execute(token: string): boolean {
    if (!token || token.length !== 6) {
      return false;
    }

    return this.totpValidator.validateToken(token);
  }
}

