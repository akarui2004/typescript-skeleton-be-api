export interface IApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: IApiError[];
}

export interface IApiError {
  code: string;
  message: string;
  field?: string;
}

export interface IPaginatedResponse<T> extends IApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface IErrorResponse {
  success: false;
  error: string;
  details?: unknown;
  stack?: string;
}

export class ApiResponseBuilder {
  public static success<T>(data: T, message = 'Success'): IApiResponse<T> {
    return {
      success: true,
      message,
      data,
    };
  }

  public static error(
    message: string,
    errors?: IApiError[]
  ): IApiResponse<never> {
    return {
      success: false,
      message,
      errors,
    };
  }

  public static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ): IPaginatedResponse<T> {
    return {
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
