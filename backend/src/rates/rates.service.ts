import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

export interface RateResult {
  from: string;
  to: string;
  rate: number;
  source: string;
  timestamp: string;
}

const CACHE_TTL_SECONDS = 60 * 15; // 15 minutes

@Injectable()
export class RatesService {
  private readonly logger = new Logger(RatesService.name);
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  private cacheKey(from: string, to: string): string {
    return `rate:${from.toUpperCase()}:${to.toUpperCase()}`;
  }

  async getRate(from: string, to: string): Promise<RateResult> {
    const key = this.cacheKey(from, to);

    try {
      const cached = await this.redis.get(key);
      if (cached) {
        return JSON.parse(cached) as RateResult;
      }
    } catch (err) {
      this.logger.warn(`Redis unavailable, skipping cache read: ${err}`);
    }

    const result = await this.fetchFromProvider(from, to);

    try {
      await this.redis.set(key, JSON.stringify(result), 'EX', CACHE_TTL_SECONDS);
    } catch (err) {
      this.logger.warn(`Redis unavailable, skipping cache write: ${err}`);
    }

    return result;
  }

  private async fetchFromProvider(from: string, to: string): Promise<RateResult> {
    const appId = process.env.OPEN_EXCHANGE_RATES_APP_ID;
    const url = `https://openexchangerates.org/api/latest.json?app_id=${appId}&base=${from.toUpperCase()}&symbols=${to.toUpperCase()}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Exchange rate provider error: ${response.status}`);
    }

    const data = (await response.json()) as { rates: Record<string, number> };
    const rate = data.rates?.[to.toUpperCase()];

    if (typeof rate !== 'number') {
      throw new Error(`No rate found for ${from} -> ${to}`);
    }

    return {
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      rate,
      source: 'openexchangerates.org',
      timestamp: new Date().toISOString(),
    };
  }
}
