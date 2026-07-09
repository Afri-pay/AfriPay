import { Module } from '@nestjs/common';
import { HealthController } from './api/health.controller';
import { RatesModule } from './rates/rates.module';
import { MomoModule } from './momo/momo.module';

@Module({
  imports: [RatesModule, MomoModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
