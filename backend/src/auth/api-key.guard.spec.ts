import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';

describe('ApiKeyGuard', () => {
  const context = (headers: Record<string, string>): ExecutionContext => ({
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  } as unknown as ExecutionContext);

  afterEach(() => {
    delete process.env.API_KEY;
    delete process.env.NODE_ENV;
  });

  it('accepts the configured key', () => {
    process.env.API_KEY = 'test-key';
    expect(new ApiKeyGuard().canActivate(context({ 'x-api-key': 'test-key' }))).toBe(true);
  });

  it('rejects a missing or invalid key', () => {
    process.env.API_KEY = 'test-key';
    expect(() => new ApiKeyGuard().canActivate(context({}))).toThrow(UnauthorizedException);
    expect(() => new ApiKeyGuard().canActivate(context({ 'x-api-key': 'wrong' }))).toThrow(UnauthorizedException);
  });
});
