export type Environment = 'development' | 'staging' | 'production' | 'test';

export const getEnvironment = (): Environment => {
  return (process.env.NODE_ENV as Environment) || 'development';
};
