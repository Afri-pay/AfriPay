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
    expect(controller.handleUssd({ text: '1*0812345678*5000' })).toContain('No transfer was initiated');
    expect(controller.handleUssd({ text: '1*0812345678*5000*1234' })).toContain('No transfer was initiated');
  });

  it('handles balance, history, and help options', () => {
    expect(controller.handleUssd({ text: '2' })).toMatch(/^END Balance:/);
    expect(controller.handleUssd({ text: '3' })).toMatch(/^END Transaction history is unavailable/);
    expect(controller.handleUssd({ text: '4' })).toMatch(/^END AfriPay Help/);
  });

  it('rejects invalid menu options', () => {
    expect(controller.handleUssd({ text: '9' })).toMatch(/^END Invalid option/);
  });

  it('expires abandoned sessions and rejects malformed input without collecting a PIN', () => {
    jest.useFakeTimers();
    try {
      controller.handleUssd({ sessionId: 'expiry', text: '1' });
      jest.advanceTimersByTime(300001);
      expect(controller.handleUssd({ sessionId: 'expiry', text: '1*0812345678' })).toContain('Session expired');
      expect(controller.handleUssd({ text: 42 } as unknown as Parameters<UssdController['handleUssd']>[0])).toContain('Invalid input');
      expect(controller.handleUssd({ text: '1*invalid' })).toContain('Invalid recipient');
      expect(controller.handleUssd({ text: '1*0812345678*-1' })).toContain('Invalid amount');
    } finally { jest.useRealTimers(); }
  });
});
