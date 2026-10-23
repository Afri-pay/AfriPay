import { ExecutionContext, HttpException } from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard';

describe('RateLimitGuard', () => {
  it('limits repeated requests and resets after the window', () => {
    jest.useFakeTimers();
    process.env.API_RATE_LIMIT = '2';
    const context = { switchToHttp: () => ({ getRequest: () => ({ ip: '127.0.0.1' }) }) } as unknown as ExecutionContext;
    const guard = new RateLimitGuard();
    try {
      expect(guard.canActivate(context)).toBe(true);
      expect(guard.canActivate(context)).toBe(true);
      expect(() => guard.canActivate(context)).toThrow(HttpException);
      jest.advanceTimersByTime(60001);
      expect(guard.canActivate(context)).toBe(true);
    } finally { delete process.env.API_RATE_LIMIT; jest.useRealTimers(); }
  });
});
