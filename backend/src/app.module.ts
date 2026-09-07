import { Module } from '@nestjs/common';
import { HealthController } from './api/health.controller';
import { RatesModule } from './rates/rates.module';
import { MomoModule } from './momo/momo.module';
import { UssdModule } from './ussd/ussd.module';

@Module({
  imports: [RatesModule, MomoModule, UssdModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}