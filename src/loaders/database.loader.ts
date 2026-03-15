import { MikroORM, Options, IDatabaseDriver, Connection } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { getConfig } from '@config';
import { LoggerService } from '@utils';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private orm: MikroORM<IDatabaseDriver<Connection>> | null = null;
  private readonly logger: LoggerService;

  private constructor() {
    this.logger = LoggerService.createContextLogger('DatabaseConnection');
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<MikroORM<IDatabaseDriver<Connection>>> {
    if (this.orm) {
      return this.orm;
    }

    const config = getConfig();
    
    const ormConfig: Options<PostgreSqlDriver> = {
      driver: PostgreSqlDriver,
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      dbName: config.database.name,
      debug: config.database.debug,
      entities: ['dist/entities/**/*.js'],
      entitiesTs: ['src/entities/**/*.ts'],
      migrations: {
        path: 'dist/migrations',
        pathTs: 'src/migrations',
        glob: '!(*.d).{js,ts}',
      },
      pool: {
        min: config.database.pool_min,
        max: config.database.pool_max,
      },
    };

    try {
      this.orm = await MikroORM.init(ormConfig);
      this.logger.info('Database connection established successfully', {
        host: config.database.host,
        database: config.database.name,
      });
      return this.orm;
    } catch (error) {
      this.logger.error('Failed to establish database connection', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.orm) {
      await this.orm.close();
      this.orm = null;
      this.logger.info('Database connection closed');
    }
  }

  public getOrm(): MikroORM<IDatabaseDriver<Connection>> {
    if (!this.orm) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.orm;
  }

  public getEntityManager() {
    return this.getOrm().em;
  }

  public async runMigrations(): Promise<void> {
    const orm = this.getOrm();
    const migrator = orm.getMigrator();
    await migrator.up();
    this.logger.info('Migrations executed successfully');
  }

  public async createMigration(): Promise<void> {
    const orm = this.getOrm();
    const migrator = orm.getMigrator();
    await migrator.createMigration();
    this.logger.info('Migration created successfully');
  }

  public async healthCheck(): Promise<boolean> {
    if (!this.orm) {
      return false;
    }
    return this.orm.isConnected();
  }
}

export const getDatabase = (): DatabaseConnection => DatabaseConnection.getInstance();
