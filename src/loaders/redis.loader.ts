import Redis from 'ioredis';
import { getConfig } from '@config';
import { LoggerService } from '@utils';

export class RedisConnection {
  private static instance: RedisConnection;
  private client: Redis | null = null;
  private readonly logger: LoggerService;

  private constructor() {
    this.logger = LoggerService.createContextLogger('RedisConnection');
  }

  public static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection();
    }
    return RedisConnection.instance;
  }

  public async connect(): Promise<Redis> {
    if (this.client) {
      return this.client;
    }

    const config = getConfig();
    const options = config.redis.getConnectionOptions();

    this.client = new Redis({
      ...options,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      this.logger.info('Redis connection established', {
        host: config.redis.host,
        port: config.redis.port,
        db: config.redis.db,
      });
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis connection error', error);
    });

    this.client.on('close', () => {
      this.logger.warn('Redis connection closed');
    });

    this.client.on('reconnecting', () => {
      this.logger.info('Redis reconnecting...');
    });

    return this.client;
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.logger.info('Redis connection closed');
    }
  }

  public getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis not connected. Call connect() first.');
    }
    return this.client;
  }

  public healthCheck(): boolean {
    return this.client !== null && this.client.status === 'ready';
  }
}

export class CacheService {
  private readonly client: Redis;
  private readonly keyPrefix: string;
  private readonly defaultTTL: number;
  private readonly logger: LoggerService;

  constructor() {
    this.client = RedisConnection.getInstance().getClient();
    const config = getConfig();
    this.keyPrefix = config.redis.key_prefix;
    this.defaultTTL = config.redis.ttl;
    this.logger = LoggerService.createContextLogger('CacheService');
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(this.getKey(key));
      if (!data) {
        return null;
      }
      return JSON.parse(data) as T;
    } catch (error) {
      this.logger.error(`Failed to get cache key: ${key}`, error);
      return null;
    }
  }

  public async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const actualTTL = ttl ?? this.defaultTTL;
      await this.client.setex(this.getKey(key), actualTTL, serialized);
    } catch (error) {
      this.logger.error(`Failed to set cache key: ${key}`, error);
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      await this.client.del(this.getKey(key));
    } catch (error) {
      this.logger.error(`Failed to delete cache key: ${key}`, error);
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(this.getKey(key));
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check cache key existence: ${key}`, error);
      return false;
    }
  }

  public async clearPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(this.getKey(pattern));
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      this.logger.error(`Failed to clear cache pattern: ${pattern}`, error);
    }
  }

  public async getOrSet<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fn();
    await this.set(key, value, ttl);
    return value;
  }
}

export const getRedis = (): RedisConnection => RedisConnection.getInstance();
export const getCache = (): CacheService => new CacheService();
