import { Module } from '@nestjs/common';
import { MomoController } from './momo.controller';
import { MomoWebhookController } from './momo-webhook.controller';
import { MomoService } from './momo.service';
import { MomoAuthService } from './momo-auth.service';
import { MomoTransactionStore } from './momo-transaction.store';

@Module({
  controllers: [MomoController, MomoWebhookController],
  providers: [MomoService, MomoAuthService, MomoTransactionStore],
  exports: [MomoService],
})
export class MomoModule {}
