import express, { Express, Router } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { getConfig } from '@config';
import { LoggerService } from '@utils';
import { DatabaseConnection } from './database.loader';
import { RedisConnection } from './redis.loader';

export class AppLoader {
  private static instance: AppLoader;
  private app: Express;
  private readonly logger: LoggerService;
  private readonly config: ReturnType<typeof getConfig>;

  private constructor() {
    this.config = getConfig();
    this.logger = LoggerService.createContextLogger('AppLoader');
    this.app = express();
  }

  public static getInstance(): AppLoader {
    if (!AppLoader.instance) {
      AppLoader.instance = new AppLoader();
    }
    return AppLoader.instance;
  }

  public getApp(): Express {
    return this.app;
  }

  public initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.security.rate_limit_window_ms,
      max: this.config.security.rate_limit_max_requests,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json({
          success: false,
          error: 'Too many requests, please try again later.',
        });
      },
    });
    this.app.use(limiter);

    this.logger.info('Middlewares initialized');
  }

  public initializeRoutes(router: Router): void {
    this.app.use('/api', router);
    
    // Health check endpoint
    this.app.get('/health', async (_req, res) => {
      const dbHealth = await DatabaseConnection.getInstance().healthCheck();
      const redisHealth = RedisConnection.getInstance().healthCheck();
      
      res.status(dbHealth && redisHealth ? 200 : 503).json({
        status: dbHealth && redisHealth ? 'healthy' : 'unhealthy',
        services: {
          database: dbHealth ? 'connected' : 'disconnected',
          redis: redisHealth ? 'connected' : 'disconnected',
        },
        timestamp: new Date().toISOString(),
      });
    });

    // 404 handler
    this.app.use((_req, res) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
      });
    });

    this.logger.info('Routes initialized');
  }

  public initializeErrorHandling(): void {
    this.app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      this.logger.error('Unhandled error', err);
      
      res.status(500).json({
        success: false,
        error: this.config.app.isProduction ? 'Internal server error' : err.message,
      });
    });

    this.logger.info('Error handling initialized');
  }

  public async initializeConnections(): Promise<void> {
    await DatabaseConnection.getInstance().connect();
    await RedisConnection.getInstance().connect();
    this.logger.info('All connections established');
  }

  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.config.app.port, this.config.app.host, () => {
        this.logger.info(`Server started`, {
          host: this.config.app.host,
          port: this.config.app.port,
          environment: this.config.app.env,
        });
        resolve();
      });
    });
  }

  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down application...');
    await DatabaseConnection.getInstance().disconnect();
    await RedisConnection.getInstance().disconnect();
    this.logger.info('Application shutdown complete');
  }
}

export const getAppLoader = (): AppLoader => AppLoader.getInstance();
