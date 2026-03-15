export interface ILoggerConfig {
  level: string;
  format: 'pretty' | 'json';
  output_dir: string;
  max_size: string;
  max_files: number;
}

export class LoggerConfig implements ILoggerConfig {
  public readonly level: string;
  public readonly format: 'pretty' | 'json';
  public readonly output_dir: string;
  public readonly max_size: string;
  public readonly max_files: number;

  constructor(data: Record<string, unknown>) {
    this.level = (data.level as string) || 'info';
    this.format = (data.format as 'pretty' | 'json') || 'pretty';
    this.output_dir = (data.output_dir as string) || 'logs';
    this.max_size = (data.max_size as string) || '10m';
    this.max_files = (data.max_files as number) || 5;
  }

  public get isPretty(): boolean {
    return this.format === 'pretty';
  }

  public get logFilePath(): string {
    return `${this.output_dir}/app.log`;
  }
}
