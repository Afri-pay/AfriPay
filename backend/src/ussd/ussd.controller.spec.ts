import { UssdController } from './ussd.controller';

describe('UssdController', () => {
  let controller: UssdController;

  beforeEach(() => {
    controller = new UssdController();
  });

  it('shows AfriPay welcome menu on empty session', () => {
    const response = controller.handleUssd({});
    expect(response).toContain('Welcome to AfriPay');
    expect(response).not.toContain('Xconfess');
    expect(response).toMatch(/^CON/);
  });

  it('walks through send-money flow', () => {
    expect(controller.handleUssd({ text: '1' })).toBe('CON Enter recipient number:');
    expect(controller.handleUssd({ text: '1*0812345678' })).toBe('CON Enter amount:');
    expect(controller.handleUssd({ text: '1*0812345678*5000' })).toBe('CON Enter PIN:');
    expect(controller.handleUssd({ text: '1*0812345678*5000*1234' })).toMatch(/^END Processing transfer/);
  });

  it('handles balance, history, and help options', () => {
    expect(controller.handleUssd({ text: '2' })).toMatch(/^END Balance:/);
    expect(controller.handleUssd({ text: '3' })).toMatch(/^END No recent transactions/);
    expect(controller.handleUssd({ text: '4' })).toMatch(/^END AfriPay Help/);
  });

  it('rejects invalid menu options', () => {
    expect(controller.handleUssd({ text: '9' })).toMatch(/^END Invalid option/);
  });
});
