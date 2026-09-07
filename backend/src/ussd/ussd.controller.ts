import { Controller, Post, Body, Header } from '@nestjs/common';

/** Africa's Talking USSD callback body (application/x-www-form-urlencoded). */
export interface UssdRequestBody {
  sessionId?: string;
  serviceCode?: string;
  phoneNumber?: string;
  text?: string;
}

@Controller('ussd')
export class UssdController {
  @Post()
  @Header('Content-Type', 'text/plain')
  handleUssd(@Body() body: UssdRequestBody): string {
    const { text } = body;
    const input = text ? text.split('*') : [];

    if (!text || text === '') {
      return `CON Welcome to AfriPay
1. Send Money
2. Check Balance
3. Transaction History
4. Help`;
    }

    const option = input[0];

    switch (option) {
      case '1':
        return this.handleSendMoney(input);
      case '2':
        return 'END Balance: NGN 0.00 (demo — connect a wallet or MoMo account to view live balance)';
      case '3':
        return 'END No recent transactions. Send money via option 1 to get started.';
      case '4':
        return `END AfriPay Help
Dial *123# to send money, check balance, or view history.
Support: support@afripay.io`;
      default:
        return 'END Invalid option. Dial again and choose 1-4.';
    }
  }

  private handleSendMoney(input: string[]): string {
    if (input.length === 1) {
      return 'CON Enter recipient number:';
    }
    if (input.length === 2) {
      return 'CON Enter amount:';
    }
    if (input.length === 3) {
      return 'CON Enter PIN:';
    }
    if (input.length === 4) {
      return 'END Processing transfer... You will receive an SMS confirmation shortly.';
    }
    return 'END Invalid input. Please start again.';
  }
}
