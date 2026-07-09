import { Controller, Post, Body, Header } from '@nestjs/common';

@Controller('ussd')
export class UssdController {
  @Post()
  @Header('Content-Type', 'text/plain')
  handleUssd(@Body() body: any): string {
    const { text } = body;
    const input = text ? text.split('*') : [];

    if (!text || text === '') {
      return `CON Welcome to Xconfess
1. Send Money
2. Check Balance
3. Transaction History
4. Help`;
    }

    const option = input[0];
    if (option === '1') {
      if (input.length === 1) return 'CON Enter recipient number:';
      if (input.length === 2) return 'CON Enter amount:';
      if (input.length === 3) return 'CON Enter PIN:';
      if (input.length === 4) return 'END Processing transfer...';
    }
    
    return 'END Invalid option.';
  }
}