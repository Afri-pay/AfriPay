import { Module } from "@nestjs/common";
import { PaymentIntentController } from './payment-intent.controller';
import { PaymentIntentService } from './payment-intent.service';
import { PaymentIntentStore } from './payment-intent.store';
import { StellarModule } from '../stellar/stellar.module';

@Module({ imports: [StellarModule], controllers: [PaymentIntentController], providers: [PaymentIntentService, PaymentIntentStore], exports: [PaymentIntentService] })
export class PaymentsModule {}
