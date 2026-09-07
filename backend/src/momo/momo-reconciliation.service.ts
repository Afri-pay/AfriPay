import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { MomoService } from './momo.service';

@Injectable()
export class MomoReconciliationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MomoReconciliationService.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly momo: MomoService) {}

  onModuleInit(): void {
    const intervalMs = Number(process.env.MOMO_RECONCILIATION_INTERVAL_MS ?? 300000);
    if (process.env.NODE_ENV === 'test' || !Number.isFinite(intervalMs) || intervalMs <= 0) return;
    this.timer = setInterval(() => {
      void this.momo.reconcilePending().catch((error) => {
        this.logger.error(`Scheduled MoMo reconciliation failed: ${error}`);
      });
    }, intervalMs);
    this.timer.unref();
  }

  onModuleDestroy(): void { if (this.timer) clearInterval(this.timer); }
}
