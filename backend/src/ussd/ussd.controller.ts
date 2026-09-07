import { Controller, Post, Body, Header } from '@nestjs/common';

/** Africa's Talking USSD callback body (application/x-www-form-urlencoded). */
export interface UssdRequestBody {
  sessionId?: string;
  serviceCode?: string;
  phoneNumber?: string;
  text?: string;
}

interface UssdSession {
  sessionId: string;
  phoneNumber?: string;
  updatedAt: number;
  completed: boolean;
}

@Controller('ussd')
export class UssdController {
  private readonly sessions = new Map<string, UssdSession>();

  @Post()
  @Header('Content-Type', 'text/plain')
  handleUssd(@Body() body: UssdRequestBody): string {
    const sessionId = body.sessionId?.trim() || 'anonymous';
    const previous = this.sessions.get(sessionId);
    if (previous && Date.now() - previous.updatedAt > 5 * 60 * 1000) {
      this.sessions.delete(sessionId);
    }
    const { text } = body;
    const input = text ? text.split('*') : [];

    this.sessions.set(sessionId, {
      sessionId,
      phoneNumber: body.phoneNumber,
      updatedAt: Date.now(),
      completed: input.length >= 4,
    });

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
      if (!/^\+?[0-9]{7,15}$/.test(input[1])) {
        return 'END Invalid recipient number. Please start again.';
      }
      return 'CON Enter amount:';
    }
    if (input.length === 3) {
      if (!/^\d+(\.\d{1,2})?$/.test(input[2]) || Number(input[2]) <= 0) {
        return 'END Invalid amount. Please start again.';
      }
      return 'CON Enter PIN:';
    }
    if (input.length === 4) {
      return 'END Processing transfer... You will receive an SMS confirmation shortly.';
    }
    return 'END Invalid input. Please start again.';
  }
}
