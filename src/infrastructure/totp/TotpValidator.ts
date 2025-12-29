import { authenticator } from 'otplib';

export class TotpValidator {
  private secret: string;

  constructor(secretSeed: string = 'JBSWY3DPEHPK3PXP') {
    this.secret = secretSeed;
  }

  validateToken(token: string): boolean {
    try {
      return authenticator.verify({
        token,
        secret: this.secret,
      });
    } catch (error) {
      return false;
    }
  }

  generateSecret(): string {
    return authenticator.generateSecret();
  }

  generateToken(): string {
    return authenticator.generate(this.secret);
  }
}

