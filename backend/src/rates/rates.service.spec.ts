import { RatesService } from './rates.service';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
  }));
});

describe('RatesService', () => {
  let service: RatesService;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    service = new RatesService();
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    process.env.OPEN_EXCHANGE_RATES_APP_ID = 'test-app-id';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and returns a rate with source + timestamp', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ rates: { NGN: 1550.25 } }),
    });

    const result = await service.getRate('USD', 'NGN');

    expect(result.from).toBe('USD');
    expect(result.to).toBe('NGN');
    expect(result.rate).toBe(1550.25);
    expect(result.source).toBe('openexchangerates.org');
    expect(result.timestamp).toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws when the provider returns a non-OK response', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    await expect(service.getRate('USD', 'NGN')).rejects.toThrow(
      'Exchange rate provider error: 500',
    );
  });

  it('throws when the requested currency is missing from the response', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ rates: {} }),
    });

    await expect(service.getRate('USD', 'NGN')).rejects.toThrow(
      'No rate found for USD -> NGN',
    );
  });
});
