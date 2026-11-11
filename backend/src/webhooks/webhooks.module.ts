import { Module } from '@nestjs/common';
import { MomoModule } from '../momo/momo.module';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WebhookReconciliationService } from './webhook-reconciliation.service';

@Module({
  imports: [MomoModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, WebhookReconciliationService],
  exports: [WebhooksService, WebhookReconciliationService],
})
export class WebhooksModule {}
