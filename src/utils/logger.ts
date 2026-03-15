import pino, { Logger, LoggerOptions } from 'pino';
import { getConfig } from '@config';

export class LoggerService {
  private static instance: LoggerService;
  private readonly logger: Logger;
  private readonly context?: string;

  private constructor(context?: string) {
    const config = getConfig();
    const options: LoggerOptions = {
      level: config.logger.level,
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label) => {
          return { level: label };
        },
      },
    };

    if (config.logger.isPretty) {
      this.logger = pino({
        ...options,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      });
    } else {
      this.logger = pino(options);
    }

    this.context = context;
  }

  public static getInstance(context?: string): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService(context);
    }
    return LoggerService.instance;
  }

  public static createContextLogger(context: string): LoggerService {
    return new LoggerService(context);
  }

  private formatMessage(message: string, data?: Record<string, unknown>): Record<string, unknown> {
    const baseData: Record<string, unknown> = {};
    if (this.context) {
      baseData.context = this.context;
    }
    return { ...baseData, ...data, message };
  }

  public info(message: string, data?: Record<string, unknown>): void {
    this.logger.info(this.formatMessage(message, data));
  }

  public error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    const errorData: Record<string, unknown> = { ...data };
    if (error instanceof Error) {
      errorData.error = error.message;
      errorData.stack = error.stack;
    } else if (error) {
      errorData.error = error;
    }
    this.logger.error(this.formatMessage(message, errorData));
  }

  public warn(message: string, data?: Record<string, unknown>): void {
    this.logger.warn(this.formatMessage(message, data));
  }

  public debug(message: string, data?: Record<string, unknown>): void {
    this.logger.debug(this.formatMessage(message, data));
  }

  public trace(message: string, data?: Record<string, unknown>): void {
    this.logger.trace(this.formatMessage(message, data));
  }

  public fatal(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    const errorData: Record<string, unknown> = { ...data };
    if (error instanceof Error) {
      errorData.error = error.message;
      errorData.stack = error.stack;
    } else if (error) {
      errorData.error = error;
    }
    this.logger.fatal(this.formatMessage(message, errorData));
  }

  public child(bindings: Record<string, unknown>): Logger {
    return this.logger.child(bindings);
  }
}

// Export a default logger instance
export const logger = LoggerService.getInstance();
export const createContextLogger = (context: string): LoggerService => 
  LoggerService.createContextLogger(context);
