import { Module } from '@nestjs/common';
import { UssdController } from './ussd.controller';

@Module({
  controllers: [UssdController]
})
export class UssdModule {}