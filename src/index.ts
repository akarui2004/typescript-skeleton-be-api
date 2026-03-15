import 'reflect-metadata';
import { AppLoader } from '@loaders';
import { AppRouter } from '@routes';
import { errorHandler, requestLogger } from '@middlewares';
import { logger } from '@utils';

async function bootstrap(): Promise<void> {
  try {
    const appLoader = AppLoader.getInstance();
    const appRouter = AppRouter.getInstance();

    // Initialize connections
    await appLoader.initializeConnections();

    // Initialize middlewares
    appLoader.initializeMiddlewares();
    const app = appLoader.getApp();
    app.use(requestLogger());

    // Initialize routes
    appLoader.initializeRoutes(appRouter.getRouter());

    // Initialize error handling
    appLoader.initializeErrorHandling();
    app.use(errorHandler());

    // Start server
    await appLoader.start();

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'] as const;
    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, shutting down gracefully...`);
        await appLoader.shutdown();
        process.exit(0);
      });
    });

  } catch (error) {
    logger.fatal('Failed to start application', error);
    process.exit(1);
  }
}

bootstrap();
