import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RateLimitGuard } from './auth/rate-limit.guard';
import { HealthController } from './api/health.controller';
import { RatesModule } from './rates/rates.module';
import { MomoModule } from './momo/momo.module';
import { UssdModule } from './ussd/ussd.module';
import { PaymentsModule } from './payments/payments.module';
import { StellarModule } from './stellar/stellar.module';

@Module({
  imports: [RatesModule, MomoModule, UssdModule, PaymentsModule, StellarModule],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: RateLimitGuard }],
})
export class AppModule {}
