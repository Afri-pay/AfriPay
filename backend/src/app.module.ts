import { Module } from '@nestjs/common';
import { HealthController } from './api/health.controller';
import { RatesModule } from './rates/rates.module';

@Module({
  imports: [RatesModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
