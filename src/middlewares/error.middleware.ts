import { Request, Response, NextFunction } from 'express';
import { LoggerService, createContextLogger } from '@utils';
import { getConfig } from '@config';

type ErrorRequestHandler = (err: Error, req: Request, res: Response, next: NextFunction) => void;

export class ErrorHandlerMiddleware {
  private static instance: ErrorHandlerMiddleware;
  private readonly logger: LoggerService;
  private readonly config: ReturnType<typeof getConfig>;

  private constructor() {
    this.logger = createContextLogger('ErrorHandler');
    this.config = getConfig();
  }

  public static getInstance(): ErrorHandlerMiddleware {
    if (!ErrorHandlerMiddleware.instance) {
      ErrorHandlerMiddleware.instance = new ErrorHandlerMiddleware();
    }
    return ErrorHandlerMiddleware.instance;
  }

  public handle(): ErrorRequestHandler {
    return (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
      this.logger.error('Unhandled error occurred', err);

      const statusCode = this.getStatusCode(err);
      const message = this.config.app.isProduction
        ? 'Internal server error'
        : err.message;

      res.status(statusCode).json({
        success: false,
        error: message,
        ...(this.config.app.isDevelopment && { stack: err.stack }),
      });
    };
  }

  private getStatusCode(err: Error): number {
    if (err.name === 'ValidationError') {
      return 400;
    }
    if (err.name === 'UnauthorizedError') {
      return 401;
    }
    if (err.name === 'ForbiddenError') {
      return 403;
    }
    if (err.name === 'NotFoundError') {
      return 404;
    }
    return 500;
  }
}

export const errorHandler = (): ErrorRequestHandler => 
  ErrorHandlerMiddleware.getInstance().handle();
