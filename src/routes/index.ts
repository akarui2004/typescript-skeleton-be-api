import { Router } from 'express';
import { requestLogger } from '@middlewares';

export class AppRouter {
  private static instance: AppRouter;
  private readonly router: Router;

  private constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  public static getInstance(): AppRouter {
    if (!AppRouter.instance) {
      AppRouter.instance = new AppRouter();
    }
    return AppRouter.instance;
  }

  private initializeRoutes(): void {
    // Apply request logging middleware
    this.router.use(requestLogger());

    // Health check route
    this.router.get('/health', (_req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
      });
    });

    // API routes will be added here
    // Example: this.router.use('/users', UserController.getInstance().getRouter());
  }

  public getRouter(): Router {
    return this.router;
  }

  public addRoute(path: string, router: Router): void {
    this.router.use(path, router);
  }
}

export const getAppRouter = (): AppRouter => AppRouter.getInstance();
