import { Request } from 'express';

export interface IPagination {
  page: number;
  limit: number;
  offset: number;
}

export interface ISort {
  field: string;
  order: 'asc' | 'desc';
}

export interface IFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'in';
  value: string | number | boolean | string[] | number[];
}

export interface IRequestContext {
  requestId: string;
  userId?: string;
  ip: string;
  userAgent: string;
}

export interface IAuthenticatedRequest extends Request {
  context: IRequestContext;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export type Environment = 'development' | 'staging' | 'production' | 'test';

export interface IHealthCheck {
  status: 'healthy' | 'unhealthy';
  services: {
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
  };
  timestamp: string;
}
