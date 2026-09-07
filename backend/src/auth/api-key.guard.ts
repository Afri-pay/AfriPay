import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const configured = process.env.API_KEY?.trim();
    if (!configured) {
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('API authentication is not configured');
      }
      return true;
    }
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const supplied = request.headers['x-api-key'];
    const value = Array.isArray(supplied) ? supplied[0] : supplied;
    if (!value) throw new UnauthorizedException('Missing API key');
    const expected = Buffer.from(configured);
    const actual = Buffer.from(value);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      throw new UnauthorizedException('Invalid API key');
    }
    return true;
  }
}
