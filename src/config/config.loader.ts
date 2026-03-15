import * as fs from 'fs';
import * as path from 'path';
import TOML from 'smol-toml';
import { AppConfig } from './app.config';
import { DatabaseConfig } from './database.config';
import { RedisConfig } from './redis.config';
import { LoggerConfig } from './logger.config';
import { SecurityConfig } from './security.config';

export type Environment = 'development' | 'staging' | 'production' | 'test';

export interface IConfig {
  app: AppConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  logger: LoggerConfig;
  security: SecurityConfig;
}

export class ConfigLoader {
  private static instance: ConfigLoader;
  private config: IConfig;
  private readonly configDir: string;

  private constructor() {
    this.configDir = path.resolve(process.cwd(), 'config');
    this.config = this.loadConfig();
  }

  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  private getEnvironment(): Environment {
    return (process.env.NODE_ENV as Environment) || 'development';
  }

  private loadConfig(): IConfig {
    const env = this.getEnvironment();
    
    // Load default config first
    const defaultConfig = this.loadTomlFile('default.toml');
    
    // Load environment-specific config
    const envConfig = this.loadTomlFile(`${env}.toml`);
    
    // Merge configurations (environment config overrides default)
    const mergedConfig = this.deepMerge(defaultConfig, envConfig);
    
    // Override with environment variables if present
    const finalConfig = this.applyEnvOverrides(mergedConfig);
    
    return this.createConfigInstances(finalConfig);
  }

  private loadTomlFile(filename: string): Record<string, unknown> {
    const filePath = path.join(this.configDir, filename);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`Config file not found: ${filename}, skipping...`);
      return {};
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    return TOML.parse(content) as Record<string, unknown>;
  }

  private deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
    const result = { ...target };
    
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
        result[key] = this.deepMerge(
          target[key] as Record<string, unknown>,
          source[key] as Record<string, unknown>
        );
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  private applyEnvOverrides(config: Record<string, unknown>): Record<string, unknown> {
    const envMappings: Record<string, string> = {
      'APP_PORT': 'app.port',
      'APP_HOST': 'app.host',
      'DB_HOST': 'database.host',
      'DB_PORT': 'database.port',
      'DB_NAME': 'database.name',
      'DB_USER': 'database.user',
      'DB_PASSWORD': 'database.password',
      'REDIS_HOST': 'redis.host',
      'REDIS_PORT': 'redis.port',
      'REDIS_PASSWORD': 'redis.password',
      'JWT_SECRET': 'security.jwt_secret',
      'LOG_LEVEL': 'logger.level',
    };

    for (const [envKey, configPath] of Object.entries(envMappings)) {
      const envValue = process.env[envKey];
      if (envValue) {
        this.setNestedValue(config, configPath, envValue);
      }
    }

    return config;
  }

  private setNestedValue(obj: Record<string, unknown>, path: string, value: string): void {
    const keys = path.split('.');
    let current: Record<string, unknown> = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (key === undefined) continue;
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }
    
    const lastKey = keys.at(-1);
    if (!lastKey) return;
    
    // Convert to appropriate type
    const existingValue = current[lastKey];
    if (typeof existingValue === 'number') {
      current[lastKey] = parseInt(value, 10);
    } else if (typeof existingValue === 'boolean') {
      current[lastKey] = value === 'true';
    } else {
      current[lastKey] = value;
    }
  }

  private createConfigInstances(config: Record<string, unknown>): IConfig {
    return {
      app: new AppConfig(config.app as Record<string, unknown>),
      database: new DatabaseConfig(config.database as Record<string, unknown>),
      redis: new RedisConfig(config.redis as Record<string, unknown>),
      logger: new LoggerConfig(config.logger as Record<string, unknown>),
      security: new SecurityConfig(config.security as Record<string, unknown>),
    };
  }

  public getConfig(): IConfig {
    return this.config;
  }

  public reload(): void {
    this.config = this.loadConfig();
  }
}

// Export a singleton instance getter
export const getConfig = (): IConfig => ConfigLoader.getInstance().getConfig();
