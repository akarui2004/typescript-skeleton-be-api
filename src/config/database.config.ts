export interface IDatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  pool_min: number;
  pool_max: number;
  debug: boolean;
}

export class DatabaseConfig implements IDatabaseConfig {
  public readonly host: string;
  public readonly port: number;
  public readonly name: string;
  public readonly user: string;
  public readonly password: string;
  public readonly pool_min: number;
  public readonly pool_max: number;
  public readonly debug: boolean;

  constructor(data: Record<string, unknown>) {
    this.host = (data.host as string) || 'localhost';
    this.port = (data.port as number) || 5432;
    this.name = (data.name as string) || 'app_db';
    this.user = (data.user as string) || 'postgres';
    this.password = (data.password as string) || 'postgres';
    this.pool_min = (data.pool_min as number) || 2;
    this.pool_max = (data.pool_max as number) || 10;
    this.debug = (data.debug as boolean) ?? false;
  }

  public get connectionString(): string {
    return `postgresql://${this.user}:${this.password}@${this.host}:${this.port}/${this.name}`;
  }

  public get mikrOrmConfig(): Record<string, unknown> {
    return {
      host: this.host,
      port: this.port,
      user: this.user,
      password: this.password,
      dbName: this.name,
      pool: {
        min: this.pool_min,
        max: this.pool_max,
      },
    };
  }
}
