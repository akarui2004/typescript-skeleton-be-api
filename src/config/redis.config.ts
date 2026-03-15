export interface IRedisConfig {
  host: string;
  port: number;
  password: string;
  db: number;
  key_prefix: string;
  ttl: number;
}

export class RedisConfig implements IRedisConfig {
  public readonly host: string;
  public readonly port: number;
  public readonly password: string;
  public readonly db: number;
  public readonly key_prefix: string;
  public readonly ttl: number;

  constructor(data: Record<string, unknown>) {
    this.host = (data.host as string) || 'localhost';
    this.port = (data.port as number) || 6379;
    this.password = (data.password as string) || '';
    this.db = (data.db as number) || 0;
    this.key_prefix = (data.key_prefix as string) || 'app:';
    this.ttl = (data.ttl as number) || 3600;
  }

  public getConnectionOptions(): Record<string, unknown> {
    const options: Record<string, unknown> = {
      host: this.host,
      port: this.port,
      db: this.db,
    };

    if (this.password) {
      options.password = this.password;
    }

    return options;
  }

  public getPrefixedKey(key: string): string {
    return `${this.key_prefix}${key}`;
  }
}
