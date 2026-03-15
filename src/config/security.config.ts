export interface ISecurityConfig {
  jwt_secret: string;
  jwt_expires_in: string;
  bcrypt_rounds: number;
  rate_limit_window_ms: number;
  rate_limit_max_requests: number;
}

export class SecurityConfig implements ISecurityConfig {
  public readonly jwt_secret: string;
  public readonly jwt_expires_in: string;
  public readonly bcrypt_rounds: number;
  public readonly rate_limit_window_ms: number;
  public readonly rate_limit_max_requests: number;

  constructor(data: Record<string, unknown>) {
    this.jwt_secret = (data.jwt_secret as string) || 'default-secret-change-me';
    this.jwt_expires_in = (data.jwt_expires_in as string) || '24h';
    this.bcrypt_rounds = (data.bcrypt_rounds as number) || 12;
    this.rate_limit_window_ms = (data.rate_limit_window_ms as number) || 900000;
    this.rate_limit_max_requests = (data.rate_limit_max_requests as number) || 100;
  }

  public get rateLimitConfig(): { windowMs: number; max: number } {
    return {
      windowMs: this.rate_limit_window_ms,
      max: this.rate_limit_max_requests,
    };
  }
}
