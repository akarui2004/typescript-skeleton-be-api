export interface IAppConfig {
  name: string;
  version: string;
  env: string;
  port: number;
  host: string;
  debug?: boolean;
}

export class AppConfig implements IAppConfig {
  public readonly name: string;
  public readonly version: string;
  public readonly env: string;
  public readonly port: number;
  public readonly host: string;
  public readonly debug: boolean;

  constructor(data: Record<string, unknown>) {
    this.name = (data.name as string) || 'app';
    this.version = (data.version as string) || '1.0.0';
    this.env = (data.env as string) || 'development';
    this.port = (data.port as number) || 3000;
    this.host = (data.host as string) || '0.0.0.0';
    this.debug = (data.debug as boolean) ?? false;
  }

  public get isDevelopment(): boolean {
    return this.env === 'development';
  }

  public get isProduction(): boolean {
    return this.env === 'production';
  }

  public get isTest(): boolean {
    return this.env === 'test';
  }

  public get isStaging(): boolean {
    return this.env === 'staging';
  }
}
