import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  @HttpCode(HttpStatus.OK)
  check() {
    const horizonUrl = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
    const sorobanRpcUrl = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
    const port = Number.parseInt(process.env.PORT || '3101', 10);
    return {
      status: 'ok',
      service: 'afripay-backend',
      timestamp: new Date().toISOString(),
      port: Number.isInteger(port) ? port : 3101,
      stellar: {
        network: process.env.STELLAR_NETWORK || 'testnet',
        horizon: { url: horizonUrl, availability: horizonUrl ? 'configured' : 'not-configured' },
        sorobanRpc: { url: sorobanRpcUrl, availability: sorobanRpcUrl ? 'configured' : 'not-configured' },
      },
    };
  }
}
