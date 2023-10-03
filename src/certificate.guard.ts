import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ValidatorService } from '@thefirstspine/certificate-authority';

/**
 * Guard for certificate authority
 */
@Injectable()
export class CertificateGuard implements CanActivate {

  constructor() {}

  /**
   * @inheritdoc
   * @param context
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> {
    if (
      !context.switchToHttp().getRequest().headers ||
      !context.switchToHttp().getRequest().headers['x-client-cert']
    ) {
      return false;
    }

    // Get encoding
    const supportedEncoding = {
      'base64': this.decodeBase64.bind(this),
    };
    const encoding: string = context.switchToHttp().getResponse().headers['x-client-cert-encoding'] ?
      context.switchToHttp().getResponse().headers['x-client-cert-encoding'] :
      supportedEncoding[0];
    if (!supportedEncoding[encoding]) {
      console.error(`Unsupported x-client-cert-encoding: ${encoding}`);
      return false;
    }

    // Get public key
    const certificate: string = supportedEncoding[encoding](context.switchToHttp().getRequest().headers['x-client-cert']);

    // Validate
    const validatorService: ValidatorService = new ValidatorService();
    if (!validatorService.challenge(certificate)) {
      console.error(`Cannot challenge the public certificate with private key`);
      return false;
    }

    return true; // ok, next!
  }

  /**
   * Decode base64 input
   * @param input
   */
  protected decodeBase64(input: string): string {
    return Buffer.from(input, 'base64').toString();
  }

}
