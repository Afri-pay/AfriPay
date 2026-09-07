import { Module } from '@nestjs/common';
import { HealthController } from './api/health.controller';
import { RatesModule } from './rates/rates.module';
import { MomoModule } from './momo/momo.module';
import { UssdModule } from './ussd/ussd.module';
import { PaymentsModule } from './payments/payments.module';
import { StellarModule } from './stellar/stellar.module';

@Module({
  imports: [RatesModule, MomoModule, UssdModule, PaymentsModule, StellarModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
