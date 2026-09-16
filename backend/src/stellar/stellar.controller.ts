import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Networks, TransactionBuilder } from '@stellar/stellar-sdk';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { StellarService } from './stellar.service';

@Controller('stellar')
@UseGuards(ApiKeyGuard)
export class StellarController {
  constructor(private readonly stellar: StellarService) {}

  @Get('accounts/:publicKey')
  account(@Param('publicKey') publicKey: string) { return this.stellar.getAccountSummary(publicKey); }

  @Get('accounts/:publicKey/history')
  history(@Param('publicKey') publicKey: string) { return this.stellar.getHistory(publicKey); }

  @Post('submit')
  submit(@Body() body: { signedXdr?: string; publicKey?: string }) {
    if (!body?.signedXdr || !body.publicKey) throw new BadRequestException('signedXdr and publicKey are required');
    try {
      const transaction = TransactionBuilder.fromXDR(body.signedXdr, Networks.TESTNET);
      if (!('source' in transaction) || transaction.source !== body.publicKey) throw new BadRequestException('Transaction source does not match wallet');
    } catch (error) { if (error instanceof BadRequestException) throw error; throw new BadRequestException('Invalid signed transaction'); }
    return this.stellar.submitSignedTransaction(body.signedXdr);
  }

  @Post('soroban/prepare')
  prepareSoroban(@Body() body: { xdr?: string; publicKey?: string }) {
    return this.stellar.prepareSorobanTransaction(body?.xdr ?? '', body?.publicKey ?? '');
  }

  @Post('soroban/submit')
  submitSoroban(@Body() body: { signedXdr?: string; publicKey?: string }) {
    return this.stellar.submitSorobanTransaction(body?.signedXdr ?? '', body?.publicKey ?? '');
  }

  @Get('soroban/transactions/:hash')
  getSoroban(@Param('hash') hash: string) { return this.stellar.getSorobanTransaction(hash); }

  @Post('accounts/:publicKey/fund-testnet')
  fund(@Param('publicKey') publicKey: string) { return this.stellar.fundTestnet(publicKey); }
}
