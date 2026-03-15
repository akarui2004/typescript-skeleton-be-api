import { Request, Response, NextFunction, Router } from 'express';
import { LoggerService, createContextLogger } from '@utils';

export interface IController {
  getRouter(): Router;
  initializeRoutes(): void;
}

export abstract class BaseController implements IController {
  protected readonly router: Router;
  protected readonly logger: LoggerService;

  constructor(protected readonly contextName: string) {
    this.router = Router();
    this.logger = createContextLogger(contextName);
    this.initializeRoutes();
  }

  public getRouter(): Router {
    return this.router;
  }

  public abstract initializeRoutes(): void;

  protected sendSuccess<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200
  ): void {
    res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  protected sendError(
    res: Response,
    message: string,
    statusCode = 500,
    errors?: unknown
  ): void {
    res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }

  protected sendPaginated<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number
  ): void {
    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  protected asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
  ) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };
}
