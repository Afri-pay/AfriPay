import { MomoAuthService } from './momo-auth.service';
import { MomoApiException } from './momo.exceptions';

describe('MomoAuthService', () => {
  let service: MomoAuthService;
  let fetchMock: jest.Mock;

  const setEnv = () => {
    process.env.MTN_MOMO_BASE_URL = 'https://sandbox.momodeveloper.mtn.com';
    process.env.MTN_MOMO_API_KEY = 'sub-key';
    process.env.MTN_MOMO_COLLECTION_API_USER = 'collection-user';
    process.env.MTN_MOMO_COLLECTION_API_SECRET = 'collection-secret';
    process.env.MTN_MOMO_DISBURSEMENT_API_USER = 'disbursement-user';
    process.env.MTN_MOMO_DISBURSEMENT_API_SECRET = 'disbursement-secret';
  };

  beforeEach(() => {
    service = new MomoAuthService();
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
    setEnv();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('requests a collection token using Basic auth and the subscription key', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'tok-123', token_type: 'access_token', expires_in: 3600 }),
    });

    const token = await service.getToken('collection');

    expect(token).toBe('tok-123');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://sandbox.momodeveloper.mtn.com/collection/token/',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Ocp-Apim-Subscription-Key': 'sub-key',
        }),
      }),
    );
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toMatch(/^Basic /);
  });

  it('requests a disbursement token from the disbursement token endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'tok-456', token_type: 'access_token', expires_in: 3600 }),
    });

    const token = await service.getToken('disbursement');

    expect(token).toBe('tok-456');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://sandbox.momodeveloper.mtn.com/disbursement/token/',
      expect.anything(),
    );
  });

  it('caches the token and does not re-fetch until it expires', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'tok-cached', token_type: 'access_token', expires_in: 3600 }),
    });

    const first = await service.getToken('collection');
    const second = await service.getToken('collection');

    expect(first).toBe('tok-cached');
    expect(second).toBe('tok-cached');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('re-fetches after reset()', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'tok-a', token_type: 'access_token', expires_in: 3600 }),
    });
    await service.getToken('collection');
    service.reset();
    await service.getToken('collection');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws MomoApiException when the token endpoint returns a non-OK response', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401 });

    await expect(service.getToken('collection')).rejects.toThrow(MomoApiException);
  });

  it('throws MomoApiException when the network request fails', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    await expect(service.getToken('collection')).rejects.toThrow(MomoApiException);
  });

  it('throws a configuration error when credentials are missing', async () => {
    delete process.env.MTN_MOMO_COLLECTION_API_USER;

    await expect(service.getToken('collection')).rejects.toThrow(/not configured/);
  });
});
