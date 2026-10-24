import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';

/** Per-instance bound; shared edge limits are still required for serverless fleets. */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly clients = new Map<string, { count: number; reset: number }>();
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ ip?: string; socket?: { remoteAddress?: string } }>();
    // Never trust an arbitrary X-Forwarded-For header from the caller.
    const ip = request.ip ?? request.socket?.remoteAddress ?? 'unknown';
    const now = Date.now();
    for (const [key, value] of this.clients) if (value.reset <= now) this.clients.delete(key);
    const configured = Number(process.env.API_RATE_LIMIT ?? 60);
    const limit = Number.isInteger(configured) && configured > 0 ? configured : 60;
    let client = this.clients.get(ip);
    if (!client) {
      if (this.clients.size >= 10000) throw new HttpException('Request capacity exceeded', 429);
      client = { count: 0, reset: now + 60000 };
      this.clients.set(ip, client);
    }
    if (++client.count > limit) throw new HttpException('Too many requests; retry later', 429);
    return true;
  }
}
