import { Controller, Post, Body, Header } from "@nestjs/common";

@Controller("ussd")
export class UssdController {
  // 1. Make this async to handle blockchain operations
  @Post()
  @Header("Content-Type", "text/plain")
  async handleUssd(@Body() body: any): Promise<string> {
    const { text, phoneNumber } = body;
    const input = text ? text.split("*") : [];

    if (!text || text === "") {
      return `CON Welcome to Xconfess
1. Send Money
2. Check Balance
3. Transaction History
4. Help`;
    }

    const option = input[0];
    if (option === "1") {
      if (input.length === 1) return "CON Enter recipient number:";
      if (input.length === 2) return "CON Enter amount:";
      if (input.length === 3) return "CON Enter PIN:";

      // 2. THIS IS WHERE YOU CONNECT YOUR STELLAR LOGIC
      if (input.length === 4) {
        // const recipient = input[1];
        // const amount = input[2];
        // const pin = input[3];
        // const tx = await this.yourStellarService.transfer(phoneNumber, recipient, amount, pin);
        return "END Your transfer is being processed.";
      }
    }

    return "END Invalid option.";
  }
}
