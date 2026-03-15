export class DateHelper {
  public static now(): Date {
    return new Date();
  }

  public static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  public static addHours(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }

  public static addMinutes(date: Date, minutes: number): Date {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  }

  public static isExpired(date: Date): boolean {
    return date < this.now();
  }

  public static formatISO(date: Date): string {
    return date.toISOString();
  }

  public static parseISO(dateString: string): Date {
    return new Date(dateString);
  }

  public static differenceInSeconds(date1: Date, date2: Date): number {
    return Math.abs(date1.getTime() - date2.getTime()) / 1000;
  }

  public static differenceInMinutes(date1: Date, date2: Date): number {
    return this.differenceInSeconds(date1, date2) / 60;
  }

  public static differenceInDays(date1: Date, date2: Date): number {
    return this.differenceInSeconds(date1, date2) / 86400;
  }

  public static startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  public static endOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }
}
