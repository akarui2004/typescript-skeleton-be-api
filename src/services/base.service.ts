import { EntityManager, EntityRepository, FilterQuery } from '@mikro-orm/core';
import { BaseEntity } from '@entities';
import { LoggerService, createContextLogger, Result, success, failure } from '@utils';

export interface IService<T extends BaseEntity> {
  findById(id: string): Promise<Result<T | null>>;
  findAll(limit?: number, offset?: number): Promise<Result<T[]>>;
  create(data: Partial<T>): Promise<Result<T>>;
  update(id: string, data: Partial<T>): Promise<Result<T | null>>;
  delete(id: string): Promise<Result<boolean>>;
}

export abstract class BaseService<T extends BaseEntity> implements IService<T> {
  protected readonly logger: LoggerService;
  protected readonly repository: EntityRepository<T>;

  constructor(
    protected readonly entityManager: EntityManager,
    protected readonly entityName: string,
    protected readonly contextName: string
  ) {
    this.repository = entityManager.getRepository(entityName) as EntityRepository<T>;
    this.logger = createContextLogger(contextName);
  }

  public async findById(id: string): Promise<Result<T | null>> {
    try {
      const entity = await this.repository.findOne({ uuid: id } as unknown as FilterQuery<T>);
      return success(entity);
    } catch (error) {
      this.logger.error(`Failed to find ${this.entityName} by id: ${id}`, error);
      return failure(error as Error);
    }
  }

  public async findAll(limit = 20, offset = 0): Promise<Result<T[]>> {
    try {
      const entities = await this.repository.findAll({ limit, offset });
      return success(entities);
    } catch (error) {
      this.logger.error(`Failed to find all ${this.entityName}`, error);
      return failure(error as Error);
    }
  }

  public async create(data: Partial<T>): Promise<Result<T>> {
    try {
      const entity = this.repository.create(data as T);
      await this.entityManager.persistAndFlush(entity);
      this.logger.info(`${this.entityName} created successfully`, { id: entity.uuid });
      return success(entity);
    } catch (error) {
      this.logger.error(`Failed to create ${this.entityName}`, error);
      return failure(error as Error);
    }
  }

  public async update(id: string, data: Partial<T>): Promise<Result<T | null>> {
    try {
      const entity = await this.repository.findOne({ uuid: id } as unknown as FilterQuery<T>);
      if (!entity) {
        return success(null);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.repository.assign(entity, data as any);
      await this.entityManager.flush();
      this.logger.info(`${this.entityName} updated successfully`, { id });
      return success(entity);
    } catch (error) {
      this.logger.error(`Failed to update ${this.entityName}: ${id}`, error);
      return failure(error as Error);
    }
  }

  public async delete(id: string): Promise<Result<boolean>> {
    try {
      const entity = await this.repository.findOne({ uuid: id } as unknown as FilterQuery<T>);
      if (!entity) {
        return success(false);
      }

      await this.entityManager.removeAndFlush(entity);
      this.logger.info(`${this.entityName} deleted successfully`, { id });
      return success(true);
    } catch (error) {
      this.logger.error(`Failed to delete ${this.entityName}: ${id}`, error);
      return failure(error as Error);
    }
  }

  public async count(conditions?: Record<string, unknown>): Promise<Result<number>> {
    try {
      const count = await this.repository.count(conditions as unknown as FilterQuery<T>);
      return success(count);
    } catch (error) {
      this.logger.error(`Failed to count ${this.entityName}`, error);
      return failure(error as Error);
    }
  }
}
