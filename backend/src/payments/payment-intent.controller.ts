import { BadRequestException, Body, Controller, Get, Headers, Param, Post, Query, UseGuards } from '@nestjs/common';
import { PaymentIntentService } from './payment-intent.service';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { StellarService } from '../stellar/stellar.service';

interface CreatePaymentBody {
  sender: string;
  recipient: string;
  amount: string;
  asset: string;
}

@Controller('payments')
@UseGuards(ApiKeyGuard)
export class PaymentIntentController {
  constructor(private readonly payments: PaymentIntentService, private readonly stellar: StellarService) {}

  @Post('intents')
  create(@Body() body: CreatePaymentBody, @Headers('idempotency-key') idempotencyKey?: string) {
    if (!idempotencyKey?.trim()) {
      throw new BadRequestException('Idempotency-Key header is required');
    }
    if (!body?.sender || !body?.recipient || !body?.amount || !body?.asset) {
      throw new BadRequestException('sender, recipient, amount and asset are required');
    }
    return this.payments.create({ ...body, idempotencyKey: idempotencyKey.trim() });
  }

  @Get('intents/:id')
  get(@Param('id') id: string) {
    return this.payments.get(id);
  }

  @Post('intents/:id/transaction')
  async buildTransaction(@Param('id') id: string) {
    const intent = this.payments.get(id);
    return this.stellar.buildNativePayment(intent.sender, intent.recipient, intent.amount);
  }

  @Post('intents/:id/submit')
  async submit(@Param('id') id: string, @Body() body: { signedXdr: string }) {
    this.payments.get(id);
    const result = await this.stellar.submitSignedTransaction(body?.signedXdr);
    return this.payments.markSubmitted(id, result.hash);
  }

  @Post('links')
  createLink(@Body() body: { creator: string; amount?: string; asset: string; reference?: string; expiresAt?: string }) {
    if (!body?.creator || !body.asset) throw new BadRequestException('creator and asset are required');
    return this.payments.createLink(body);
  }

  @Get('links/:id')
  getLink(@Param('id') id: string) {
    return this.payments.getLink(id);
  }

  @Get('intents')
  list(@Query('sender') sender?: string) {
    return this.payments.list(sender);
  }
}
