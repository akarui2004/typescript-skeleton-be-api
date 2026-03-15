import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { BaseEntity } from '@entities';
import { LoggerService, createContextLogger, Result, success, failure } from '@utils';

export abstract class BaseRepository<T extends BaseEntity> {
  protected readonly logger: LoggerService;
  protected readonly repository: EntityRepository<T>;

  constructor(
    protected readonly em: EntityManager,
    protected readonly entityName: string,
    protected readonly contextName: string
  ) {
    this.repository = em.getRepository(entityName) as EntityRepository<T>;
    this.logger = createContextLogger(contextName);
  }

  public async findByUuid(uuid: string): Promise<T | null> {
    try {
      return await this.repository.findOne({ uuid } as unknown as FilterQuery<T>);
    } catch (error) {
      this.logger.error(`Failed to find entity by uuid: ${uuid}`, error);
      throw error;
    }
  }

  public async findByUuidOrFail(uuid: string): Promise<T> {
    try {
      return await this.repository.findOneOrFail({ uuid } as unknown as FilterQuery<T>);
    } catch (error) {
      this.logger.error(`Failed to find entity by uuid: ${uuid}`, error);
      throw error;
    }
  }

  public async exists(uuid: string): Promise<boolean> {
    try {
      const count = await this.repository.count({ uuid } as unknown as FilterQuery<T>);
      return count > 0;
    } catch (error) {
      this.logger.error(`Failed to check entity existence: ${uuid}`, error);
      return false;
    }
  }

  public async findWithPagination(
    page = 1,
    limit = 20,
    conditions?: Record<string, unknown>
  ): Promise<Result<{ data: T[]; total: number }>> {
    try {
      const offset = (page - 1) * limit;
      const [data, total] = await this.repository.findAndCount(
        conditions as unknown as FilterQuery<T>,
        { limit, offset }
      );
      return success({ data, total });
    } catch (error) {
      this.logger.error('Failed to find entities with pagination', error);
      return failure(error as Error);
    }
  }

  public async createEntity(data: Partial<T>): Promise<T> {
    const entity = this.repository.create(data as T);
    return entity;
  }

  public async updateEntity(entity: T, data: Partial<T>): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.repository.assign(entity, data as any);
    return entity;
  }

  public async softDelete(uuid: string): Promise<boolean> {
    try {
      const entity = await this.findByUuid(uuid);
      if (!entity) {
        return false;
      }

      // Assuming entities have a deletedAt property for soft delete
      // If not, this can be overridden in child repositories
      (entity as Record<string, unknown>).deletedAt = new Date();
      await this.em.flush();
      return true;
    } catch (error) {
      this.logger.error(`Failed to soft delete entity: ${uuid}`, error);
      return false;
    }
  }

  public async findAll(limit = 20, offset = 0): Promise<T[]> {
    return this.repository.findAll({ limit, offset });
  }

  public async count(conditions?: Record<string, unknown>): Promise<number> {
    return this.repository.count(conditions as unknown as FilterQuery<T>);
  }
}
